import 'server-only';
import { renderToBuffer } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { createAdminClient } from '@/lib/supabase/admin';
import { notify } from '@/modules/notifications/notify';
import { CertificateDocument, type CertificateData } from './pdf/CertificateDocument';

const siteUrl = () => (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const BUCKET = 'certificates';
const MAX_ATTEMPTS = 5;

const fmt = (iso: string | null, locale: string) =>
  iso
    ? new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(`${iso}T00:00:00Z`))
    : '';

const dates = (start: string | null, end: string | null, locale: string) =>
  start && end && end !== start
    ? `${fmt(start, locale)} – ${fmt(end, locale)}`
    : fmt(start ?? end, locale);

type Row = {
  id: string;
  registration_id: string;
  event_id: string;
  user_id: string | null;
  recipient_name: string;
  recipient_email: string;
  attendance_percent: number;
  sessions_attended: number;
  sessions_expected: number;
  pdf_path: string | null;
  delivery_status: string;
  attempt_count: number;
};

async function buildPdf(row: Row): Promise<Buffer> {
  const db = createAdminClient();
  const { data: e } = await db
    .from('events')
    .select('title_ar, title_en, start_date, end_date')
    .eq('id', row.event_id)
    .maybeSingle();
  const verifyUrl = `${siteUrl()}/certificates/${row.id}`;
  const data: CertificateData = {
    id: row.id,
    recipientName: row.recipient_name,
    titleAr: e?.title_ar ?? '',
    titleEn: e?.title_en ?? null,
    dateAr: dates(e?.start_date ?? null, e?.end_date ?? null, 'ar-u-nu-latn-ca-gregory'),
    dateEn: dates(e?.start_date ?? null, e?.end_date ?? null, 'en-GB'),
    percent: row.attendance_percent,
    sessionsAttended: row.sessions_attended,
    sessionsExpected: row.sessions_expected,
    verifyUrl,
    qrDataUrl: await QRCode.toDataURL(verifyUrl, { margin: 1, width: 240 }),
  };
  return renderToBuffer(<CertificateDocument c={data} />);
}

/**
 * Generates the PDF (once), stores it in the private bucket, then e-mails the participant a link to the
 * verification page; every step is recorded on the certificate row so a failure can be retried (attempts ≤ 5).
 * Never throws.
 */
export async function deliverCertificate(
  certificateId: string,
): Promise<'sent' | 'failed' | 'skipped'> {
  const db = createAdminClient();
  const { data } = await db.from('certificates').select('*').eq('id', certificateId).maybeSingle();
  if (!data) return 'skipped';
  const row = data as Row;
  if (row.delivery_status === 'sent') return 'skipped';
  if (row.attempt_count >= MAX_ATTEMPTS) return 'skipped';

  const attempt = row.attempt_count + 1;
  const mark = (patch: Record<string, unknown>) =>
    db
      .from('certificates')
      .update({ attempt_count: attempt, last_attempt_at: new Date().toISOString(), ...patch })
      .eq('id', row.id);

  try {
    let path = row.pdf_path;
    if (!path) {
      const pdf = await buildPdf(row);
      path = `${row.event_id}/${row.id}.pdf`;
      const up = await db.storage.from(BUCKET).upload(path, pdf, {
        contentType: 'application/pdf',
        upsert: true,
      });
      if (up.error) throw new Error(up.error.message);
      await mark({ pdf_path: path, delivery_status: 'generated', error_code: null });
    }

    const { data: e } = await db
      .from('events')
      .select('title_ar, title_en')
      .eq('id', row.event_id)
      .maybeSingle();
    const { data: profile } = row.user_id
      ? await db.from('profiles').select('preferred_locale').eq('id', row.user_id).maybeSingle()
      : { data: null };
    // A guest gets the language they registered in.
    const { data: reg } = await db
      .from('event_registrations')
      .select('answers')
      .eq('id', row.registration_id)
      .maybeSingle();
    const guestLang = (reg?.answers as { lang?: string } | null)?.lang;
    const lang = (profile?.preferred_locale ?? guestLang) === 'en' ? 'en' : 'ar';
    const outcome = await notify({
      templateKey: 'certificate.issued',
      entityType: 'certificate',
      entityId: row.id,
      state: 'issued',
      recipient: { userId: row.user_id, email: row.recipient_email, locale: lang },
      data: {
        name: row.recipient_name,
        eventTitle: (lang === 'en' ? e?.title_en : null) || e?.title_ar || '',
        certificateUrl: `${siteUrl()}${lang === 'en' ? '/en' : ''}/certificates/${row.id}`,
        registrationsUrl: row.user_id
          ? `${siteUrl()}${lang === 'en' ? '/en' : ''}/account/registrations`
          : undefined,
      },
    });
    if (outcome === 'sent' || outcome === 'duplicate') {
      await mark({ delivery_status: 'sent', sent_at: new Date().toISOString(), error_code: null });
      return 'sent';
    }
    await mark({ delivery_status: 'failed', error_code: 'MAIL_FAILED' });
    return 'failed';
  } catch (e) {
    console.error('[certificates] delivery failed', row.id, (e as Error).message);
    await mark({ delivery_status: 'failed', error_code: 'PDF_FAILED' });
    return 'failed';
  }
}

/** Delivers every pending (or, with `onlyFailed`, failed) certificate of an event. */
export async function deliverEventCertificates(
  eventId: string,
  opts: { onlyFailed?: boolean } = {},
): Promise<{ sent: number; failed: number }> {
  const db = createAdminClient();
  const states = opts.onlyFailed ? ['failed'] : ['pending', 'generated', 'failed'];
  const { data } = await db
    .from('certificates')
    .select('id')
    .eq('event_id', eventId)
    .in('delivery_status', states)
    .lt('attempt_count', MAX_ATTEMPTS)
    .order('issued_at');
  let sent = 0;
  let failed = 0;
  for (const c of data ?? []) {
    const r = await deliverCertificate(c.id);
    if (r === 'sent') sent += 1;
    if (r === 'failed') failed += 1;
  }
  return { sent, failed };
}

/** Owner / organizer download: the caller is checked first by RLS; the file is read with the server key. */
export async function readCertificatePdf(path: string): Promise<Buffer | null> {
  const db = createAdminClient();
  const { data, error } = await db.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}
