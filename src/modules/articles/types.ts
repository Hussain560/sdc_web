import type { Lang } from '@/modules/auth/messages';

export const ARTICLE_STATUSES = [
  'draft',
  'in_review',
  'changes_requested',
  'published',
  'archived',
] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

/** Status badge text and tone, shared by the list, the editor and the review view. */
export const ARTICLE_STATUS_LABEL: Record<
  ArticleStatus,
  { ar: string; en: string; tone: 'neutral' | 'accent' | 'warning' | 'danger' }
> = {
  draft: { ar: 'مسودة', en: 'Draft', tone: 'neutral' },
  in_review: { ar: 'قيد المراجعة', en: 'In review', tone: 'warning' },
  changes_requested: { ar: 'تعديلات مطلوبة', en: 'Changes requested', tone: 'danger' },
  published: { ar: 'منشور', en: 'Published', tone: 'accent' },
  archived: { ar: 'مؤرشف', en: 'Archived', tone: 'neutral' },
};

export type ArticleAction =
  'submit' | 'withdraw' | 'publish' | 'request_changes' | 'archive' | 'restore';

export type AuthorLine = {
  kind: 'user' | 'committee' | 'guest';
  nameAr: string;
  nameEn: string | null;
};
export type TagRef = { slug: string; labelAr: string; labelEn: string | null };

/** What the public list and the home block need. */
export type PublicArticleCard = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string | null;
  excerptAr: string | null;
  excerptEn: string | null;
  authors: AuthorLine[];
  publishedAt: string;
  readingMinutes: number;
  tags: TagRef[];
};

export type PublicArticle = PublicArticleCard & {
  bodyAr: string;
  bodyEn: string | null;
  resourceUrl: string | null;
  resourceLabelAr: string | null;
  resourceLabelEn: string | null;
};

/** Editor form state (strings only, so inputs stay controlled). */
export type ArticleFormValues = {
  committeeId: string;
  titleAr: string;
  titleEn: string;
  excerptAr: string;
  excerptEn: string;
  bodyAr: string;
  bodyEn: string;
  slug: string;
  coverImagePath: string;
  resourceUrl: string;
  resourceLabelAr: string;
  resourceLabelEn: string;
  authors: AuthorInput[];
  tags: TagInput[];
};

export type AuthorInput = {
  userId?: string;
  committeeId?: string;
  displayNameAr?: string;
  displayNameEn?: string;
  /** Label shown in the editor chip (never sent to the database). */
  label?: string;
};
export type TagInput = { slug: string; labelAr: string; labelEn: string };

export const EMPTY_ARTICLE: ArticleFormValues = {
  committeeId: '',
  titleAr: '',
  titleEn: '',
  excerptAr: '',
  excerptEn: '',
  bodyAr: '',
  bodyEn: '',
  slug: '',
  coverImagePath: '',
  resourceUrl: '',
  resourceLabelAr: '',
  resourceLabelEn: '',
  authors: [],
  tags: [],
};

// ---------------------------------------------------------------- display helpers (public pages and the editor)
export const articleTitle = (a: { titleAr: string; titleEn: string | null }, lang: Lang) =>
  (lang === 'en' ? a.titleEn : null) || a.titleAr;

export const articleExcerpt = (
  a: { excerptAr: string | null; excerptEn: string | null },
  lang: Lang,
) => (lang === 'en' ? a.excerptEn || a.excerptAr : a.excerptAr) ?? '';

export const authorsLabel = (authors: AuthorLine[], lang: Lang) =>
  authors.map((x) => (lang === 'en' ? x.nameEn || x.nameAr : x.nameAr)).join(' – ');

export const tagLabel = (t: TagRef, lang: Lang) =>
  lang === 'en' ? t.labelEn || t.labelAr : t.labelAr;

/** "15 أغسطس 2024" / "August 15, 2024" — Gregorian, Latin digits, Saudi time. */
export function articleDate(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-u-nu-latn-ca-gregory' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Riyadh',
  }).format(new Date(iso));
}

/** "3 دقائق" / "3 min": Arabic number agreement (1 دقيقة, 2 دقيقتان, 3–10 دقائق, 11+ دقيقة). */
export function readingLabel(minutes: number, lang: Lang): string {
  if (lang === 'en') return `${minutes} min`;
  if (minutes === 1) return 'دقيقة';
  if (minutes === 2) return 'دقيقتان';
  return minutes <= 10 ? `${minutes} دقائق` : `${minutes} دقيقة`;
}

export const wordCount = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);
/** Same rule as the database trigger: words ÷ 200, at least one minute. */
export const readingMinutesOf = (text: string) => Math.max(1, Math.ceil(wordCount(text) / 200));
