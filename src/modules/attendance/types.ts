import type { Lang } from '@/modules/auth/messages';

export type SessionStatus = 'scheduled' | 'open' | 'closed' | 'finalized';
export type CheckInMethod = 'qr' | 'online' | 'manual';

export type OverviewDay = {
  eventDateId: string;
  /** yyyy-mm-dd */
  date: string;
  day: number;
  sessionId: string | null;
  status: SessionStatus;
  late: boolean;
  present: number;
  qr: number;
  online: number;
  manual: number;
};

export type AttendanceOverview = {
  event: {
    id: string;
    slug: string;
    status: string;
    titleAr: string;
    titleEn: string | null;
    finalizedAt: string | null;
  };
  accepted: number;
  threshold: number;
  certificatesEnabled: boolean;
  averagePercent: number | null;
  eligible: number;
  certificates: { issued: number; sent: number; failed: number };
  days: OverviewDay[];
};

export type RosterRow = {
  registrationId: string;
  fullName: string;
  email: string;
  wasMember: boolean;
  present: boolean;
  method: CheckInMethod | null;
  checkedInAt: string | null;
};

export const SESSION_STATUS_LABEL: Record<
  SessionStatus,
  { ar: string; en: string; tone: 'neutral' | 'accent' | 'warning' | 'danger' }
> = {
  scheduled: { ar: 'مجدولة', en: 'Scheduled', tone: 'neutral' },
  open: { ar: 'مفتوحة', en: 'Open', tone: 'accent' },
  closed: { ar: 'بانتظار الاعتماد', en: 'Awaiting sign-off', tone: 'warning' },
  finalized: { ar: 'مُعتمدة', en: 'Finalized', tone: 'accent' },
};

export const METHOD_LABEL: Record<CheckInMethod, { ar: string; en: string }> = {
  qr: { ar: 'رمز QR', en: 'QR' },
  online: { ar: 'أونلاين', en: 'Online' },
  manual: { ar: 'يدوي', en: 'Manual' },
};

/** The check-in page state, as returned by check_in_context(). */
export type CheckInContext = {
  event: { id: string; slug: string; titleAr: string; titleEn: string | null; mode: string };
  accepted: boolean;
  session: {
    id: string;
    status: 'open' | 'closed' | 'finalized';
    day: number;
    date: string;
    days: number;
  } | null;
  checkedInAt: string | null;
};

export const eventTitleOf = (e: { titleAr: string; titleEn: string | null }, lang: Lang) =>
  (lang === 'en' ? e.titleEn : null) || e.titleAr;

/** The public check-in page state (no sign-in): the event, the day and whether the session is open. */
export type PublicCheckInContext = {
  event: { slug: string; titleAr: string; titleEn: string | null };
  session: {
    id: string;
    status: 'open' | 'closed' | 'finalized';
    day: number;
    date: string;
    days: number;
  };
};

/** Live numbers of one session for the organizer screens. */
export type SessionLive = {
  status: SessionStatus;
  total: number;
  present: number;
  qr: number;
  online: number;
  manual: number;
  recent: Array<{ name: string; at: string; method: CheckInMethod }>;
};

export type CertificateRow = {
  registrationId: string;
  fullName: string;
  email: string;
  percent: number | null;
  attended: boolean;
  eligible: boolean;
  certificate: {
    id: string;
    status: 'pending' | 'generated' | 'sent' | 'failed';
    sentAt: string | null;
    attempts: number;
  } | null;
};
