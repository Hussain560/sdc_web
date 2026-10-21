import { PRIVACY_VERSION } from '@/modules/privacy/content';
import type { Localized } from '@/modules/access/types';

export const ACADEMIC_STATUSES = ['student', 'graduate', 'employee', 'other'] as const;
export type AcademicStatus = (typeof ACADEMIC_STATUSES)[number];

export const ACADEMIC_LABEL: Record<AcademicStatus, Localized> = {
  student: { ar: 'طالب', en: 'Student' },
  graduate: { ar: 'خريج', en: 'Graduate' },
  employee: { ar: 'موظف', en: 'Employee' },
  other: { ar: 'أخرى', en: 'Other' },
};

export const QUESTION_TYPES = ['text', 'long_text', 'single_choice', 'multi_choice'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABEL: Record<QuestionType, Localized> = {
  text: { ar: 'نص قصير', en: 'Short text' },
  long_text: { ar: 'نص طويل', en: 'Long text' },
  single_choice: { ar: 'اختيار واحد', en: 'Single choice' },
  multi_choice: { ar: 'اختيار متعدد', en: 'Multiple choice' },
};

/** One extra question of a cycle (membership entities §1, `questions` column). */
export type CycleQuestion = {
  key: string;
  type: QuestionType;
  required: boolean;
  label_ar: string;
  label_en?: string;
  options?: string[];
};

export type CyclePhase = 'draft' | 'scheduled' | 'open' | 'closed' | 'completed';

export const PHASE_LABEL: Record<
  CyclePhase,
  { label: Localized; tone: 'neutral' | 'accent' | 'warning' }
> = {
  draft: { label: { ar: 'مسودة', en: 'Draft' }, tone: 'neutral' },
  scheduled: { label: { ar: 'مجدولة', en: 'Scheduled' }, tone: 'neutral' },
  open: { label: { ar: 'مفتوحة', en: 'Open' }, tone: 'accent' },
  closed: {
    label: { ar: 'مغلقة — بانتظار القرارات', en: 'Closed — awaiting decisions' },
    tone: 'warning',
  },
  completed: { label: { ar: 'مكتملة', en: 'Completed' }, tone: 'neutral' },
};

export const APPLICATION_STATUSES = [
  'submitted',
  'under_review',
  'info_requested',
  'accepted',
  'rejected',
  'waitlisted',
  'withdrawn',
  'lapsed',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABEL: Record<
  ApplicationStatus,
  { label: Localized; tone: 'neutral' | 'accent' | 'warning' | 'danger' | 'info' }
> = {
  submitted: { label: { ar: 'جديد', en: 'New' }, tone: 'info' },
  under_review: { label: { ar: 'قيد المراجعة', en: 'Under review' }, tone: 'neutral' },
  info_requested: { label: { ar: 'طلب تعديل', en: 'Edit requested' }, tone: 'warning' },
  accepted: { label: { ar: 'مقبول', en: 'Accepted' }, tone: 'accent' },
  rejected: { label: { ar: 'غير مقبول', en: 'Not accepted' }, tone: 'neutral' },
  waitlisted: { label: { ar: 'الانتظار', en: 'Waitlist' }, tone: 'warning' },
  withdrawn: { label: { ar: 'مسحوب', en: 'Withdrawn' }, tone: 'neutral' },
  lapsed: { label: { ar: 'سقط التفعيل', en: 'Lapsed' }, tone: 'danger' },
};

/** Version of the privacy notice the applicant accepts (OPEN Q-031: final text pending). */
export const CONSENT_VERSION = PRIVACY_VERSION;

/** The public view of a published/completed cycle (`membership_cycle_phase`). */
export type PublicCycle = {
  id: string;
  nameAr: string;
  nameEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  opensAt: string;
  closesAt: string;
  effectiveClosesAt: string;
  status: 'published' | 'completed';
  phase: Exclude<CyclePhase, 'draft'>;
  questions: CycleQuestion[];
  /** The date the decision is expected (told to applicants). */
  reviewEndsAt: string | null;
  /** Places of the cycle (told to applicants). */
  capacity: number | null;
  activationDeadlineDays: number;
  termEndsAt: string | null;
};

/** Values of the 5-step application form. Strings are kept as typed; numbers are chosen ids. */
export type ApplicationValues = {
  email: string;
  firstNameAr: string;
  middleNameAr: string;
  lastNameAr: string;
  firstNameEn: string;
  middleNameEn: string;
  lastNameEn: string;
  /** International format (E.164) from the phone field. */
  phone: string;
  academicStatus: AcademicStatus | '';
  universityId: string;
  otherUniversity: string;
  majorId: string;
  otherMajor: string;
  subMajorId: string;
  trackId: string;
  preferredCommitteeId: string;
  bioAr: string;
  bioEn: string;
  portfolioUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  xUrl: string;
  answers: Record<string, string | string[]>;
  wantsDirectoryListing: boolean;
  consent: boolean;
};

export const emptyApplication = (): ApplicationValues => ({
  email: '',
  firstNameAr: '',
  middleNameAr: '',
  lastNameAr: '',
  firstNameEn: '',
  middleNameEn: '',
  lastNameEn: '',
  phone: '',
  academicStatus: '',
  universityId: '',
  otherUniversity: '',
  majorId: '',
  otherMajor: '',
  subMajorId: '',
  trackId: '',
  preferredCommitteeId: '',
  bioAr: '',
  bioEn: '',
  portfolioUrl: '',
  githubUrl: '',
  linkedinUrl: '',
  xUrl: '',
  answers: {},
  wantsDirectoryListing: false,
  consent: false,
});

export type CycleFormValues = {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  /** yyyy-mm-ddThh:mm in Riyadh wall-clock (what <input type="datetime-local"> holds). */
  opensAt: string;
  closesAt: string;
  reviewEndsAt: string;
  capacity: string;
  questions: CycleQuestion[];
  /** yyyy-mm-dd: the day the membership of this cycle ends (empty: one year after acceptance). */
  termEndsAt: string;
  /** Days an accepted person has to activate before the place goes to the waiting list. */
  activationDeadlineDays: string;
  /** Reviewer rubric: empty means scoring is off for the cycle. */
  rubric: RubricCriterion[];
};

export const RUBRIC_WEIGHTS = [1, 2, 3] as const;
export type RubricWeight = (typeof RUBRIC_WEIGHTS)[number];

/** One scoring criterion of a cycle (up to 6): reviewers give 1 to 5 for each. */
export type RubricCriterion = {
  key: string;
  label_ar: string;
  label_en: string;
  weight: RubricWeight;
};

export const MAX_RUBRIC = 6;

/** The default set offered by the cycle form. */
export const DEFAULT_RUBRIC: RubricCriterion[] = [
  { key: 'motivation', label_ar: 'الدافع', label_en: 'Motivation', weight: 2 },
  {
    key: 'experience',
    label_ar: 'الخبرة أو الرغبة في التعلّم',
    label_en: 'Experience or eagerness',
    weight: 1,
  },
  { key: 'work', label_ar: 'الأعمال والروابط', label_en: 'Work and links', weight: 1 },
  {
    key: 'participation',
    label_ar: 'المشاركة المتوقعة',
    label_en: 'Expected participation',
    weight: 1,
  },
];

export type ReferenceOption = {
  id: number;
  nameAr: string;
  nameEn: string | null;
  parentId?: number | null;
};
