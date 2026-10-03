import type { ErrorCode } from '@/lib/result';
import { accessMessage } from '@/modules/access/messages';
import type { Lang } from '@/modules/auth/messages';

const fieldLabel: Record<string, { ar: string; en: string }> = {
  start_date: { ar: 'تاريخ البداية', en: 'start date' },
  end_date: { ar: 'تاريخ النهاية', en: 'end date' },
  dates: { ar: 'التواريخ', en: 'dates' },
  location: { ar: 'المكان', en: 'location' },
  group_link: { ar: 'رابط المجموعة', en: 'group link' },
  goals: { ar: 'هدف واحد على الأقل بالعربية', en: 'at least one Arabic goal' },
};

export const EVENT_ERROR_CODES = [
  'NOTE_TOO_SHORT',
  'NOT_EDITABLE',
  'NOT_DELETABLE',
  'STALE_DATA',
  'SLUG_LOCKED',
  'EVENT_NOT_ENDED',
  'INVALID_TRANSITION',
  'REASON_REQUIRED',
  'COMMITTEE_INACTIVE',
  'VALIDATION_FAILED',
] as const satisfies readonly ErrorCode[];

const messages: Partial<Record<ErrorCode, Record<Lang, string>>> = {
  NOTE_TOO_SHORT: {
    ar: 'اكتب ملاحظة لا تقل عن 10 أحرف.',
    en: 'Write a note of at least 10 characters.',
  },
  NOT_EDITABLE: {
    ar: 'لا يمكن تعديل الفعالية في حالتها الحالية.',
    en: "This event can't be edited in its current state.",
  },
  NOT_DELETABLE: {
    ar: 'لا يمكن حذف فعالية نُشرت من قبل.',
    en: "An event that was published can't be deleted.",
  },
  STALE_DATA: {
    ar: 'عدّل شخص آخر هذه الفعالية — أعد تحميل الصفحة.',
    en: 'Someone else changed this event — reload the page.',
  },
  SLUG_LOCKED: {
    ar: 'الرابط مقفل بعد النشر.',
    en: 'The slug is locked after publishing.',
  },
  EVENT_NOT_ENDED: {
    ar: 'لا يمكن إكمال الفعالية قبل انتهائها.',
    en: "An event can't be completed before it ends.",
  },
  INVALID_TRANSITION: {
    ar: 'الإجراء غير متاح لهذه الحالة (ربما تغيّرت الفعالية).',
    en: "This action isn't available in this state (the event may have changed).",
  },
  REASON_REQUIRED: { ar: 'يرجى كتابة السبب.', en: 'Please provide a reason.' },
  SLUG_TAKEN: { ar: 'هذا الرابط مستخدم.', en: 'This slug is already used.' },
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

export function eventMessage(code: ErrorCode, lang: Lang, field?: string): string {
  const base = messages[code]?.[lang] ?? accessMessage(code, lang);
  if (field && (code === 'INCOMPLETE' || code === 'PUBLISH_GUARD')) {
    const label = fieldLabel[field]?.[lang] ?? field;
    return `${base}: ${label}`;
  }
  return base;
}

/** Splits `PUBLISH_GUARD:group_link` into code and field; plain codes pass through. */
export function parseEventDbError(error: { message?: string; code?: string }): {
  code: ErrorCode;
  field?: string;
} {
  const msg = (error.message ?? '').trim();
  const prefixed = /^(PUBLISH_GUARD|INCOMPLETE):(\w+)$/.exec(msg);
  if (prefixed) return { code: prefixed[1] as ErrorCode, field: prefixed[2] };
  const known = [
    ...EVENT_ERROR_CODES,
    'SLUG_TAKEN',
    'UNAUTHENTICATED',
    'FORBIDDEN',
    'NOT_FOUND',
    'SCOPE_REQUIRED',
  ] as readonly string[];
  if (known.includes(msg)) return { code: msg as ErrorCode };
  if (error.code === '42501') return { code: 'FORBIDDEN' };
  if (
    error.code === '23514' ||
    error.code === '23502' ||
    error.code === '22P02' ||
    error.code === '22007'
  ) {
    return { code: 'VALIDATION_FAILED' };
  }
  return { code: 'INTERNAL' };
}
