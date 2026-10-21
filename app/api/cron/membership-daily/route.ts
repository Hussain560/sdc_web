import { NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/admin';
import { ensureApplicantAccounts } from '@/modules/membership/accounts';
import {
  flushOutbox,
  notifyActivationLapsed,
  notifyActivationReminder,
  notifyApplicationDecision,
  notifyMemberEvent,
  notifyTermReminder,
  sendLeadershipDigest,
} from '@/modules/notifications/lifecycle';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

type Job = {
  dry: boolean;
  today: string;
  activation_synced: number;
  expired: string[];
  ended: string[];
  reinstated: string[];
  term_reminders: Array<{ member: string; days: number; term_ends_at: string }>;
  activation_reminders: Array<{ application: string; day: number }>;
  lapsed: Array<{ application: string; cycle: string }>;
  promote: Array<{ application: string; cycle: string }>;
};

/**
 * The daily membership job (MEM-016, ACC-009, MBR-013): activation sync, expiry, approved leave dates, suspensions
 * that reach their end, term reminders (30 / 7 / 1), activation reminders (day 3 / 6), lapse, waiting-list promotion,
 * the leadership digest and the e-mail outbox. Idempotent: running it twice changes nothing the second time (the
 * database function records what it did, the mails carry an idempotency key). `?dry=1` writes nothing and sends
 * nothing. Protected by CRON_SECRET (Authorization: Bearer), the same pattern as the e-mail retry route.
 */
export async function GET(request: Request) {
  const secret = serverEnv().CRON_SECRET;
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!secret || token !== secret) return new NextResponse('Unauthorized', { status: 401 });
  const dry = new URL(request.url).searchParams.get('dry') === '1';

  const db = createAdminClient();
  const { data, error } = await db.rpc('run_membership_daily', { p_dry: dry });
  if (error || !data) {
    console.error('[cron] membership-daily failed', error?.message);
    return NextResponse.json({ error: 'JOB_FAILED' }, { status: 500 });
  }
  const job = data as unknown as Job;
  if (dry) return NextResponse.json(job);

  const result = {
    mails: 0,
    promoted: 0,
    failures: 0,
    digest: { recipients: 0, sent: 0 },
    outbox: { sent: 0, skipped: 0, failed: 0 },
  };
  const run = async (fn: () => Promise<string>) => {
    try {
      const out = await fn();
      if (out === 'sent') result.mails += 1;
    } catch (e) {
      result.failures += 1;
      console.error('[cron] mail failed', (e as Error).message);
    }
  };

  for (const id of job.expired) await run(() => notifyMemberEvent(id, 'expired'));
  for (const id of job.reinstated) await run(() => notifyMemberEvent(id, 'reinstated'));
  for (const r of job.term_reminders)
    await run(() => notifyTermReminder(r.member, r.days, r.term_ends_at));
  for (const r of job.activation_reminders)
    await run(() => notifyActivationReminder(r.application, r.day));
  for (const r of job.lapsed) await run(() => notifyActivationLapsed(r.application));

  // Waiting-list promotion: the account first (the member row needs it), then the acceptance, then the usual mail.
  const ids = job.promote.map((p) => p.application);
  if (ids.length > 0) {
    const accounts = await ensureApplicantAccounts(ids);
    const ready = ids.filter((id) => !accounts.failed.has(id));
    if (ready.length > 0) {
      const { data: accepted } = await db.rpc('system_accept_applications', {
        p_ids: ready,
        p_reason: 'activation_lapsed',
      });
      for (const row of (accepted ?? []) as Array<{ id: string; ok: boolean }>) {
        if (!row.ok) continue;
        result.promoted += 1;
        await run(() => notifyApplicationDecision(row.id, accounts.activation.get(row.id)));
      }
    }
  }

  result.digest = await sendLeadershipDigest().catch(() => ({ recipients: 0, sent: 0 }));
  result.outbox = await flushOutbox(200).catch(() => ({ sent: 0, skipped: 0, failed: 0 }));
  return NextResponse.json({ ...job, result });
}
