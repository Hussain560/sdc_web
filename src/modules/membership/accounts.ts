import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

export type AccountOutcome = {
  /** Kept for callers; the links are issued after the decision by prepareActivationLinks. */
  activation: Map<string, string>;
  /** applications whose account could not be prepared (they are left undecided) */
  failed: Set<string>;
};

/**
 * Accepting an application without an account (owner decision): the person has no account yet, so the acceptance
 * creates it — confirmed, no password — links it to the application, and prepares the one-time link they use to
 * choose a password. An e-mail that already has an account is simply linked. Never throws; a failure leaves that
 * application undecided so it can be retried.
 */
export async function ensureApplicantAccounts(ids: string[]): Promise<AccountOutcome> {
  const out: AccountOutcome = { activation: new Map(), failed: new Set() };
  const db = createAdminClient();
  const { data: apps } = await db
    .from('membership_applications')
    .select('id, email, locale, full_name_ar, user_id')
    .in('id', ids)
    .is('user_id', null)
    .in('status', ['submitted', 'under_review', 'waitlisted']);

  for (const a of apps ?? []) {
    try {
      const mail = a.email.toLowerCase();
      const { data: existing } = await db
        .from('profiles')
        .select('id')
        .ilike('email', mail)
        .maybeSingle();
      let userId = existing?.id ?? null;
      let created = false;

      if (!userId) {
        const res = await db.auth.admin.createUser({
          email: mail,
          email_confirm: true,
          user_metadata: { full_name: a.full_name_ar, locale: a.locale },
        });
        if (res.error || !res.data.user) throw new Error(res.error?.message ?? 'createUser failed');
        userId = res.data.user.id;
        created = true;
      }

      const link = await db
        .from('membership_applications')
        .update({ user_id: userId })
        .eq('id', a.id)
        .is('user_id', null);
      if (link.error) throw new Error(link.error.message);

      // The activation link is issued after the decision (prepareActivationLinks), so a re-accepted person gets one too.
      void created;
    } catch (e) {
      console.error('[membership] account for application failed', a.id, (e as Error).message);
      out.failed.add(a.id);
    }
  }
  return out;
}
