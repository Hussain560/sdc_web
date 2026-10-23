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
  'SELF_DECISION',
  'CAPACITY_REACHED',
  'ALREADY_CLAIMED',
  'RATE_LIMITED',
  'TOO_FAST',
  'TOKEN_INVALID',
  'SELF_ACTION',
  'HIGHER_ROLE',
  'UNDO_EXPIRED',
  'ALREADY_PENDING',
  'NO_ACCOUNT',
  'RUBRIC_LOCKED',
  'REASON_REQUIRED',
  'NOT_A_MEMBER',
] as const satisfies readonly ErrorCode[];

/** Messages shared by the application review and the member lifecycle (one wording for the same refusal). */
export const LIFECYCLE_MESSAGES: Partial<Record<ErrorCode, Record<Lang, string>>> = {
  SELF_ACTION: {
    ar: 'لا يمكنك تنفيذ هذا الإجراء على نفسك.',
    en: "You can't do this to yourself.",
  },
  HIGHER_ROLE: {
    ar: 'لا يمكنك تنفيذ هذا الإجراء على شخص بمنصب أعلى.',
    en: "You can't do this to someone with a higher role.",
  },
  UNDO_EXPIRED: { ar: 'انتهت مهلة التراجع.', en: 'The undo window has passed.' },
  ALREADY_PENDING: {
    ar: 'لديك طلب قائم بالفعل.',
    en: 'You already have a pending request.',
  },
  NO_ACCOUNT: {
    ar: 'تعذّر تجهيز حساب المتقدم. حاول مرة أخرى.',
    en: "The applicant's account could not be prepared. Try again.",
  },
  RUBRIC_LOCKED: {
    ar: 'لا يمكن تعديل معايير التقييم بعد بدء التقييم.',
    en: "The rubric can't be changed once scoring has started.",
  },
  TOKEN_INVALID: { ar: 'هذا الرابط غير صالح.', en: 'This link is not valid.' },
  REASON_REQUIRED: { ar: 'يرجى كتابة السبب.', en: 'Please provide a reason.' },
  NOT_A_MEMBER: { ar: 'هذه الصفحة للأعضاء فقط.', en: 'This page is for members only.' },
};

const messages: Partial<Record<ErrorCode, Record<Lang, string>>> = {
  ...LIFECYCLE_MESSAGES,
  EMAIL_NOT_CONFIRMED: {
    ar: 'أكّد بريدك الإلكتروني قبل التقديم.',
    en: 'Confirm your e-mail address before applying.',
  },
  CYCLE_CLOSED: { ar: 'باب التقديم مغلق حاليًا.', en: 'Applications are closed.' },
  ALREADY_APPLIED: {
    ar: 'استلمنا طلبًا بهذا البريد في هذه الدورة.',
    en: 'We already received an application with this e-mail in this cycle.',
  },
  RATE_LIMITED: {
    ar: 'محاولات كثيرة. انتظر دقائق ثم حاول مجددًا.',
    en: 'Too many attempts. Wait a few minutes and try again.',
  },
  TOO_FAST: {
    ar: 'أُرسل النموذج بسرعة كبيرة. راجع بياناتك ثم أرسله مجددًا.',
    en: 'The form was sent too quickly. Check your details and send it again.',
  },
  ALREADY_MEMBER: {
    ar: 'هذا البريد لعضو في المجتمع بالفعل. سجّل الدخول من بوابة الأعضاء.',
    en: 'This e-mail already belongs to a member. Sign in through the members portal.',
  },
  CONSENT_REQUIRED: {
    ar: 'يجب الموافقة على سياسة الخصوصية.',
    en: 'You must accept the privacy notice.',
  },
  CYCLE_OVERLAP: {
    ar: 'تتداخل هذه التواريخ مع دورة منشورة أخرى. غيّر التواريخ، أو أعد الدورة الأخرى إلى مسودة، أو أغلقها مبكراً.',
    en: 'These dates overlap another published cycle. Change the dates, unpublish the other cycle, or close it early.',
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
    ar: 'هذا الإجراء غير متاح في الحالة الحالية. حدّث الصفحة وتحقّق من حالة الطلب.',
    en: 'This action is not available in the current state. Refresh the page and check the application status.',
  },
  NOT_EDITABLE: {
    ar: 'لا يمكن تعديل الطلب أو الدورة الآن.',
    en: "This can't be changed now.",
  },
  SELF_DECISION: { ar: 'لا يمكنك البت في طلبك.', en: "You can't decide your own application." },
  CAPACITY_REACHED: { ar: 'اكتمل العدد المحدد للقبول.', en: 'The acceptance limit is reached.' },
  ALREADY_CLAIMED: {
    ar: 'مراجع آخر يعمل على هذا الطلب.',
    en: 'Another reviewer is working on this application.',
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
