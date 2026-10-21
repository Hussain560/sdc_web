import type { Lang } from '@/modules/auth/messages';
import type { TemplateData, TemplateKey } from './templates';

/**
 * The membership lifecycle e-mails (Sprint 18, NOT-004). Wording follows the approved design ("رسائل دورة العضوية"):
 * a rejection, an expired activation and a declined leave request are PLAIN (no note, no reason, no button), and the
 * membership card is never attached or linked as a file. Both languages, in the person's own language.
 */
export const LIFECYCLE_KEYS = [
  'membership.info_requested',
  'membership.activation_reminder',
  'membership.activation_lapsed',
  'member.term_reminder',
  'member.expired',
  'member.renewed',
  'member.suspended',
  'member.reinstated',
  'member.ended',
  'member.leave_requested',
  'member.leave_approved',
  'member.leave_declined',
  'account.blocked',
  'account.unblocked',
  'member.leave_notice',
  'member.renewal_requested',
  'leadership.digest',
  'member.message',
] as const;
export type LifecycleKey = (typeof LIFECYCLE_KEYS)[number];

export const isLifecycleKey = (k: string): k is LifecycleKey =>
  (LIFECYCLE_KEYS as readonly string[]).includes(k);

/** Mails that carry no button and no reason: the person reads one short, calm message. */
export const PLAIN_KEYS: readonly TemplateKey[] = [
  'membership.application_rejected',
  'membership.activation_lapsed',
  'member.leave_declined',
  'account.blocked',
];

export type LifecycleCopy = {
  subject: string;
  lead: string;
  body: string[];
  action?: { label: string; url?: string };
};

export const LIFECYCLE_FOOTER = {
  ar: 'وصلتك هذه الرسالة لأنها تخص طلبك أو عضويتك في المجتمع السعودي للمطورين. لا نرسل بطاقتك مرفقة أبداً.',
  en: 'You received this message because it concerns your application or membership in the Saudi Developer Community. We never attach your card.',
} as const;

export function lifecycleCopy(key: LifecycleKey, lang: Lang, d: TemplateData): LifecycleCopy {
  const ar = lang === 'ar';
  const t = d.eventTitle;
  const date = (v?: string) => v ?? '';
  switch (key) {
    case 'membership.info_requested':
      return {
        subject: ar ? 'نحتاج تعديلاً بسيطاً على طلبك' : 'A small change to your application',
        lead: ar
          ? 'قرأ فريق المراجعة طلبك ويحتاج منك تعديلاً قبل القرار:'
          : 'The review team read your application and needs one change before deciding:',
        body: [
          ar ? `«${d.infoRequest ?? ''}»` : `“${d.infoRequest ?? ''}”`,
          ar
            ? `عدّل الجزء المطلوب فقط وأعد الإرسال قبل ${date(d.infoDeadline)}.`
            : `Edit only the requested part and resubmit before ${date(d.infoDeadline)}.`,
        ],
        action: { label: ar ? 'عدّل طلبك' : 'Edit your application', url: d.trackingUrl },
      };
    case 'membership.activation_reminder':
      return {
        subject: ar
          ? 'تذكير: فعّل حسابك قبل انتهاء المهلة'
          : 'Reminder: activate your account in time',
        lead: ar
          ? `لم تفعّل حسابك بعد. ينتهي رابط التفعيل ومهلة المقعد يوم ${date(d.activationDeadline)}.`
          : `You have not activated your account yet. The link and your place expire on ${date(d.activationDeadline)}.`,
        body: [
          ar
            ? 'بعدها يُعرض مقعدك على التالي في قائمة الانتظار.'
            : 'After that, your place is offered to the next person on the waiting list.',
        ],
        action: { label: ar ? 'فعّل حسابي' : 'Activate my account', url: d.activationUrl },
      };
    case 'membership.activation_lapsed':
      return {
        subject: ar ? 'انتهت مهلة تفعيل حسابك' : 'Your activation period has ended',
        lead: ar
          ? `انتهت مهلة التفعيل لـ«${t}»، فلم يعد المقعد محجوزاً.`
          : `The activation period for “${t}” has ended, so the place is no longer held for you.`,
        body: [
          ar ? 'يمكنك التقديم في الدورة القادمة.' : 'You are welcome to apply in the next intake.',
        ],
      };
    case 'member.term_reminder': {
      const n = d.daysLeft ?? 30;
      return {
        subject: ar
          ? n === 1
            ? 'عضويتك تنتهي غداً'
            : `عضويتك تنتهي بعد ${n} ${n === 7 ? 'أيام' : 'يوماً'}`
          : n === 1
            ? 'Your membership ends tomorrow'
            : `Your membership ends in ${n} days`,
        lead: ar
          ? `تنتهي عضويتك يوم ${date(d.termEnd)}.`
          : `Your membership ends on ${date(d.termEnd)}.`,
        body: [
          ar
            ? 'اطلب التجديد من صفحة «عضويتي» لتستمر دون انقطاع.'
            : 'Request a renewal from “My membership” to continue without a break.',
        ],
        action: { label: ar ? 'عضويتي' : 'My membership', url: d.membershipUrl },
      };
    }
    case 'member.expired':
      return {
        subject: ar ? 'انتهت مدة عضويتك' : 'Your membership has ended',
        lead: ar
          ? `انتهت عضويتك في ${date(d.termEnd)}. شهاداتك وسجلّك محفوظان.`
          : `Your membership ended on ${date(d.termEnd)}. Your certificates and history are kept.`,
        body: [
          ar
            ? 'إن أردت الاستمرار، اطلب التجديد.'
            : 'If you would like to continue, request a renewal.',
        ],
        action: { label: ar ? 'اطلب التجديد' : 'Request renewal', url: d.membershipUrl },
      };
    case 'member.renewed':
      return {
        subject: ar ? 'جُدّدت عضويتك' : 'Your membership has been renewed',
        lead: ar
          ? `جُدّدت عضويتك حتى ${date(d.termEnd)}. بطاقتك الرقمية محدّثة.`
          : `Your membership is renewed until ${date(d.termEnd)}. Your digital card is up to date.`,
        body: d.message ? [d.message] : [],
        action: { label: ar ? 'بطاقتي' : 'My card', url: d.membershipUrl },
      };
    case 'member.suspended':
      return {
        subject: ar ? 'عضويتك موقوفة مؤقتاً' : 'Your membership is suspended',
        lead: d.until
          ? ar
            ? `أُوقفت عضويتك مؤقتاً حتى ${d.until}.`
            : `Your membership is suspended until ${d.until}.`
          : ar
            ? 'أُوقفت عضويتك مؤقتاً.'
            : 'Your membership is suspended.',
        body: [
          ...(d.reasonLabel ? [ar ? `السبب: ${d.reasonLabel}.` : `Reason: ${d.reasonLabel}.`] : []),
          ...(d.message ? [d.message] : []),
          ar
            ? `حسابك وشهاداتك متاحة كما هي. للاستفسار تواصل مع قائد المجتمع${d.contactEmail ? ` على ${d.contactEmail}` : ''}.`
            : `Your account and certificates stay available. Contact the community leader with any questions${d.contactEmail ? ` at ${d.contactEmail}` : ''}.`,
        ],
      };
    case 'member.reinstated':
      return {
        subject: ar ? 'أُعيدت عضويتك' : 'Your membership is active again',
        lead: ar
          ? 'عادت عضويتك نشطة. يمكنك التسجيل في فعاليات الأعضاء من جديد.'
          : 'Your membership is active again. You can register for member events.',
        body: d.message ? [d.message] : [],
        action: { label: ar ? 'عضويتي' : 'My membership', url: d.membershipUrl },
      };
    case 'member.ended':
      return {
        subject: ar ? 'انتهت عضويتك' : 'Your membership has ended',
        lead: ar
          ? 'انتهت عضويتك في المجتمع اليوم.'
          : 'Your membership in the community ended today.',
        body: [
          ...(d.message ? [ar ? `«${d.message}»` : `“${d.message}”`] : []),
          ar
            ? 'حسابك باقٍ لشهاداتك وتسجيلاتك السابقة.'
            : 'Your account stays for your certificates and past registrations.',
        ],
      };
    case 'member.leave_requested':
      return {
        subject: ar ? 'وصلنا طلب مغادرتك' : 'We received your request to leave',
        lead: ar
          ? 'وصل طلبك بمغادرة المجتمع إلى القيادة. ما زلت عضواً نشطاً حتى يقرّروا.'
          : 'Your request to leave the community has reached leadership. You stay an active member until they decide.',
        body: [
          ar
            ? 'يمكنك سحب الطلب من «عضويتي» قبل القرار.'
            : 'You can withdraw the request from “My membership” before a decision.',
        ],
        action: { label: ar ? 'عضويتي' : 'My membership', url: d.membershipUrl },
      };
    case 'member.leave_approved':
      return {
        subject: ar ? 'وافقت القيادة على طلب مغادرتك' : 'Leadership approved your request to leave',
        lead: ar
          ? `آخر يوم لعضويتك ${date(d.lastDay)}${d.positionLine ? `، وينتهي معه منصبك في ${d.positionLine}` : ''}.`
          : `Your last day as a member is ${date(d.lastDay)}${d.positionLine ? `, and your position on ${d.positionLine} ends with it` : ''}.`,
        body: [
          ar
            ? 'حسابك باقٍ لشهاداتك. شكراً لكل ما قدّمته.'
            : 'Your account stays for your certificates. Thank you for everything.',
        ],
      };
    case 'member.leave_declined':
      return {
        subject: ar ? 'بخصوص طلب المغادرة' : 'About your request to leave',
        lead: ar
          ? 'لم تُوافق القيادة على طلب مغادرتك، وما زلت عضواً نشطاً.'
          : 'Leadership did not approve your request to leave. You remain an active member.',
        body: [],
      };
    case 'account.blocked':
      return {
        subject: ar ? 'حسابك موقوف عن الدخول' : 'Your account is blocked',
        lead: ar
          ? 'أوقفت إدارة المجتمع الدخول إلى حسابك.'
          : 'The community administration has blocked sign-in to your account.',
        body: [
          ar
            ? `إن كنت ترى أن هذا خطأ، تواصل معنا${d.contactEmail ? ` على ${d.contactEmail}` : ''}.`
            : `If you think this is a mistake, contact us${d.contactEmail ? ` at ${d.contactEmail}` : ''}.`,
        ],
      };
    case 'account.unblocked':
      return {
        subject: ar ? 'أُعيد تفعيل حسابك' : 'Your account is active again',
        lead: ar ? 'يمكنك الدخول إلى حسابك من جديد.' : 'You can sign in to your account again.',
        body: [],
        action: { label: ar ? 'تسجيل الدخول' : 'Sign in', url: d.membershipUrl },
      };
    case 'member.leave_notice':
      return {
        subject: ar
          ? `طلب مغادرة جديد: ${d.requester ?? ''}`
          : `New leave request: ${d.requester ?? ''}`,
        lead: ar
          ? `أرسل ${d.requester ?? 'أحد الأعضاء'} طلباً بمغادرة المجتمع وينتظر قراركم.`
          : `${d.requester ?? 'A member'} asked to leave the community and is waiting for your decision.`,
        body: d.message ? [d.message] : [],
        action: { label: ar ? 'طلبات المغادرة' : 'Leave requests', url: d.reviewUrl },
      };
    case 'member.renewal_requested':
      return {
        subject: ar ? `طلب تجديد: ${d.requester ?? ''}` : `Renewal requested: ${d.requester ?? ''}`,
        lead: ar
          ? `طلب ${d.requester ?? 'أحد الأعضاء'} تجديد عضويته${d.termEnd ? ` (تنتهي ${d.termEnd})` : ''}.`
          : `${d.requester ?? 'A member'} asked to renew their membership${d.termEnd ? ` (ends ${d.termEnd})` : ''}.`,
        body: [],
        action: { label: ar ? 'فتح العضو' : 'Open the member', url: d.reviewUrl },
      };
    case 'member.message':
      return {
        subject: d.subject ?? (ar ? 'رسالة من المجتمع' : 'A message from the community'),
        lead: (d.text ?? '').split(/\n{2,}/)[0] ?? '',
        body: (d.text ?? '').split(/\n{2,}/).slice(1),
      };
    case 'leadership.digest': {
      const g = d.digest;
      const n = (v: number | undefined) => v ?? 0;
      const lines: string[] = [];
      if (g) {
        if (g.lapsed.length)
          lines.push(
            ar
              ? `سقط تفعيل ${g.lapsed.length}: ${g.lapsed.join('، ')}.`
              : `${g.lapsed.length} lapsed: ${g.lapsed.join(', ')}.`,
          );
        if (g.promoted.length)
          lines.push(
            ar
              ? `عُرض المقعد على ${g.promoted.length}: ${g.promoted.join('، ')}.`
              : `A place was offered to ${g.promoted.length}: ${g.promoted.join(', ')}.`,
          );
        if (n(g.endingThisWeek))
          lines.push(
            ar
              ? `تنتهي هذا الأسبوع: ${g.endingThisWeek} عضويات.`
              : `Ending this week: ${g.endingThisWeek} memberships.`,
          );
        if (n(g.pendingLeave))
          lines.push(
            ar
              ? `طلبات مغادرة معلّقة: ${g.pendingLeave}، أقدمها منذ ${g.oldestLeaveDays} أيام.`
              : `Pending leave requests: ${g.pendingLeave}, the oldest for ${g.oldestLeaveDays} days.`,
          );
        if (n(g.renewalRequests))
          lines.push(
            ar ? `طلبات تجديد: ${g.renewalRequests}.` : `Renewal requests: ${g.renewalRequests}.`,
          );
        if (n(g.newApplications))
          lines.push(
            ar
              ? `طلبات انضمام جديدة خلال 24 ساعة: ${g.newApplications}.`
              : `New applications in the last 24 hours: ${g.newApplications}.`,
          );
      }
      return {
        subject: ar ? `ملخص العضوية · ${date(d.when)}` : `Membership summary · ${date(d.when)}`,
        lead: ar ? 'ما تغيّر أمس في العضوية:' : 'What changed in membership yesterday:',
        body: lines.length
          ? lines
          : [ar ? 'لا شيء آخر يحتاج انتباهك.' : 'Nothing else needs your attention.'],
        action: {
          label: ar ? 'فتح الانتظار والتفعيل' : 'Open waiting & activation',
          url: d.reviewUrl,
        },
      };
    }
  }
}
