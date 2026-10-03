'use server';

import { revalidatePath } from 'next/cache';
import { fail, ok, type ErrorCode, type Result } from '@/lib/result';
import { createClient } from '@/lib/supabase/server';
import { getAccess } from '@/modules/access/queries';
import { isLang, type Lang } from '@/modules/auth/messages';
import { committeeMessage, FIELD_KEY, parseCommitteeDbError } from './messages';

/**
 * Committee Server Actions: authenticate → one database function (it re-checks committees.manage and every guard)
 * → revalidate. Positions are managed by the access module (assign / end / handover).
 */
const langOf = (v: unknown): Lang => (isLang(v) ? v : 'ar');
const uuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

function dbFailure(error: { message?: string; code?: string }, lang: Lang): Result<never> {
  const { code, field } = parseCommitteeDbError(error);
  if (code === 'INTERNAL')
    console.error('[committees] unexpected database error', error.code, error.message);
  const key = field ? (FIELD_KEY[field] ?? field) : undefined;
  return fail(
    code,
    committeeMessage(code, lang, field),
    key ? { [key]: committeeMessage(code, lang, field) } : undefined,
  );
}
const failCode = (code: ErrorCode, lang: Lang) => fail(code, committeeMessage(code, lang));

const refresh = () => {
  revalidatePath('/dashboard/committees', 'layout');
  revalidatePath('/', 'layout');
};

export type CommitteeInput = {
  slug?: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  contactEmail: string;
  displayOrder: string;
};

export async function saveCommittee(
  input: { id?: string; values: CommitteeInput },
  ctx: { lang: Lang },
): Promise<Result<{ id: string; slug: string }>> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  if (input.id && !uuid(input.id)) return failCode('NOT_FOUND', lang);
  const v = input.values;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('save_committee', {
    p_id: (input.id ?? null) as string,
    p: {
      ...(v.slug ? { slug: v.slug } : {}),
      name_ar: v.nameAr,
      name_en: v.nameEn,
      description_ar: v.descriptionAr,
      description_en: v.descriptionEn,
      contact_email: v.contactEmail,
      display_order: v.displayOrder === '' ? 0 : v.displayOrder,
    } as never,
  });
  if (error) return dbFailure(error, lang);
  refresh();
  const r = data as { id: string; slug: string };
  return ok({ id: r.id, slug: r.slug });
}

export async function setCommitteeStatus(
  input: { id: string; active: boolean; reason?: string },
  ctx: { lang: Lang },
): Promise<Result<{ positionsEnded: number }>> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  if (!uuid(input.id)) return failCode('NOT_FOUND', lang);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('set_committee_status', {
    p_id: input.id,
    p_active: input.active,
    p_reason: input.reason,
  });
  if (error) return dbFailure(error, lang);
  refresh();
  return ok({ positionsEnded: (data as { positions_ended: number }).positions_ended });
}

export async function deleteCommittee(id: string, ctx: { lang: Lang }): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  if (!uuid(id)) return failCode('NOT_FOUND', lang);
  const supabase = await createClient();
  const { error } = await supabase.rpc('delete_committee', { p_id: id });
  if (error) return dbFailure(error, lang);
  refresh();
  return ok(undefined);
}
