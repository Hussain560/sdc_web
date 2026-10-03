import type { Lang } from '@/modules/auth/messages';
import type { ArticleFormValues } from './types';

export const LIMITS = {
  title: 200,
  excerpt: 500,
  body: 50_000,
  authors: 8,
  tags: 8,
} as const;

type Errors = Record<string, string>;

const m = (lang: Lang, ar: string, en: string) => (lang === 'ar' ? ar : en);

/** Same rules as the database CHECKs, for instant feedback (the database stays authoritative). */
export function validateArticle(
  v: ArticleFormValues,
  lang: Lang,
  opts: { forSubmit?: boolean } = {},
): { ok: true } | { ok: false; errors: Errors } {
  const errors: Errors = {};
  const title = v.titleAr.trim();
  if (title.length < 3)
    errors.titleAr = m(
      lang,
      'العنوان بالعربية مطلوب (3 أحرف على الأقل).',
      'The Arabic title is required (at least 3 characters).',
    );
  else if (title.length > LIMITS.title)
    errors.titleAr = m(lang, 'العنوان طويل جدًا.', 'The title is too long.');
  if (v.titleEn.length > LIMITS.title)
    errors.titleEn = m(lang, 'العنوان طويل جدًا.', 'The title is too long.');
  if (v.excerptAr.length > LIMITS.excerpt)
    errors.excerptAr = m(lang, 'المقتطف يتجاوز 500 حرف.', 'The excerpt is over 500 characters.');
  if (v.excerptEn.length > LIMITS.excerpt)
    errors.excerptEn = m(lang, 'المقتطف يتجاوز 500 حرف.', 'The excerpt is over 500 characters.');
  if (v.bodyAr.length > LIMITS.body)
    errors.bodyAr = m(lang, 'النص يتجاوز الحد المسموح.', 'The body is over the limit.');
  if (v.bodyEn.length > LIMITS.body)
    errors.bodyEn = m(lang, 'النص يتجاوز الحد المسموح.', 'The body is over the limit.');
  if (v.resourceUrl.trim() && !/^https:\/\/\S+$/i.test(v.resourceUrl.trim()))
    errors.resourceUrl = m(
      lang,
      'الرابط يجب أن يبدأ بـ https://',
      'The link must start with https://',
    );
  if (v.slug.trim() && !/^[a-z0-9-]{3,120}$/.test(v.slug.trim()))
    errors.slug = m(
      lang,
      'حروف إنجليزية صغيرة وأرقام وشرطات فقط (3 أحرف على الأقل).',
      'Lowercase letters, numbers and dashes only (at least 3 characters).',
    );
  if (v.authors.length > LIMITS.authors)
    errors.authors = m(lang, 'ثمانية كتّاب كحد أقصى.', 'At most eight authors.');
  if (v.tags.length > LIMITS.tags)
    errors.tags = m(lang, 'ثمانية وسوم كحد أقصى.', 'At most eight tags.');
  if (opts.forSubmit) {
    if (!v.bodyAr.trim())
      errors.bodyAr = m(
        lang,
        'النص بالعربية مطلوب للإرسال.',
        'The Arabic body is required to submit.',
      );
    if (v.authors.length === 0)
      errors.authors = m(lang, 'أضف كاتبًا واحدًا على الأقل.', 'Add at least one author.');
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true };
}

/** Lowercase, dashes, no accents: the tag slug derived from its English (or Latin) label. */
export function tagSlug(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
