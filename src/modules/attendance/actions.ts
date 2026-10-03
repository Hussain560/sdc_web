'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { fail, ok, type ErrorCode, type Result } from '@/lib/result';
import { createClient } from '@/lib/supabase/server';
import { getAccess } from '@/modules/access/queries';
import { isLang, type Lang } from '@/modules/auth/messages';
import { deliverEventCertificates } from './certificates';
import { attendanceCode, attendanceMessage } from './messages';

/**
 * Attendance Server Actions. Pattern (server-logic §3): authenticate → ONE database function that re-checks
 * authorization, the session state and every rule → revalidate → Result. The SQL functions are authoritative.
 */
const langOf = (v: unknown): Lang => (isLang(v) ? v : 'ar');
const uuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

function dbFailure(error: { message?: string; code?: string }, lang: Lang): Result<never> {
  const code = attendanceCode(error);
  if (code === 'INTERNAL')
    console.error('[attendance] unexpected database error', error.code, error.message);
  return fail(code, attendanceMessage(code, lang));
}
const failCode = (code: ErrorCode, lang: Lang) => fail(code, attendanceMessage(code, lang));

const refresh = (eventId?: string) => {
  if (eventId) revalidatePath(`/dashboard/events/${eventId}/attendance`, 'layout');
  revalidatePath('/dashboard/events', 'layout');
};

export async function openSession(
  input: { eventDateId: string; eventId: string; confirm?: boolean },
  ctx: { lang: Lang },
): Promise<Result<{ sessionId: string }>> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  if (!uuid(input.eventDateId)) return failCode('NOT_FOUND', lang);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('open_session', {
    p_event_date: input.eventDateId,
    p_confirm: input.confirm ?? false,
  });
  if (error) return dbFailure(error, lang);
  refresh(input.eventId);
  return ok({ sessionId: data as string });
}

export async function closeSession(
  input: { sessionId: string; eventId: string },
  ctx: { lang: Lang },
): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  if (!uuid(input.sessionId)) return failCode('NOT_FOUND', lang);
  const supabase = await createClient();
  const { error } = await supabase.rpc('close_session', { p_session: input.sessionId });
  if (error) return dbFailure(error, lang);
  refresh(input.eventId);
  return ok(undefined);
}

export async function finalizeSession(
  input: { sessionId: string; eventId: string },
  ctx: { lang: Lang },
): Promise<Result<{ present: number; absent: number }>> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  if (!uuid(input.sessionId)) return failCode('NOT_FOUND', lang);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('finalize_session', { p_session: input.sessionId });
  if (error) return dbFailure(error, lang);
  const r = data as { present: number; absent: number };
  refresh(input.eventId);
  return ok({ present: r.present, absent: r.absent });
}

/** The rotating QR token for the organizer screen (the secret never leaves the database). */
export async function getQrToken(
  sessionId: string,
  ctx: { lang: Lang },
): Promise<Result<{ token: string; expiresIn: number }>> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  if (!uuid(sessionId)) return failCode('NOT_FOUND', lang);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('session_qr_token', { p_session: sessionId });
  if (error) return dbFailure(error, lang);
  const r = data as { token: string; expires_in: number };
  return ok({ token: r.token, expiresIn: r.expires_in });
}

/** Live counter of the QR screen (polled every 10 s). */
export async function getLiveCount(
  sessionId: string,
): Promise<{ present: number; total: number } | null> {
  if (!(await getAccess()) || !uuid(sessionId)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('session_roster', { p_session: sessionId });
  if (error) return null;
  return { present: (data ?? []).filter((r) => r.present).length, total: data?.length ?? 0 };
}

export async function recordAttendance(
  input: { sessionId: string; eventId: string; registrationIds: string[]; present?: boolean },
  ctx: { lang: Lang },
): Promise<Result<{ changed: number }>> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  if (!uuid(input.sessionId) || !input.registrationIds.every(uuid))
    return failCode('NOT_FOUND', lang);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('record_attendance', {
    p_session: input.sessionId,
    p_registrations: input.registrationIds,
    p_present: input.present ?? true,
  });
  if (error) return dbFailure(error, lang);
  refresh(input.eventId);
  return ok({ changed: data as number });
}

export async function correctAttendance(
  input: {
    sessionId: string;
    eventId: string;
    registrationId: string;
    present: boolean;
    reason: string;
  },
  ctx: { lang: Lang },
): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  if (!uuid(input.sessionId) || !uuid(input.registrationId)) return failCode('NOT_FOUND', lang);
  const supabase = await createClient();
  const { error } = await supabase.rpc('correct_attendance', {
    p_session: input.sessionId,
    p_registration: input.registrationId,
    p_present: input.present,
    p_reason: input.reason,
  });
  if (error) return dbFailure(error, lang);
  refresh(input.eventId);
  return ok(undefined);
}

export async function finalizeEventAttendance(
  eventId: string,
  ctx: { lang: Lang },
): Promise<Result<{ attended: number; absent: number; eligible: number; threshold: number }>> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  if (!uuid(eventId)) return failCode('NOT_FOUND', lang);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('finalize_event_attendance', { p_event: eventId });
  if (error) return dbFailure(error, lang);
  refresh(eventId);
  return ok(data as { attended: number; absent: number; eligible: number; threshold: number });
}

/** Issues the certificates (database: eligibility, snapshot) and delivers them after the response is sent. */
export async function issueCertificates(
  eventId: string,
  ctx: { lang: Lang },
): Promise<Result<{ issued: number; total: number }>> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  if (!uuid(eventId)) return failCode('NOT_FOUND', lang);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('issue_certificates', { p_event: eventId });
  if (error) return dbFailure(error, lang);
  after(async () => {
    try {
      await deliverEventCertificates(eventId);
    } catch (e) {
      console.error('[attendance] certificate delivery failed', (e as Error).message);
    }
  });
  refresh(eventId);
  return ok(data as { issued: number; total: number });
}

/** "Resend failed": retries the certificates whose PDF or e-mail failed. Needs events.complete (checked by RLS). */
export async function resendFailedCertificates(
  eventId: string,
  ctx: { lang: Lang },
): Promise<Result<{ sent: number; failed: number }>> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  if (!uuid(eventId)) return failCode('NOT_FOUND', lang);
  // The organizer must be able to read the event's certificates (events.complete in scope) before the server retries.
  const supabase = await createClient();
  const { count } = await supabase
    .from('certificates')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId);
  if (!count) return failCode('FORBIDDEN', lang);
  const result = await deliverEventCertificates(eventId, { onlyFailed: true });
  refresh(eventId);
  return ok(result);
}

/** Participant check-in (QR token or online window). Idempotent. */
export async function checkIn(
  input: { sessionId: string; token?: string },
  ctx: { lang: Lang },
): Promise<Result<{ status: 'checked_in' | 'already' }>> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  if (!uuid(input.sessionId)) return failCode('SESSION_NOT_OPEN', lang);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('check_in', {
    p_session: input.sessionId,
    p_token: (input.token ?? null) as string,
  });
  if (error) return dbFailure(error, lang);
  revalidatePath('/account/registrations');
  return ok({ status: data === 'already' ? 'already' : 'checked_in' });
}
