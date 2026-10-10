'use server';

import { createHmac } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { after } from 'next/server';
import { z } from 'zod';
import { isArabicName, isEnglishName } from '@/lib/names';
import { normalizeInternational } from '@/lib/phone';
import { fail, ok, type ErrorCode, type Result } from '@/lib/result';
import { createClient } from '@/lib/supabase/server';
import { isLang, type Lang } from '@/modules/auth/messages';
import { getAccess } from '@/modules/access/queries';
import { notifyRegistration } from '@/modules/notifications/registrations';
import { PRIVACY_VERSION } from '@/modules/privacy/content';
import { registrationCode, registrationMessage } from './messages';

/**
 * Registration Server Actions. authenticate → validate → ONE database function (authoritative: capacity, window,
 * audience, scope) → e-mail after the response → revalidate → Result. A failed e-mail never fails the action; the
 * notify_status column and the retry route cover it.
 */
const langOf = (v: unknown): Lang => (isLang(v) ? v : 'ar');
const uuid = z.uuid();

function dbFailure(error: { message?: string; code?: string }, lang: Lang): Result<never> {
  const code = registrationCode(error);
  if (code === 'INTERNAL')
    console.error('[registrations] unexpected database error', error.code, error.message);
  return fail(code, registrationMessage(code, lang));
}
const failCode = (code: ErrorCode, lang: Lang) => fail(code, registrationMessage(code, lang));

function mailLater(...ids: string[]) {
  after(async () => {
    for (const id of ids) {
      try {
        await notifyRegistration(id);
      } catch (e) {
        console.error('[registrations] notification failed', (e as Error).message);
      }
    }
  });
}

export type RegistrationStatus = 'pending' | 'accepted' | 'waitlisted';

export async function registerForEvent(
  input: { eventId: string },
  ctx: { lang: Lang },
): Promise<Result<{ id: string; status: RegistrationStatus }>> {
  const lang = langOf(ctx?.lang);
  if (!uuid.safeParse(input?.eventId).success) return failCode('NOT_FOUND', lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('register_for_event', { p_event: input.eventId });
  if (error) return dbFailure(error, lang);

  const r = data as { id: string; status: RegistrationStatus };
  mailLater(r.id);
  revalidatePath('/', 'layout');
  return ok({ id: r.id, status: r.status });
}

export async function cancelMyRegistration(id: string, ctx: { lang: Lang }): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!uuid.safeParse(id).success) return failCode('NOT_FOUND', lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  const supabase = await createClient();
  const { error } = await supabase.rpc('cancel_registration', { p_id: id });
  if (error) return dbFailure(error, lang);
  revalidatePath('/', 'layout');
  return ok(undefined);
}

export type DecisionOutcome = { id: string; ok: boolean; status?: string; code?: ErrorCode };

const decideSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(200),
  decision: z.enum(['accept', 'reject', 'waitlist']),
  note: z.string().trim().max(500).optional(),
});

export async function decideRegistrations(
  input: { ids: string[]; decision: 'accept' | 'reject' | 'waitlist'; note?: string },
  ctx: { lang: Lang },
): Promise<Result<DecisionOutcome[]>> {
  const lang = langOf(ctx?.lang);
  const parsed = decideSchema.safeParse(input);
  if (!parsed.success) return failCode('VALIDATION_FAILED', lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('decide_registrations', {
    p_ids: parsed.data.ids,
    p_decision: parsed.data.decision,
    p_note: parsed.data.note,
  });
  if (error) return dbFailure(error, lang);

  const results = data as DecisionOutcome[];
  mailLater(...results.filter((r) => r.ok).map((r) => r.id));
  revalidatePath('/', 'layout');
  return ok(results);
}

export async function cancelRegistrationByOrganizer(
  input: { id: string; reason: string },
  ctx: { lang: Lang },
): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!uuid.safeParse(input?.id).success) return failCode('NOT_FOUND', lang);
  const reason = String(input?.reason ?? '').trim();
  if (reason.length < 3) return failCode('REASON_REQUIRED', lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);

  const supabase = await createClient();
  const { error } = await supabase.rpc('cancel_registration_by_organizer', {
    p_id: input.id,
    p_reason: reason,
  });
  if (error) return dbFailure(error, lang);
  mailLater(input.id);
  revalidatePath('/', 'layout');
  return ok(undefined);
}

/** Manual "send again" for one registration whose mail failed (REG-008). */
export async function resendRegistrationMail(id: string, ctx: { lang: Lang }): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!uuid.safeParse(id).success) return failCode('NOT_FOUND', lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  // RLS decides whether the caller may see (and so retry) this registration.
  const supabase = await createClient();
  const { data } = await supabase
    .from('event_registrations')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (!data) return failCode('NOT_FOUND', lang);
  mailLater(id);
  return ok(undefined);
}

const GUEST_FIELD: Record<string, { ar: string; en: string }> = {
  firstAr: { ar: 'الاسم الأول بالعربية', en: 'first name in Arabic' },
  lastAr: { ar: 'اسم العائلة بالعربية', en: 'last name in Arabic' },
  firstEn: { ar: 'الاسم الأول بالإنجليزية', en: 'first name in English' },
  lastEn: { ar: 'اسم العائلة بالإنجليزية', en: 'last name in English' },
  name: { ar: 'الاسم الكامل', en: 'full name' },
  email: { ar: 'البريد الإلكتروني', en: 'e-mail address' },
  phone: { ar: 'رقم الجوال', en: 'phone number' },
};

const guestSchema = z.object({
  eventId: z.uuid(),
  firstAr: z.string().trim().max(40),
  lastAr: z.string().trim().max(40),
  firstEn: z.string().trim().max(40),
  lastEn: z.string().trim().max(40),
  email: z.string().trim().max(160),
  /** International (E.164) number; the form builds it from the country and the national digits. */
  phone: z.string().trim().max(25),
  phoneCountry: z.string().trim().max(2).optional(),
  occupation: z.enum(['student', 'employee']).optional(),
  university: z.string().trim().max(120).optional(),
  employer: z.string().trim().max(120).optional(),
  honeypot: z.string().max(200).optional(),
  consent: z.boolean().optional(),
  elapsedMs: z.number().int().min(0).max(86_400_000).optional(),
});

/**
 * Registration without an account (KFUCS parity). The database applies the seat rules and the anti-spam layers
 * (honeypot, minimum fill time, per-e-mail and per-address throttles, one active registration per e-mail); the
 * address is only ever stored as a keyed hash. The confirmation mail goes out after the response.
 */
export async function registerGuest(
  input: z.input<typeof guestSchema>,
  ctx: { lang: Lang },
): Promise<Result<{ id: string | null; status: RegistrationStatus }>> {
  const lang = langOf(ctx?.lang);
  const parsed = guestSchema.safeParse(input);
  if (!parsed.success) return failCode('VALIDATION_FAILED', lang);
  const v = parsed.data;

  // Script rules again on the server: Arabic boxes hold Arabic letters, English boxes hold Latin letters, and
  // the phone is a real international number. The form already filters; this is the authority.
  const invalid: Record<string, boolean> = {
    firstAr: !isArabicName(v.firstAr),
    lastAr: !isArabicName(v.lastAr),
    firstEn: !isEnglishName(v.firstEn),
    lastEn: !isEnglishName(v.lastEn),
  };
  const phone = normalizeInternational(v.phone);
  if (!phone) invalid.phone = true;
  const bad = Object.keys(invalid).filter((k) => invalid[k]);
  if (bad.length > 0) {
    const message = registrationMessage('VALIDATION_FAILED', lang);
    return fail(
      'VALIDATION_FAILED',
      message,
      Object.fromEntries(
        bad.map((k) => [
          k,
          `${lang === 'ar' ? 'تحقق من ' : 'Check the '}${GUEST_FIELD[k]![lang]}.`,
        ]),
      ),
    );
  }

  const h = await headers();
  const ip = (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? '').trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'dev-only-key';
  const ipHash = ip ? createHmac('sha256', key).update(ip).digest('hex') : null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('register_guest', {
    p_event: v.eventId,
    p_name: `${v.firstAr} ${v.lastAr}`,
    p_email: v.email,
    p_phone: phone!,
    p_answers: {
      lang,
      first_name_ar: v.firstAr,
      last_name_ar: v.lastAr,
      first_name_en: v.firstEn,
      last_name_en: v.lastEn,
      ...(v.phoneCountry ? { phone_country: v.phoneCountry } : {}),
      ...(v.occupation ? { occupation: v.occupation } : {}),
      // Only the field that belongs to the chosen occupation is kept.
      ...(v.occupation === 'student' && v.university ? { university: v.university } : {}),
      ...(v.occupation === 'employee' && v.employer ? { employer: v.employer } : {}),
    } as never,
    p_ip_hash: ipHash as string,
    p_honeypot: (v.honeypot ?? '') as string,
    p_elapsed_ms: (v.elapsedMs ?? null) as number,
    p_consent_version: (v.consent ? PRIVACY_VERSION : '') as string,
  });
  if (error) return dbFailure(error, lang);

  const o = (data ?? {}) as {
    ok?: boolean;
    code?: string;
    field?: string;
    id?: string | null;
    status?: string;
  };
  if (!o.ok) {
    const code = (o.code ?? 'INTERNAL') as ErrorCode;
    const field = o.field ? GUEST_FIELD[o.field] : undefined;
    const message =
      code === 'VALIDATION_FAILED' && field
        ? `${lang === 'ar' ? 'تحقق من ' : 'Check the '}${field[lang]}.`
        : registrationMessage(code, lang);
    return fail(code, message, o.field ? { [o.field]: message } : undefined);
  }
  if (o.id) mailLater(o.id);
  revalidatePath('/', 'layout');
  return ok({ id: o.id ?? null, status: (o.status ?? 'pending') as RegistrationStatus });
}
