'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { can } from '@/lib/auth/permissions';
import { fail, ok, type ErrorCode, type Result } from '@/lib/result';
import { createClient } from '@/lib/supabase/server';
import { notifyCommitteeAssigned } from '@/modules/notifications/access';
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

/** Tells the person about their new position after the response is sent; a mail problem never fails the action. */
function mailAssignment(assignmentId: string) {
  after(async () => {
    try {
      await notifyCommitteeAssigned(assignmentId);
    } catch (e) {
      console.error('[access] assignment notification failed', (e as Error).message);
    }
  });
}

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

  mailAssignment(data);
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
    p_keep_as_deputy: parsed.data.keepAsDeputy ?? false,
  });
  if (error) return failCode(codeFromDbError(error), lang);

  mailAssignment(data);
  revalidatePath('/', 'layout');
  return ok({ id: data });
}

export type AssignableUser = {
  memberId: string;
  userId: string;
  nameAr: string;
  nameEn: string | null;
  /** Only for people who may search every account (users.view). */
  email: string | null;
  photoPath: string | null;
  /** The account has signed in at least once. */
  activated: boolean;
  /** Holds a position in the committee the dialog is for. */
  inCommittee: boolean;
  roleAr: string | null;
  roleEn: string | null;
};

export type AssignableSearch = {
  /** The search is limited to the people of one committee. Say so instead of staying silent. */
  restricted: boolean;
  /** Who leads the committee now (names only), for the handover warning. */
  head: { nameAr: string; nameEn: string | null } | null;
  rows: AssignableUser[];
};

/**
 * The person picker of the assign dialog. One database function decides what the caller may search, searches every
 * name part in both languages and returns `restricted` when the answer is limited (a committee head sees only the
 * own committee), so the dialog can say why instead of showing an empty list.
 */
export async function searchAssignableUsers(
  query: string,
  committeeId?: string,
): Promise<Result<AssignableSearch>> {
  if (!(await getAccess())) return fail('UNAUTHENTICATED', accessMessage('UNAUTHENTICATED', 'ar'));
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('search_assignable_users', {
    p_query: query,
    ...(committeeId ? { p_committee: committeeId } : {}),
  });
  if (error) {
    const code = codeFromDbError(error);
    return fail(code, accessMessage(code, 'ar'));
  }
  const d = data as unknown as {
    restricted: boolean;
    head: { name_ar: string; name_en: string | null } | null;
    rows: Array<{
      member_id: string;
      user_id: string;
      name_ar: string;
      name_en: string | null;
      email: string | null;
      photo_path: string | null;
      activated: boolean;
      in_committee: boolean;
      role_ar: string | null;
      role_en: string | null;
    }>;
  };
  return ok({
    restricted: d.restricted,
    head: d.head ? { nameAr: d.head.name_ar, nameEn: d.head.name_en } : null,
    rows: d.rows.map((r) => ({
      memberId: r.member_id,
      userId: r.user_id,
      nameAr: r.name_ar,
      nameEn: r.name_en,
      email: r.email,
      photoPath: r.photo_path,
      activated: r.activated,
      inCommittee: r.in_committee,
      roleAr: r.role_ar,
      roleEn: r.role_en,
    })),
  });
}
