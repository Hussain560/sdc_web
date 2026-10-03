'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { fail, ok, type ErrorCode, type Result } from '@/lib/result';
import { createClient } from '@/lib/supabase/server';
import { isLang, type Lang } from '@/modules/auth/messages';
import { getAccess } from '@/modules/access/queries';
import { notifyArticleSubmitted } from '@/modules/notifications/articles';
import { articleMessage, FIELD_KEY, parseArticleDbError } from './messages';
import { validateArticle } from './schemas';
import type { ArticleAction, ArticleFormValues } from './types';

/**
 * Article Server Actions. Pattern (server-logic §3): authenticate → validate → ONE database function call that
 * re-checks authorization and the lifecycle guards → revalidate → Result. The SQL functions are authoritative.
 */
const langOf = (v: unknown): Lang => (isLang(v) ? v : 'ar');
const uuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

function dbFailure(error: { message?: string; code?: string }, lang: Lang): Result<never> {
  const { code, field } = parseArticleDbError(error);
  if (code === 'INTERNAL')
    console.error('[articles] unexpected database error', error.code, error.message);
  const key = field ? (FIELD_KEY[field] ?? field) : undefined;
  return fail(
    code,
    articleMessage(code, lang, field),
    key ? { [key]: articleMessage(code, lang, field) } : undefined,
  );
}
const failCode = (code: ErrorCode, lang: Lang) => fail(code, articleMessage(code, lang));

/** Form values → the jsonb the database function takes (snake_case, empty strings as nulls on its side). */
function toPayload(v: ArticleFormValues) {
  return {
    committee_id: v.committeeId || null,
    title_ar: v.titleAr,
    title_en: v.titleEn,
    excerpt_ar: v.excerptAr,
    excerpt_en: v.excerptEn,
    body_ar: v.bodyAr,
    body_en: v.bodyEn,
    ...(v.slug.trim() ? { slug: v.slug.trim() } : {}),
    cover_image_path: v.coverImagePath,
    resource_url: v.resourceUrl,
    resource_label_ar: v.resourceLabelAr,
    resource_label_en: v.resourceLabelEn,
    authors: v.authors.map((a) => ({
      user_id: a.userId ?? null,
      committee_id: a.committeeId ?? null,
      display_name_ar: a.displayNameAr ?? null,
      display_name_en: a.displayNameEn ?? null,
    })),
    tags: v.tags.map((t) => ({ slug: t.slug, label_ar: t.labelAr, label_en: t.labelEn })),
  };
}

export type SavedArticle = { id: string; slug: string; status: string; updatedAt: string };

/** Create (no id) or update a draft / published article from the editor. */
export async function saveArticle(
  input: { id?: string; values: ArticleFormValues; expectedUpdatedAt?: string },
  ctx: { lang: Lang },
): Promise<Result<SavedArticle>> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);

  const check = validateArticle(input.values, lang);
  if (!check.ok)
    return fail('VALIDATION_FAILED', articleMessage('VALIDATION_FAILED', lang), check.errors);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('save_article', {
    // null (not undefined) so PostgREST resolves save_article(uuid, jsonb, timestamptz) for new articles
    p_id: (input.id ?? null) as string,
    p: toPayload(input.values) as never,
    p_expected_updated_at: input.expectedUpdatedAt,
  });
  if (error) return dbFailure(error, lang);

  const r = data as { id: string; slug: string; status: string; updated_at: string };
  // A published article is live: its pages refresh now, not at the next minute.
  if (r.status === 'published') revalidatePath('/', 'layout');
  return ok({ id: r.id, slug: r.slug, status: r.status, updatedAt: r.updated_at });
}

export async function transitionArticle(
  input: { id: string; action: ArticleAction; note?: string },
  ctx: { lang: Lang },
): Promise<Result<{ status: string }>> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  if (!uuid(input.id)) return failCode('NOT_FOUND', lang);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('transition_article', {
    p_id: input.id,
    p_action: input.action,
    p_note: input.note,
  });
  if (error) return dbFailure(error, lang);

  if (input.action === 'submit') {
    // Publishers hear about it after the response; a mail problem never fails the action.
    after(async () => {
      try {
        await notifyArticleSubmitted(input.id);
      } catch (e) {
        console.error('[articles] review notification failed', (e as Error).message);
      }
    });
  }
  revalidatePath('/', 'layout');
  return ok({ status: data as string });
}

export async function deleteArticleDraft(id: string, ctx: { lang: Lang }): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  if (!uuid(id)) return failCode('NOT_FOUND', lang);
  const supabase = await createClient();
  const { error } = await supabase.rpc('delete_article_draft', { p_id: id });
  if (error) return dbFailure(error, lang);
  revalidatePath('/', 'layout');
  return ok(undefined);
}

const ALLOWED_IMAGE = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/** Cover upload: type and size are checked here and again by the bucket configuration. */
export async function uploadArticleCover(
  formData: FormData,
  ctx: { lang: Lang },
): Promise<Result<{ path: string; url: string }>> {
  const lang = langOf(ctx?.lang);
  const access = await getAccess();
  if (!access) return failCode('UNAUTHENTICATED', lang);

  const file = formData.get('file');
  if (!(file instanceof File)) return failCode('VALIDATION_FAILED', lang);
  const ext = ALLOWED_IMAGE[file.type as keyof typeof ALLOWED_IMAGE];
  if (!ext) return failCode('FILE_TYPE', lang);
  if (file.size > MAX_IMAGE_BYTES) return failCode('FILE_TOO_LARGE', lang);

  const articleId = String(formData.get('articleId') ?? '');
  const folder = uuid(articleId) ? articleId : `drafts/${access.userId}`;
  const path = `articles/${folder}/cover-${Date.now()}.${ext}`;

  const supabase = await createClient();
  const { error } = await supabase.storage.from('public-media').upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return failCode('FORBIDDEN', lang);
  const { data } = supabase.storage.from('public-media').getPublicUrl(path);
  return ok({ path, url: data.publicUrl });
}

/** Editor typeahead for author accounts (names only). */
export async function searchArticleAuthors(
  query: string,
): Promise<Array<{ id: string; name: string }>> {
  if (!(await getAccess())) return [];
  const q = query.trim();
  if (q.length < 2) return [];
  const supabase = await createClient();
  const { data } = await supabase.rpc('search_article_author_candidates', { p_query: q });
  return (data ?? []).map((r) => ({ id: r.id, name: r.full_name_ar }));
}
