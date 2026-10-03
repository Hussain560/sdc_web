'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { fail, ok, type ErrorCode, type Result } from '@/lib/result';
import { createClient } from '@/lib/supabase/server';
import { getAccess } from '@/modules/access/queries';
import { isLang, type Lang } from '@/modules/auth/messages';
import { adminMessage, FIELD_KEY, parseAdminDbError } from './messages';

/**
 * Administration Server Actions: authenticate → one database function (it re-checks the permission and validates
 * every value) → refresh what the public site caches. Nothing is validated twice with different rules.
 */
const langOf = (v: unknown): Lang => (isLang(v) ? v : 'ar');
const uuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v);
const failCode = (code: ErrorCode, lang: Lang) => fail(code, adminMessage(code, lang));

function dbFailure(error: { message?: string; code?: string }, lang: Lang): Result<never> {
  const { code, field } = parseAdminDbError(error);
  if (code === 'INTERNAL')
    console.error('[admin] unexpected database error', error.code, error.message);
  const key = field ? (FIELD_KEY[field] ?? field) : undefined;
  return fail(
    code,
    adminMessage(code, lang, field),
    key ? { [key]: adminMessage(code, lang, field) } : undefined,
  );
}

const refreshPublic = () => {
  updateTag('site-settings');
  updateTag('partners');
  revalidatePath('/', 'layout');
};

export type SettingsInput = {
  socialInstagram: string;
  socialLinkedin: string;
  socialX: string;
  contactEmail: string;
  footerRightsAr: string;
  footerRightsEn: string;
  certificatesEnabled: boolean;
  certificateThreshold: string;
};

export async function saveSettings(input: SettingsInput, ctx: { lang: Lang }): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  const threshold = input.certificateThreshold.trim();
  const supabase = await createClient();
  const { error } = await supabase.rpc('save_site_settings', {
    p_values: {
      social_instagram: input.socialInstagram,
      social_linkedin: input.socialLinkedin,
      social_x: input.socialX,
      contact_email: input.contactEmail,
      footer_rights_ar: input.footerRightsAr,
      footer_rights_en: input.footerRightsEn,
      certificates_enabled: input.certificatesEnabled,
      // a non-number is sent as text so the database refuses it with the field name
      certificate_threshold:
        threshold !== '' && Number.isFinite(Number(threshold)) ? Number(threshold) : threshold,
    } as never,
  });
  if (error) return dbFailure(error, lang);
  refreshPublic();
  revalidatePath('/dashboard/admin/settings');
  return ok(undefined);
}

export type PartnerInput = {
  nameAr: string;
  nameEn: string;
  logoUrl: string;
  websiteUrl: string;
  displayOrder: string;
  isActive: boolean;
};

export async function savePartner(
  input: { id?: string; values: PartnerInput },
  ctx: { lang: Lang },
): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  if (input.id && !uuid(input.id)) return failCode('NOT_FOUND', lang);
  const v = input.values;
  const supabase = await createClient();
  const { error } = await supabase.rpc('save_partner', {
    p_id: (input.id ?? null) as string,
    p: {
      name_ar: v.nameAr,
      name_en: v.nameEn,
      logo_url: v.logoUrl,
      website_url: v.websiteUrl,
      display_order: v.displayOrder === '' ? 0 : Number(v.displayOrder),
      is_active: v.isActive,
    } as never,
  });
  if (error) return dbFailure(error, lang);
  refreshPublic();
  revalidatePath('/dashboard/admin/settings');
  return ok(undefined);
}

export async function deletePartner(id: string, ctx: { lang: Lang }): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  if (!uuid(id)) return failCode('NOT_FOUND', lang);
  const supabase = await createClient();
  const { error } = await supabase.rpc('delete_partner', { p_id: id });
  if (error) return dbFailure(error, lang);
  refreshPublic();
  revalidatePath('/dashboard/admin/settings');
  return ok(undefined);
}

export async function saveTag(
  input: { id: string; labelAr: string; labelEn: string },
  ctx: { lang: Lang },
): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  if (!uuid(input.id)) return failCode('NOT_FOUND', lang);
  const supabase = await createClient();
  const { error } = await supabase.rpc('save_tag', {
    p_id: input.id,
    p_label_ar: input.labelAr,
    p_label_en: input.labelEn,
  });
  if (error) return dbFailure(error, lang);
  revalidatePath('/dashboard/admin/reference-data');
  revalidatePath('/articles', 'layout');
  return ok(undefined);
}

export async function deleteTag(id: string, ctx: { lang: Lang }): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  if (!uuid(id)) return failCode('NOT_FOUND', lang);
  const supabase = await createClient();
  const { error } = await supabase.rpc('delete_tag', { p_id: id });
  if (error) return dbFailure(error, lang);
  revalidatePath('/dashboard/admin/reference-data');
  return ok(undefined);
}
