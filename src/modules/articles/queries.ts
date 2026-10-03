import { createClient } from '@/lib/supabase/server';
import type { PageRequest } from '@/lib/pagination';
import type { Json } from '@/lib/supabase/database.types';
import {
  EMPTY_ARTICLE,
  type ArticleFormValues,
  type ArticleStatus,
  type AuthorInput,
  type TagInput,
} from './types';

export type ArticleListRow = {
  id: string;
  slug: string;
  status: ArticleStatus;
  titleAr: string;
  titleEn: string | null;
  committeeId: string | null;
  committeeName: { ar: string; en: string } | null;
  authorsAr: string[];
  authorsEn: string[];
  readingMinutes: number;
  tagCount: number;
  publishedAt: string | null;
  updatedAt: string;
  submittedAt: string | null;
  reviewNote: string | null;
  createdBy: string | null;
};

export type ArticleListFilters = { status?: string; committeeId?: string; q?: string };

const names = (v: Json | null): string[] =>
  (Array.isArray(v) ? v : []).filter((x): x is string => typeof x === 'string');

/** Drafts the caller wrote or may edit, plus what they may review — RLS and the view decide. */
export async function listArticles(
  filters: ArticleListFilters,
  page: Pick<PageRequest, 'from' | 'to'>,
): Promise<{ rows: ArticleListRow[]; total: number }> {
  const supabase = await createClient();
  let query = supabase
    .from('dashboard_articles')
    .select('*', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .order('id');
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.committeeId) query = query.eq('committee_id', filters.committeeId);
  const term = filters.q?.trim().replace(/[%,()]/g, ' ');
  if (term) query = query.or(`title_ar.ilike.%${term}%,title_en.ilike.%${term}%`);
  const { data, count } = await query.range(page.from, page.to);

  const rows = (data ?? []).map((a): ArticleListRow => ({
    id: a.id!,
    slug: a.slug!,
    status: a.status as ArticleStatus,
    titleAr: a.title_ar!,
    titleEn: a.title_en,
    committeeId: a.committee_id,
    committeeName: a.committee_name_ar
      ? { ar: a.committee_name_ar, en: a.committee_name_en ?? a.committee_name_ar }
      : null,
    authorsAr: names(a.author_names_ar),
    authorsEn: names(a.author_names_en),
    readingMinutes: a.reading_minutes ?? 1,
    tagCount: a.tag_count ?? 0,
    publishedAt: a.published_at,
    updatedAt: a.updated_at!,
    submittedAt: a.submitted_at,
    reviewNote: a.review_note,
    createdBy: a.created_by,
  }));
  return { rows, total: count ?? rows.length };
}

export async function getArticleCounts(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase.from('article_status_counts').select('status, total');
  return Object.fromEntries((data ?? []).map((r) => [r.status as string, r.total as number]));
}

export type ArticleDetail = {
  id: string;
  updatedAt: string;
  status: ArticleStatus;
  committeeId: string | null;
  createdBy: string | null;
  reviewNote: string | null;
  publishedAt: string | null;
  submittedAt: string | null;
  form: ArticleFormValues;
};

export async function getArticleForEdit(id: string): Promise<ArticleDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data: a } = await supabase.from('articles').select('*').eq('id', id).maybeSingle();
  if (!a) return null;

  const [{ data: authors }, { data: tagRows }] = await Promise.all([
    supabase
      .from('article_authors_named')
      .select(
        'position, user_id, committee_id, display_name_ar, display_name_en, label_ar, label_en',
      )
      .eq('article_id', id)
      .order('position'),
    supabase.from('article_tags').select('tags(slug, label_ar, label_en)').eq('article_id', id),
  ]);

  const authorInputs: AuthorInput[] = (authors ?? []).map((x) => ({
    ...(x.user_id ? { userId: x.user_id } : {}),
    ...(x.committee_id ? { committeeId: x.committee_id } : {}),
    ...(x.display_name_ar ? { displayNameAr: x.display_name_ar } : {}),
    ...(x.display_name_en ? { displayNameEn: x.display_name_en } : {}),
    label: x.label_ar ?? x.label_en ?? '',
  }));
  const tags: TagInput[] = (tagRows ?? [])
    .map((r) => r.tags)
    .filter((t): t is NonNullable<typeof t> => !!t)
    .map((t) => ({ slug: t.slug, labelAr: t.label_ar, labelEn: t.label_en ?? '' }));

  return {
    id: a.id,
    updatedAt: a.updated_at,
    status: a.status as ArticleStatus,
    committeeId: a.committee_id,
    createdBy: a.created_by,
    reviewNote: a.review_note,
    publishedAt: a.published_at,
    submittedAt: a.submitted_at,
    form: {
      ...EMPTY_ARTICLE,
      committeeId: a.committee_id ?? '',
      titleAr: a.title_ar,
      titleEn: a.title_en ?? '',
      excerptAr: a.excerpt_ar ?? '',
      excerptEn: a.excerpt_en ?? '',
      bodyAr: a.body_ar,
      bodyEn: a.body_en ?? '',
      slug: a.slug,
      coverImagePath: a.cover_image_path ?? '',
      resourceUrl: a.resource_url ?? '',
      resourceLabelAr: a.resource_label_ar ?? '',
      resourceLabelEn: a.resource_label_en ?? '',
      authors: authorInputs,
      tags,
    },
  };
}

/** Existing tags, for the editor's suggestions. */
export async function listTags(): Promise<TagInput[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('tags').select('slug, label_ar, label_en').order('slug');
  return (data ?? []).map((t) => ({
    slug: t.slug,
    labelAr: t.label_ar,
    labelEn: t.label_en ?? '',
  }));
}
