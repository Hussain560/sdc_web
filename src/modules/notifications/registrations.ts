import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { TemplateKey } from '@/lib/email/templates';
import { formatDateRange, formatTimeRange } from '@/lib/format';
import type { Lang } from '@/modules/auth/messages';
import { notify, type NotifyOutcome } from './notify';

const siteUrl = () => (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const localized = (lang: Lang, path: string) => `${siteUrl()}${lang === 'en' ? '/en' : ''}${path}`;
const stamp = (iso: string | null | undefined) => String(new Date(iso ?? 0).getTime());

type EventRow = {
  slug: string;
  title_ar: string;
  title_en: string | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location_ar: string | null;
  location_en: string | null;
  updated_at: string;
  cancelled_at: string | null;
  cancel_reason: string | null;
};

const EVENT_COLUMNS =
  'slug, title_ar, title_en, start_date, end_date, start_time, end_time, location_ar, location_en, updated_at, cancelled_at, cancel_reason';

function eventFacts(e: EventRow, lang: Lang) {
  const date = e.start_date ? formatDateRange(e.start_date, e.end_date, lang) : '';
  const time = formatTimeRange(e.start_time, e.end_time);
  return {
    eventTitle: (lang === 'en' ? e.title_en : null) || e.title_ar,
    eventUrl: localized(lang, `/events/${e.slug}`),
    when: [date, time].filter(Boolean).join(' · ') || undefined,
    where: (lang === 'en' ? e.location_en : null) || e.location_ar || undefined,
  };
}

/** Sends the mail that matches a registration's current state and records the outcome in notify_status. */
export async function notifyRegistration(registrationId: string): Promise<NotifyOutcome | 'none'> {
  const db = createAdminClient();
  const { data: r } = await db
    .from('event_registrations')
    .select(
      `id, user_id, status, event_id, full_name_snapshot, email_snapshot, decision_note, cancelled_by, answers,
       created_at, decided_at, cancelled_at, events(${EVENT_COLUMNS})`,
    )
    .eq('id', registrationId)
    .maybeSingle();
  if (!r?.events) return 'none';

  // Only an acceptance is e-mailed. Submission, rejection, waiting list and cancellation send nothing;
  // the person sees the status in their account (or on the event page for a guest).
  const template: TemplateKey | null = r.status === 'accepted' ? 'registration.confirmed' : null;
  if (!template) {
    await db.from('event_registrations').update({ notify_status: 'sent' }).eq('id', r.id);
    return 'none';
  }

  // A person with an account gets their preferred language; a guest gets the language they registered in.
  const { data: profile } = r.user_id
    ? await db.from('profiles').select('preferred_locale').eq('id', r.user_id).maybeSingle()
    : { data: null };
  const guestLang = (r.answers as { lang?: string } | null)?.lang;
  const lang: Lang = (profile?.preferred_locale ?? guestLang) === 'en' ? 'en' : 'ar';

  // The group link goes only into the "confirmed" mail (NO-6).
  let groupLink: string | null = null;
  if (template === 'registration.confirmed') {
    const { data: priv } = await db
      .from('event_private_details')
      .select('group_link')
      .eq('event_id', r.event_id)
      .maybeSingle();
    groupLink = priv?.group_link ?? null;
  }

  await db.from('event_registrations').update({ notify_status: 'sending' }).eq('id', r.id);
  const outcome = await notify({
    templateKey: template,
    entityType: 'registration',
    entityId: r.id,
    state: stamp(r.decided_at ?? r.cancelled_at ?? r.created_at),
    recipient: { userId: r.user_id, email: r.email_snapshot, locale: lang },
    data: {
      name: r.full_name_snapshot,
      ...eventFacts(r.events, lang),
      registrationsUrl: r.user_id ? localized(lang, '/account/registrations') : undefined,
      groupLink,
      note: r.decision_note,
    },
  });
  await db
    .from('event_registrations')
    .update({ notify_status: outcome === 'failed' ? 'failed' : 'sent' })
    .eq('id', r.id);
  return outcome;
}

/** event.cancelled / event.changed to everyone still holding a place (EVT-016). Idempotent per event state. */
export async function notifyEventRegistrants(
  eventId: string,
  kind: 'cancelled' | 'changed',
): Promise<{ sent: number; failed: number }> {
  const db = createAdminClient();
  const { data: e } = await db.from('events').select(EVENT_COLUMNS).eq('id', eventId).maybeSingle();
  if (!e) return { sent: 0, failed: 0 };
  const { data: rows } = await db
    .from('event_registrations')
    .select('id, user_id, full_name_snapshot, email_snapshot, answers')
    .eq('event_id', eventId)
    .in('status', ['pending', 'accepted', 'waitlisted']);

  let sent = 0;
  let failed = 0;
  for (const r of rows ?? []) {
    const { data: profile } = r.user_id
      ? await db.from('profiles').select('preferred_locale').eq('id', r.user_id).maybeSingle()
      : { data: null };
    const guestLang = (r.answers as { lang?: string } | null)?.lang;
    const lang: Lang = (profile?.preferred_locale ?? guestLang) === 'en' ? 'en' : 'ar';
    const outcome = await notify({
      templateKey: kind === 'cancelled' ? 'event.cancelled' : 'event.changed',
      entityType: 'event',
      entityId: `${eventId}:${r.id}`,
      state: stamp(kind === 'cancelled' ? e.cancelled_at : e.updated_at),
      recipient: { userId: r.user_id, email: r.email_snapshot, locale: lang },
      data: { name: r.full_name_snapshot, ...eventFacts(e, lang), note: e.cancel_reason },
    });
    if (outcome === 'sent') sent += 1;
    if (outcome === 'failed') failed += 1;
  }
  return { sent, failed };
}

/** Re-sends registration mails whose notify_status is not_sent/failed (manual and scheduled retry). */
export async function retryPendingRegistrationMail(
  limit = 50,
): Promise<{ tried: number; sent: number }> {
  const db = createAdminClient();
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data } = await db
    .from('event_registrations')
    .select('id')
    .in('notify_status', ['not_sent', 'failed'])
    .gte('updated_at', since)
    .order('updated_at')
    .limit(limit);
  let sent = 0;
  for (const r of data ?? []) {
    if ((await notifyRegistration(r.id)) === 'sent') sent += 1;
  }
  return { tried: data?.length ?? 0, sent };
}
