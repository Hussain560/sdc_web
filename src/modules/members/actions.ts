'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { z } from 'zod';
import { fail, ok, type ErrorCode, type Result } from '@/lib/result';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { isLang, type Lang } from '@/modules/auth/messages';
import { getAccess } from '@/modules/access/queries';
import { sendClaimInviteMail, sendMemberCreatedMail } from '@/modules/notifications/membership';
import { can } from '@/lib/auth/permissions';
import { memberCode, memberMessage } from './messages';
import { WIZARD_ROLE_KEYS } from './new-member';
import { toProfilePayload, validateProfile, type ProfileValues } from './schemas';

/** Member Server Actions: authenticate → validate → ONE database function (authoritative) → Result. */
const langOf = (v: unknown): Lang => (isLang(v) ? v : 'ar');
const UUID = z.uuid();

function dbFailure(error: { message?: string; code?: string }, lang: Lang): Result<never> {
  const code = memberCode(error);
  if (code === 'INTERNAL')
    console.error('[members] unexpected database error', error.code, error.message);
  return fail(code, memberMessage(code, lang));
}
const failCode = (code: ErrorCode, lang: Lang) => fail(code, memberMessage(code, lang));
const refresh = () => revalidatePath('/', 'layout');

export async function updateMyMemberProfile(
  values: ProfileValues,
  ctx: { lang: Lang },
): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  const errors = validateProfile(values, lang);
  if (Object.keys(errors).length > 0)
    return fail('VALIDATION_FAILED', memberMessage('VALIDATION_FAILED', lang), errors);
  const supabase = await createClient();
  const { error } = await supabase.rpc('update_my_member_profile', {
    p: toProfilePayload(values) as never,
  });
  if (error) return dbFailure(error, lang);
  refresh();
  return ok(undefined);
}

/** Leadership sends a one-time claim link to a legacy member's known e-mail (7 days, single use). */
export async function sendClaimInvite(
  input: { memberId: string; email: string },
  ctx: { lang: Lang },
): Promise<Result<{ sent: boolean }>> {
  const lang = langOf(ctx?.lang);
  if (!UUID.safeParse(input?.memberId).success) return failCode('NOT_FOUND', lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  const supabase = await createClient();
  const { data: token, error } = await supabase.rpc('create_member_claim_token', {
    p_member: input.memberId,
    p_email: input.email,
  });
  if (error) return dbFailure(error, lang);

  // The member's name for the greeting comes through RLS (members.manage reads all).
  const { data: m } = await supabase
    .from('members')
    .select('first_name_ar, last_name_ar')
    .eq('id', input.memberId)
    .maybeSingle();
  const name = m ? `${m.first_name_ar} ${m.last_name_ar}`.trim() : '';
  after(async () => {
    try {
      await sendClaimInviteMail({
        memberId: input.memberId,
        email: input.email.trim().toLowerCase(),
        token: token as string,
        name,
      });
    } catch (e) {
      console.error('[members] claim invite failed', (e as Error).message);
    }
  });
  refresh();
  return ok({ sent: true });
}

export async function previewClaim(
  token: string,
  ctx: { lang: Lang },
): Promise<Result<{ nameAr: string; nameEn: string | null }>> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('preview_member_claim', {
    p_token: String(token ?? ''),
  });
  if (error) return dbFailure(error, lang);
  const r = data as { name_ar: string; name_en: string | null };
  return ok({ nameAr: r.name_ar, nameEn: r.name_en });
}

export async function claimLegacyMember(
  token: string,
  ctx: { lang: Lang },
): Promise<Result<{ id: string }>> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('claim_legacy_member', {
    p_token: String(token ?? ''),
  });
  if (error) return dbFailure(error, lang);
  // No revalidation here: the claim page keeps its confirmation panel (a refresh would re-run the now-spent token).
  return ok({ id: data as string });
}

const optionalDigits = z.string().regex(/^\d*$/).optional();
const createSchema = z
  .object({
    firstNameAr: z.string().trim().min(1).max(100),
    middleNameAr: z.string().trim().max(100).optional(),
    lastNameAr: z.string().trim().min(1).max(100),
    firstNameEn: z.string().trim().min(1).max(100),
    middleNameEn: z.string().trim().max(100).optional(),
    lastNameEn: z.string().trim().min(1).max(100),
    email: z
      .string()
      .trim()
      .max(160)
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/),
    /** International format (E.164), or empty. */
    phone: z
      .string()
      .regex(/^(\+[1-9]\d{6,14})?$/)
      .optional(),
    academicStatus: z.enum(['student', 'graduate', 'employee', 'other']),
    universityId: optionalDigits,
    majorId: optionalDigits,
    subMajorId: optionalDigits,
    trackId: optionalDigits,
    committeeId: z.union([z.uuid(), z.literal('')]).optional(),
    roleKey: z.union([z.enum(WIZARD_ROLE_KEYS), z.literal('')]).optional(),
    /** Saudi midnight as an ISO instant, or empty for now. */
    startsAt: z.string().max(40).optional(),
    handover: z.boolean().optional(),
    keepAsDeputy: z.boolean().optional(),
  })
  .refine((v) => !!v.committeeId === !!v.roleKey, { path: ['roleKey'] });
export type CreateMemberInput = z.input<typeof createSchema>;

export type MemberEmailStatus = 'sent' | 'queued' | 'none';
const mailStatus = (o: string | 'none'): MemberEmailStatus =>
  o === 'sent' || o === 'duplicate' ? 'sent' : o === 'failed' ? 'queued' : 'none';

const siteUrl = () => (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/** A one-time link to choose a password and activate the account, for people who have never signed in. */
async function activationLink(db: ReturnType<typeof createAdminClient>, mail: string, lang: Lang) {
  const gen = await db.auth.admin.generateLink({ type: 'recovery', email: mail });
  const hash = gen.data?.properties?.hashed_token;
  if (!hash) return undefined;
  return `${siteUrl()}/auth/confirm?token_hash=${encodeURIComponent(hash)}&type=recovery&next=${encodeURIComponent('/reset-password?welcome=1')}${lang === 'en' ? '&locale=en' : ''}`;
}

/**
 * Leadership adds a member (Sprint 17 wizard). The account is created here with the server key (confirmed, no
 * password), then ONE database function writes the member and, when asked, the committee position in a single
 * transaction (a refused position leaves no member behind). A newly created account is removed again when that
 * function refuses. The member gets an e-mail with the one-time activation link; the answer says whether the mail went
 * out or was queued for a retry, so the wizard can tell the person instead of guessing.
 */
export async function createMember(
  input: CreateMemberInput,
  ctx: { lang: Lang },
): Promise<
  Result<{ id: string; emailStatus: MemberEmailStatus; activationLinked: boolean; userId: string }>
> {
  const lang = langOf(ctx?.lang);
  const access = await getAccess();
  if (!access) return failCode('UNAUTHENTICATED', lang);
  if (!can(access, 'members.create')) return failCode('FORBIDDEN', lang);
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues)
      fieldErrors[String(i.path[0])] ??= memberMessage('VALIDATION_FAILED', lang);
    return fail('VALIDATION_FAILED', memberMessage('VALIDATION_FAILED', lang), fieldErrors);
  }
  const v = parsed.data;
  // A quick answer for the common case; the database function decides.
  if (
    v.roleKey &&
    !can(access, 'roles.assign') &&
    !can(access, 'committee_members.manage', v.committeeId || undefined)
  )
    return failCode('FORBIDDEN', lang);
  const mail = v.email.toLowerCase();
  const nameAr = [v.firstNameAr, v.middleNameAr, v.lastNameAr].filter(Boolean).join(' ');

  const db = createAdminClient();
  const { data: existing } = await db
    .from('profiles')
    .select('id')
    .ilike('email', mail)
    .maybeSingle();
  let userId = existing?.id ?? null;
  let created = false;
  try {
    if (!userId) {
      const res = await db.auth.admin.createUser({
        email: mail,
        email_confirm: true,
        user_metadata: { full_name: nameAr, locale: lang },
      });
      if (res.error || !res.data.user) throw new Error(res.error?.message ?? 'createUser failed');
      userId = res.data.user.id;
      created = true;
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('create_member', {
      p_user: userId,
      p: {
        first_name_ar: v.firstNameAr,
        middle_name_ar: v.middleNameAr ?? '',
        last_name_ar: v.lastNameAr,
        first_name_en: v.firstNameEn,
        middle_name_en: v.middleNameEn ?? '',
        last_name_en: v.lastNameEn,
        phone: v.phone ?? '',
        academic_status: v.academicStatus,
        university_id: v.universityId ?? '',
        major_id: v.majorId ?? '',
        sub_major_id: v.subMajorId ?? '',
        track_id: v.trackId ?? '',
        ...(v.roleKey
          ? {
              role_key: v.roleKey,
              committee_id: v.committeeId,
              starts_at: v.startsAt ?? '',
              handover: v.handover ?? false,
              keep_as_deputy: v.handover ? (v.keepAsDeputy ?? false) : false,
            }
          : {}),
      } as never,
    });
    if (error) {
      if (created) await db.auth.admin.deleteUser(userId);
      return dbFailure(error, lang);
    }
    const memberId = data as string;

    const activationUrl = created ? await activationLink(db, mail, lang) : undefined;
    const outcome = await sendMemberCreatedMail({
      memberId,
      userId,
      email: mail,
      name: nameAr,
      lang,
      activationUrl,
    }).catch(() => 'failed' as const);
    refresh();
    return ok({
      id: memberId,
      userId,
      emailStatus: mailStatus(outcome),
      activationLinked: !!activationUrl,
    });
  } catch (e) {
    console.error('[members] create failed', (e as Error).message);
    if (created && userId) await db.auth.admin.deleteUser(userId);
    return failCode('INTERNAL', lang);
  }
}

export type EmailCheck = {
  /** An account with this e-mail exists. */
  account: boolean;
  /** It already belongs to a member. */
  member: { id: string; nameAr: string; nameEn: string | null } | null;
};

/** Step one of the wizard asks this before anything is created: is the e-mail already taken? */
export async function checkMemberEmail(email: string): Promise<Result<EmailCheck>> {
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', 'ar');
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('find_member_by_email', { p_email: email });
  if (error) return dbFailure(error, 'ar');
  const d = data as unknown as {
    account: boolean;
    member: { id: string; name_ar: string; name_en: string | null } | null;
  };
  return ok({
    account: d.account,
    member: d.member
      ? { id: d.member.id, nameAr: d.member.name_ar, nameEn: d.member.name_en }
      : null,
  });
}

/** Sends the activation e-mail again (after a delayed or lost one). A fresh one-time link is made each time. */
export async function resendMemberActivation(
  memberId: string,
  ctx: { lang: Lang },
): Promise<Result<{ emailStatus: MemberEmailStatus }>> {
  const lang = langOf(ctx?.lang);
  const access = await getAccess();
  if (!access) return failCode('UNAUTHENTICATED', lang);
  if (!can(access, 'members.create')) return failCode('FORBIDDEN', lang);
  if (!UUID.safeParse(memberId).success) return failCode('NOT_FOUND', lang);

  const supabase = await createClient();
  const { data: m } = await supabase
    .from('members')
    .select('id, user_id, first_name_ar, middle_name_ar, last_name_ar')
    .eq('id', memberId)
    .maybeSingle();
  if (!m?.user_id) return failCode('NOT_FOUND', lang);
  const { data: p } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', m.user_id)
    .maybeSingle();
  if (!p?.email) return failCode('NOT_FOUND', lang);

  const db = createAdminClient();
  const activationUrl = await activationLink(db, p.email, lang);
  const outcome = await sendMemberCreatedMail({
    memberId: m.id,
    userId: m.user_id,
    email: p.email,
    name: [m.first_name_ar, m.middle_name_ar, m.last_name_ar].filter(Boolean).join(' '),
    lang,
    activationUrl,
  }).catch(() => 'failed' as const);
  return ok({ emailStatus: mailStatus(outcome) });
}

const staffEditSchema = z.object({
  firstNameAr: z.string().trim().min(1).max(100),
  middleNameAr: z.string().trim().max(100).optional(),
  lastNameAr: z.string().trim().min(1).max(100),
  firstNameEn: z.string().trim().max(100).optional(),
  middleNameEn: z.string().trim().max(100).optional(),
  lastNameEn: z.string().trim().max(100).optional(),
  /** International format, empty to clear, or undefined to leave it as it is. */
  phone: z
    .string()
    .regex(/^(\+[1-9]\d{6,14})?$/)
    .optional(),
  academicStatus: z.enum(['student', 'graduate', 'employee', 'other']),
  /** Leadership only: male | female, or empty to clear. */
  gender: z.enum(['male', 'female', '']).optional(),
  /** 1 to 7 for a student, empty otherwise. */
  studyYear: z
    .string()
    .regex(/^[1-7]?$/)
    .optional(),
  universityId: optionalDigits,
  majorId: optionalDigits,
  subMajorId: optionalDigits,
  trackId: optionalDigits,
  /** The public text of the profile (leadership may edit it; the visibility switches stay with the member). */
  headlineAr: z.string().trim().max(80).optional(),
  headlineEn: z.string().trim().max(80).optional(),
  aboutAr: z.string().trim().max(1000).optional(),
  aboutEn: z.string().trim().max(1000).optional(),
  openTo: z
    .array(z.enum(['internship', 'job', 'freelance', 'mentoring', 'speaking', 'collaboration']))
    .max(6)
    .optional(),
  links: z
    .partialRecord(
      z.enum([
        'portfolio_url',
        'github_url',
        'linkedin_url',
        'x_url',
        'website_url',
        'behance_url',
        'dribbble_url',
        'youtube_url',
      ]),
      z
        .string()
        .trim()
        .max(500)
        .regex(/^(https:\/\/\S+)?$/),
    )
    .optional(),
});
export type StaffEditInput = z.input<typeof staffEditSchema>;

/**
 * Leadership edits a member's names, phone, academic data and the public text of the profile (headline, about, open
 * to, links). The visibility switches and the photo stay with the member. One database function checks
 * `members.manage` (and `members.view_contact` for the phone) and audits the change.
 */
export async function updateMemberByStaff(
  id: string,
  input: StaffEditInput,
  ctx: { lang: Lang },
): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!UUID.safeParse(id).success) return failCode('NOT_FOUND', lang);
  const access = await getAccess();
  if (!access) return failCode('UNAUTHENTICATED', lang);
  if (!can(access, 'members.manage')) return failCode('FORBIDDEN', lang);
  const parsed = staffEditSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues)
      fieldErrors[String(i.path[0])] ??= memberMessage('VALIDATION_FAILED', lang);
    return fail('VALIDATION_FAILED', memberMessage('VALIDATION_FAILED', lang), fieldErrors);
  }
  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc('admin_update_member', {
    p_id: id,
    p: {
      first_name_ar: v.firstNameAr,
      middle_name_ar: v.middleNameAr ?? '',
      last_name_ar: v.lastNameAr,
      first_name_en: v.firstNameEn ?? '',
      middle_name_en: v.middleNameEn ?? '',
      last_name_en: v.lastNameEn ?? '',
      ...(v.phone !== undefined ? { phone: v.phone } : {}),
      academic_status: v.academicStatus,
      university_id: v.universityId ?? '',
      major_id: v.majorId ?? '',
      sub_major_id: v.subMajorId ?? '',
      track_id: v.trackId ?? '',
      ...(v.gender !== undefined ? { gender: v.gender } : {}),
      ...(v.studyYear !== undefined
        ? { study_year: v.academicStatus === 'student' ? v.studyYear : '' }
        : {}),
      ...(v.headlineAr !== undefined ? { headline_ar: v.headlineAr } : {}),
      ...(v.headlineEn !== undefined ? { headline_en: v.headlineEn } : {}),
      ...(v.aboutAr !== undefined ? { about_ar: v.aboutAr } : {}),
      ...(v.aboutEn !== undefined ? { about_en: v.aboutEn } : {}),
      ...(v.openTo !== undefined ? { open_to: v.openTo } : {}),
      ...(v.links ?? {}),
    } as never,
  });
  if (error) return dbFailure(error, lang);
  refresh();
  return ok(undefined);
}

async function staffGuard(lang: Lang): Promise<Result<never> | null> {
  const access = await getAccess();
  if (!access) return failCode('UNAUTHENTICATED', lang);
  if (!can(access, 'members.manage')) return failCode('FORBIDDEN', lang);
  return null;
}

/** Leadership sets a member's skills, in order (members.manage; at most 12). */
export async function setMemberSkillsByStaff(
  id: string,
  slugs: string[],
  ctx: { lang: Lang },
): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!UUID.safeParse(id).success) return failCode('NOT_FOUND', lang);
  const parsed = z
    .array(z.string().regex(/^[a-z0-9-]{1,60}$/))
    .max(12)
    .safeParse(slugs);
  if (!parsed.success) return failCode('VALIDATION_FAILED', lang);
  const denied = await staffGuard(lang);
  if (denied) return denied;
  const { error } = await (
    await createClient()
  ).rpc('admin_set_member_skills', { p_id: id, p_slugs: parsed.data });
  if (error) return dbFailure(error, lang);
  refresh();
  return ok(undefined);
}

const staffProjectSchema = z.object({
  id: z.uuid().optional(),
  title_ar: z.string().trim().min(1).max(80),
  title_en: z.string().trim().max(80),
  description_ar: z.string().trim().max(300),
  description_en: z.string().trim().max(300),
  url: z
    .string()
    .trim()
    .max(500)
    .regex(/^https:\/\/\S+$/),
});
export type StaffProjectInput = z.input<typeof staffProjectSchema>;

/** The member's projects with their descriptions, for the leadership editor. */
export async function getMemberProjectsForStaff(
  id: string,
  ctx: { lang: Lang },
): Promise<Result<Array<StaffProjectInput & { id: string }>>> {
  const lang = langOf(ctx?.lang);
  if (!UUID.safeParse(id).success) return failCode('NOT_FOUND', lang);
  const denied = await staffGuard(lang);
  if (denied) return denied;
  const { data, error } = await (await createClient()).rpc('admin_member_projects', { p_id: id });
  if (error) return dbFailure(error, lang);
  return ok(
    ((data ?? []) as Array<Record<string, string | null>>).map((p) => ({
      id: String(p.id),
      title_ar: p.title_ar ?? '',
      title_en: p.title_en ?? '',
      description_ar: p.description_ar ?? '',
      description_en: p.description_en ?? '',
      url: p.url ?? '',
    })),
  );
}

export async function saveMemberProjectByStaff(
  memberId: string,
  input: StaffProjectInput,
  ctx: { lang: Lang },
): Promise<Result<{ id: string }>> {
  const lang = langOf(ctx?.lang);
  if (!UUID.safeParse(memberId).success) return failCode('NOT_FOUND', lang);
  const parsed = staffProjectSchema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues)
      errors[String(i.path[0])] ??= memberMessage('VALIDATION_FAILED', lang);
    return fail('VALIDATION_FAILED', memberMessage('VALIDATION_FAILED', lang), errors);
  }
  const denied = await staffGuard(lang);
  if (denied) return denied;
  const { data, error } = await (
    await createClient()
  ).rpc('admin_save_member_project', { p_member: memberId, p: parsed.data as never });
  if (error) return dbFailure(error, lang);
  refresh();
  return ok({ id: String(data) });
}

export async function deleteMemberProjectByStaff(
  memberId: string,
  projectId: string,
  ctx: { lang: Lang },
): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!UUID.safeParse(memberId).success || !UUID.safeParse(projectId).success)
    return failCode('NOT_FOUND', lang);
  const denied = await staffGuard(lang);
  if (denied) return denied;
  const { error } = await (
    await createClient()
  ).rpc('admin_delete_member_project', { p_member: memberId, p_project: projectId });
  if (error) return dbFailure(error, lang);
  refresh();
  return ok(undefined);
}
