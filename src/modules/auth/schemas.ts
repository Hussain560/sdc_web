import { z } from 'zod';
import type { Lang } from './messages';

/** AU-2: 8+ characters with lower, upper, digit and symbol (the rule the UI has always shown). */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const t = {
  nameWords: {
    ar: 'يرجى إدخال الاسم الثلاثي كاملًا (لا يقل عن ثلاث كلمات).',
    en: 'Please enter your full name (first, middle and last name).',
  },
  nameLong: { ar: 'الاسم طويل جدًا.', en: 'The name is too long.' },
  email: { ar: 'البريد الإلكتروني غير صالح.', en: 'Enter a valid email address.' },
  password: {
    ar: 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل، وتشمل حرفًا كبيرًا وحرفًا صغيرًا ورقمًا ورمزًا خاصًا.',
    en: 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a symbol.',
  },
  mismatch: { ar: 'كلمتا المرور غير متطابقتين.', en: 'Passwords do not match.' },
  required: { ar: 'هذا الحقل مطلوب.', en: 'This field is required.' },
  locale: { ar: 'اللغة غير مدعومة.', en: 'Unsupported language.' },
} as const;

const words = (value: string) => value.trim().split(/\s+/).filter(Boolean);

export const fullNameField = (lang: Lang) =>
  z
    .string()
    .transform((v) => words(v).join(' '))
    .pipe(
      z
        .string()
        .max(100, t.nameLong[lang])
        .refine((v) => words(v).length >= 3, t.nameWords[lang]),
    );

export const emailField = (lang: Lang) =>
  z.string().trim().toLowerCase().max(254, t.email[lang]).pipe(z.email(t.email[lang]));

export const passwordField = (lang: Lang) => z.string().regex(PASSWORD_REGEX, t.password[lang]);

export const signInSchema = (lang: Lang) =>
  z.object({
    email: emailField(lang),
    password: z.string().min(1, t.required[lang]).max(200),
  });

export const emailOnlySchema = (lang: Lang) => z.object({ email: emailField(lang) });

export const updatePasswordSchema = (lang: Lang) =>
  z
    .object({ password: passwordField(lang), confirmPassword: z.string() })
    .refine((v) => v.password === v.confirmPassword, {
      path: ['confirmPassword'],
      message: t.mismatch[lang],
    });

export const updateProfileSchema = (lang: Lang) =>
  z.object({
    fullNameAr: fullNameField(lang),
    fullNameEn: z
      .string()
      .trim()
      .max(100, t.nameLong[lang])
      .transform((v) => (v === '' ? null : v)),
    preferredLocale: z.enum(['ar', 'en'], { error: t.locale[lang] }),
  });

/** Flattens a Zod error to `{ field: firstMessage }`. */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
