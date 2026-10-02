'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { z } from 'zod';
import { fail, ok, type ErrorCode, type Result } from '@/lib/result';
import { createClient } from '@/lib/supabase/server';
import { isLang, type Lang } from '@/modules/auth/messages';
import { getAccess } from '@/modules/access/queries';
import { notifyRegistration } from '@/modules/notifications/registrations';
import { registrationCode, registrationMessage } from './messages';

/**
 * Registration Server Actions. authenticate → validate → ONE database function (authoritative: capacity, window,
 * audience, scope) → e-mail after the response → revalidate → Result. A failed e-mail never fails the action; the
 * notify_status column and the retry route cover it.
 */
const langOf = (v: unknown): Lang => (isLang(v) ? v : 'ar');
const uuid = z.uuid();

function dbFailure(error: { message?: string; code?: string }, lang: Lang): Result<never> {
  const code = registrationCode(error);
  if (code === 'INTERNAL')
    console.error('[registrations] unexpected database error', error.code, error.message);
  return fail(code, registrationMessage(code, lang));
}
const failCode = (code: ErrorCode, lang: Lang) => fail(code, registrationMessage(code, lang));

function mailLater(...ids: string[]) {
  after(async () => {
    for (const id of ids) {
      try {
        await notifyRegistration(id);
      } catch (e) {
        console.error('[registrations] notification failed', (e as Error).message);
      }
    }
  });
}

export type RegistrationStatus = 'pending' | 'accepted' | 'waitlisted';

export async function registerForEvent(
  input: { eventId: string },
  ctx: { lang: Lang },
): Promise<Result<{ id: string; status: RegistrationStatus }>> {
  const lang = langOf(ctx?.lang);
  if (!uuid.safeParse(input?.eventId).success) return failCode('NOT_FOUND', lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('register_for_event', { p_event: input.eventId });
  if (error) return dbFailure(error, lang);

  const r = data as { id: string; status: RegistrationStatus };
  mailLater(r.id);
  revalidatePath('/', 'layout');
  return ok({ id: r.id, status: r.status });
}

export async function cancelMyRegistration(id: string, ctx: { lang: Lang }): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!uuid.safeParse(id).success) return failCode('NOT_FOUND', lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  const supabase = await createClient();
  const { error } = await supabase.rpc('cancel_registration', { p_id: id });
  if (error) return dbFailure(error, lang);
  revalidatePath('/', 'layout');
  return ok(undefined);
}

export type DecisionOutcome = { id: string; ok: boolean; status?: string; code?: ErrorCode };

const decideSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(200),
  decision: z.enum(['accept', 'reject', 'waitlist']),
  note: z.string().trim().max(500).optional(),
});

export async function decideRegistrations(
  input: { ids: string[]; decision: 'accept' | 'reject' | 'waitlist'; note?: string },
  ctx: { lang: Lang },
): Promise<Result<DecisionOutcome[]>> {
  const lang = langOf(ctx?.lang);
  const parsed = decideSchema.safeParse(input);
  if (!parsed.success) return failCode('VALIDATION_FAILED', lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('decide_registrations', {
    p_ids: parsed.data.ids,
    p_decision: parsed.data.decision,
    p_note: parsed.data.note,
  });
  if (error) return dbFailure(error, lang);

  const results = data as DecisionOutcome[];
  mailLater(...results.filter((r) => r.ok).map((r) => r.id));
  revalidatePath('/', 'layout');
  return ok(results);
}

export async function cancelRegistrationByOrganizer(
  input: { id: string; reason: string },
  ctx: { lang: Lang },
): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!uuid.safeParse(input?.id).success) return failCode('NOT_FOUND', lang);
  const reason = String(input?.reason ?? '').trim();
  if (reason.length < 3) return failCode('REASON_REQUIRED', lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);

  const supabase = await createClient();
  const { error } = await supabase.rpc('cancel_registration_by_organizer', {
    p_id: input.id,
    p_reason: reason,
  });
  if (error) return dbFailure(error, lang);
  mailLater(input.id);
  revalidatePath('/', 'layout');
  return ok(undefined);
}

/** Manual "send again" for one registration whose mail failed (REG-008). */
export async function resendRegistrationMail(id: string, ctx: { lang: Lang }): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!uuid.safeParse(id).success) return failCode('NOT_FOUND', lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  // RLS decides whether the caller may see (and so retry) this registration.
  const supabase = await createClient();
  const { data } = await supabase
    .from('event_registrations')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (!data) return failCode('NOT_FOUND', lang);
  mailLater(id);
  return ok(undefined);
}
