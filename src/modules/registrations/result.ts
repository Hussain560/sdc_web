import type { ErrorCode } from '@/lib/result';

/**
 * Every outcome of a registration attempt and the result dialog it gets (event page §5.3).
 * Pure data: the dialog renders it, the tests walk the table. Duplicate, too fast and throttled are never shown as
 * a generic error; honeypot and fill-time refusals deliberately look like "too many attempts".
 */
export type Lang = 'ar' | 'en';

export type ResultOutcome =
  | 'accepted'
  | 'pending'
  | 'waitlisted'
  | 'ALREADY_REGISTERED'
  | 'EVENT_FULL'
  | 'CAPACITY_REACHED'
  | 'REGISTRATION_CLOSED'
  | 'RATE_LIMITED'
  | 'TOO_FAST'
  | 'HONEYPOT'
  | 'MEMBERS_ONLY'
  | 'VALIDATION_FAILED'
  | 'CONSENT_REQUIRED'
  | 'INTERNAL'
  | 'TIMEOUT';

export type ResultIcon =
  | 'CircleCheck'
  | 'Clock'
  | 'ListOrdered'
  | 'Info'
  | 'Users'
  | 'CalendarX'
  | 'Timer'
  | 'UserRound'
  | 'CircleX';

export type ResultAction =
  | 'calendar' // add to calendar (+ Done)
  | 'done'
  | 'browse' // browse events
  | 'ok' // acknowledge, with the retry countdown
  | 'apply' // apply for membership
  | 'retry'; // back to the filled form

export type RegistrationResult = {
  /** `form` = return to the form with field errors instead of a result dialog. */
  kind: 'result' | 'form';
  tone: 'success' | 'info' | 'warning' | 'danger' | 'neutral';
  icon: ResultIcon;
  title: Record<Lang, string>;
  /** `{email}` is replaced with the address the person typed. */
  body: Record<Lang, string>;
  action: ResultAction;
  /** A visible countdown before the next attempt is allowed. */
  countdown: boolean;
  /** Announced as role="alert" (refusals) rather than role="status". */
  alert: boolean;
};

const R = (
  r: Omit<RegistrationResult, 'kind' | 'countdown' | 'alert'> & Partial<RegistrationResult>,
) => ({ kind: 'result', countdown: false, alert: false, ...r }) as RegistrationResult;

const tooMany = R({
  tone: 'warning',
  icon: 'Timer',
  title: { ar: 'محاولات كثيرة', en: 'Too many attempts' },
  body: { ar: 'انتظر قليلاً ثم حاول مرة أخرى.', en: 'Please wait a moment and try again.' },
  action: 'ok',
  countdown: true,
  alert: true,
});

const full = R({
  tone: 'neutral',
  icon: 'Users',
  title: { ar: 'اكتملت المقاعد', en: 'This event is full' },
  body: { ar: 'اكتمل العدد قبل وصول طلبك.', en: 'It filled up just before your request arrived.' },
  action: 'browse',
  alert: true,
});

export const RESULTS: Record<ResultOutcome, RegistrationResult> = {
  accepted: R({
    tone: 'success',
    icon: 'CircleCheck',
    title: { ar: 'تم تسجيلك', en: "You're registered" },
    body: { ar: 'أرسلنا التفاصيل إلى {email}.', en: 'We sent the details to {email}.' },
    action: 'calendar',
  }),
  pending: R({
    tone: 'info',
    icon: 'Clock',
    title: { ar: 'استلمنا طلبك', en: 'We got your request' },
    body: {
      ar: 'سنراسلك على {email} بعد مراجعة الطلب.',
      en: "We'll e-mail {email} once it's reviewed.",
    },
    action: 'done',
  }),
  waitlisted: R({
    tone: 'warning',
    icon: 'ListOrdered',
    title: { ar: 'أنت في قائمة الانتظار', en: "You're on the waiting list" },
    body: { ar: 'سنراسلك إن توفّر مقعد.', en: "We'll e-mail you if a seat opens." },
    action: 'done',
  }),
  ALREADY_REGISTERED: R({
    tone: 'info',
    icon: 'Info',
    title: { ar: 'أنت مسجّل مسبقاً', en: "You're already registered" },
    body: {
      ar: 'هذا البريد مسجّل في الفعالية. تفقّد بريدك للتفاصيل.',
      en: 'This e-mail is already registered. Check your inbox.',
    },
    action: 'done',
  }),
  EVENT_FULL: full,
  CAPACITY_REACHED: full,
  REGISTRATION_CLOSED: R({
    tone: 'neutral',
    icon: 'CalendarX',
    title: { ar: 'أُغلق التسجيل', en: 'Registration has closed' },
    body: {
      ar: 'انتهت فترة التسجيل لهذه الفعالية.',
      en: 'Registration for this event has ended.',
    },
    action: 'browse',
    alert: true,
  }),
  RATE_LIMITED: tooMany,
  TOO_FAST: tooMany,
  HONEYPOT: tooMany,
  MEMBERS_ONLY: R({
    tone: 'info',
    icon: 'UserRound',
    title: { ar: 'هذه الفعالية للأعضاء', en: 'This event is for members' },
    body: {
      ar: 'التسجيل فيها متاح لأعضاء المجتمع.',
      en: 'Registration is open to community members.',
    },
    action: 'apply',
    alert: true,
  }),
  VALIDATION_FAILED: {
    kind: 'form',
    tone: 'danger',
    icon: 'CircleX',
    title: { ar: 'راجع بياناتك', en: 'Check your details' },
    body: { ar: 'بعض الحقول تحتاج إلى تصحيح.', en: 'Some fields need fixing.' },
    action: 'retry',
    countdown: false,
    alert: true,
  },
  CONSENT_REQUIRED: {
    kind: 'form',
    tone: 'danger',
    icon: 'CircleX',
    title: { ar: 'راجع بياناتك', en: 'Check your details' },
    body: {
      ar: 'يجب الموافقة على سياسة الخصوصية للتسجيل.',
      en: 'You must accept the privacy notice to register.',
    },
    action: 'retry',
    countdown: false,
    alert: true,
  },
  INTERNAL: R({
    tone: 'danger',
    icon: 'CircleX',
    title: { ar: 'تعذّر التسجيل', en: "We couldn't register you" },
    body: {
      ar: 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.',
      en: 'Something went wrong. Please try again.',
    },
    action: 'retry',
    alert: true,
  }),
  TIMEOUT: R({
    tone: 'danger',
    icon: 'CircleX',
    title: { ar: 'تعذّر التسجيل', en: "We couldn't register you" },
    body: {
      ar: 'لم نتلقَّ ردّاً. تحقق من اتصالك وحاول مرة أخرى.',
      en: "We didn't get an answer. Check your connection and try again.",
    },
    action: 'retry',
    alert: true,
  }),
};

/** Maps a server error code to the outcome (anything unknown is a generic failure, never a leaked message). */
export function outcomeForCode(code: ErrorCode | string): ResultOutcome {
  switch (code) {
    case 'ALREADY_REGISTERED':
    case 'EVENT_FULL':
    case 'CAPACITY_REACHED':
    case 'REGISTRATION_CLOSED':
    case 'RATE_LIMITED':
    case 'TOO_FAST':
    case 'MEMBERS_ONLY':
    case 'VALIDATION_FAILED':
    case 'CONSENT_REQUIRED':
      return code;
    case 'HONEYPOT':
      return 'HONEYPOT';
    default:
      return 'INTERNAL';
  }
}

/** Outcome of a successful call, from the registration status the server returned. */
export function outcomeForStatus(status: string): ResultOutcome {
  if (status === 'accepted') return 'accepted';
  if (status === 'waitlisted') return 'waitlisted';
  return 'pending';
}

export function resultFor(outcome: ResultOutcome, lang: Lang, email?: string) {
  const r = RESULTS[outcome];
  return {
    ...r,
    titleText: r.title[lang],
    bodyText: r.body[lang].replace('{email}', email ?? ''),
  };
}
