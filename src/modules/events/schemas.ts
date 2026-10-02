import { z } from 'zod';
import type { Lang } from '@/modules/auth/messages';
import {
  EVENT_TYPES,
  LOCATION_MODES,
  PRESENTER_ROLES,
  SCHEDULE_TYPES,
  type EventFormValues,
} from './types';

/**
 * Wizard validation — the KFUCS step schemas ported Arabic-first (docs/10-design-system/INTERNAL-SCREENS/13-event-form.md).
 * The same schemas run in the browser (per step, on *Next*) and in the Server Actions (full form).
 */
const m = {
  committee: { ar: 'اختر اللجنة المنظِّمة.', en: 'Choose the organizing committee.' },
  type: { ar: 'اختر نوع الفعالية.', en: 'Choose the event type.' },
  titleAr: {
    ar: 'العنوان بالعربية مطلوب (3–200 حرفًا).',
    en: 'The Arabic title is required (3–200 characters).',
  },
  titleEn: {
    ar: 'العنوان الإنجليزي طويل جدًا (200 كحد أقصى).',
    en: 'The English title is too long (max 200).',
  },
  slug: {
    ar: 'الرابط: أحرف إنجليزية صغيرة وأرقام وشرطات فقط (3–120).',
    en: 'Slug: lowercase letters, digits and hyphens only (3–120).',
  },
  summary: { ar: 'الملخص طويل جدًا (500 كحد أقصى).', en: 'The summary is too long (max 500).' },
  description: {
    ar: 'الوصف طويل جدًا (5000 كحد أقصى).',
    en: 'The description is too long (max 5000).',
  },
  startDate: { ar: 'تاريخ البداية مطلوب.', en: 'The start date is required.' },
  endDate: {
    ar: 'تاريخ النهاية مطلوب ويجب ألا يسبق البداية.',
    en: 'The end date is required and must not be before the start.',
  },
  dates: { ar: 'أضف تاريخًا واحدًا على الأقل.', en: 'Add at least one date.' },
  datesDup: { ar: 'لا يمكن تكرار التاريخ.', en: 'Dates must be unique.' },
  time: { ar: 'صيغة الوقت غير صحيحة.', en: 'Invalid time.' },
  timeOrder: {
    ar: 'وقت النهاية يجب أن يكون بعد وقت البداية.',
    en: 'The end time must be after the start time.',
  },
  locationRequired: {
    ar: 'المكان مطلوب للفعاليات الحضورية والهجينة.',
    en: 'A location is required for in-person and hybrid events.',
  },
  https: { ar: 'يجب أن يبدأ الرابط بـ https://', en: 'The link must start with https://' },
  groupLink: {
    ar: 'رابط المجموعة مطلوب ويجب أن يبدأ بـ https://',
    en: 'A group link is required and must start with https://',
  },
  seats: { ar: 'عدد المقاعد يجب أن يكون رقمًا موجبًا.', en: 'Seats must be a positive number.' },
  regOrder: {
    ar: 'نهاية التسجيل يجب أن تكون بعد بدايته.',
    en: 'Registration must close after it opens.',
  },
  goals: {
    ar: 'أضف هدفًا واحدًا على الأقل بالعربية (حتى 15).',
    en: 'Add at least one Arabic goal (up to 15).',
  },
  goalLong: { ar: 'الهدف طويل جدًا (300 كحد أقصى).', en: 'A goal is too long (max 300).' },
  faq: {
    ar: 'السؤال والجواب بالعربية مطلوبان في كل بند (حتى 15).',
    en: 'Each FAQ item needs an Arabic question and answer (up to 15).',
  },
  presenters: {
    ar: 'كل مقدّم يحتاج حسابًا أو اسمًا بالعربية (حتى 10).',
    en: 'Each presenter needs an account or an Arabic name (up to 10).',
  },
  detailItem: {
    ar: 'حتى 20 بندًا، كل بند ≤ 300 حرف.',
    en: 'Up to 20 items, each ≤ 300 characters.',
  },
  email: { ar: 'البريد الإلكتروني غير صالح.', en: 'Enter a valid e-mail address.' },
  phone: {
    ar: 'رقم الهاتف غير صالح (مثال: +966512345678 أو 0512345678).',
    en: 'Invalid phone number (e.g. +966512345678 or 0512345678).',
  },
  confirm: { ar: 'يرجى تأكيد صحة المعلومات.', en: 'Please confirm the information is correct.' },
} as const;

const optionalText = (max: number, message: string) => z.string().max(max, message);
const httpsUrl = (message: string) =>
  z.string().refine((v) => v === '' || /^https:\/\/\S+$/i.test(v), message);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const hhmm = (message: string) =>
  z.string().refine((v) => v === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), message);
const nonEmpty = (v: string) => v.trim().length > 0;

export function eventSchemas(lang: Lang) {
  const t = (k: keyof typeof m) => m[k][lang];

  const step1 = z.object({
    committeeId: z.uuid({ error: t('committee') }),
    type: z.enum(EVENT_TYPES, { error: t('type') }),
    titleAr: z.string().trim().min(3, t('titleAr')).max(200, t('titleAr')),
    titleEn: optionalText(200, t('titleEn')),
    slug: z.string().refine((v) => v === '' || /^[a-z0-9-]{3,120}$/.test(v), t('slug')),
    summaryAr: optionalText(500, t('summary')),
    summaryEn: optionalText(500, t('summary')),
    descriptionAr: optionalText(5000, t('description')),
    descriptionEn: optionalText(5000, t('description')),
  });

  const step2 = z
    .object({
      scheduleType: z.enum(SCHEDULE_TYPES),
      startDate: z.string(),
      endDate: z.string(),
      dates: z.array(isoDate),
      startTime: hhmm(t('time')),
      endTime: hhmm(t('time')),
      locationMode: z.enum(LOCATION_MODES),
      locationAr: optionalText(500, t('locationRequired')),
      locationEn: optionalText(500, t('locationRequired')),
      mapUrl: httpsUrl(t('https')),
      meetingUrl: httpsUrl(t('https')),
      meetingNotes: optionalText(1000, t('description')),
      groupLink: z.string().regex(/^https:\/\/\S+$/i, t('groupLink')),
      seats: z.string().refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) > 0), t('seats')),
      registrationStartAt: z.string(),
      registrationEndAt: z.string(),
      requiresApproval: z.boolean(),
      waitlistEnabled: z.boolean(),
      audience: z.enum(['public', 'members_only']),
    })
    .superRefine((v, ctx) => {
      const add = (path: string, message: string) =>
        ctx.addIssue({ code: 'custom', path: [path], message });
      if (v.scheduleType === 'specific_dates') {
        if (v.dates.length === 0) add('dates', t('dates'));
        else if (new Set(v.dates).size !== v.dates.length) add('dates', t('datesDup'));
      } else {
        if (!isoDate.safeParse(v.startDate).success) add('startDate', t('startDate'));
        if (
          v.scheduleType === 'consecutive_range' &&
          (!isoDate.safeParse(v.endDate).success || v.endDate < v.startDate)
        ) {
          add('endDate', t('endDate'));
        }
      }
      const sameDay =
        v.scheduleType === 'single_day' ||
        (v.scheduleType === 'specific_dates' && v.dates.length === 1);
      if (sameDay && v.startTime && v.endTime && v.endTime <= v.startTime)
        add('endTime', t('timeOrder'));
      if (v.locationMode !== 'online' && !nonEmpty(v.locationAr))
        add('locationAr', t('locationRequired'));
      // KFUCS: the deadline may be after the event starts (registration can be reopened) — only its order against the opening is checked.
      if (
        v.registrationStartAt &&
        v.registrationEndAt &&
        v.registrationEndAt <= v.registrationStartAt
      ) {
        add('registrationEndAt', t('regOrder'));
      }
    });

  const detailList = z.array(z.string().max(300, t('detailItem'))).max(20, t('detailItem'));
  const step3 = z.object({
    coverImagePath: z.string(),
    goals: z
      .array(
        z.object({
          ar: z.string().max(300, t('goalLong')),
          en: z.string().max(300, t('goalLong')),
        }),
      )
      .max(15, t('goals'))
      .refine((g) => g.some((x) => nonEmpty(x.ar)), t('goals')),
    faq: z
      .array(z.object({ qAr: z.string(), qEn: z.string(), aAr: z.string(), aEn: z.string() }))
      .max(15, t('faq'))
      .refine((items) => items.every((i) => nonEmpty(i.qAr) && nonEmpty(i.aAr)), t('faq')),
    presenters: z
      .array(
        z.object({
          profileId: z.string(),
          profileName: z.string(),
          guestNameAr: z.string(),
          guestNameEn: z.string(),
          guestTitleAr: z.string(),
          guestTitleEn: z.string(),
          guestLink: httpsUrl(t('https')),
          role: z.enum(PRESENTER_ROLES),
        }),
      )
      .max(10, t('presenters'))
      .refine(
        (ps) => ps.every((p) => p.profileId !== '' || nonEmpty(p.guestNameAr)),
        t('presenters'),
      ),
    details: z.object({
      target_audience: z.object({ ar: detailList, en: detailList }),
      requirements: z.object({ ar: detailList, en: detailList }),
      responsibilities: z.object({ ar: detailList, en: detailList }),
      deliverables: z.object({ ar: detailList, en: detailList }),
      benefits: z.object({ ar: detailList, en: detailList }),
    }),
    certificateAvailable: z.boolean(),
    awardsAr: z.string().max(500),
    awardsEn: z.string().max(500),
    contactEmail: z.string().refine((v) => v === '' || z.email().safeParse(v).success, t('email')),
    contactPhone: z
      .string()
      .refine((v) => v === '' || /^(\+[1-9]\d{6,14}|0\d{8,10})$/.test(v), t('phone')),
  });

  const step4 = z.object({
    displayConfig: z.object({
      show_presenters: z.boolean(),
      show_goals: z.boolean(),
      show_faq: z.boolean(),
      show_seats_remaining: z.boolean(),
      auto_close_registration: z.boolean(),
      show_details: z.boolean(),
    }),
    submissionNote: z.string().max(1000),
    confirmed: z.literal(true, { error: t('confirm') }),
  });

  return { step1, step2, step3, step4, steps: [step1, step2, step3, step4] as const };
}

export type StepNumber = 1 | 2 | 3 | 4;

/** Which form fields belong to each step (to pick the values a step schema sees). */
export const STEP_FIELDS: Record<StepNumber, ReadonlyArray<keyof EventFormValues>> = {
  1: [
    'committeeId',
    'type',
    'titleAr',
    'titleEn',
    'slug',
    'summaryAr',
    'summaryEn',
    'descriptionAr',
    'descriptionEn',
  ],
  2: [
    'scheduleType',
    'startDate',
    'endDate',
    'dates',
    'startTime',
    'endTime',
    'locationMode',
    'locationAr',
    'locationEn',
    'mapUrl',
    'meetingUrl',
    'meetingNotes',
    'groupLink',
    'seats',
    'registrationStartAt',
    'registrationEndAt',
    'requiresApproval',
    'waitlistEnabled',
    'audience',
  ],
  3: [
    'coverImagePath',
    'goals',
    'faq',
    'presenters',
    'details',
    'certificateAvailable',
    'awardsAr',
    'awardsEn',
    'contactEmail',
    'contactPhone',
  ],
  4: ['displayConfig', 'submissionNote', 'confirmed'],
};

export type StepResult = { ok: true } | { ok: false; errors: Record<string, string> };

/** Validates one wizard step; errors are keyed by field path (e.g. `startDate`, `goals`). */
export function validateStep(step: StepNumber, values: EventFormValues, lang: Lang): StepResult {
  const schema = eventSchemas(lang).steps[step - 1]!;
  const subset = Object.fromEntries(STEP_FIELDS[step].map((k) => [k, values[k]]));
  const parsed = schema.safeParse(subset);
  if (parsed.success) return { ok: true };
  const found: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!(key in found)) found[key] = issue.message;
  }
  // Keep the errors in form order so the first one is the first invalid field on screen (it gets the focus).
  const order = STEP_FIELDS[step] as readonly string[];
  const errors: Record<string, string> = {};
  for (const k of Object.keys(found).sort((a, b) => order.indexOf(a) - order.indexOf(b)))
    errors[k] = found[k]!;
  return { ok: false, errors };
}

/** Steps 1–3 (everything required to submit); step 4 only adds the confirmation. */
export function validateAll(
  values: EventFormValues,
  lang: Lang,
): { ok: true } | { ok: false; step: StepNumber; errors: Record<string, string> } {
  for (const step of [1, 2, 3] as const) {
    const r = validateStep(step, values, lang);
    if (!r.ok) return { ok: false, step, errors: r.errors };
  }
  return { ok: true };
}

/** Minimum for saving a draft (the database also requires these): committee, type and an Arabic title. */
export function validateDraft(values: EventFormValues, lang: Lang): StepResult {
  const t = eventSchemas(lang).step1.pick({
    committeeId: true,
    type: true,
    titleAr: true,
    titleEn: true,
    slug: true,
  });
  const parsed = t.safeParse(values);
  if (parsed.success) return { ok: true };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!(key in errors)) errors[key] = issue.message;
  }
  return { ok: false, errors };
}
