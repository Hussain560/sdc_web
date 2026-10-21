'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { fail, ok, type ErrorCode, type Result } from '@/lib/result';
import { createClient } from '@/lib/supabase/server';
import { isLang, type Lang } from '@/modules/auth/messages';
import { getAccess } from '@/modules/access/queries';
import {
  cancelDecisionMail,
  enqueueDecisionMail,
  flushOutbox,
  notifyApplicationInfoRequested,
  sendActivationMail,
  UNDO_HOLD_SECONDS,
} from '@/modules/notifications/lifecycle';
import { ensureApplicantAccounts } from './accounts';
import { membershipCode, membershipMessage } from './messages';

/** Review Server Actions: claim / release, decisions with a short undo window, info requests, scoring, restore. */
const langOf = (v: unknown): Lang => (isLang(v) ? v : 'ar');
const UUID = /^[0-9a-f-]{36}$/i;

function dbFailure(error: { message?: string; code?: string }, lang: Lang): Result<never> {
  const code = membershipCode(error);
  if (code === 'INTERNAL')
    console.error('[membership] unexpected database error', error.code, error.message);
  return fail(code, membershipMessage(code, lang));
}
const failCode = (code: ErrorCode, lang: Lang) => fail(code, membershipMessage(code, lang));
const refresh = () => revalidatePath('/', 'layout');

export type ApplicationOutcome = { id: string; ok: boolean; status?: string; code?: ErrorCode };

export async function claimApplication(
  input: { id: string; release?: boolean },
  ctx: { lang: Lang },
): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!UUID.test(input?.id ?? '')) return failCode('NOT_FOUND', lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  const supabase = await createClient();
  const { error } = await supabase.rpc('claim_membership_application', {
    p_id: input.id,
    p_release: input.release ?? false,
  });
  if (error) return dbFailure(error, lang);
  refresh();
  return ok(undefined);
}

const TEMPLATE = {
  accepted: 'membership.application_accepted',
  rejected: 'membership.application_rejected',
  waitlisted: 'membership.application_waitlisted',
} as const;

/**
 * Accept / waitlist / reject one or many (≤ 200). Acceptance creates the person's account first (the member row
 * needs it). Every decision e-mail is held back by the outbox for a few seconds, so the person who decided can undo
 * (`undoDecision`) before anything is sent; the daily job is the safety net for rows nobody flushes.
 */
export async function decideApplications(
  input: { ids: string[]; decision: 'accept' | 'reject' | 'waitlist'; note?: string },
  ctx: { lang: Lang },
): Promise<Result<{ outcomes: ApplicationOutcome[]; undoSeconds: number }>> {
  const lang = langOf(ctx?.lang);
  const ids = Array.isArray(input?.ids) ? input.ids.filter((x) => UUID.test(x)) : [];
  if (
    ids.length === 0 ||
    ids.length > 200 ||
    !['accept', 'reject', 'waitlist'].includes(input?.decision)
  )
    return failCode('VALIDATION_FAILED', lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);

  const accounts =
    input.decision === 'accept'
      ? await ensureApplicantAccounts(ids)
      : { activation: new Map<string, string>(), failed: new Set<string>() };
  const decidable = ids.filter((x) => !accounts.failed.has(x));
  const failedOutcomes: ApplicationOutcome[] = [...accounts.failed].map((id) => ({
    id,
    ok: false,
    code: 'NO_ACCOUNT' as ErrorCode,
  }));

  const supabase = await createClient();
  const { data, error } = decidable.length
    ? await supabase.rpc('decide_membership_applications', {
        p_ids: decidable,
        p_decision: input.decision,
        p_note: input.note?.trim() || undefined,
      })
    : { data: [], error: null };
  if (error) return dbFailure(error, lang);

  const outcomes = [...(data as ApplicationOutcome[]), ...failedOutcomes];
  const template =
    input.decision === 'accept'
      ? TEMPLATE.accepted
      : input.decision === 'reject'
        ? TEMPLATE.rejected
        : TEMPLATE.waitlisted;
  // The mails wait in the outbox; the response returns at once and a delayed flush releases them.
  for (const r of outcomes.filter((x) => x.ok)) {
    try {
      await enqueueDecisionMail(r.id, template, accounts.activation.get(r.id));
    } catch (e) {
      console.error('[membership] enqueue failed', (e as Error).message);
    }
  }
  after(async () => {
    await new Promise((resolve) => setTimeout(resolve, (UNDO_HOLD_SECONDS + 1) * 1000));
    try {
      await flushOutbox();
    } catch (e) {
      console.error('[membership] outbox flush failed', (e as Error).message);
    }
  });
  refresh();
  return ok({ outcomes, undoSeconds: UNDO_HOLD_SECONDS });
}

/** Undoes a decision while its e-mail is still held back. Returns the status the application went back to. */
export async function undoDecision(
  id: string,
  ctx: { lang: Lang },
): Promise<Result<{ status: string }>> {
  const lang = langOf(ctx?.lang);
  if (!UUID.test(id ?? '')) return failCode('NOT_FOUND', lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('undo_application_decision', { p_id: id });
  if (error) return dbFailure(error, lang);
  await cancelDecisionMail(id);
  refresh();
  return ok({ status: data as string });
}

/** Asks the applicant to fix something: a message, and which parts they may edit. The mail goes straight out. */
export async function requestApplicationInfo(
  input: { id: string; message: string; fields: string[] },
  ctx: { lang: Lang },
): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!UUID.test(input?.id ?? '')) return failCode('NOT_FOUND', lang);
  const message = (input.message ?? '').trim();
  if (!message || message.length > 1000)
    return fail('VALIDATION_FAILED', membershipMessage('VALIDATION_FAILED', lang), {
      message: membershipMessage('VALIDATION_FAILED', lang),
    });
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  const supabase = await createClient();
  const { error } = await supabase.rpc('request_application_info', {
    p_id: input.id,
    p_message: message,
    p_fields: (input.fields ?? []).filter((f) => typeof f === 'string' && f.length <= 40),
  });
  if (error) return dbFailure(error, lang);
  after(async () => {
    try {
      await notifyApplicationInfoRequested(input.id);
    } catch (e) {
      console.error('[membership] info request mail failed', (e as Error).message);
    }
  });
  refresh();
  return ok(undefined);
}

/** A reviewer's 1–5 score per criterion and a comment (visible to reviewers only). */
export async function saveScore(
  input: { id: string; scores: Record<string, number>; comment?: string },
  ctx: { lang: Lang },
): Promise<Result<{ average: number | null; reviewers: number }>> {
  const lang = langOf(ctx?.lang);
  if (!UUID.test(input?.id ?? '')) return failCode('NOT_FOUND', lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('save_application_score', {
    p_app: input.id,
    p_scores: input.scores as never,
    p_comment: input.comment?.trim() || undefined,
  });
  if (error) return dbFailure(error, lang);
  const r = data as { average: number | null; reviewers: number };
  refresh();
  return ok({ average: r.average === null ? null : Number(r.average), reviewers: r.reviewers });
}

/** Leadership restores a lapsed person while a place remains; they get a new activation link. */
export async function restoreApplication(id: string, ctx: { lang: Lang }): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!UUID.test(id ?? '')) return failCode('NOT_FOUND', lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  const supabase = await createClient();
  const { error } = await supabase.rpc('restore_application', { p_id: id });
  if (error) return dbFailure(error, lang);
  after(async () => {
    try {
      await sendActivationMail(id, 'restored');
    } catch (e) {
      console.error('[membership] restored mail failed', (e as Error).message);
    }
  });
  refresh();
  return ok(undefined);
}

/** Re-sends the acceptance mail with a fresh activation link (leadership, from the activation list). */
export async function resendApplicationActivation(
  id: string,
  ctx: { lang: Lang },
): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!UUID.test(id ?? '')) return failCode('NOT_FOUND', lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  const out = await sendActivationMail(id, 'resend');
  if (out === 'none') return failCode('NOT_FOUND', lang);
  refresh();
  return ok(undefined);
}
