import type { ErrorCode } from '@/lib/result';
import { accessMessage } from '@/modules/access/messages';
import type { Lang } from '@/modules/auth/messages';

const REGISTRATION_CODES = [
  'UNAUTHENTICATED',
  'EMAIL_NOT_CONFIRMED',
  'NOT_FOUND',
  'FORBIDDEN',
  'ALREADY_REGISTERED',
  'REGISTRATION_CLOSED',
  'EVENT_FULL',
  'MEMBERS_ONLY',
  'TOO_LATE_TO_CANCEL',
  'CAPACITY_REACHED',
  'INVALID_TRANSITION',
  'REASON_REQUIRED',
  'VALIDATION_FAILED',
  'RATE_LIMITED',
  'TOO_FAST',
] as const satisfies readonly ErrorCode[];

const messages: Partial<Record<ErrorCode, Record<Lang, string>>> = {
  UNAUTHENTICATED: { ar: 'سجّل الدخول أولًا.', en: 'Please sign in first.' },
  EMAIL_NOT_CONFIRMED: {
    ar: 'أكّد بريدك الإلكتروني قبل التسجيل في الفعاليات.',
    en: 'Confirm your e-mail address before registering for events.',
  },
  ALREADY_REGISTERED: {
    ar: 'أنت مسجّل في هذه الفعالية بالفعل.',
    en: 'You are already registered for this event.',
  },
  REGISTRATION_CLOSED: {
    ar: 'التسجيل في هذه الفعالية غير متاح حاليًا.',
    en: 'Registration for this event is not open.',
  },
  EVENT_FULL: { ar: 'اكتملت المقاعد.', en: 'This event is full.' },
  MEMBERS_ONLY: {
    ar: 'هذه الفعالية لأعضاء المجتمع فقط.',
    en: 'This event is for community members only.',
  },
  TOO_LATE_TO_CANCEL: {
    ar: 'لا يمكن إلغاء التسجيل بعد بدء الفعالية.',
    en: "You can't cancel after the event has started.",
  },
  CAPACITY_REACHED: {
    ar: 'اكتملت المقاعد — لا يمكن قبول المزيد.',
    en: 'No seats left — nobody else can be accepted.',
  },
  INVALID_TRANSITION: {
    ar: 'الإجراء غير متاح لحالة هذا التسجيل.',
    en: "This action isn't available for this registration.",
  },
  REASON_REQUIRED: { ar: 'يرجى كتابة السبب.', en: 'Please provide a reason.' },
  RATE_LIMITED: {
    ar: 'محاولات كثيرة. انتظر دقائق ثم حاول مجددًا.',
    en: 'Too many attempts. Wait a few minutes and try again.',
  },
  TOO_FAST: {
    ar: 'أُرسل النموذج بسرعة كبيرة. راجع بياناتك ثم أرسله مجددًا.',
    en: 'The form was sent too quickly. Check your details and send it again.',
  },
  VALIDATION_FAILED: {
    ar: 'تعذّر تنفيذ الطلب. راجع المدخلات.',
    en: 'The request could not be processed. Check your input.',
  },
};

export function registrationMessage(code: ErrorCode, lang: Lang): string {
  return messages[code]?.[lang] ?? accessMessage(code, lang);
}

export function registrationCode(error: { message?: string; code?: string }): ErrorCode {
  const msg = (error.message ?? '').trim();
  if ((REGISTRATION_CODES as readonly string[]).includes(msg)) return msg as ErrorCode;
  if (error.code === '42501') return 'FORBIDDEN';
  if (error.code === '22P02' || error.code === '23514') return 'VALIDATION_FAILED';
  return 'INTERNAL';
}
