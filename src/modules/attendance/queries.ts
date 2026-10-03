import { createClient } from '@/lib/supabase/server';
import { createPublicClient } from '@/lib/supabase/public';
import type { Json } from '@/lib/supabase/database.types';
import type {
  AttendanceOverview,
  CheckInContext,
  CertificateRow,
  CheckInMethod,
  OverviewDay,
  PublicCheckInContext,
  RosterRow,
  SessionStatus,
} from './types';

const obj = (v: Json | undefined | null): Record<string, Json> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, Json>) : {};
const num = (v: Json | undefined) => (typeof v === 'number' ? v : 0);
const str = (v: Json | undefined) => (typeof v === 'string' ? v : null);

/** Sessions of one event with live counts. Null when the caller may not run attendance for it (or no such event). */
export async function getAttendanceOverview(eventId: string): Promise<AttendanceOverview | null> {
  if (!/^[0-9a-f-]{36}$/i.test(eventId)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('event_attendance_overview', { p_event: eventId });
  if (error || !data) return null;
  const o = obj(data);
  const e = obj(o.event);
  const certs = obj(o.certificates);
  return {
    event: {
      id: str(e.id) ?? eventId,
      slug: str(e.slug) ?? '',
      status: str(e.status) ?? '',
      titleAr: str(e.title_ar) ?? '',
      titleEn: str(e.title_en),
      finalizedAt: str(e.finalized_at),
    },
    accepted: num(o.accepted),
    threshold: num(o.threshold),
    certificatesEnabled: o.certificates_enabled === true,
    averagePercent: typeof o.average_percent === 'number' ? o.average_percent : null,
    eligible: num(o.eligible),
    certificates: { issued: num(certs.issued), sent: num(certs.sent), failed: num(certs.failed) },
    days: (Array.isArray(o.days) ? o.days : []).map((d): OverviewDay => {
      const x = obj(d);
      return {
        eventDateId: str(x.event_date_id) ?? '',
        date: str(x.date) ?? '',
        day: num(x.day),
        sessionId: str(x.session_id),
        status: (str(x.status) ?? 'scheduled') as SessionStatus,
        late: x.late === true,
        present: num(x.present),
        qr: num(x.qr),
        online: num(x.online),
        manual: num(x.manual),
      };
    }),
  };
}

export async function getSessionRoster(sessionId: string): Promise<RosterRow[] | null> {
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('session_roster', { p_session: sessionId });
  if (error) return null;
  return (data ?? []).map((r) => ({
    registrationId: r.registration_id,
    fullName: r.full_name,
    email: r.email,
    wasMember: r.was_member,
    present: r.present,
    method: (r.method as CheckInMethod | null) ?? null,
    checkedInAt: r.checked_in_at,
  }));
}

/** What the participant check-in page draws. Null when the event is unknown or not open to attendance. */
export async function getCheckInContext(
  slug: string,
  sessionId?: string,
): Promise<CheckInContext | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('check_in_context', {
    p_slug: slug,
    p_session: (sessionId && /^[0-9a-f-]{36}$/i.test(sessionId) ? sessionId : null) as string,
  });
  if (error || !data) return null;
  const o = obj(data);
  const e = obj(o.event);
  const s = o.session ? obj(o.session) : null;
  return {
    event: {
      id: str(e.id) ?? '',
      slug: str(e.slug) ?? slug,
      titleAr: str(e.title_ar) ?? '',
      titleEn: str(e.title_en),
      mode: str(e.mode) ?? 'in_person',
    },
    accepted: o.accepted === true,
    session: s
      ? {
          id: str(s.id) ?? '',
          status: (str(s.status) ?? 'open') as 'open' | 'closed' | 'finalized',
          day: num(s.day),
          date: str(s.date) ?? '',
          days: num(s.days),
        }
      : null,
    checkedInAt: str(o.checked_in_at),
  };
}

export type CertificateFacts = {
  recipientName: string;
  titleAr: string;
  titleEn: string | null;
  startDate: string | null;
  endDate: string | null;
  percent: number;
  issuedAt: string;
};

/** Public verification (AT-9): name, event, dates, percentage. Null for an unknown id. */
export async function verifyCertificate(id: string): Promise<CertificateFacts | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await createPublicClient().rpc('verify_certificate', { p_id: id });
  const r = data?.[0];
  if (!r) return null;
  return {
    recipientName: r.recipient_name,
    titleAr: r.title_ar,
    titleEn: r.title_en,
    startDate: r.start_date,
    endDate: r.end_date,
    percent: r.attendance_percent,
    issuedAt: r.issued_at,
  };
}

/** The public check-in context (no sign-in needed). Null when the session or event is unknown or not public. */
export async function getPublicCheckInContext(
  sessionId: string | undefined,
): Promise<PublicCheckInContext | null> {
  if (!sessionId || !/^[0-9a-f-]{36}$/i.test(sessionId)) return null;
  const { data, error } = await createPublicClient().rpc('check_in_public_context', {
    p_session: sessionId,
  });
  if (error || !data) return null;
  const o = obj(data);
  const e = obj(o.event);
  const s = obj(o.session);
  return {
    event: { slug: str(e.slug) ?? '', titleAr: str(e.title_ar) ?? '', titleEn: str(e.title_en) },
    session: {
      id: str(s.id) ?? sessionId,
      status: (str(s.status) ?? 'open') as 'open' | 'closed' | 'finalized',
      day: num(s.day),
      date: str(s.date) ?? '',
      days: num(s.days),
    },
  };
}

/** The accepted registrants of an event with their percentage and certificate state (RLS scopes the rows). */
export async function listEventCertificates(
  eventId: string,
  threshold: number,
): Promise<CertificateRow[]> {
  if (!/^[0-9a-f-]{36}$/i.test(eventId)) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('event_registrations')
    .select(
      'id, full_name_snapshot, email_snapshot, attendance_percent, attendance_result, certificates(id, delivery_status, sent_at, attempt_count)',
    )
    .eq('event_id', eventId)
    .eq('status', 'accepted')
    .order('full_name_snapshot');
  return (data ?? []).map((r) => {
    const raw = r.certificates as unknown;
    const c = (Array.isArray(raw) ? raw[0] : raw) as {
      id: string;
      delivery_status: string;
      sent_at: string | null;
      attempt_count: number;
    } | null;
    const attended = r.attendance_result === 'attended';
    return {
      registrationId: r.id,
      fullName: r.full_name_snapshot,
      email: r.email_snapshot,
      percent: r.attendance_percent,
      attended,
      eligible: attended && (r.attendance_percent ?? 0) >= threshold,
      certificate: c
        ? {
            id: c.id,
            status: c.delivery_status as 'pending' | 'generated' | 'sent' | 'failed',
            sentAt: c.sent_at,
            attempts: c.attempt_count,
          }
        : null,
    };
  });
}
