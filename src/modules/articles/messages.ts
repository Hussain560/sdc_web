import type { ErrorCode } from '@/lib/result';
import { accessMessage } from '@/modules/access/messages';
import type { Lang } from '@/modules/auth/messages';

const fieldLabel: Record<string, { ar: string; en: string }> = {
  title_ar: { ar: 'العنوان بالعربية', en: 'Arabic title' },
  title_en: { ar: 'العنوان بالإنجليزية', en: 'English title' },
  excerpt_ar: { ar: 'المقتطف بالعربية', en: 'Arabic excerpt' },
  excerpt_en: { ar: 'المقتطف بالإنجليزية', en: 'English excerpt' },
  body_ar: { ar: 'النص بالعربية', en: 'Arabic body' },
  body_en: { ar: 'النص بالإنجليزية', en: 'English body' },
  authors: { ar: 'كاتب واحد على الأقل', en: 'at least one author' },
  tags: { ar: 'الوسوم', en: 'tags' },
  slug: { ar: 'الرابط', en: 'slug' },
  resource_url: { ar: 'رابط المصدر', en: 'resource link' },
};

const ARTICLE_CODES = [
  'NOTE_TOO_SHORT',
  'NOT_EDITABLE',
  'STALE_DATA',
  'SLUG_LOCKED',
  'SLUG_TAKEN',
  'INVALID_TRANSITION',
  'COMMITTEE_INACTIVE',
  'SCOPE_REQUIRED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
] as const satisfies readonly ErrorCode[];

const messages: Partial<Record<ErrorCode, Record<Lang, string>>> = {
  NOTE_TOO_SHORT: {
    ar: 'اكتب ملاحظة لا تقل عن 10 أحرف.',
    en: 'Write a note of at least 10 characters.',
  },
  NOT_EDITABLE: {
    ar: 'لا يمكن تعديل المقال في حالته الحالية.',
    en: "This article can't be edited in its current state.",
  },
  STALE_DATA: {
    ar: 'عدّل شخص آخر هذا المقال — أعد تحميل الصفحة.',
    en: 'Someone else changed this article — reload the page.',
  },
  SLUG_LOCKED: { ar: 'الرابط مقفل بعد النشر.', en: 'The slug is locked after publishing.' },
  SLUG_TAKEN: { ar: 'هذا الرابط مستخدم.', en: 'This slug is already used.' },
  INVALID_TRANSITION: {
    ar: 'الإجراء غير متاح لهذه الحالة (ربما تغيّر المقال).',
    en: "This action isn't available in this state (the article may have changed).",
  },
  COMMITTEE_INACTIVE: { ar: 'اللجنة غير نشطة.', en: 'This committee is not active.' },
  SCOPE_REQUIRED: { ar: 'اختر اللجنة.', en: 'Choose a committee.' },
  INCOMPLETE: {
    ar: 'أكمل الحقول المطلوبة قبل الإرسال',
    en: 'Complete the required fields before submitting',
  },
  PUBLISH_GUARD: { ar: 'مطلوب للنشر', en: 'Required to publish' },
  VALIDATION_FAILED: {
    ar: 'يرجى مراجعة الحقول المحددة.',
    en: 'Please review the highlighted fields.',
  },
  FILE_TOO_LARGE: { ar: 'حجم الصورة يتجاوز 2 ميغابايت.', en: 'The image is larger than 2 MB.' },
  FILE_TYPE: {
    ar: 'نوع الملف غير مدعوم (JPEG أو PNG أو WebP فقط).',
    en: 'Unsupported file type (JPEG, PNG or WebP only).',
  },
};

export function articleMessage(code: ErrorCode, lang: Lang, field?: string): string {
  const base = messages[code]?.[lang] ?? accessMessage(code, lang);
  if (
    field &&
    (code === 'INCOMPLETE' || code === 'PUBLISH_GUARD' || code === 'VALIDATION_FAILED')
  ) {
    const label = fieldLabel[field]?.[lang] ?? field;
    return `${base}: ${label}`;
  }
  return base;
}

/** Splits `INCOMPLETE:body_ar` / `VALIDATION_FAILED:title_ar` into code and field; plain codes pass through. */
export function parseArticleDbError(error: { message?: string; code?: string }): {
  code: ErrorCode;
  field?: string;
} {
  const msg = (error.message ?? '').trim();
  const prefixed = /^(PUBLISH_GUARD|INCOMPLETE|VALIDATION_FAILED):(\w+)$/.exec(msg);
  if (prefixed) return { code: prefixed[1] as ErrorCode, field: prefixed[2] };
  if ((ARTICLE_CODES as readonly string[]).includes(msg)) return { code: msg as ErrorCode };
  if (error.code === '42501') return { code: 'FORBIDDEN' };
  if (['23514', '23502', '22P02', '22007'].includes(error.code ?? '')) {
    return { code: 'VALIDATION_FAILED' };
  }
  return { code: 'INTERNAL' };
}

/** Database column → editor field key (so the form can point at the right input). */
export const FIELD_KEY: Record<string, string> = {
  title_ar: 'titleAr',
  title_en: 'titleEn',
  excerpt_ar: 'excerptAr',
  excerpt_en: 'excerptEn',
  body_ar: 'bodyAr',
  body_en: 'bodyEn',
  authors: 'authors',
  tags: 'tags',
  slug: 'slug',
  resource_url: 'resourceUrl',
};
