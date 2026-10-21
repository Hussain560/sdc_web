import { z } from 'zod';
import type { Lang } from '@/modules/auth/messages';
import {
  ACADEMIC_STATUSES,
  QUESTION_TYPES,
  type ApplicationValues,
  type CycleFormValues,
  type CycleQuestion,
} from './types';

const m = {
  firstAr: { ar: 'اكتب اسمك الأول بالعربية.', en: 'Enter your first name in Arabic.' },
  lastAr: { ar: 'اكتب اسم العائلة بالعربية.', en: 'Enter your family name in Arabic.' },
  firstEn: { ar: 'اكتب اسمك الأول بالإنجليزية.', en: 'Enter your first name in English.' },
  lastEn: { ar: 'اكتب اسم العائلة بالإنجليزية.', en: 'Enter your family name in English.' },
  bioRequired: { ar: 'اكتب نبذة قصيرة عنك.', en: 'Write a short bio about yourself.' },
  phoneRequired: { ar: 'أدخل رقم الجوال.', en: 'Enter your phone number.' },
  email: {
    ar: 'اكتب بريدًا إلكترونيًا صحيحًا — سيصلك عليه القرار ورابط تفعيل الحساب.',
    en: 'Enter a valid e-mail — the decision and your account activation link are sent there.',
  },
  nameLong: { ar: 'النص طويل جدًا.', en: 'The text is too long.' },
  phone: {
    ar: 'رقم الجوال غير صحيح (أرقام فقط، مع + اختياريًا).',
    en: 'Invalid phone number (digits only, optional leading +).',
  },
  status: { ar: 'اختر حالتك الدراسية أو المهنية.', en: 'Choose your academic or work status.' },
  university: { ar: 'اختر الجامعة أو اكتبها.', en: 'Choose or type your university.' },
  major: { ar: 'اختر التخصص أو اكتبه.', en: 'Choose or type your major.' },
  track: { ar: 'اختر المسار.', en: 'Choose a track.' },
  bio: { ar: 'النبذة طويلة (1000 حرف كحد أقصى).', en: 'The bio is too long (max 1000).' },
  https: { ar: 'يجب أن يبدأ الرابط بـ https://', en: 'The link must start with https://' },
  required: { ar: 'هذا السؤال مطلوب.', en: 'This question is required.' },
  consent: {
    ar: 'يجب الموافقة على سياسة الخصوصية لإرسال الطلب.',
    en: 'You must accept the privacy notice to submit.',
  },
  nameCycle: {
    ar: 'اسم الدورة بالعربية مطلوب (3–150).',
    en: 'The Arabic cycle name is required (3–150).',
  },
  opens: { ar: 'حدّد وقت الفتح.', en: 'Set the opening time.' },
  closes: { ar: 'وقت الإغلاق يجب أن يكون بعد الفتح.', en: 'Closing must be after opening.' },
  review: {
    ar: 'موعد القرار يجب أن يكون بعد الإغلاق.',
    en: 'The decision date must be after closing.',
  },
  capacity: { ar: 'الحد الأقصى رقم موجب.', en: 'The limit must be a positive number.' },
  questions: { ar: 'راجع الأسئلة الإضافية.', en: 'Check the extra questions.' },
  term: {
    ar: 'نهاية العضوية يجب أن تكون بعد إغلاق باب التقديم.',
    en: 'The membership end must be after applications close.',
  },
  deadline: {
    ar: 'مهلة التفعيل من 1 إلى 30 يوماً.',
    en: 'The activation period is 1 to 30 days.',
  },
  rubric: {
    ar: 'راجع معايير التقييم: حتى 6 معايير، لكل منها اسم بالعربية ووزن.',
    en: 'Check the rubric: up to 6 criteria, each with an Arabic name and a weight.',
  },
} as const;

const url = (lang: Lang) =>
  z
    .string()
    .trim()
    .refine((v) => v === '' || /^https:\/\/\S+$/.test(v), m.https[lang]);

/** Select value meaning "not in the list — I will type it" (reference-data.md: applicants may type their own). */
export const OTHER = 'other';

/** Steps of the /join form: personal · study/work · bio and links · cycle questions · review & consent. */
export const APPLICATION_STEPS = ['personal', 'academic', 'links', 'questions', 'review'] as const;
export type ApplicationStep = (typeof APPLICATION_STEPS)[number];

/** Validates one step; returns field → message (empty object = valid). Server re-validates everything. */
export function validateApplicationStep(
  step: ApplicationStep,
  v: ApplicationValues,
  questions: CycleQuestion[],
  lang: Lang,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const add = (field: string, message: string) => {
    if (!errors[field]) errors[field] = message;
  };

  if (step === 'personal') {
    if (!v.firstNameAr.trim()) add('firstNameAr', m.firstAr[lang]);
    if (!v.lastNameAr.trim()) add('lastNameAr', m.lastAr[lang]);
    if (!v.firstNameEn.trim()) add('firstNameEn', m.firstEn[lang]);
    if (!v.lastNameEn.trim()) add('lastNameEn', m.lastEn[lang]);
    for (const [field, value] of [
      ['firstNameAr', v.firstNameAr],
      ['middleNameAr', v.middleNameAr],
      ['lastNameAr', v.lastNameAr],
      ['firstNameEn', v.firstNameEn],
      ['middleNameEn', v.middleNameEn],
      ['lastNameEn', v.lastNameEn],
    ] as const)
      if (value.length > 100) add(field, m.nameLong[lang]);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) add('email', m.email[lang]);
    if (!v.phone.trim()) add('phone', m.phoneRequired[lang]);
    else if (!/^\+?[0-9]{8,15}$/.test(v.phone.trim())) add('phone', m.phone[lang]);
  }
  if (step === 'academic') {
    if (!(ACADEMIC_STATUSES as readonly string[]).includes(v.academicStatus))
      add('academicStatus', m.status[lang]);
    if (!v.universityId || (v.universityId === OTHER && !v.otherUniversity.trim()))
      add('universityId', m.university[lang]);
    if (!v.majorId || (v.majorId === OTHER && !v.otherMajor.trim())) add('majorId', m.major[lang]);
    if (!v.trackId) add('trackId', m.track[lang]);
  }
  if (step === 'links') {
    if (!v.bioAr.trim() && !v.bioEn.trim()) add('bioAr', m.bioRequired[lang]);
    if (v.bioAr.length > 1000 || v.bioEn.length > 1000) add('bioAr', m.bio[lang]);
    for (const [field, value] of [
      ['portfolioUrl', v.portfolioUrl],
      ['githubUrl', v.githubUrl],
      ['linkedinUrl', v.linkedinUrl],
      ['xUrl', v.xUrl],
    ] as const) {
      const parsed = url(lang).safeParse(value);
      if (!parsed.success) add(field, m.https[lang]);
    }
  }
  if (step === 'questions') {
    for (const q of questions) {
      const a = v.answers[q.key];
      const empty = a === undefined || (Array.isArray(a) ? a.length === 0 : a.trim() === '');
      if (q.required && empty) add(`q:${q.key}`, m.required[lang]);
      if (typeof a === 'string' && a.length > 2000) add(`q:${q.key}`, m.nameLong[lang]);
    }
  }
  if (step === 'review' && !v.consent) add('consent', m.consent[lang]);
  return errors;
}

export function validateApplication(
  v: ApplicationValues,
  questions: CycleQuestion[],
  lang: Lang,
): Record<string, string> {
  const all: Record<string, string> = {};
  for (const step of APPLICATION_STEPS)
    Object.assign(all, validateApplicationStep(step, v, questions, lang));
  return all;
}

/** Form values → the JSON the database function validates and stores. "Other" text travels in `answers`. */
export function toApplicationPayload(v: ApplicationValues, consentVersion: string) {
  const answers: Record<string, string | string[]> = { ...v.answers };
  if (v.universityId === OTHER) answers.other_university = v.otherUniversity.trim();
  if (v.majorId === OTHER) answers.other_major = v.otherMajor.trim();
  return {
    email: v.email.trim(),
    first_name_ar: v.firstNameAr.trim(),
    middle_name_ar: v.middleNameAr.trim(),
    last_name_ar: v.lastNameAr.trim(),
    first_name_en: v.firstNameEn.trim(),
    middle_name_en: v.middleNameEn.trim(),
    last_name_en: v.lastNameEn.trim(),
    phone: v.phone.trim(),
    academic_status: v.academicStatus,
    university_id: v.universityId === OTHER ? '' : v.universityId,
    major_id: v.majorId === OTHER ? '' : v.majorId,
    sub_major_id: v.majorId === OTHER ? '' : v.subMajorId,
    track_id: v.trackId,
    preferred_committee_id: v.preferredCommitteeId,
    bio_ar: v.bioAr.trim(),
    bio_en: v.bioEn.trim(),
    portfolio_url: v.portfolioUrl.trim(),
    github_url: v.githubUrl.trim(),
    linkedin_url: v.linkedinUrl.trim(),
    x_url: v.xUrl.trim(),
    answers,
    wants_directory_listing: v.wantsDirectoryListing,
    consent: v.consent,
    consent_version: consentVersion,
  };
}

/** Saved payload → form values (for editing and for the "my application" summary). */
export function fromApplicationRow(r: Record<string, unknown>): ApplicationValues {
  const s = (k: string) => (typeof r[k] === 'string' ? (r[k] as string) : '');
  const n = (k: string) => (r[k] === null || r[k] === undefined ? '' : String(r[k]));
  const answers = (r.answers && typeof r.answers === 'object' ? r.answers : {}) as Record<
    string,
    string | string[]
  >;
  const { other_university, other_major, ...rest } = answers as Record<string, string | string[]>;
  return {
    email: s('email'),
    firstNameAr: s('first_name_ar') || s('full_name_ar').split(' ')[0] || '',
    middleNameAr: s('middle_name_ar'),
    lastNameAr: s('last_name_ar'),
    firstNameEn: s('first_name_en'),
    middleNameEn: s('middle_name_en'),
    lastNameEn: s('last_name_en'),
    phone: s('phone'),
    academicStatus: (s('academic_status') as ApplicationValues['academicStatus']) || '',
    universityId: n('university_id') || (typeof other_university === 'string' ? OTHER : ''),
    otherUniversity: typeof other_university === 'string' ? other_university : '',
    majorId: n('major_id') || (typeof other_major === 'string' ? OTHER : ''),
    otherMajor: typeof other_major === 'string' ? other_major : '',
    subMajorId: n('sub_major_id'),
    trackId: n('track_id'),
    preferredCommitteeId: s('preferred_committee_id'),
    bioAr: s('bio_ar'),
    bioEn: s('bio_en'),
    portfolioUrl: s('portfolio_url'),
    githubUrl: s('github_url'),
    linkedinUrl: s('linkedin_url'),
    xUrl: s('x_url'),
    answers: rest,
    wantsDirectoryListing: r.wants_directory_listing === true,
    consent: false,
  };
}

// ----------------------------------------------------------------------------------------------- cycles
const questionSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]{0,31}$/),
  type: z.enum(QUESTION_TYPES),
  required: z.boolean(),
  label_ar: z.string().trim().min(2).max(200),
  label_en: z.string().trim().max(200).optional(),
  options: z.array(z.string().trim().min(1).max(100)).min(2).max(12).optional(),
});

/** yyyy-mm-ddThh:mm (Riyadh wall-clock) → ISO instant with the +03:00 offset (no daylight saving). */
export const riyadhToIso = (local: string) =>
  local ? new Date(`${local}:00+03:00`).toISOString() : '';
/** ISO instant → the value an <input type="datetime-local"> expects, in Riyadh wall-clock. */
export const isoToRiyadh = (iso: string | null | undefined) =>
  iso ? new Date(new Date(iso).getTime() + 3 * 3_600_000).toISOString().slice(0, 16) : '';

export function validateCycle(v: CycleFormValues, lang: Lang): Record<string, string> {
  const errors: Record<string, string> = {};
  if (v.nameAr.trim().length < 3 || v.nameAr.length > 150) errors.nameAr = m.nameCycle[lang];
  if (!v.opensAt) errors.opensAt = m.opens[lang];
  if (!v.closesAt || (v.opensAt && v.closesAt <= v.opensAt)) errors.closesAt = m.closes[lang];
  if (v.reviewEndsAt && v.closesAt && v.reviewEndsAt < v.closesAt)
    errors.reviewEndsAt = m.review[lang];
  if (v.capacity && !(Number.isInteger(Number(v.capacity)) && Number(v.capacity) > 0))
    errors.capacity = m.capacity[lang];
  if (
    v.questions.length > 10 ||
    !z.array(questionSchema).safeParse(v.questions.map(cleanQuestion)).success
  )
    errors.questions = m.questions[lang];
  if (v.termEndsAt && v.closesAt && v.termEndsAt <= v.closesAt.slice(0, 10))
    errors.termEndsAt = m.term[lang];
  const days = Number(v.activationDeadlineDays || '7');
  if (!Number.isInteger(days) || days < 1 || days > 30)
    errors.activationDeadlineDays = m.deadline[lang];
  if (!z.array(rubricSchema).max(6).safeParse(v.rubric).success) errors.rubric = m.rubric[lang];
  return errors;
}

const rubricSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]{0,23}$/),
  label_ar: z.string().trim().min(2).max(80),
  label_en: z.string().trim().max(80),
  weight: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

/** A key made from a label (or a counter) that satisfies the database rule. */
export function rubricKey(label: string, taken: string[]): string {
  const base =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 18) || 'criterion';
  let key = /^[a-z]/.test(base) ? base : `c_${base}`;
  let n = 1;
  while (taken.includes(key)) key = `${base.slice(0, 18)}_${(n += 1)}`;
  return key;
}

const cleanQuestion = (q: CycleQuestion): CycleQuestion => ({
  key: q.key,
  type: q.type,
  required: q.required,
  label_ar: q.label_ar,
  ...(q.label_en ? { label_en: q.label_en } : {}),
  ...(q.type === 'single_choice' || q.type === 'multi_choice' ? { options: q.options ?? [] } : {}),
});

export function toCyclePayload(v: CycleFormValues) {
  return {
    name_ar: v.nameAr.trim(),
    name_en: v.nameEn.trim(),
    description_ar: v.descriptionAr,
    description_en: v.descriptionEn,
    opens_at: riyadhToIso(v.opensAt),
    closes_at: riyadhToIso(v.closesAt),
    review_ends_at: riyadhToIso(v.reviewEndsAt),
    term_ends_at: v.termEndsAt,
    activation_deadline_days: v.activationDeadlineDays.trim() || '7',
    rubric: v.rubric.map((r) => ({
      key: r.key,
      label_ar: r.label_ar.trim(),
      label_en: r.label_en.trim(),
      weight: r.weight,
    })),
    capacity: v.capacity.trim(),
    questions: v.questions.map(cleanQuestion),
  };
}
