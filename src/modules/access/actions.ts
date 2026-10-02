'use server';

import { revalidatePath } from 'next/cache';
import { can } from '@/lib/auth/permissions';
import { fail, ok, type ErrorCode, type Result } from '@/lib/result';
import { createClient } from '@/lib/supabase/server';
import { fieldErrorsOf } from '@/modules/auth/schemas';
import { isLang, type Lang } from '@/modules/auth/messages';
import { accessMessage, codeFromDbError } from './messages';
import { getAccess } from './queries';
import { assignRoleSchema, endAssignmentSchema, handoverSchema, riyadhMidnight } from './schemas';

/**
 * Role-assignment Server Actions. Pattern (server-logic §3): authenticate → validate → UX pre-check with can()
 * → ONE database function call that re-checks everything (authorization, anti-escalation, guards) → revalidate.
 * The pre-check only gives faster errors; the SQL functions are authoritative.
 */
const langOf = (v: unknown): Lang => (isLang(v) ? v : 'ar');
const failCode = (code: ErrorCode, lang: Lang) => fail(code, accessMessage(code, lang));

export async function assignRole(
  input: unknown,
  ctx: { lang: Lang },
): Promise<Result<{ id: string }>> {
  const lang = langOf(ctx?.lang);
  const access = await getAccess();
  if (!access) return failCode('UNAUTHENTICATED', lang);

  const parsed = assignRoleSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'VALIDATION_FAILED',
      accessMessage('VALIDATION_FAILED', lang),
      fieldErrorsOf(parsed.error),
    );
  }
  const v = parsed.data;
  if (!can(access, 'roles.assign') && !can(access, 'committee_members.manage', v.committeeId)) {
    return failCode('FORBIDDEN', lang);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('assign_role', {
    p_user: v.userId,
    p_role: v.roleKey,
    p_committee: v.committeeId,
    p_starts_at: v.startsAt ? riyadhMidnight(v.startsAt) : undefined,
    p_ends_at: v.endsAt ? riyadhMidnight(v.endsAt) : undefined,
    p_title_ar: v.titleAr,
    p_title_en: v.titleEn,
    p_bio_ar: v.bioAr,
    p_bio_en: v.bioEn,
    p_tags_ar: v.tagsAr.length ? v.tagsAr : undefined,
    p_tags_en: v.tagsEn.length ? v.tagsEn : undefined,
  });
  if (error) return failCode(codeFromDbError(error), lang);

  revalidatePath('/', 'layout');
  return ok({ id: data });
}

export async function endRoleAssignment(input: unknown, ctx: { lang: Lang }): Promise<Result> {
  const lang = langOf(ctx?.lang);
  const access = await getAccess();
  if (!access) return failCode('UNAUTHENTICATED', lang);

  const parsed = endAssignmentSchema.safeParse(input);
  if (!parsed.success) {
    const fe = fieldErrorsOf(parsed.error);
    return fail(
      fe.reason ? 'REASON_REQUIRED' : 'VALIDATION_FAILED',
      accessMessage(fe.reason ? 'REASON_REQUIRED' : 'VALIDATION_FAILED', lang),
      fe,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('end_role_assignment', {
    p_id: parsed.data.assignmentId,
    p_reason: parsed.data.reason,
    p_ends_at: parsed.data.endsAt ? riyadhMidnight(parsed.data.endsAt) : undefined,
  });
  if (error) return failCode(codeFromDbError(error), lang);

  revalidatePath('/', 'layout');
  return ok(undefined);
}

export async function handoverHead(
  input: unknown,
  ctx: { lang: Lang },
): Promise<Result<{ id: string }>> {
  const lang = langOf(ctx?.lang);
  const access = await getAccess();
  if (!access) return failCode('UNAUTHENTICATED', lang);
  if (!can(access, 'roles.assign')) return failCode('FORBIDDEN', lang);

  const parsed = handoverSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'VALIDATION_FAILED',
      accessMessage('VALIDATION_FAILED', lang),
      fieldErrorsOf(parsed.error),
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('handover_head', {
    p_committee: parsed.data.committeeId,
    p_new_head: parsed.data.newHeadUserId,
    p_at: parsed.data.handoverAt ? riyadhMidnight(parsed.data.handoverAt) : undefined,
  });
  if (error) return failCode(codeFromDbError(error), lang);

  revalidatePath('/', 'layout');
  return ok({ id: data });
}

/** Typeahead for the assign dialog. Needs users.view; RLS filters the rows as well. */
export async function searchUsers(
  query: string,
): Promise<Array<{ id: string; name: string; email: string }>> {
  const access = await getAccess();
  if (!access || !can(access, 'users.view')) return [];
  const q = query.trim().replace(/[%,()]/g, ' ');
  if (q.length < 2) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name_ar, full_name_en, email')
    .or(`full_name_ar.ilike.%${q}%,full_name_en.ilike.%${q}%,email.ilike.%${q}%`)
    .order('full_name_ar')
    .limit(8);
  return (data ?? []).map((p) => ({ id: p.id, name: p.full_name_ar, email: p.email }));
}
