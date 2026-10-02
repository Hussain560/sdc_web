import type { Localized } from '@/modules/access/types';
import type { RegistrationRowStatus } from './queries';

type Tone = 'neutral' | 'accent' | 'warning' | 'danger';

export const REGISTRATION_STATUS_LABEL: Record<
  RegistrationRowStatus,
  { label: Localized; tone: Tone }
> = {
  pending: { label: { ar: 'قيد المراجعة', en: 'Pending' }, tone: 'warning' },
  accepted: { label: { ar: 'مقبول', en: 'Accepted' }, tone: 'accent' },
  waitlisted: { label: { ar: 'قائمة الانتظار', en: 'Waitlisted' }, tone: 'neutral' },
  rejected: { label: { ar: 'مرفوض', en: 'Rejected' }, tone: 'danger' },
  cancelled: { label: { ar: 'ملغى', en: 'Cancelled' }, tone: 'neutral' },
};

export const NOTIFY_LABEL: Record<string, Localized> = {
  not_sent: { ar: 'بانتظار الإرسال', en: 'Waiting to send' },
  sending: { ar: 'جارٍ الإرسال', en: 'Sending' },
  sent: { ar: 'أُرسل', en: 'Sent' },
  failed: { ar: 'فشل الإرسال', en: 'Failed' },
};
