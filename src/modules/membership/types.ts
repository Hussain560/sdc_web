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
  'accepted',
  'rejected',
  'waitlisted',
  'withdrawn',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABEL: Record<
  ApplicationStatus,
  { label: Localized; tone: 'neutral' | 'accent' | 'warning' | 'danger' }
> = {
  submitted: { label: { ar: 'مُستلم', en: 'Received' }, tone: 'neutral' },
  under_review: { label: { ar: 'قيد المراجعة', en: 'Under review' }, tone: 'warning' },
  accepted: { label: { ar: 'مقبول', en: 'Accepted' }, tone: 'accent' },
  rejected: { label: { ar: 'غير مقبول', en: 'Not accepted' }, tone: 'danger' },
  waitlisted: { label: { ar: 'قائمة الانتظار', en: 'Waitlisted' }, tone: 'neutral' },
  withdrawn: { label: { ar: 'مسحوب', en: 'Withdrawn' }, tone: 'neutral' },
};

/** Version of the privacy notice the applicant accepts (OPEN Q-031: final text pending). */
export const CONSENT_VERSION = '2027-01-draft';

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
};

/** Values of the 5-step application form. Strings are kept as typed; numbers are chosen ids. */
export type ApplicationValues = {
  fullNameAr: string;
  fullNameEn: string;
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
  fullNameAr: '',
  fullNameEn: '',
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
};

export type ReferenceOption = {
  id: number;
  nameAr: string;
  nameEn: string | null;
  parentId?: number | null;
};
