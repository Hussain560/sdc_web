import { createClient } from '@/lib/supabase/server';
import type { PageRequest } from '@/lib/pagination';

export type EmailState =
  'sent' | 'sending' | 'skipped' | 'retrying' | 'abandoned' | 'recovered' | 'superseded';

export type EmailLogRow = {
  id: string;
  createdAt: string;
  templateKey: string;
  locale: string;
  recipientEmail: string;
  entityType: string | null;
  attempt: number;
  state: EmailState;
  errorCode: string | null;
  errorMessage: string | null;
};

export type EmailFilters = {
  /** failed = retrying + abandoned, the rows an admin can act on. */
  group?: 'failed' | 'sent' | 'recovered';
  template?: string;
  q?: string;
};

const GROUP_STATES: Record<NonNullable<EmailFilters['group']>, EmailState[]> = {
  failed: ['retrying', 'abandoned'],
  sent: ['sent'],
  recovered: ['recovered'],
};

/** Daily sending limit shown by the quota meter (the provider's free tier, notifications §6). */
export const EMAIL_DAILY_LIMIT = Number(process.env.EMAIL_DAILY_LIMIT ?? 300);

export async function listEmailLogs(
  filters: EmailFilters,
  page: Pick<PageRequest, 'from' | 'to'>,
): Promise<{ rows: EmailLogRow[]; total: number }> {
  const supabase = await createClient();
  let query = supabase
    .from('admin_email_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .order('id');
  if (filters.group) query = query.in('state', GROUP_STATES[filters.group]);
  if (filters.template) query = query.eq('template_key', filters.template);
  const term = filters.q?.trim().replace(/[%,()]/g, ' ');
  if (term) query = query.ilike('recipient_email', `%${term}%`);
  const { data, count } = await query.range(page.from, page.to);

  const rows = (data ?? []).map((r): EmailLogRow => ({
    id: r.id!,
    createdAt: r.created_at!,
    templateKey: r.template_key!,
    locale: r.locale!,
    recipientEmail: r.recipient_email!,
    entityType: r.entity_type,
    attempt: r.attempt ?? 1,
    state: (r.state ?? 'sent') as EmailState,
    errorCode: r.error_code,
    errorMessage: r.error_message,
  }));
  return { rows, total: count ?? rows.length };
}

export async function getEmailCounts(): Promise<{
  all: number;
  failed: number;
  sent: number;
  recovered: number;
  sentToday: number;
}> {
  const supabase = await createClient();
  const count = async (states?: EmailState[], since?: string) => {
    let q = supabase.from('admin_email_logs').select('id', { count: 'exact', head: true });
    if (states) q = q.in('state', states);
    if (since) q = q.gte('created_at', since);
    const { count: n } = await q;
    return n ?? 0;
  };
  // "Today" in Saudi time (UTC+3).
  const now = new Date(Date.now() + 3 * 3_600_000);
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 3 * 3_600_000,
  ).toISOString();
  const [all, failed, sent, recovered, sentToday] = await Promise.all([
    count(),
    count(GROUP_STATES.failed),
    count(GROUP_STATES.sent),
    count(GROUP_STATES.recovered),
    count(['sent'], todayStart),
  ]);
  return { all, failed, sent, recovered, sentToday };
}

export async function listTemplateKeys(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('admin_email_logs').select('template_key').limit(1000);
  return [...new Set((data ?? []).map((r) => r.template_key!))].sort();
}
