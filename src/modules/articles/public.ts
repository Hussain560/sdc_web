import { createPublicClient } from '@/lib/supabase/public';
import type { Database, Json } from '@/lib/supabase/database.types';
import type { AuthorLine, PublicArticle, PublicArticleCard, TagRef } from './types';

type Row = Database['public']['Views']['public_articles']['Row'];

const CARD_COLUMNS =
  'id, slug, title_ar, title_en, excerpt_ar, excerpt_en, authors, tags, published_at, reading_minutes';

const obj = (v: Json | undefined): Record<string, Json> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, Json>) : {};
const str = (v: Json | undefined) => (typeof v === 'string' ? v : null);

function authorsOf(v: Json | null): AuthorLine[] {
  return (Array.isArray(v) ? v : []).map((a) => {
    const o = obj(a);
    const kind = o.kind === 'user' || o.kind === 'committee' ? o.kind : 'guest';
    return { kind, nameAr: str(o.name_ar) ?? '', nameEn: str(o.name_en) };
  });
}

function tagsOf(v: Json | null): TagRef[] {
  return (Array.isArray(v) ? v : []).map((t) => {
    const o = obj(t);
    return { slug: str(o.slug) ?? '', labelAr: str(o.label_ar) ?? '', labelEn: str(o.label_en) };
  });
}

function toCard(r: Row): PublicArticleCard {
  return {
    id: r.id!,
    slug: r.slug!,
    titleAr: r.title_ar!,
    titleEn: r.title_en,
    excerptAr: r.excerpt_ar,
    excerptEn: r.excerpt_en,
    authors: authorsOf(r.authors),
    publishedAt: r.published_at!,
    readingMinutes: r.reading_minutes ?? 1,
    tags: tagsOf(r.tags),
  };
}

/** Newest first; the six migrated threads keep their original order after any newer one (display_rank). */
export async function listPublicArticles(limit?: number): Promise<PublicArticleCard[]> {
  let q = createPublicClient()
    .from('public_articles')
    .select(CARD_COLUMNS)
    .order('display_rank', { ascending: true });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) console.error('[articles] public list failed', error.code);
  return ((data ?? []) as unknown as Row[]).map(toCard);
}

export async function getPublicArticle(slug: string): Promise<PublicArticle | null> {
  const { data } = await createPublicClient()
    .from('public_articles')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (!data) return null;
  const r = data as Row;
  return {
    ...toCard(r),
    bodyAr: r.body_ar ?? '',
    bodyEn: r.body_en,
    resourceUrl: r.resource_url,
    resourceLabelAr: r.resource_label_ar,
    resourceLabelEn: r.resource_label_en,
  };
}

/** /articles/3 (the old numeric URL) → its readable slug. */
export async function slugForLegacyArticleId(id: number): Promise<string | null> {
  const { data } = await createPublicClient()
    .from('public_articles')
    .select('slug')
    .eq('legacy_id', id)
    .maybeSingle();
  return data?.slug ?? null;
}
