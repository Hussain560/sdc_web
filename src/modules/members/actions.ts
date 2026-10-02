'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { z } from 'zod';
import { fail, ok, type ErrorCode, type Result } from '@/lib/result';
import { createClient } from '@/lib/supabase/server';
import { isLang, type Lang } from '@/modules/auth/messages';
import { getAccess } from '@/modules/access/queries';
import { sendClaimInviteMail } from '@/modules/notifications/membership';
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
