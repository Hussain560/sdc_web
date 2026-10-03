'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { fail, ok, type ErrorCode, type Result } from '@/lib/result';
import { createClient } from '@/lib/supabase/server';
import { isLang, type Lang } from '@/modules/auth/messages';
import { getAccess } from '@/modules/access/queries';
import { notifyApplicationDecision } from '@/modules/notifications/membership';
import { ensureApplicantAccounts } from './accounts';
import { membershipCode, membershipMessage } from './messages';

/** Review Server Actions (MBR-004): claim / release and bulk decisions with per-application results. */
const langOf = (v: unknown): Lang => (isLang(v) ? v : 'ar');
const UUID = /^[0-9a-f-]{36}$/i;

function dbFailure(error: { message?: string; code?: string }, lang: Lang): Result<never> {
  const code = membershipCode(error);
  if (code === 'INTERNAL')
    console.error('[membership] unexpected database error', error.code, error.message);
  return fail(code, membershipMessage(code, lang));
}
const failCode = (code: ErrorCode, lang: Lang) => fail(code, membershipMessage(code, lang));

export type ApplicationOutcome = { id: string; ok: boolean; status?: string; code?: ErrorCode };

export async function claimApplication(
  input: { id: string; release?: boolean },
  ctx: { lang: Lang },
): Promise<Result> {
  const lang = langOf(ctx?.lang);
  if (!UUID.test(input?.id ?? '')) return failCode('NOT_FOUND', lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);
  const supabase = await createClient();
  const { error } = await supabase.rpc('claim_membership_application', {
    p_id: input.id,
    p_release: input.release ?? false,
  });
  if (error) return dbFailure(error, lang);
  revalidatePath('/', 'layout');
  return ok(undefined);
}

export async function decideApplications(
  input: { ids: string[]; decision: 'accept' | 'reject' | 'waitlist'; note?: string },
  ctx: { lang: Lang },
): Promise<Result<ApplicationOutcome[]>> {
  const lang = langOf(ctx?.lang);
  const ids = Array.isArray(input?.ids) ? input.ids.filter((x) => UUID.test(x)) : [];
  if (
    ids.length === 0 ||
    ids.length > 200 ||
    !['accept', 'reject', 'waitlist'].includes(input?.decision)
  )
    return failCode('VALIDATION_FAILED', lang);
  if (!(await getAccess())) return failCode('UNAUTHENTICATED', lang);

  // Applicants have no account until they are accepted: acceptance creates it first (the member row needs it).
  const accounts =
    input.decision === 'accept'
      ? await ensureApplicantAccounts(ids)
      : { activation: new Map<string, string>(), failed: new Set<string>() };
  const decidable = ids.filter((x) => !accounts.failed.has(x));
  const failedOutcomes: ApplicationOutcome[] = [...accounts.failed].map((id) => ({
    id,
    ok: false,
    code: 'INTERNAL' as ErrorCode,
  }));

  const supabase = await createClient();
  const { data, error } = decidable.length
    ? await supabase.rpc('decide_membership_applications', {
        p_ids: decidable,
        p_decision: input.decision,
        p_note: input.note?.trim() || undefined,
      })
    : { data: [], error: null };
  if (error) return dbFailure(error, lang);

  const results = [...(data as ApplicationOutcome[]), ...failedOutcomes];
  // E-mails go out after the response; a mail problem never undoes a decision (the log + retry cover it).
  after(async () => {
    for (const r of results.filter((x) => x.ok)) {
      try {
        await notifyApplicationDecision(r.id, accounts.activation.get(r.id));
      } catch (e) {
        console.error('[membership] decision notification failed', (e as Error).message);
      }
    }
  });
  revalidatePath('/', 'layout');
  return ok(results);
}
