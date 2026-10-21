'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { ipHash } from '@/lib/ip-hash';
import { fail, ok, type ErrorCode, type Result } from '@/lib/result';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPublicClient } from '@/lib/supabase/public';
import { isLang, type Lang } from '@/modules/auth/messages';
import { notifyApplicationReceived, sendActivationMail } from '@/modules/notifications/lifecycle';
import { membershipMessage } from './messages';

/** Public tracking actions: the opaque token is the only credential, every call is rate-limited in the database. */
const langOf = (v: unknown): Lang => (isLang(v) ? v : 'ar');
const TOKEN = /^[0-9a-f]{40,80}$/i;
const failCode = (code: ErrorCode, lang: Lang) => fail(code, membershipMessage(code, lang));

function fromDb(o: { ok?: boolean; code?: string } | null, lang: Lang): Result {
  if (o?.ok) return ok(undefined);
  const code = (o?.code ?? 'INTERNAL') as ErrorCode;
  return failCode(code, lang);
}

/** Resubmits only the parts the reviewer asked to fix (`patch` keys are the requested fields). */
export async function resubmitApplication(
  input: { token: string; patch: Record<string, string> },
  ctx: { lang: Lang },
): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!TOKEN.test(input?.token ?? '')) return failCode('TOKEN_INVALID', lang);
  const { data, error } = await createPublicClient().rpc('resubmit_application_by_token', {
    p_token: input.token,
    p_patch: (input.patch ?? {}) as never,
    p_ip_hash: (await ipHash()) as string,
  });
  if (error) return failCode('INTERNAL', lang);
  revalidatePath('/', 'layout');
  return fromDb(data as { ok?: boolean; code?: string } | null, lang);
}

export async function withdrawApplicationByToken(
  token: string,
  ctx: { lang: Lang },
): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!TOKEN.test(token ?? '')) return failCode('TOKEN_INVALID', lang);
  const { data, error } = await createPublicClient().rpc('withdraw_application_by_token', {
    p_token: token,
    p_ip_hash: (await ipHash()) as string,
  });
  if (error) return failCode('INTERNAL', lang);
  revalidatePath('/', 'layout');
  return fromDb(data as { ok?: boolean; code?: string } | null, lang);
}

/**
 * "I did not get the e-mail": the answer is always the same (nothing says whether an application exists for this
 * address). When one does, a new link is mailed to the address on the application. Three per hour per address.
 */
export async function requestTrackingLink(email: string, ctx: { lang: Lang }): Promise<Result> {
  const lang = langOf(ctx?.lang);
  const mail = String(email ?? '')
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) return failCode('VALIDATION_FAILED', lang);
  const db = createAdminClient();
  const ip = await ipHash();
  const { data: allowedMail } = await db.rpc('allow_public_attempt', {
    p_kind: 'link-mail',
    p_key: mail,
    p_max: 3,
    p_minutes: 60,
  });
  const { data: allowedIp } = await db.rpc('allow_public_attempt', {
    p_kind: 'link-ip',
    p_key: ip ?? 'none',
    p_max: 10,
    p_minutes: 60,
  });
  if (!allowedMail || !allowedIp) return failCode('RATE_LIMITED', lang);
  const { data } = await db.rpc('rotate_tracking_token', { p_email: mail });
  const r = data as { id?: string; token?: string } | null;
  if (r?.id && r.token) {
    const { id, token } = r;
    after(async () => {
      try {
        await notifyApplicationReceived(id, token, `:link:${Date.now()}`);
      } catch (e) {
        console.error('[membership] tracking link mail failed', (e as Error).message);
      }
    });
  }
  return ok(undefined);
}

/** Sends the activation link again to the address of an accepted application (the person holds its tracking link). */
export async function requestActivationLink(token: string, ctx: { lang: Lang }): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!TOKEN.test(token ?? '')) return failCode('TOKEN_INVALID', lang);
  const db = createAdminClient();
  const { data: allowed } = await db.rpc('allow_public_attempt', {
    p_kind: 'act-link',
    p_key: token.slice(0, 24),
    p_max: 3,
    p_minutes: 60,
  });
  if (!allowed) return failCode('RATE_LIMITED', lang);
  const { data } = await db.rpc('application_by_token', { p_token: token });
  const r = data as { id?: string; status?: string } | null;
  if (r?.id && r.status === 'accepted') {
    const id = r.id;
    after(async () => {
      try {
        await sendActivationMail(id, 'resend');
      } catch (e) {
        console.error('[membership] activation link mail failed', (e as Error).message);
      }
    });
  }
  return ok(undefined);
}
