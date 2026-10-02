import type { ErrorCode } from '@/lib/result';
import { accessMessage } from '@/modules/access/messages';
import type { Lang } from '@/modules/auth/messages';

const MEMBERSHIP_CODES = [
  'UNAUTHENTICATED',
  'EMAIL_NOT_CONFIRMED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CYCLE_CLOSED',
  'ALREADY_APPLIED',
  'ALREADY_MEMBER',
  'CONSENT_REQUIRED',
  'CYCLE_OVERLAP',
  'PENDING_APPLICATIONS',
  'QUESTIONS_LOCKED',
  'INVALID_DATES',
  'INVALID_TRANSITION',
  'NOT_EDITABLE',
  'VALIDATION_FAILED',
] as const satisfies readonly ErrorCode[];

const messages: Partial<Record<ErrorCode, Record<Lang, string>>> = {
  EMAIL_NOT_CONFIRMED: {
    ar: 'أكّد بريدك الإلكتروني قبل التقديم.',
    en: 'Confirm your e-mail address before applying.',
  },
  CYCLE_CLOSED: { ar: 'باب التقديم مغلق حاليًا.', en: 'Applications are closed.' },
  ALREADY_APPLIED: { ar: 'لديك طلب في هذه الدورة.', en: 'You already applied in this cycle.' },
  ALREADY_MEMBER: { ar: 'أنت عضو بالفعل.', en: 'You are already a member.' },
  CONSENT_REQUIRED: {
    ar: 'يجب الموافقة على سياسة الخصوصية.',
    en: 'You must accept the privacy notice.',
  },
  CYCLE_OVERLAP: {
    ar: 'يوجد دورة أخرى منشورة في نفس الفترة.',
    en: 'Another published cycle overlaps these dates.',
  },
  PENDING_APPLICATIONS: {
    ar: 'توجد طلبات دون قرار — لا يمكن إكمال الدورة.',
    en: 'Undecided applications remain — the cycle cannot be completed.',
  },
  QUESTIONS_LOCKED: {
    ar: 'لا يمكن تعديل الأسئلة بعد وصول أول طلب.',
    en: "Questions can't be changed once the first application arrives.",
  },
  INVALID_DATES: {
    ar: 'التواريخ غير صحيحة (الإغلاق بعد الفتح، والتمديد إلى تاريخ لاحق).',
    en: 'Invalid dates (closing after opening; extend to a later date).',
  },
  INVALID_TRANSITION: {
    ar: 'الإجراء غير متاح في الحالة الحالية للدورة.',
    en: "This action isn't available in the cycle's current state.",
  },
  NOT_EDITABLE: {
    ar: 'لا يمكن تعديل الطلب أو الدورة الآن.',
    en: "This can't be changed now.",
  },
  VALIDATION_FAILED: {
    ar: 'يرجى مراجعة الحقول المحددة.',
    en: 'Please review the highlighted fields.',
  },
};

export const membershipMessage = (code: ErrorCode, lang: Lang) =>
  messages[code]?.[lang] ?? accessMessage(code, lang);

export function membershipCode(error: { message?: string; code?: string }): ErrorCode {
  const msg = (error.message ?? '').trim();
  if ((MEMBERSHIP_CODES as readonly string[]).includes(msg)) return msg as ErrorCode;
  if (error.code === '42501') return 'FORBIDDEN';
  if (error.code === '22P02' || error.code === '23514') return 'VALIDATION_FAILED';
  return 'INTERNAL';
}
