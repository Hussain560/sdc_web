'use server';

import type { AuthError } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth/session';
import { fail, ok, type ErrorCode, type Result } from '@/lib/result';
import { createClient } from '@/lib/supabase/server';
import { errorMessage, genericNotices, isLang, type Lang } from './messages';
import { sanitizeRedirect } from './redirect';
import {
  emailOnlySchema,
  fieldErrorsOf,
  signInSchema,
  updatePasswordSchema,
  updateProfileSchema,
} from './schemas';

/**
 * Auth Server Actions. Skeleton for every action (server-logic §3):
 * validate → authorize → one Supabase call → map errors → revalidate → Result.
 * Responses for sign-up, reset and resend are identical whether or not an e-mail exists (AU-5).
 */

const langOf = (value: unknown): Lang => (isLang(value) ? value : 'ar');

function codeFromAuthError(error: AuthError): ErrorCode {
  switch (error.code) {
    case 'invalid_credentials':
      return 'INVALID_CREDENTIALS';
    case 'email_not_confirmed':
      return 'EMAIL_NOT_CONFIRMED';
    case 'weak_password':
      return 'WEAK_PASSWORD';
    case 'same_password':
      return 'SAME_PASSWORD';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
    case 'over_sms_send_rate_limit':
      return 'RATE_LIMITED';
    case 'email_exists':
    case 'user_already_exists':
      return 'EMAIL_IN_USE';
    case 'otp_expired':
      return 'LINK_EXPIRED';
    default:
      return error.status === 429 ? 'RATE_LIMITED' : 'INTERNAL';
  }
}

const failCode = (code: ErrorCode, lang: Lang) => fail(code, errorMessage(code, lang));

export async function signIn(
  input: { email: string; password: string },
  ctx: { lang: Lang; redirect?: string },
): Promise<Result<{ redirectTo: string }>> {
  const lang = langOf(ctx?.lang);
  const parsed = signInSchema(lang).safeParse(input);
  if (!parsed.success) {
    return fail(
      'VALIDATION_FAILED',
      errorMessage('VALIDATION_FAILED', lang),
      fieldErrorsOf(parsed.error),
    );
  }

  const supabase = await createClient();
  const { data: session, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const code = codeFromAuthError(error);
    return failCode(code === 'INTERNAL' ? 'INVALID_CREDENTIALS' : code, lang);
  }

  // Without an explicit destination, people with an active position land on the dashboard and
  // everyone else on their account. Uses this client (the new session) because cookies set during
  // this request are not readable by getAccess() yet.
  // No revalidatePath: it would re-render /login (now signed in) and bounce before the client navigates.
  const explicit = sanitizeRedirect(ctx?.redirect, '');
  if (explicit && explicit !== '/') return ok({ redirectTo: explicit });
  const now = new Date().toISOString();
  const { count } = await supabase
    .from('role_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', session.user.id)
    .lte('starts_at', now)
    .or(`ends_at.is.null,ends_at.gt.${now}`);
  return ok({ redirectTo: (count ?? 0) > 0 ? '/dashboard' : '/account' });
}

// ---------------------------------------------------------------- sign out
export async function signOut(): Promise<Result> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  return ok(undefined);
}

// ---------------------------------------------------------------- reset password
export async function requestPasswordReset(
  input: { email: string },
  ctx: { lang: Lang },
): Promise<Result<{ notice: string }>> {
  const lang = langOf(ctx?.lang);
  const parsed = emailOnlySchema(lang).safeParse(input);
  if (!parsed.success) {
    return fail(
      'VALIDATION_FAILED',
      errorMessage('VALIDATION_FAILED', lang),
      fieldErrorsOf(parsed.error),
    );
  }

  const supabase = await createClient();
  // The recovery link is built by the e-mail template (/auth/confirm?token_hash=…). Errors are swallowed on
  // purpose: the caller must not learn whether the address exists (AU-5).
  await supabase.auth.resetPasswordForEmail(parsed.data.email);
  return ok({ notice: genericNotices.reset[lang] });
}

export async function resendConfirmation(
  input: { email: string },
  ctx: { lang: Lang },
): Promise<Result<{ notice: string }>> {
  const lang = langOf(ctx?.lang);
  const parsed = emailOnlySchema(lang).safeParse(input);
  if (!parsed.success) {
    return fail(
      'VALIDATION_FAILED',
      errorMessage('VALIDATION_FAILED', lang),
      fieldErrorsOf(parsed.error),
    );
  }
  const supabase = await createClient();
  await supabase.auth.resend({ type: 'signup', email: parsed.data.email });
  return ok({ notice: genericNotices.resend[lang] });
}

// ---------------------------------------------------------------- password change (signed in or recovery session)
export async function updatePassword(
  input: { password: string; confirmPassword: string },
  ctx: { lang: Lang; endSession?: boolean },
): Promise<Result> {
  const lang = langOf(ctx?.lang);
  const parsed = updatePasswordSchema(lang).safeParse(input);
  if (!parsed.success) {
    return fail(
      'VALIDATION_FAILED',
      errorMessage('VALIDATION_FAILED', lang),
      fieldErrorsOf(parsed.error),
    );
  }

  const user = await getUser();
  if (!user) return failCode('UNAUTHENTICATED', lang);

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    const code = codeFromAuthError(error);
    return failCode(code === 'INTERNAL' ? 'INTERNAL' : code, lang);
  }

  // Recovery flow: end the temporary session so the user signs in with the new password.
  // Normal change: keep this session, end every other one.
  await supabase.auth.signOut({ scope: ctx?.endSession ? 'global' : 'others' });
  revalidatePath('/', 'layout');
  return ok(undefined);
}

// ---------------------------------------------------------------- profile
export async function updateProfile(
  input: { fullNameAr: string; fullNameEn: string; preferredLocale: string },
  ctx: { lang: Lang },
): Promise<Result> {
  const lang = langOf(ctx?.lang);
  const user = await getUser();
  if (!user) return failCode('UNAUTHENTICATED', lang);

  const parsed = updateProfileSchema(lang).safeParse(input);
  if (!parsed.success) {
    return fail(
      'VALIDATION_FAILED',
      errorMessage('VALIDATION_FAILED', lang),
      fieldErrorsOf(parsed.error),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name_ar: parsed.data.fullNameAr,
      full_name_en: parsed.data.fullNameEn,
      preferred_locale: parsed.data.preferredLocale,
    })
    .eq('id', user.id);
  if (error) return failCode('INTERNAL', lang);

  revalidatePath('/', 'layout');
  return ok(undefined);
}

// ---------------------------------------------------------------- change e-mail
export async function changeEmail(
  input: { email: string },
  ctx: { lang: Lang },
): Promise<Result<{ notice: string }>> {
  const lang = langOf(ctx?.lang);
  const user = await getUser();
  if (!user) return failCode('UNAUTHENTICATED', lang);

  const parsed = emailOnlySchema(lang).safeParse(input);
  if (!parsed.success) {
    return fail(
      'VALIDATION_FAILED',
      errorMessage('VALIDATION_FAILED', lang),
      fieldErrorsOf(parsed.error),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: parsed.data.email });
  if (error) return failCode(codeFromAuthError(error), lang);

  return ok({
    notice:
      lang === 'ar'
        ? 'أرسلنا رابط تأكيد إلى العنوانين القديم والجديد.'
        : 'We sent a confirmation link to both the old and the new address.',
  });
}
