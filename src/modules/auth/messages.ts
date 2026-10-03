import type { ErrorCode } from '@/lib/result';

export type Lang = 'ar' | 'en';

export const isLang = (value: unknown): value is Lang => value === 'ar' || value === 'en';

type Bilingual = Record<Lang, string>;

/** Auth error messages (docs/11-modules/authentication/README.md §12). */
const errors: Partial<Record<ErrorCode, Bilingual>> = {
  VALIDATION_FAILED: {
    ar: 'يرجى مراجعة الحقول المحددة.',
    en: 'Please review the highlighted fields.',
  },
  UNAUTHENTICATED: {
    ar: 'انتهت الجلسة، يرجى تسجيل الدخول مجددًا.',
    en: 'Your session has ended. Please sign in again.',
  },
  FORBIDDEN: {
    ar: 'ليس لديك صلاحية لهذا الإجراء.',
    en: "You don't have permission for this action.",
  },
  INVALID_CREDENTIALS: {
    ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة. حاول مرة أخرى.',
    en: 'Incorrect email or password. Please try again.',
  },
  EMAIL_NOT_CONFIRMED: {
    ar: 'يرجى تأكيد بريدك الإلكتروني أولًا. تحقق من صندوق الوارد للرابط المرسل إليك.',
    en: 'Please confirm your email first. Check your inbox for the confirmation link.',
  },
  WEAK_PASSWORD: {
    ar: 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل، وتشمل حرفًا كبيرًا وحرفًا صغيرًا ورقمًا ورمزًا خاصًا.',
    en: 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a symbol.',
  },
  SAME_PASSWORD: {
    ar: 'كلمة المرور الجديدة يجب أن تختلف عن الحالية.',
    en: 'The new password must be different from the current one.',
  },
  RATE_LIMITED: {
    ar: 'محاولات كثيرة، حاول بعد قليل.',
    en: 'Too many attempts, try again shortly.',
  },
  LINK_EXPIRED: {
    ar: 'انتهت صلاحية الرابط. اطلب رابطًا جديدًا.',
    en: 'The link has expired. Request a new one.',
  },
  EMAIL_IN_USE: {
    ar: 'هذا البريد الإلكتروني مستخدم في حساب آخر.',
    en: 'This email is already used by another account.',
  },
  INTERNAL: {
    ar: 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.',
    en: 'Something went wrong. Please try again.',
  },
};

export function errorMessage(code: ErrorCode, lang: Lang): string {
  return (errors[code] ?? errors.INTERNAL!)[lang];
}

/** Same text for every outcome so an e-mail's existence cannot be inferred (AU-5). */
export const genericNotices = {
  reset: {
    ar: 'إذا كان هناك حساب بهذا البريد، فقد أرسلنا رابط إعادة التعيين.',
    en: 'If an account exists for this email, we sent a reset link.',
  },
  resend: {
    ar: 'إذا كان الحساب بانتظار التأكيد، فقد أعدنا إرسال الرابط.',
    en: 'If the account is awaiting confirmation, we sent the link again.',
  },
} satisfies Record<string, Bilingual>;
