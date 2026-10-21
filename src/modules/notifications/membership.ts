import 'server-only';
import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Lang } from '@/modules/auth/messages';
import { notify, type NotifyOutcome } from './notify';

const siteUrl = () => (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/** The community WhatsApp group link set by the administrators (empty when none). */
async function communityWhatsapp(): Promise<string | null> {
  const { data } = await createAdminClient()
    .from('site_settings')
    .select('value')
    .eq('key', 'community_whatsapp_link')
    .maybeSingle();
  return typeof data?.value === 'string' && data.value ? data.value : null;
}

/** The application mails live in ./lifecycle (Sprint 18); re-exported so existing imports keep working. */
export { notifyApplicationDecision, notifyApplicationReceived } from './lifecycle';

/** member.claim_invite — the raw token only ever travels in this mail (the database stores its hash). */
export async function sendClaimInviteMail(input: {
  memberId: string;
  email: string;
  token: string;
  name: string;
}): Promise<NotifyOutcome> {
  return notify({
    templateKey: 'member.claim_invite',
    entityType: 'member',
    entityId: input.memberId,
    // A hash, never a piece of the secret itself: the log must not help anyone guess the token.
    state: createHash('sha256').update(input.token).digest('hex').slice(0, 16),
    // Invites go out in Arabic: the legacy record has no account (and so no preferred language) yet.
    recipient: { userId: null, email: input.email, locale: 'ar' },
    data: {
      name: input.name,
      eventTitle: '',
      claimUrl: `${siteUrl()}/claim/${input.token}`,
    },
  });
}

/** member.created — a leader added the member directly; a new account carries its one-time activation link. */
export async function sendMemberCreatedMail(input: {
  memberId: string;
  userId: string;
  email: string;
  name: string;
  lang: Lang;
  activationUrl?: string;
}): Promise<NotifyOutcome> {
  const prefix = input.lang === 'en' ? '/en' : '';
  return notify({
    templateKey: 'member.created',
    entityType: 'member',
    entityId: input.memberId,
    state: 'created',
    recipient: { userId: input.userId, email: input.email, locale: input.lang },
    data: {
      name: input.name,
      eventTitle: '',
      membershipUrl: `${siteUrl()}${prefix}/account/profile`,
      activationUrl: input.activationUrl,
      whatsappUrl: await communityWhatsapp(),
    },
  });
}
