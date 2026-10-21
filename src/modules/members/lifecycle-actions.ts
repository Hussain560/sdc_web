'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { z } from 'zod';
import { fail, ok, type ErrorCode, type Result } from '@/lib/result';
import { createClient } from '@/lib/supabase/server';
import { isLang, type Lang } from '@/modules/auth/messages';
import { getAccess } from '@/modules/access/queries';
import {
  notifyAccount,
  notifyLeadershipOfRequest,
  notifyMemberEvent,
  type MemberMailKind,
} from '@/modules/notifications/lifecycle';
import { sendMemberMessage } from '@/modules/notifications/member-message';
import { memberCode, memberMessage } from './messages';

/** Lifecycle Server Actions (MEM-016..019, ACC-008): ONE database function per action; mails go out afterwards. */
const langOf = (v: unknown): Lang => (isLang(v) ? v : 'ar');
const UUID = z.uuid();
const refresh = () => revalidatePath('/', 'layout');

function dbFailure(error: { message?: string; code?: string }, lang: Lang): Result<never> {
  const code = memberCode(error);
  if (code === 'INTERNAL')
    console.error('[members] unexpected database error', error.code, error.message);
  return fail(code, memberMessage(code, lang));
}
const failCode = (code: ErrorCode, lang: Lang) => fail(code, memberMessage(code, lang));

/** One row of a bulk action: done, or skipped with the reason. */
export type BulkOutcome = { id: string; ok: boolean; code?: ErrorCode | null };
export type BulkResult = { outcomes: BulkOutcome[]; done: number; skipped: number };

const idList = z.array(z.uuid()).min(1).max(200);
const text = (max: number) => z.string().trim().max(max);

function summarise(rows: unknown): BulkResult {
  const outcomes = ((rows ?? []) as Array<{ id: string; ok: boolean; code?: string | null }>).map(
    (r) => ({
      id: r.id,
      ok: r.ok === true,
      code: (r.code ?? null) as ErrorCode | null,
    }),
  );
  const done = outcomes.filter((o) => o.ok).length;
  return { outcomes, done, skipped: outcomes.length - done };
}

async function guard(lang: Lang) {
  return (await getAccess()) ? null : failCode('UNAUTHENTICATED', lang);
}

function mailAfter(ids: string[], kind: MemberMailKind) {
  after(async () => {
    for (const id of ids) {
      try {
        await notifyMemberEvent(id, kind);
      } catch (e) {
        console.error('[members] lifecycle mail failed', kind, (e as Error).message);
      }
    }
  });
}

const okIds = (r: BulkResult) => r.outcomes.filter((o) => o.ok).map((o) => o.id);

// ----------------------------------------------------------------------------------------------- leadership
export async function suspendMembers(
  input: { ids: string[]; category: string; reason: string; until?: string; message?: string },
  ctx: { lang: Lang },
): Promise<Result<BulkResult>> {
  const lang = langOf(ctx?.lang);
  const parsed = z
    .object({
      ids: idList,
      category: z.enum(['conduct', 'inactivity', 'administrative', 'other']),
      reason: text(500).min(1),
      until: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .or(z.literal('')),
      message: text(1000).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return failCode('REASON_REQUIRED', lang);
  const denied = await guard(lang);
  if (denied) return denied;
  const v = parsed.data;
  const { data, error } = await (
    await createClient()
  ).rpc('suspend_members', {
    p_ids: v.ids,
    p_category: v.category,
    p_reason: v.reason,
    p_until: (v.until || undefined) as string,
    p_message: v.message || undefined,
  });
  if (error) return dbFailure(error, lang);
  const r = summarise(data);
  mailAfter(okIds(r), 'suspended');
  refresh();
  return ok(r);
}

export async function reinstateMembers(
  input: { ids: string[]; note?: string; message?: string },
  ctx: { lang: Lang },
): Promise<Result<BulkResult>> {
  const lang = langOf(ctx?.lang);
  const parsed = z
    .object({ ids: idList, note: text(500).optional(), message: text(1000).optional() })
    .safeParse(input);
  if (!parsed.success) return failCode('VALIDATION_FAILED', lang);
  const denied = await guard(lang);
  if (denied) return denied;
  const { data, error } = await (
    await createClient()
  ).rpc('reinstate_members', {
    p_ids: parsed.data.ids,
    p_note: parsed.data.note || undefined,
  });
  if (error) return dbFailure(error, lang);
  const r = summarise(data);
  mailAfter(okIds(r), 'reinstated');
  refresh();
  return ok(r);
}

export async function endMembers(
  input: {
    ids: string[];
    reason: string;
    message?: string;
    endReason?: 'terminated' | 'not_renewed';
  },
  ctx: { lang: Lang },
): Promise<Result<BulkResult>> {
  const lang = langOf(ctx?.lang);
  const parsed = z
    .object({
      ids: idList,
      reason: text(500).min(1),
      message: text(1000).optional(),
      endReason: z.enum(['terminated', 'not_renewed']).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return failCode('REASON_REQUIRED', lang);
  const denied = await guard(lang);
  if (denied) return denied;
  const v = parsed.data;
  const { data, error } = await (
    await createClient()
  ).rpc('end_members', {
    p_ids: v.ids,
    p_reason: v.reason,
    p_end_reason: v.endReason ?? 'terminated',
    p_message: v.message || undefined,
  });
  if (error) return dbFailure(error, lang);
  const r = summarise(data);
  mailAfter(okIds(r), 'ended');
  refresh();
  return ok(r);
}

export async function renewMembers(
  input: { ids: string[]; endsAt: string; message?: string },
  ctx: { lang: Lang },
): Promise<Result<BulkResult>> {
  const lang = langOf(ctx?.lang);
  const parsed = z
    .object({
      ids: idList,
      endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      message: text(1000).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return failCode('VALIDATION_FAILED', lang);
  const denied = await guard(lang);
  if (denied) return denied;
  const { data, error } = await (
    await createClient()
  ).rpc('renew_members', {
    p_ids: parsed.data.ids,
    p_ends_at: parsed.data.endsAt,
    p_message: parsed.data.message || undefined,
  });
  if (error) return dbFailure(error, lang);
  const r = summarise(data);
  mailAfter(okIds(r), 'renewed');
  refresh();
  return ok(r);
}

/** Approve or decline leave requests, one by one or in bulk. A leader never decides about themselves. */
export async function decideLeaveRequests(
  input: { ids: string[]; decision: 'approve' | 'decline'; note?: string; effective?: string },
  ctx: { lang: Lang },
): Promise<Result<BulkResult & { members: Record<string, string> }>> {
  const lang = langOf(ctx?.lang);
  const parsed = z
    .object({
      ids: idList,
      decision: z.enum(['approve', 'decline']),
      note: text(1000).optional(),
      effective: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .or(z.literal('')),
    })
    .safeParse(input);
  if (!parsed.success) return failCode('VALIDATION_FAILED', lang);
  const denied = await guard(lang);
  if (denied) return denied;
  const v = parsed.data;
  // The members behind the requests, read before the decision (the mail needs them afterwards).
  const supabase = await createClient();
  const { data: reqs } = await supabase
    .from('member_leave_requests')
    .select('id, member_id')
    .in('id', v.ids);
  const memberOf = Object.fromEntries((reqs ?? []).map((q) => [q.id, q.member_id]));
  const { data, error } = await supabase.rpc('decide_leave_requests', {
    p_ids: v.ids,
    p_decision: v.decision,
    p_note: v.note || undefined,
    p_effective: (v.effective || undefined) as string,
  });
  if (error) return dbFailure(error, lang);
  const r = summarise(data);
  mailAfter(
    okIds(r)
      .map((id) => memberOf[id])
      .filter((x): x is string => !!x),
    v.decision === 'approve' ? 'leave_approved' : 'leave_declined',
  );
  refresh();
  return ok({ ...r, members: memberOf });
}

/** Messages to the selected members (a template or free text). One mail per member, in their language. */
export async function messageMembers(
  input: { ids: string[]; subject: string; body: string },
  ctx: { lang: Lang },
): Promise<Result<{ queued: number }>> {
  const lang = langOf(ctx?.lang);
  const parsed = z
    .object({ ids: idList, subject: text(150).min(2), body: text(3000).min(2) })
    .safeParse(input);
  if (!parsed.success) return failCode('VALIDATION_FAILED', lang);
  const denied = await guard(lang);
  if (denied) return denied;
  const access = await getAccess();
  if (!access || !access.grants['members.manage']) return failCode('FORBIDDEN', lang);
  const { ids, subject, body } = parsed.data;
  after(async () => {
    for (const id of ids) {
      try {
        await sendMemberMessage(id, subject, body);
      } catch (e) {
        console.error('[members] message failed', (e as Error).message);
      }
    }
  });
  return ok({ queued: ids.length });
}

// ----------------------------------------------------------------------------------------------- accounts
export async function blockAccounts(
  input: { ids: string[]; reason: string },
  ctx: { lang: Lang },
): Promise<Result<BulkResult>> {
  const lang = langOf(ctx?.lang);
  const parsed = z.object({ ids: idList, reason: text(500).min(1) }).safeParse(input);
  if (!parsed.success) return failCode('REASON_REQUIRED', lang);
  const denied = await guard(lang);
  if (denied) return denied;
  const { data, error } = await (
    await createClient()
  ).rpc('block_accounts', {
    p_ids: parsed.data.ids,
    p_reason: parsed.data.reason,
  });
  if (error) return dbFailure(error, lang);
  const r = summarise(data);
  const stamp = String(Date.now());
  after(async () => {
    for (const id of okIds(r)) {
      try {
        await notifyAccount(id, 'blocked', stamp);
      } catch (e) {
        console.error('[members] blocked mail failed', (e as Error).message);
      }
    }
  });
  refresh();
  return ok(r);
}

export async function unblockAccounts(
  input: { ids: string[]; note?: string },
  ctx: { lang: Lang },
): Promise<Result<BulkResult>> {
  const lang = langOf(ctx?.lang);
  const parsed = z.object({ ids: idList, note: text(500).optional() }).safeParse(input);
  if (!parsed.success) return failCode('VALIDATION_FAILED', lang);
  const denied = await guard(lang);
  if (denied) return denied;
  const { data, error } = await (
    await createClient()
  ).rpc('unblock_accounts', {
    p_ids: parsed.data.ids,
    p_note: parsed.data.note || undefined,
  });
  if (error) return dbFailure(error, lang);
  const r = summarise(data);
  const stamp = String(Date.now());
  after(async () => {
    for (const id of okIds(r)) {
      try {
        await notifyAccount(id, 'unblocked', stamp);
      } catch (e) {
        console.error('[members] unblocked mail failed', (e as Error).message);
      }
    }
  });
  refresh();
  return ok(r);
}

// ----------------------------------------------------------------------------------------------- the member
export async function requestToLeave(
  input: { reason?: string; lastDay?: string },
  ctx: { lang: Lang },
): Promise<Result> {
  const lang = langOf(ctx?.lang);
  const parsed = z
    .object({
      reason: text(1000).optional(),
      lastDay: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional()
        .or(z.literal('')),
    })
    .safeParse(input ?? {});
  if (!parsed.success) return failCode('VALIDATION_FAILED', lang);
  const access = await getAccess();
  if (!access) return failCode('UNAUTHENTICATED', lang);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('request_to_leave', {
    p_reason: parsed.data.reason || undefined,
    p_last_day: (parsed.data.lastDay || undefined) as string,
  });
  if (error) return dbFailure(error, lang);
  const requestId = data as string;
  const { data: m } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', access.userId)
    .maybeSingle();
  if (m) {
    after(async () => {
      try {
        await notifyMemberEvent(m.id, 'leave_requested');
        await notifyLeadershipOfRequest('leave', m.id, requestId, parsed.data.reason || null);
      } catch (e) {
        console.error('[members] leave request mail failed', (e as Error).message);
      }
    });
  }
  refresh();
  return ok(undefined);
}

export async function withdrawLeaveRequest(ctx: { lang: Lang }): Promise<Result> {
  const lang = langOf(ctx?.lang);
  const denied = await guard(lang);
  if (denied) return denied;
  const { error } = await (await createClient()).rpc('withdraw_leave_request');
  if (error) return dbFailure(error, lang);
  refresh();
  return ok(undefined);
}

export async function requestRenewal(ctx: { lang: Lang }): Promise<Result> {
  const lang = langOf(ctx?.lang);
  const access = await getAccess();
  if (!access) return failCode('UNAUTHENTICATED', lang);
  const supabase = await createClient();
  const { error } = await supabase.rpc('request_renewal');
  if (error) return dbFailure(error, lang);
  const { data: m } = await supabase
    .from('members')
    .select('id')
    .eq('user_id', access.userId)
    .maybeSingle();
  if (m) {
    after(async () => {
      try {
        await notifyLeadershipOfRequest('renewal', m.id, `${m.id}:${Date.now()}`);
      } catch (e) {
        console.error('[members] renewal request mail failed', (e as Error).message);
      }
    });
  }
  refresh();
  return ok(undefined);
}

export async function rotateCardToken(ctx: { lang: Lang }): Promise<Result> {
  const lang = langOf(ctx?.lang);
  const denied = await guard(lang);
  if (denied) return denied;
  const { error } = await (await createClient()).rpc('rotate_card_token');
  if (error) return dbFailure(error, lang);
  refresh();
  return ok(undefined);
}

export async function saveOnboardingStep(
  input: { step: number; done?: boolean },
  ctx: { lang: Lang },
): Promise<Result> {
  const lang = langOf(ctx?.lang);
  const denied = await guard(lang);
  if (denied) return denied;
  const step = Math.min(5, Math.max(0, Math.trunc(Number(input?.step) || 0)));
  const { error } = await (
    await createClient()
  ).rpc('save_onboarding_step', {
    p_step: step,
    p_done: input?.done === true,
  });
  if (error) return dbFailure(error, lang);
  refresh();
  return ok(undefined);
}

/** A signed-in person's first visit marks the activation at once (the daily job is the safety net). */
export async function markActivated(): Promise<void> {
  if (!(await getAccess())) return;
  await (await createClient()).rpc('sync_my_activation');
}

/** Re-sends the activation mail for members who never activated (members.create). */
export async function resendActivations(
  input: { ids: string[] },
  ctx: { lang: Lang },
): Promise<Result<{ queued: number }>> {
  const lang = langOf(ctx?.lang);
  const parsed = z.object({ ids: idList }).safeParse(input);
  if (!parsed.success) return failCode('VALIDATION_FAILED', lang);
  const access = await getAccess();
  if (!access) return failCode('UNAUTHENTICATED', lang);
  if (!access.grants['members.create']) return failCode('FORBIDDEN', lang);
  const { resendMemberActivation } = await import('./actions');
  after(async () => {
    for (const id of parsed.data.ids) {
      try {
        await resendMemberActivation(id, { lang });
      } catch (e) {
        console.error('[members] resend activation failed', (e as Error).message);
      }
    }
  });
  return ok({ queued: parsed.data.ids.length });
}
