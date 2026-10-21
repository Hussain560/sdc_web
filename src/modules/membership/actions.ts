'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { ipHash } from '@/lib/ip-hash';
import { fail, ok, type ErrorCode, type Result } from '@/lib/result';
import { createPublicClient } from '@/lib/supabase/public';
import { createClient } from '@/lib/supabase/server';
import { isLang, type Lang } from '@/modules/auth/messages';
import { getAccess } from '@/modules/access/queries';
import { notifyApplicationReceived } from '@/modules/notifications/lifecycle';
import { membershipCode, membershipMessage } from './messages';
import {
  toApplicationPayload,
  toCyclePayload,
  validateApplication,
  validateCycle,
} from './schemas';
import {
  CONSENT_VERSION,
  type ApplicationValues,
  type CycleFormValues,
  type CycleQuestion,
} from './types';

/** Membership Server Actions: validate → ONE database function (authoritative) → Result. */
const langOf = (v: unknown): Lang => (isLang(v) ? v : 'ar');
const UUID = /^[0-9a-f-]{36}$/i;

function dbFailure(error: { message?: string; code?: string }, lang: Lang): Result<never> {
  const code = membershipCode(error);
  if (code === 'INTERNAL')
    console.error('[membership] unexpected database error', error.code, error.message);
  return fail(code, membershipMessage(code, lang));
}
const failCode = (code: ErrorCode, lang: Lang) => fail(code, membershipMessage(code, lang));

const refresh = () => {
  revalidatePath('/', 'layout');
};

// ----------------------------------------------------------------------------------------------- applicant
/**
 * Apply without an account (owner decision: non-members never sign up). The database applies the cycle window and
 * the anti-spam layers (honeypot, minimum fill time, per-e-mail and per-address throttles, one application per
 * e-mail and cycle). The answer carries the reference number and the tracking token (shown once); the received
 * e-mail with the tracking link goes out after the response. The account is created later, when leadership accepts.
 */
export async function applyForMembership(
  input: { cycleId: string; values: ApplicationValues; honeypot?: string; elapsedMs?: number },
  ctx: { lang: Lang },
): Promise<Result<{ id: string | null; reference: string | null; token: string | null }>> {
  const lang = langOf(ctx?.lang);
  if (!UUID.test(input?.cycleId ?? '')) return failCode('NOT_FOUND', lang);

  const db = createPublicClient();
  // The cycle's questions are read again on the server: the client's copy is never trusted for validation.
  const { data: cycle } = await db
    .from('membership_cycle_phase')
    .select('questions')
    .eq('id', input.cycleId)
    .maybeSingle();
  if (!cycle) return failCode('NOT_FOUND', lang);
  const questions = (Array.isArray(cycle.questions)
    ? cycle.questions
    : []) as unknown as CycleQuestion[];
  const errors = validateApplication(input.values, questions, lang);
  if (Object.keys(errors).length > 0)
    return fail('VALIDATION_FAILED', membershipMessage('VALIDATION_FAILED', lang), errors);

  const { data, error } = await db.rpc('apply_for_membership', {
    p_cycle: input.cycleId,
    p: { ...toApplicationPayload(input.values, CONSENT_VERSION), lang } as never,
    p_ip_hash: (await ipHash()) as string,
    p_honeypot: (input.honeypot ?? '') as string,
    p_elapsed_ms: (input.elapsedMs ?? null) as number,
  });
  if (error) return dbFailure(error, lang);
  const o = (data ?? {}) as {
    ok?: boolean;
    code?: string;
    id?: string | null;
    reference?: string;
    token?: string;
  };
  if (!o.ok) {
    const code = (o.code ?? 'INTERNAL') as ErrorCode;
    const message = membershipMessage(code, lang);
    return fail(code, message, code === 'VALIDATION_FAILED' ? { email: message } : undefined);
  }
  const id = o.id ?? null;
  if (id) {
    after(async () => {
      try {
        await notifyApplicationReceived(id, o.token);
      } catch (e) {
        console.error('[membership] received mail failed', (e as Error).message);
      }
    });
  }
  refresh();
  return ok({ id, reference: o.reference ?? null, token: o.token ?? null });
}

// ----------------------------------------------------------------------------------------------- cycles
export async function saveCycle(
  input: { id?: string; values: CycleFormValues },
  ctx: { lang: Lang },
): Promise<Result<{ id: string }>> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  const errors = validateCycle(input.values, lang);
  if (Object.keys(errors).length > 0)
    return fail('VALIDATION_FAILED', membershipMessage('VALIDATION_FAILED', lang), errors);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('save_membership_cycle', {
    p_id: (input.id ?? null) as string,
    p: toCyclePayload(input.values) as never,
  });
  if (error) {
    const failure = dbFailure(error, lang);
    if (!failure.ok && (failure.code === 'CYCLE_OVERLAP' || failure.code === 'INVALID_DATES'))
      return fail(failure.code, failure.message, { closesAt: failure.message });
    if (!failure.ok && failure.code === 'RUBRIC_LOCKED')
      return fail(failure.code, failure.message, { rubric: failure.message });
    return failure;
  }
  refresh();
  return ok({ id: (data as { id: string }).id });
}

export type CycleAction =
  'publish' | 'unpublish' | 'open_now' | 'extend' | 'close_early' | 'complete' | 'delete';

export async function transitionCycle(
  input: { id: string; action: CycleAction; closesAt?: string },
  ctx: { lang: Lang },
): Promise<Result<{ phase: string }>> {
  const lang = langOf(ctx?.lang);
  if (!UUID.test(input?.id ?? '')) return failCode('NOT_FOUND', lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('transition_membership_cycle', {
    p_id: input.id,
    p_action: input.action,
    p_closes_at: input.closesAt ? new Date(`${input.closesAt}:00+03:00`).toISOString() : undefined,
  });
  if (error) return dbFailure(error, lang);
  refresh();
  return ok({ phase: data as string });
}
