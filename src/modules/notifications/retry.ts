import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { deliverCertificate } from '@/modules/attendance/certificates';
import { notifyArticleSubmitted } from './articles';
import { notifyCommitteeAssigned } from './access';
import { notifyApplicationDecision, notifyApplicationReceived } from './membership';
import {
  notifyEventRegistrants,
  notifyRegistration,
  retryPendingRegistrationMail,
} from './registrations';

export type RetryOutcome = 'sent' | 'failed' | 'nothing' | 'unsupported';

/**
 * Re-runs the notification a failed log row belongs to. Every family re-derives its recipient and data from the
 * current database state and goes through notify(), so the idempotency key still guarantees one delivery. Mails
 * whose data cannot be rebuilt (the claim invite carries a one-time secret) are never retried: send a new one.
 */
export async function retryEmailLog(logId: string): Promise<RetryOutcome> {
  const db = createAdminClient();
  const { data: log } = await db
    .from('email_logs')
    .select('id, template_key, entity_type, entity_id, idempotency_key, status, attempt')
    .eq('id', logId)
    .maybeSingle();
  if (!log || log.status !== 'failed') return 'nothing';

  // Already delivered by a later attempt: nothing left to do.
  const { count } = await db
    .from('email_logs')
    .select('id', { count: 'exact', head: true })
    .eq('idempotency_key', log.idempotency_key)
    .in('status', ['sent', 'sending']);
  if ((count ?? 0) > 0) return 'nothing';

  const id = log.entity_id ?? '';
  let outcome: string;
  switch (log.entity_type) {
    case 'registration':
      outcome = await notifyRegistration(id);
      break;
    case 'event': {
      const eventId = id.split(':')[0] ?? '';
      const res = await notifyEventRegistrants(
        eventId,
        log.template_key === 'event.cancelled' ? 'cancelled' : 'changed',
      );
      outcome = res.sent > 0 ? 'sent' : 'failed';
      break;
    }
    case 'membership_application':
      outcome =
        log.template_key === 'membership.application_received'
          ? await notifyApplicationReceived(id)
          : await notifyApplicationDecision(id);
      break;
    case 'article': {
      const res = await notifyArticleSubmitted(id.split(':')[0] ?? '');
      outcome = res.sent > 0 ? 'sent' : 'failed';
      break;
    }
    case 'role_assignment':
      outcome = await notifyCommitteeAssigned(id);
      break;
    case 'certificate': {
      const res = await deliverCertificate(id);
      outcome = res === 'sent' ? 'sent' : res === 'failed' ? 'failed' : 'nothing';
      break;
    }
    default:
      return 'unsupported';
  }
  return outcome === 'sent' ? 'sent' : outcome === 'failed' ? 'failed' : 'nothing';
}

/** The scheduled job: due failed mails (backoff and attempt limit live in due_email_retries()) + stuck registration mails. */
export async function retryDueEmails(limit = 50): Promise<{
  tried: number;
  sent: number;
  failed: number;
  unsupported: number;
  registrations: { tried: number; sent: number };
}> {
  const db = createAdminClient();
  const { data } = await db.rpc('due_email_retries', { p_limit: limit });
  let sent = 0;
  let failed = 0;
  let unsupported = 0;
  for (const row of data ?? []) {
    const outcome = await retryEmailLog(row.id);
    if (outcome === 'sent') sent += 1;
    else if (outcome === 'failed') failed += 1;
    else if (outcome === 'unsupported') unsupported += 1;
  }
  return {
    tried: data?.length ?? 0,
    sent,
    failed,
    unsupported,
    registrations: await retryPendingRegistrationMail(limit),
  };
}
