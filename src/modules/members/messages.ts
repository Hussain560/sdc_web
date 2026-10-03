import type { ErrorCode } from '@/lib/result';
import { accessMessage } from '@/modules/access/messages';
import type { Lang } from '@/modules/auth/messages';

const MEMBER_CODES = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'NOT_A_MEMBER',
  'REASON_REQUIRED',
  'INVALID_TRANSITION',
  'NO_EMAIL',
  'ALREADY_LINKED',
  'TOKEN_INVALID',
  'TOKEN_EXPIRED',
  'EMAIL_MISMATCH',
  'ALREADY_CLAIMED',
  'SELF_DECISION',
  'CAPACITY_REACHED',
  'VALIDATION_FAILED',
  'ALREADY_MEMBER',
] as const satisfies readonly ErrorCode[];

const messages: Partial<Record<ErrorCode, Record<Lang, string>>> = {
  NOT_A_MEMBER: { ar: 'هذه الصفحة للأعضاء فقط.', en: 'This page is for members only.' },
  REASON_REQUIRED: { ar: 'يرجى كتابة السبب.', en: 'Please provide a reason.' },
  INVALID_TRANSITION: {
    ar: 'الإجراء غير متاح في الحالة الحالية.',
    en: "This action isn't available in the current state.",
  },
  NO_EMAIL: { ar: 'أدخل بريدًا إلكترونيًا صحيحًا.', en: 'Enter a valid e-mail address.' },
  ALREADY_LINKED: {
    ar: 'هذا الملف مرتبط بحساب بالفعل.',
    en: 'This profile is already linked to an account.',
  },
  TOKEN_INVALID: {
    ar: 'رابط المطالبة غير صالح أو استُخدم من قبل — اطلب رابطًا جديدًا.',
    en: 'This claim link is invalid or was already used — ask for a new one.',
  },
  TOKEN_EXPIRED: {
    ar: 'انتهت صلاحية رابط المطالبة — اطلب رابطًا جديدًا.',
    en: 'This claim link expired — ask for a new one.',
  },
  EMAIL_MISMATCH: {
    ar: 'سجّل الدخول بالبريد الذي وصلته الدعوة.',
    en: 'Sign in with the e-mail that received the invite.',
  },
  ALREADY_CLAIMED: {
    ar: 'مراجع آخر يعمل على هذا الطلب.',
    en: 'Another reviewer is working on this application.',
  },
  SELF_DECISION: { ar: 'لا يمكنك البت في طلبك.', en: "You can't decide your own application." },
  CAPACITY_REACHED: {
    ar: 'اكتمل العدد المحدد للقبول.',
    en: 'The acceptance limit is reached.',
  },
  ALREADY_MEMBER: {
    ar: 'هذا البريد لعضو في المجتمع بالفعل.',
    en: 'This e-mail already belongs to a member.',
  },
  VALIDATION_FAILED: {
    ar: 'يرجى مراجعة الحقول المحددة.',
    en: 'Please review the highlighted fields.',
  },
};

export const memberMessage = (code: ErrorCode, lang: Lang) =>
  messages[code]?.[lang] ?? accessMessage(code, lang);

export function memberCode(error: { message?: string; code?: string }): ErrorCode {
  const msg = (error.message ?? '').trim();
  if ((MEMBER_CODES as readonly string[]).includes(msg)) return msg as ErrorCode;
  if (error.code === '42501') return 'FORBIDDEN';
  if (error.code === '22P02' || error.code === '23514') return 'VALIDATION_FAILED';
  return 'INTERNAL';
}
