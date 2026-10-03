'use server';

import { revalidatePath } from 'next/cache';
import { fail, ok, type ErrorCode, type Result } from '@/lib/result';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getAccess } from '@/modules/access/queries';
import { accessMessage } from '@/modules/access/messages';
import { isLang, type Lang } from '@/modules/auth/messages';

/**
 * Data-subject actions (SEC-003). The database functions do the work and the permission checks; the only thing done
 * here with the admin key is removing the sign-in account and the stored certificate PDFs once a deletion request
 * has been completed in the database.
 */
const langOf = (v: unknown): Lang => (isLang(v) ? v : 'ar');
const UUID = /^[0-9a-f-]{36}$/i;

const text: Partial<Record<ErrorCode, Record<Lang, string>>> = {
  ALREADY_REQUESTED: {
    ar: 'لديك طلب حذف قيد المراجعة بالفعل.',
    en: 'You already have a deletion request waiting.',
  },
  SELF_DECISION: {
    ar: 'لا يمكنك معالجة طلبك بنفسك.',
    en: 'You cannot handle your own request.',
  },
  INVALID_TRANSITION: {
    ar: 'تمت معالجة هذا الطلب مسبقًا.',
    en: 'This request was already handled.',
  },
};
const message = (code: ErrorCode, lang: Lang) => text[code]?.[lang] ?? accessMessage(code, lang);

function code(error: { message?: string; code?: string }): ErrorCode {
  const msg = (error.message ?? '').trim();
  if (
    [
      'UNAUTHENTICATED',
      'FORBIDDEN',
      'NOT_FOUND',
      'VALIDATION_FAILED',
      'INVALID_TRANSITION',
      'SELF_DECISION',
      'ALREADY_REQUESTED',
    ].includes(msg)
  )
    return msg as ErrorCode;
  if (error.code === '42501') return 'FORBIDDEN';
  return 'INTERNAL';
}

function dbFailure(error: { message?: string; code?: string }, lang: Lang): Result<never> {
  const c = code(error);
  if (c === 'INTERNAL')
    console.error('[privacy] unexpected database error', error.code, error.message);
  return fail(c, message(c, lang));
}

/** Access: everything the platform holds about the signed-in person, as JSON text for a download. */
export async function exportMyData(ctx: { lang: Lang }): Promise<Result<{ json: string }>> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return fail('UNAUTHENTICATED', message('UNAUTHENTICATED', lang));
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('export_my_data');
  if (error) return dbFailure(error, lang);
  return ok({ json: JSON.stringify(data, null, 2) });
}

export async function requestAccountDeletion(reason: string, ctx: { lang: Lang }): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return fail('UNAUTHENTICATED', message('UNAUTHENTICATED', lang));
  const supabase = await createClient();
  const { error } = await supabase.rpc('request_account_deletion', {
    p_reason: reason.slice(0, 500),
  });
  if (error) return dbFailure(error, lang);
  revalidatePath('/account/privacy');
  revalidatePath('/dashboard/admin/privacy');
  return ok(undefined);
}

/** Complete (anonymize, then remove the account and the stored PDFs) or reject a deletion request. */
export async function handleDataRequest(
  input: { id: string; decision: 'done' | 'rejected'; note?: string },
  ctx: { lang: Lang },
): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!(await getAccess())) return fail('UNAUTHENTICATED', message('UNAUTHENTICATED', lang));
  if (!UUID.test(input?.id ?? '')) return fail('NOT_FOUND', message('NOT_FOUND', lang));

  const admin = createAdminClient();
  // Before the database forgets who the certificates belong to, remember which stored PDFs must go.
  let paths: string[] = [];
  let userId: string | null = null;
  if (input.decision === 'done') {
    const { data: req } = await admin
      .from('data_requests')
      .select('user_id, email')
      .eq('id', input.id)
      .maybeSingle();
    userId = req?.user_id ?? null;
    if (req) {
      const { data: certs } = await admin
        .from('certificates')
        .select('pdf_path')
        .or(
          `user_id.eq.${req.user_id ?? '00000000-0000-0000-0000-000000000000'},recipient_email.ilike.${req.email}`,
        )
        .not('pdf_path', 'is', null);
      paths = (certs ?? []).map((c) => c.pdf_path!).filter(Boolean);
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('handle_data_request', {
    p_id: input.id,
    p_decision: input.decision,
    p_note: input.note?.slice(0, 500),
  });
  if (error) return dbFailure(error, lang);

  if (input.decision === 'done') {
    try {
      if (paths.length) await admin.storage.from('certificates').remove(paths);
      if (userId) await admin.auth.admin.deleteUser(userId);
    } catch (e) {
      console.error('[privacy] cleanup after a completed request failed', (e as Error).message);
    }
  }
  revalidatePath('/dashboard/admin/privacy');
  return ok(undefined);
}
