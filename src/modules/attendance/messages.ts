import type { ErrorCode } from '@/lib/result';
import { accessMessage } from '@/modules/access/messages';
import type { Lang } from '@/modules/auth/messages';

const CODES = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'INVALID_TRANSITION',
  'REASON_REQUIRED',
  'NOT_SESSION_DAY',
  'SESSION_FINALIZED',
  'SESSION_NOT_CLOSED',
  'SESSION_NOT_OPEN',
  'SESSIONS_NOT_FINALIZED',
  'NOT_ACCEPTED',
  'NOT_REGISTERED',
  'REGISTRATION_CANCELLED',
  'RATE_LIMITED',
  'VALIDATION_FAILED',
  'TOKEN_EXPIRED',
  'CERTIFICATES_DISABLED',
  'ATTENDANCE_NOT_FINALIZED',
  'DATE_HAS_FINALIZED_SESSION',
] as const satisfies readonly ErrorCode[];

const messages: Partial<Record<ErrorCode, Record<Lang, string>>> = {
  NOT_SESSION_DAY: {
    ar: 'هذا ليس يوم الجلسة. أكّد إن كنت تريد فتحها مبكرًا أو متأخرًا.',
    en: "This isn't the session's day. Confirm to open it early or late.",
  },
  SESSION_FINALIZED: {
    ar: 'الجلسة معتمدة — التصحيح يتطلب صلاحية.',
    en: 'The session is finalized — corrections need permission.',
  },
  SESSION_NOT_CLOSED: { ar: 'أغلق الجلسة أولًا.', en: 'Close the session first.' },
  SESSION_NOT_OPEN: {
    ar: 'الجلسة غير مفتوحة الآن.',
    en: "The session isn't open right now.",
  },
  SESSIONS_NOT_FINALIZED: {
    ar: 'اعتمد جميع الجلسات أولًا (أو احذف اليوم الذي لم يُقَم من الجدول).',
    en: 'Finalize all sessions first (or remove a day that never ran from the schedule).',
  },
  NOT_ACCEPTED: {
    ar: 'لم يُقبل تسجيلك بعد في هذه الفعالية.',
    en: "Your registration hasn't been accepted for this event yet.",
  },
  TOKEN_EXPIRED: {
    ar: 'انتهت مهلة المسح — امسح الرمز المعروض الآن من جديد.',
    en: 'Scanner timeout — scan the code on screen again.',
  },
  NOT_REGISTERED: {
    ar: 'لم نجد تسجيلًا بهذا البريد. استخدم نفس البريد الذي سجّلت به في الفعالية.',
    en: 'No registration found for this e-mail. Use the exact e-mail you registered with.',
  },
  REGISTRATION_CANCELLED: {
    ar: 'أُلغي تسجيلك في هذه الفعالية.',
    en: 'Your registration for this event was cancelled.',
  },
  RATE_LIMITED: {
    ar: 'محاولات كثيرة. انتظر دقيقة ثم حاول مجددًا.',
    en: 'Too many attempts. Wait a minute and try again.',
  },
  VALIDATION_FAILED: {
    ar: 'اكتب بريدًا إلكترونيًا صحيحًا.',
    en: 'Enter a valid e-mail address.',
  },
  CERTIFICATES_DISABLED: { ar: 'الشهادات غير مفعّلة.', en: 'Certificates are not enabled.' },
  ATTENDANCE_NOT_FINALIZED: {
    ar: 'اعتمد حضور الفعالية أولًا.',
    en: "Finalize the event's attendance first.",
  },
  DATE_HAS_FINALIZED_SESSION: {
    ar: 'لا يمكن حذف يوم له جلسة معتمدة.',
    en: "A day with a finalized session can't be removed.",
  },
  INVALID_TRANSITION: {
    ar: 'الإجراء غير متاح في الحالة الحالية.',
    en: "This action isn't available in the current state.",
  },
  REASON_REQUIRED: { ar: 'يرجى كتابة السبب.', en: 'Please provide a reason.' },
};

export const attendanceMessage = (code: ErrorCode, lang: Lang) =>
  messages[code]?.[lang] ?? accessMessage(code, lang);

export function attendanceCode(error: { message?: string; code?: string }): ErrorCode {
  const msg = (error.message ?? '').trim();
  if ((CODES as readonly string[]).includes(msg)) return msg as ErrorCode;
  if (error.code === '42501') return 'FORBIDDEN';
  if (['23514', '22P02'].includes(error.code ?? '')) return 'VALIDATION_FAILED';
  return 'INTERNAL';
}
