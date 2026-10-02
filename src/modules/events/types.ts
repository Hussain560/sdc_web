import type { Localized } from '@/modules/access/types';

export const EVENT_TYPES = [
  'workshop',
  'bootcamp',
  'hackathon',
  'meeting',
  'meetup',
  'talk',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_STATUSES = [
  'draft',
  'pending_review',
  'changes_requested',
  'published',
  'cancelled',
  'completed',
  'archived',
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_PHASES = [
  'announced',
  'registration_open',
  'registration_closed',
  'in_progress',
  'ended',
  'cancelled',
] as const;
export type EventPhase = (typeof EVENT_PHASES)[number];

export const SCHEDULE_TYPES = ['single_day', 'consecutive_range', 'specific_dates'] as const;
export type ScheduleType = (typeof SCHEDULE_TYPES)[number];

export const LOCATION_MODES = ['in_person', 'online', 'hybrid'] as const;
export type LocationMode = (typeof LOCATION_MODES)[number];

export const PRESENTER_ROLES = ['presenter', 'mentor', 'judge', 'host'] as const;
export type PresenterRole = (typeof PRESENTER_ROLES)[number];

type Tone = 'neutral' | 'accent' | 'warning' | 'danger';

/** Badge palettes and labels: docs/10-design-system/INTERNAL-SCREENS/00-data-model-reference.md §1.2–1.3. */
export const TYPE_LABEL: Record<EventType, Localized> = {
  workshop: { ar: 'ورشة', en: 'Workshop' },
  bootcamp: { ar: 'معسكر', en: 'Bootcamp' },
  hackathon: { ar: 'هاكاثون', en: 'Hackathon' },
  meeting: { ar: 'لقاء', en: 'Meeting' },
  meetup: { ar: 'ميت أب', en: 'Meetup' },
  talk: { ar: 'محاضرة', en: 'Talk' },
};

export const STATUS_LABEL: Record<EventStatus, { label: Localized; tone: Tone }> = {
  draft: { label: { ar: 'مسودة', en: 'Draft' }, tone: 'neutral' },
  pending_review: { label: { ar: 'بانتظار الاعتماد', en: 'Pending review' }, tone: 'warning' },
  changes_requested: { label: { ar: 'مطلوب تعديلات', en: 'Changes requested' }, tone: 'danger' },
  published: { label: { ar: 'منشورة', en: 'Published' }, tone: 'accent' },
  cancelled: { label: { ar: 'ملغاة', en: 'Cancelled' }, tone: 'danger' },
  completed: { label: { ar: 'مكتملة', en: 'Completed' }, tone: 'neutral' },
  archived: { label: { ar: 'مؤرشفة', en: 'Archived' }, tone: 'neutral' },
};

export const PHASE_LABEL: Record<EventPhase, { label: Localized; tone: Tone }> = {
  announced: { label: { ar: 'قريبًا', en: 'Coming soon' }, tone: 'warning' },
  registration_open: { label: { ar: 'التسجيل متاح', en: 'Registration open' }, tone: 'accent' },
  registration_closed: {
    label: { ar: 'التسجيل مغلق', en: 'Registration closed' },
    tone: 'neutral',
  },
  in_progress: { label: { ar: 'جارية', en: 'In progress' }, tone: 'accent' },
  ended: { label: { ar: 'منتهية', en: 'Ended' }, tone: 'neutral' },
  cancelled: { label: { ar: 'ملغاة', en: 'Cancelled' }, tone: 'danger' },
};

export const LOCATION_LABEL: Record<LocationMode, Localized> = {
  in_person: { ar: 'حضوري', en: 'In person' },
  online: { ar: 'أونلاين', en: 'Online' },
  hybrid: { ar: 'هجين', en: 'Hybrid' },
};

export const PRESENTER_ROLE_LABEL: Record<PresenterRole, Localized> = {
  presenter: { ar: 'مقدّم', en: 'Presenter' },
  mentor: { ar: 'مرشد', en: 'Mentor' },
  judge: { ar: 'محكّم', en: 'Judge' },
  host: { ar: 'مضيف', en: 'Host' },
};

export type DisplayConfig = {
  show_presenters: boolean;
  show_goals: boolean;
  show_faq: boolean;
  show_seats_remaining: boolean;
  auto_close_registration: boolean;
  show_details: boolean;
};

export const DEFAULT_DISPLAY_CONFIG: DisplayConfig = {
  show_presenters: false,
  show_goals: true,
  show_faq: true,
  show_seats_remaining: false,
  auto_close_registration: true,
  show_details: true,
};

export const DETAIL_KEYS = [
  'target_audience',
  'requirements',
  'responsibilities',
  'deliverables',
  'benefits',
] as const;
export type DetailKey = (typeof DETAIL_KEYS)[number];

export const DETAIL_LABEL: Record<DetailKey, Localized> = {
  target_audience: { ar: 'الفئة المستهدفة', en: 'Target audience' },
  requirements: { ar: 'الشروط والمعايير', en: 'Requirements & criteria' },
  responsibilities: { ar: 'المهام والمسؤوليات', en: 'Tasks & responsibilities' },
  deliverables: { ar: 'المخرجات', en: 'Deliverables' },
  benefits: { ar: 'الفرص والمزايا', en: 'Opportunities & benefits' },
};

/** Wizard form state (strings for inputs; converted to the database payload by `toPayload`). */
export type FormPresenter = {
  profileId: string;
  profileName: string;
  guestNameAr: string;
  guestNameEn: string;
  guestTitleAr: string;
  guestTitleEn: string;
  guestLink: string;
  role: PresenterRole;
};

export type FormFaq = { qAr: string; qEn: string; aAr: string; aEn: string };
export type FormGoal = { ar: string; en: string };
export type FormDetails = Record<DetailKey, { ar: string[]; en: string[] }>;

export type EventFormValues = {
  committeeId: string;
  type: EventType;
  titleAr: string;
  titleEn: string;
  slug: string;
  summaryAr: string;
  summaryEn: string;
  descriptionAr: string;
  descriptionEn: string;
  scheduleType: ScheduleType;
  startDate: string;
  endDate: string;
  dates: string[];
  startTime: string;
  endTime: string;
  locationMode: LocationMode;
  locationAr: string;
  locationEn: string;
  mapUrl: string;
  meetingUrl: string;
  meetingNotes: string;
  groupLink: string;
  seats: string;
  registrationStartAt: string;
  registrationEndAt: string;
  requiresApproval: boolean;
  waitlistEnabled: boolean;
  audience: 'public' | 'members_only';
  coverImagePath: string;
  goals: FormGoal[];
  faq: FormFaq[];
  presenters: FormPresenter[];
  details: FormDetails;
  certificateAvailable: boolean;
  awardsAr: string;
  awardsEn: string;
  contactEmail: string;
  contactPhone: string;
  displayConfig: DisplayConfig;
  submissionNote: string;
  confirmed: boolean;
};

export const emptyDetails = (): FormDetails =>
  Object.fromEntries(DETAIL_KEYS.map((k) => [k, { ar: [], en: [] }])) as unknown as FormDetails;

export const emptyForm = (committeeId = ''): EventFormValues => ({
  committeeId,
  type: 'workshop',
  titleAr: '',
  titleEn: '',
  slug: '',
  summaryAr: '',
  summaryEn: '',
  descriptionAr: '',
  descriptionEn: '',
  scheduleType: 'single_day',
  startDate: '',
  endDate: '',
  dates: [],
  startTime: '',
  endTime: '',
  locationMode: 'online',
  locationAr: '',
  locationEn: '',
  mapUrl: '',
  meetingUrl: '',
  meetingNotes: '',
  groupLink: '',
  seats: '',
  registrationStartAt: '',
  registrationEndAt: '',
  requiresApproval: true,
  waitlistEnabled: false,
  audience: 'public',
  coverImagePath: '',
  goals: [{ ar: '', en: '' }],
  faq: [],
  presenters: [],
  details: emptyDetails(),
  certificateAvailable: false,
  awardsAr: '',
  awardsEn: '',
  contactEmail: '',
  contactPhone: '',
  displayConfig: { ...DEFAULT_DISPLAY_CONFIG },
  submissionNote: '',
  confirmed: false,
});
