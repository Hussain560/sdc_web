'use server';

import { revalidatePath } from 'next/cache';
import { can } from '@/lib/auth/permissions';
import { fail, ok, type Result } from '@/lib/result';
import { getAccess } from '@/modules/access/queries';
import { accessMessage } from '@/modules/access/messages';
import { isLang, type Lang } from '@/modules/auth/messages';
import { createAdminClient } from '@/lib/supabase/admin';
import { retryEmailLog } from './retry';

const langOf = (v: unknown): Lang => (isLang(v) ? v : 'ar');

/** Manual retry of one failed e-mail (notifications §10). Needs email_logs.view; the job uses the same code path. */
export async function retryEmail(
  logId: string,
  ctx: { lang: Lang },
): Promise<Result<{ outcome: 'sent' | 'failed' }>> {
  const lang = langOf(ctx?.lang);
  const access = await getAccess();
  if (!access) return fail('UNAUTHENTICATED', accessMessage('UNAUTHENTICATED', lang));
  if (!can(access, 'email_logs.view')) return fail('FORBIDDEN', accessMessage('FORBIDDEN', lang));
  if (!/^[0-9a-f-]{36}$/i.test(logId)) return fail('NOT_FOUND', accessMessage('NOT_FOUND', lang));

  const outcome = await retryEmailLog(logId);
  if (outcome === 'nothing' || outcome === 'unsupported') {
    return fail(
      'NOTHING_TO_RETRY',
      outcome === 'unsupported'
        ? lang === 'ar'
          ? 'هذا النوع من الرسائل لا يُعاد إرساله — أنشئ رسالة جديدة من مصدرها (مثل دعوة المطالبة).'
          : 'This kind of e-mail cannot be re-sent — create a new one from its source (for example a claim invite).'
        : lang === 'ar'
          ? 'لا شيء لإعادة إرساله: تم التسليم أو تغيّرت الحالة.'
          : 'Nothing to retry: it was delivered or its state changed.',
    );
  }
  revalidatePath('/dashboard/admin/emails');
  return outcome === 'sent'
    ? ok({ outcome: 'sent' })
    : fail(
        'INTERNAL',
        lang === 'ar'
          ? 'تعذّر الإرسال مرة أخرى. راجع سبب الفشل في السجل.'
          : 'Sending failed again. See the reason in the log.',
      );
}

/** "Retry all failed": the newest 50 retryable failures, one by one, through the same path as the job. */
export async function retryAllFailedEmails(ctx: {
  lang: Lang;
}): Promise<Result<{ sent: number; failed: number }>> {
  const lang = langOf(ctx?.lang);
  const access = await getAccess();
  if (!access) return fail('UNAUTHENTICATED', accessMessage('UNAUTHENTICATED', lang));
  if (!can(access, 'email_logs.view')) return fail('FORBIDDEN', accessMessage('FORBIDDEN', lang));

  const db = createAdminClient();
  const { data } = await db
    .from('admin_email_logs')
    .select('id')
    .in('state', ['retrying', 'abandoned'])
    .order('created_at', { ascending: false })
    .limit(50);
  let sent = 0;
  let failed = 0;
  for (const row of data ?? []) {
    const outcome = await retryEmailLog(row.id!);
    if (outcome === 'sent') sent += 1;
    else if (outcome === 'failed') failed += 1;
  }
  revalidatePath('/dashboard/admin/emails');
  return ok({ sent, failed });
}
