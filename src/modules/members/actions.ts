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
import {
  toProfilePayload,
  validateProfile,
  type MemberStatus,
  type ProfileValues,
} from './schemas';

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

export async function setMemberStatus(
  input: { id: string; status: MemberStatus; reason?: string },
  ctx: { lang: Lang },
): Promise<Result<{ status: string }>> {
  const lang = langOf(ctx?.lang);
  if (!UUID.safeParse(input?.id).success) return failCode('NOT_FOUND', lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('set_member_status', {
    p_id: input.id,
    p_status: input.status,
    p_reason: input.reason?.trim() || undefined,
  });
  if (error) return dbFailure(error, lang);
  refresh();
  return ok({ status: data as string });
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

const createSchema = z.object({
  fullNameAr: z.string().trim().min(3).max(100),
  fullNameEn: z.string().trim().max(100).optional(),
  email: z
    .string()
    .trim()
    .max(160)
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/),
  academicStatus: z.enum(['student', 'graduate', 'employee', 'other']),
  universityId: z.string().regex(/^\d*$/).optional(),
  majorId: z.string().regex(/^\d*$/).optional(),
  trackId: z.string().regex(/^\d*$/).optional(),
});
export type CreateMemberInput = z.input<typeof createSchema>;

const siteUrl = () => (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/**
 * Leadership adds a member (KFUCS parity). The account is created here with the server key (confirmed, no password),
 * the member row is written by a permission-checked database function, and the new member gets an e-mail with the
 * one-time link to choose a password. An e-mail that already has an account is linked instead. If the member row
 * cannot be written, an account created a moment ago is removed again.
 */
export async function createMember(
  input: CreateMemberInput,
  ctx: { lang: Lang },
): Promise<Result<{ id: string; activationSent: boolean }>> {
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
  const mail = v.email.toLowerCase();

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
        user_metadata: { full_name: v.fullNameAr, locale: lang },
      });
      if (res.error || !res.data.user) throw new Error(res.error?.message ?? 'createUser failed');
      userId = res.data.user.id;
      created = true;
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('create_member', {
      p_user: userId,
      p: {
        full_name_ar: v.fullNameAr,
        full_name_en: v.fullNameEn ?? '',
        academic_status: v.academicStatus,
        university_id: v.universityId ?? '',
        major_id: v.majorId ?? '',
        track_id: v.trackId ?? '',
      } as never,
    });
    if (error) {
      if (created) await db.auth.admin.deleteUser(userId);
      return dbFailure(error, lang);
    }
    const memberId = data as string;

    let activationUrl: string | undefined;
    if (created) {
      const gen = await db.auth.admin.generateLink({ type: 'recovery', email: mail });
      const hash = gen.data?.properties?.hashed_token;
      if (hash)
        activationUrl = `${siteUrl()}/auth/confirm?token_hash=${encodeURIComponent(hash)}&type=recovery&next=${encodeURIComponent('/reset-password?welcome=1')}${lang === 'en' ? '&locale=en' : ''}`;
    }
    after(async () => {
      try {
        await sendMemberCreatedMail({
          memberId,
          userId: userId!,
          email: mail,
          name: v.fullNameAr,
          lang,
          activationUrl,
        });
      } catch (e) {
        console.error('[members] welcome e-mail failed', (e as Error).message);
      }
    });
    refresh();
    return ok({ id: memberId, activationSent: !!activationUrl });
  } catch (e) {
    console.error('[members] create failed', (e as Error).message);
    if (created && userId) await db.auth.admin.deleteUser(userId);
    return failCode('INTERNAL', lang);
  }
}
