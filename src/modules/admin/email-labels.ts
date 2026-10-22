import { ENTITY_LABEL } from './audit-labels';

/**
 * Human names for the e-mail log (ACC-006): the template a message was made from, the thing it was about, and why a
 * send failed. The database keeps stable codes; the page shows words in the reader's language and never a raw key
 * (an unknown key is humanised from its parts).
 */
type Localized = { ar: string; en: string };
type Lang = 'ar' | 'en';

export const TEMPLATE_LABEL: Record<string, Localized> = {
  'registration.received': {
    ar: 'استلام طلب التسجيل في فعالية',
    en: 'Event registration received',
  },
  'registration.confirmed': { ar: 'قبول التسجيل في فعالية', en: 'Event registration confirmed' },
  'registration.rejected': { ar: 'رفض التسجيل في فعالية', en: 'Event registration declined' },
  'registration.waitlisted': { ar: 'قائمة انتظار فعالية', en: 'Event waiting list' },
  'registration.cancelled_by_organizer': {
    ar: 'إلغاء التسجيل من المنظّم',
    en: 'Registration cancelled by the organiser',
  },
  'event.cancelled': { ar: 'إلغاء فعالية', en: 'Event cancelled' },
  'event.changed': { ar: 'تغيير موعد أو تفاصيل فعالية', en: 'Event changed' },
  'membership.application_received': { ar: 'استلام طلب العضوية', en: 'Application received' },
  'membership.application_accepted': { ar: 'قبول طلب العضوية', en: 'Application accepted' },
  'membership.application_rejected': {
    ar: 'نتيجة طلب العضوية (غير مقبول)',
    en: 'Application result (not accepted)',
  },
  'membership.application_waitlisted': {
    ar: 'طلب العضوية في الانتظار',
    en: 'Application on the waiting list',
  },
  'membership.info_requested': {
    ar: 'طلب تعديل على طلب العضوية',
    en: 'Application: edit requested',
  },
  'membership.activation_reminder': { ar: 'تذكير بتفعيل الحساب', en: 'Activation reminder' },
  'membership.activation_lapsed': { ar: 'سقوط مهلة التفعيل', en: 'Activation period ended' },
  'member.claim_invite': { ar: 'دعوة مطالبة بسجل العضوية', en: 'Claim invitation' },
  'member.created': { ar: 'ترحيب بعضو جديد وتفعيل الحساب', en: 'Welcome and account activation' },
  'member.term_reminder': { ar: 'تذكير بقرب انتهاء العضوية', en: 'Membership ending reminder' },
  'member.expired': { ar: 'انتهاء مدة العضوية', en: 'Membership term ended' },
  'member.renewed': { ar: 'تجديد العضوية', en: 'Membership renewed' },
  'member.suspended': { ar: 'إيقاف العضوية مؤقتاً', en: 'Membership suspended' },
  'member.reinstated': { ar: 'إعادة العضوية', en: 'Membership reinstated' },
  'member.ended': { ar: 'إنهاء العضوية', en: 'Membership ended' },
  'member.leave_requested': { ar: 'استلام طلب المغادرة', en: 'Leave request received' },
  'member.leave_approved': { ar: 'الموافقة على المغادرة', en: 'Leave approved' },
  'member.leave_declined': { ar: 'رفض طلب المغادرة', en: 'Leave declined' },
  'member.leave_notice': {
    ar: 'إشعار القيادة بطلب مغادرة',
    en: 'Leadership: leave request notice',
  },
  'member.renewal_requested': {
    ar: 'إشعار القيادة بطلب تجديد',
    en: 'Leadership: renewal request notice',
  },
  'member.message': { ar: 'رسالة من القيادة إلى عضو', en: 'Message from leadership' },
  'account.blocked': { ar: 'حظر الحساب', en: 'Account blocked' },
  'account.unblocked': { ar: 'رفع الحظر عن الحساب', en: 'Account unblocked' },
  'leadership.digest': { ar: 'الملخص اليومي للقيادة', en: 'Daily leadership summary' },
  'review.pending': { ar: 'مقال بانتظار المراجعة', en: 'Article waiting for review' },
  'committee.assigned': { ar: 'تعيين في لجنة', en: 'Committee assignment' },
  'certificate.issued': { ar: 'صدور شهادة', en: 'Certificate issued' },
};

export function templateLabel(key: string, lang: Lang): string {
  return TEMPLATE_LABEL[key]?.[lang] ?? key.replace(/[._]+/g, ' ');
}

export function emailEntityLabel(entity: string, lang: Lang): string {
  return ENTITY_LABEL[entity]?.[lang] ?? entity.replace(/_/g, ' ');
}

const ERROR_LABEL: Record<string, Localized> = {
  PROVIDER_ERROR: {
    ar: 'تعذّر الإرسال من مزوّد البريد',
    en: 'The mail provider could not send it',
  },
  RATE_LIMITED: { ar: 'تجاوز حد الإرسال', en: 'Sending limit reached' },
  INVALID_RECIPIENT: { ar: 'عنوان المستلم غير صالح', en: 'The recipient address is not valid' },
  TIMEOUT: { ar: 'انتهت مهلة الاتصال', en: 'The connection timed out' },
  UNKNOWN: { ar: 'خطأ غير معروف', en: 'Unknown error' },
};

export function emailErrorLabel(code: string, lang: Lang): string {
  return ERROR_LABEL[code]?.[lang] ?? code.replace(/_/g, ' ').toLowerCase();
}
