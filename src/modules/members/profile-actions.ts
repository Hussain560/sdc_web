'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getAccess } from '@/modules/access/queries';
import { fail, ok, type ErrorCode, type Result } from '@/lib/result';
import { createClient } from '@/lib/supabase/server';
import { isLang, type Lang } from '@/modules/auth/messages';
import { memberCode, memberMessage } from './messages';

/** Server Actions of the profile editor: each saves ONE section through the database functions (authoritative). */
const langOf = (v: unknown): Lang => (isLang(v) ? v : 'ar');
const failCode = (code: ErrorCode, lang: Lang) => fail(code, memberMessage(code, lang));
const refresh = () => revalidatePath('/', 'layout');

function dbFailure(error: { message?: string; code?: string }, lang: Lang): Result<never> {
  const code = memberCode(error);
  if (code === 'INTERNAL')
    console.error('[profile] unexpected database error', error.code, error.message);
  return failCode(code, lang);
}

const TEXT = {
  required: { ar: 'هذا الحقل مطلوب.', en: 'This field is required.' },
  long: { ar: 'النص طويل جدًا.', en: 'The text is too long.' },
  https: { ar: 'يجب أن يبدأ الرابط بـ https://', en: 'The link must start with https://' },
} as const;

const line = z.string().trim().max(80);
const link = z.string().trim().max(500);
const id = z.string().regex(/^\d{0,6}$/);

const name = z.string().trim().max(40);
const partSchema = z
  .object({
    first_name_ar: name.min(1),
    middle_name_ar: name,
    last_name_ar: name.min(1),
    first_name_en: name,
    middle_name_en: name,
    last_name_en: name,
    phone: z.string().regex(/^(\+[1-9][0-9]{6,14})?$/),
    headline_ar: line,
    headline_en: line,
    about_ar: z.string().trim().max(1000),
    about_en: z.string().trim().max(1000),
    open_to: z
      .array(z.enum(['internship', 'job', 'freelance', 'mentoring', 'speaking', 'collaboration']))
      .max(6),
    academic_status: z.string().max(40),
    study_year: z.string().regex(/^[1-7]?$/),
    university_id: id,
    major_id: id,
    sub_major_id: id,
    track_id: id,
    portfolio_url: link,
    github_url: link,
    linkedin_url: link,
    x_url: link,
    website_url: link,
    behance_url: link,
    dribbble_url: link,
    youtube_url: link,
    is_directory_visible: z.boolean(),
    show_photo: z.boolean(),
    show_headline: z.boolean(),
    show_about: z.boolean(),
    show_skills: z.boolean(),
    show_projects: z.boolean(),
    show_open_to: z.boolean(),
    show_university: z.boolean(),
    show_track: z.boolean(),
    show_participation: z.boolean(),
  })
  .partial()
  .strict();

const isLinkKey = (k: string) => k.endsWith('_url');

function fieldErrors(error: z.ZodError, lang: Lang) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '');
    if (!key || out[key]) continue;
    out[key] =
      issue.code === 'too_big'
        ? TEXT.long[lang]
        : issue.message === 'required' || issue.code === 'too_small'
          ? TEXT.required[lang]
          : TEXT.long[lang];
  }
  return out;
}

/**
 * Saves some fields of my profile (a section). Only the keys sent change; links must be https. Names are accepted by the schema
 * but only people holding members.edit_own_name may change them: the database refuses everyone else (NAME_LOCKED).
 */
export async function saveMyProfilePart(
  part: Record<string, unknown>,
  ctx: { lang: Lang },
): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  const parsed = partSchema.safeParse(part);
  if (!parsed.success)
    return fail(
      'VALIDATION_FAILED',
      memberMessage('VALIDATION_FAILED', lang),
      fieldErrors(parsed.error, lang),
    );
  const errors: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (isLinkKey(k) && typeof v === 'string' && v && !/^https:\/\/\S+$/.test(v))
      errors[k] = TEXT.https[lang];
  }
  if (Object.keys(errors).length > 0)
    return fail('VALIDATION_FAILED', memberMessage('VALIDATION_FAILED', lang), errors);
  const supabase = await createClient();
  const { error } = await supabase.rpc('update_my_member_profile', { p: parsed.data as never });
  if (error) return dbFailure(error, lang);
  refresh();
  return ok(undefined);
}

export async function saveMySkills(slugs: string[], ctx: { lang: Lang }): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  const parsed = z
    .array(z.string().regex(/^[a-z0-9-]{1,60}$/))
    .max(12)
    .safeParse(slugs);
  if (!parsed.success) return failCode('VALIDATION_FAILED', lang);
  const supabase = await createClient();
  const { error } = await supabase.rpc('set_my_skills', { p_slugs: parsed.data });
  if (error) return dbFailure(error, lang);
  refresh();
  return ok(undefined);
}

const projectSchema = z.object({
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

export async function saveMyProject(
  input: z.input<typeof projectSchema>,
  ctx: { lang: Lang },
): Promise<Result<{ id: string }>> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = String(i.path[0] ?? '');
      if (k && !errors[k])
        errors[k] =
          k === 'url'
            ? TEXT.https[lang]
            : i.code === 'too_big'
              ? TEXT.long[lang]
              : TEXT.required[lang];
    }
    return fail('VALIDATION_FAILED', memberMessage('VALIDATION_FAILED', lang), errors);
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('save_my_project', { p: parsed.data as never });
  if (error) return dbFailure(error, lang);
  refresh();
  return ok({ id: String(data) });
}

export async function deleteMyProject(projectId: string, ctx: { lang: Lang }): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!z.uuid().safeParse(projectId).success) return failCode('NOT_FOUND', lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  const supabase = await createClient();
  const { error } = await supabase.rpc('delete_my_project', { p_id: projectId });
  if (error) return dbFailure(error, lang);
  refresh();
  return ok(undefined);
}

export async function reorderMyProjects(ids: string[], ctx: { lang: Lang }): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!z.array(z.uuid()).max(6).safeParse(ids).success) return failCode('VALIDATION_FAILED', lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  const supabase = await createClient();
  const { error } = await supabase.rpc('reorder_my_projects', { p_ids: ids });
  if (error) return dbFailure(error, lang);
  refresh();
  return ok(undefined);
}
