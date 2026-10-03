import type { ErrorCode } from '@/lib/result';
import { accessMessage } from '@/modules/access/messages';
import type { Lang } from '@/modules/auth/messages';

const fieldLabel: Record<string, { ar: string; en: string }> = {
  slug: { ar: 'الرابط المختصر', en: 'slug' },
  name_ar: { ar: 'الاسم بالعربية', en: 'Arabic name' },
  name_en: { ar: 'الاسم بالإنجليزية', en: 'English name' },
  description_ar: { ar: 'الوصف بالعربية', en: 'Arabic description' },
  description_en: { ar: 'الوصف بالإنجليزية', en: 'English description' },
  contact_email: { ar: 'البريد', en: 'contact e-mail' },
  display_order: { ar: 'الترتيب', en: 'order' },
};

const CODES = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'SLUG_TAKEN',
  'SLUG_LOCKED',
  'REASON_REQUIRED',
  'NOT_DELETABLE',
  'INVALID_TRANSITION',
] as const satisfies readonly ErrorCode[];

const messages: Partial<Record<ErrorCode, Record<Lang, string>>> = {
  SLUG_TAKEN: { ar: 'الرابط المختصر مستخدم.', en: 'This slug is already used.' },
  SLUG_LOCKED: { ar: 'الرابط المختصر ثابت ولا يتغير.', en: 'The slug is fixed and cannot change.' },
  REASON_REQUIRED: { ar: 'يرجى كتابة السبب.', en: 'Please provide a reason.' },
  NOT_DELETABLE: {
    ar: 'لا يمكن حذف لجنة لها فعاليات أو مقالات أو مناصب — عطّلها بدلًا من ذلك.',
    en: 'A committee with events, threads or positions cannot be deleted — deactivate it instead.',
  },
  INVALID_TRANSITION: {
    ar: 'الإجراء غير متاح في الحالة الحالية.',
    en: "This action isn't available in the current state.",
  },
  VALIDATION_FAILED: {
    ar: 'يرجى مراجعة الحقول المحددة.',
    en: 'Please review the highlighted fields.',
  },
};

export function committeeMessage(code: ErrorCode, lang: Lang, field?: string): string {
  const base = messages[code]?.[lang] ?? accessMessage(code, lang);
  if (field && code === 'VALIDATION_FAILED')
    return `${base}: ${fieldLabel[field]?.[lang] ?? field}`;
  return base;
}

export function parseCommitteeDbError(error: { message?: string; code?: string }): {
  code: ErrorCode;
  field?: string;
} {
  const msg = (error.message ?? '').trim();
  const prefixed = /^VALIDATION_FAILED:(\w+)$/.exec(msg);
  if (prefixed) return { code: 'VALIDATION_FAILED', field: prefixed[1] };
  if ((CODES as readonly string[]).includes(msg)) return { code: msg as ErrorCode };
  if (error.code === '42501') return { code: 'FORBIDDEN' };
  if (['23514', '22P02'].includes(error.code ?? '')) return { code: 'VALIDATION_FAILED' };
  return { code: 'INTERNAL' };
}

/** Database field → form field key. */
export const FIELD_KEY: Record<string, string> = {
  slug: 'slug',
  name_ar: 'nameAr',
  name_en: 'nameEn',
  description_ar: 'descriptionAr',
  description_en: 'descriptionEn',
  contact_email: 'contactEmail',
  display_order: 'displayOrder',
};
