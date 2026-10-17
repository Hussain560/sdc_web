import { DEFAULT_PHONE_COUNTRY, toE164, type PhoneCountry } from '@/lib/phone';
import { ACADEMIC_STATUSES, type AcademicStatus } from '@/modules/membership/types';

/**
 * The add-member wizard (MEM-014): what is collected, what each step requires, and the payload the database
 * function takes. One definition for the form and for the tests; the server validates the same rules again.
 */
export const NEW_MEMBER_STEPS = ['identity', 'academic', 'position', 'review'] as const;
export type NewMemberStep = (typeof NEW_MEMBER_STEPS)[number];

/** Roles that can be given while adding a member: committee positions only (global roles are not given here). */
export const WIZARD_ROLE_KEYS = ['committee_member', 'committee_deputy', 'committee_head'] as const;
export type WizardRoleKey = (typeof WIZARD_ROLE_KEYS)[number];

export type NewMemberValues = {
  firstNameAr: string;
  middleNameAr: string;
  lastNameAr: string;
  firstNameEn: string;
  middleNameEn: string;
  lastNameEn: string;
  email: string;
  phoneCountry: PhoneCountry;
  /** National digits only. */
  phone: string;
  academicStatus: AcademicStatus | '';
  universityId: string;
  majorId: string;
  subMajorId: string;
  trackId: string;
  committeeId: string;
  roleKey: WizardRoleKey | '';
  /** `YYYY-MM-DD` in Saudi time, empty means today. */
  startsAt: string;
  /** The committee already has a head and the person takes over. */
  handover: boolean;
  keepAsDeputy: boolean;
};

export const emptyNewMember = (): NewMemberValues => ({
  firstNameAr: '',
  middleNameAr: '',
  lastNameAr: '',
  firstNameEn: '',
  middleNameEn: '',
  lastNameEn: '',
  email: '',
  phoneCountry: DEFAULT_PHONE_COUNTRY,
  phone: '',
  academicStatus: '',
  universityId: '',
  majorId: '',
  subMajorId: '',
  trackId: '',
  committeeId: '',
  roleKey: '',
  startsAt: '',
  handover: false,
  keepAsDeputy: false,
});

type Lang = 'ar' | 'en';
export type StepErrors = Record<string, string>;

const MSG = {
  firstAr: { ar: 'اكتب الاسم الأول بالعربية.', en: 'Enter the first name in Arabic.' },
  lastAr: { ar: 'اكتب الاسم الأخير بالعربية.', en: 'Enter the last name in Arabic.' },
  firstEn: { ar: 'اكتب الاسم الأول بالإنجليزية.', en: 'Enter the first name in English.' },
  lastEn: { ar: 'اكتب الاسم الأخير بالإنجليزية.', en: 'Enter the last name in English.' },
  long: { ar: 'النص طويل جدًا (100 حرف كحد أقصى).', en: 'Too long (100 characters at most).' },
  email: { ar: 'اكتب بريدًا إلكترونيًا صحيحًا.', en: 'Enter a valid e-mail address.' },
  phone: {
    ar: 'رقم الجوال غير صحيح لهذه الدولة.',
    en: 'This phone number is not valid for the country.',
  },
  status: { ar: 'اختر الحالة.', en: 'Choose the status.' },
  committee: { ar: 'اختر اللجنة.', en: 'Choose the committee.' },
  role: { ar: 'اختر المنصب.', en: 'Choose the position.' },
  date: { ar: 'تاريخ غير صحيح.', en: 'This date is not valid.' },
} as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** What is missing in one step, as messages keyed by field. An empty object means the step is complete. */
export function validateStep(
  step: NewMemberStep,
  v: NewMemberValues,
  lang: Lang,
  opts: { canAssign: boolean } = { canAssign: true },
): StepErrors {
  const e: StepErrors = {};
  if (step === 'identity') {
    if (!v.firstNameAr.trim()) e.firstNameAr = MSG.firstAr[lang];
    if (!v.lastNameAr.trim()) e.lastNameAr = MSG.lastAr[lang];
    if (!v.firstNameEn.trim()) e.firstNameEn = MSG.firstEn[lang];
    if (!v.lastNameEn.trim()) e.lastNameEn = MSG.lastEn[lang];
    for (const k of [
      'firstNameAr',
      'middleNameAr',
      'lastNameAr',
      'firstNameEn',
      'middleNameEn',
      'lastNameEn',
    ] as const) {
      if (v[k].trim().length > 100) e[k] = MSG.long[lang];
    }
    if (!EMAIL.test(v.email.trim())) e.email = MSG.email[lang];
    if (v.phone && !toE164(v.phoneCountry, v.phone)) e.phone = MSG.phone[lang];
  }
  if (step === 'academic') {
    if (!v.academicStatus || !(ACADEMIC_STATUSES as readonly string[]).includes(v.academicStatus))
      e.academicStatus = MSG.status[lang];
  }
  if (step === 'position' && opts.canAssign) {
    const asked = !!(v.committeeId || v.roleKey);
    if (asked && !v.committeeId) e.committeeId = MSG.committee[lang];
    if (asked && !v.roleKey) e.roleKey = MSG.role[lang];
    if (v.startsAt && (!DATE.test(v.startsAt) || Number.isNaN(Date.parse(v.startsAt))))
      e.startsAt = MSG.date[lang];
  }
  return e;
}

/** The first step that still has a problem, or null when every step is complete (used by the review). */
export function firstIncompleteStep(
  v: NewMemberValues,
  lang: Lang,
  opts: { canAssign: boolean },
): NewMemberStep | null {
  for (const s of NEW_MEMBER_STEPS) {
    if (Object.keys(validateStep(s, v, lang, opts)).length > 0) return s;
  }
  return null;
}

/** Saudi midnight, like the rest of the platform: a date picked in the UI means 00:00 in Riyadh (UTC+3). */
export const startsAtIso = (date: string) => new Date(`${date}T00:00:00+03:00`).toISOString();

/** The payload of `create_member` (snake case, as the database function reads it). */
export function toCreatePayload(v: NewMemberValues, opts: { canAssign: boolean }) {
  const phone = v.phone ? toE164(v.phoneCountry, v.phone) : null;
  const position = opts.canAssign && v.roleKey && v.committeeId;
  return {
    first_name_ar: v.firstNameAr.trim(),
    middle_name_ar: v.middleNameAr.trim(),
    last_name_ar: v.lastNameAr.trim(),
    first_name_en: v.firstNameEn.trim(),
    middle_name_en: v.middleNameEn.trim(),
    last_name_en: v.lastNameEn.trim(),
    phone: phone ?? '',
    academic_status: v.academicStatus,
    university_id: v.universityId,
    major_id: v.majorId,
    sub_major_id: v.subMajorId,
    track_id: v.trackId,
    ...(position
      ? {
          role_key: v.roleKey,
          committee_id: v.committeeId,
          starts_at: v.startsAt ? startsAtIso(v.startsAt) : '',
          handover: v.handover,
          keep_as_deputy: v.handover && v.keepAsDeputy,
        }
      : {}),
  };
}

export const fullName = (a: string, b: string, c: string) =>
  [a, b, c]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' ');
