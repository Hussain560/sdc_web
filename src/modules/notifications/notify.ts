import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendMail } from '@/lib/email/transport';
import { renderTemplate, type TemplateData, type TemplateKey } from '@/lib/email/templates';
import type { Lang } from '@/modules/auth/messages';

export type NotifyInput = {
  templateKey: TemplateKey;
  entityType: string;
  entityId: string;
  /** The state the mail announces (e.g. a decision timestamp). Same state ⇒ same key ⇒ never sent twice (NO-3). */
  state: string;
  recipient: { userId: string | null; email: string; locale: Lang };
  data: TemplateData;
};

export type NotifyOutcome = 'sent' | 'failed' | 'duplicate' | 'skipped';

const clip = (s: string, n = 300) => (s.length > n ? s.slice(0, n) : s);

/**
 * Claim-before-send: a unique partial index on the idempotency key admits one "sending"/"sent" row, so concurrent
 * or repeated calls cannot send the same notification twice. A failure is recorded and releases the claim, so a
 * later attempt (retry) can run. Never throws.
 */
export async function notify(input: NotifyInput): Promise<NotifyOutcome> {
  if (!input.recipient.email) return 'skipped';
  const db = createAdminClient();
  const key = `${input.templateKey}:${input.entityId}:${input.state}`;

  const { count } = await db
    .from('email_logs')
    .select('id', { count: 'exact', head: true })
    .eq('idempotency_key', key)
    .eq('status', 'failed');

  const claim = await db
    .from('email_logs')
    .insert({
      template_key: input.templateKey,
      locale: input.recipient.locale,
      recipient_user_id: input.recipient.userId,
      recipient_email: input.recipient.email,
      entity_type: input.entityType,
      entity_id: input.entityId,
      idempotency_key: key,
      attempt: (count ?? 0) + 1,
      status: 'sending',
    })
    .select('id')
    .single();
  if (claim.error || !claim.data) return claim.error?.code === '23505' ? 'duplicate' : 'failed';

  try {
    const mail = renderTemplate(input.templateKey, input.recipient.locale, input.data);
    const res = await sendMail({ to: input.recipient.email, ...mail });
    await db
      .from('email_logs')
      .update({ status: 'sent', provider: res.provider, provider_message_id: res.messageId })
      .eq('id', claim.data.id);
    return 'sent';
  } catch (e) {
    await db
      .from('email_logs')
      .update({
        status: 'failed',
        error_code: 'PROVIDER_ERROR',
        error_message: clip(String((e as Error).message)),
      })
      .eq('id', claim.data.id);
    return 'failed';
  }
}
