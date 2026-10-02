import 'server-only';
import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Lang } from '@/modules/auth/messages';
import { notify, type NotifyOutcome } from './notify';

const siteUrl = () => (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/** membership.application_received — sent once per submission (idempotent on the submission time). */
export async function notifyApplicationReceived(
  applicationId: string,
): Promise<NotifyOutcome | 'none'> {
  const db = createAdminClient();
  const { data: a } = await db
    .from('membership_applications')
    .select(
      'id, user_id, full_name_ar, submitted_at, cycle_id, membership_cycles(name_ar, name_en)',
    )
    .eq('id', applicationId)
    .maybeSingle();
  if (!a) return 'none';
  const { data: profile } = await db
    .from('profiles')
    .select('email, preferred_locale')
    .eq('id', a.user_id)
    .maybeSingle();
  if (!profile) return 'none';
  const lang: Lang = profile.preferred_locale === 'en' ? 'en' : 'ar';
  const cycleName =
    (lang === 'en' ? a.membership_cycles?.name_en : null) || a.membership_cycles?.name_ar || '';
  return notify({
    templateKey: 'membership.application_received',
    entityType: 'membership_application',
    entityId: a.id,
    state: String(new Date(a.submitted_at).getTime()),
    recipient: { userId: a.user_id, email: profile.email, locale: lang },
    data: {
      name: a.full_name_ar,
      eventTitle: cycleName,
      membershipUrl: `${siteUrl()}${lang === 'en' ? '/en' : ''}/account/membership`,
    },
  });
}

/** membership.application_accepted / rejected / waitlisted — one mail per decision (idempotent on the decision time). */
export async function notifyApplicationDecision(
  applicationId: string,
): Promise<NotifyOutcome | 'none'> {
  const db = createAdminClient();
  const { data: a } = await db
    .from('membership_applications')
    .select('id, user_id, status, full_name_ar, decided_at, membership_cycles(name_ar, name_en)')
    .eq('id', applicationId)
    .maybeSingle();
  if (!a || !a.decided_at) return 'none';
  const template =
    a.status === 'accepted'
      ? 'membership.application_accepted'
      : a.status === 'rejected'
        ? 'membership.application_rejected'
        : a.status === 'waitlisted'
          ? 'membership.application_waitlisted'
          : null;
  if (!template) return 'none';
  const { data: profile } = await db
    .from('profiles')
    .select('email, preferred_locale')
    .eq('id', a.user_id)
    .maybeSingle();
  if (!profile) return 'none';
  const lang: Lang = profile.preferred_locale === 'en' ? 'en' : 'ar';
  const prefix = lang === 'en' ? '/en' : '';
  const cycleName =
    (lang === 'en' ? a.membership_cycles?.name_en : null) || a.membership_cycles?.name_ar || '';
  return notify({
    templateKey: template,
    entityType: 'membership_application',
    entityId: a.id,
    state: `${template}:${new Date(a.decided_at).getTime()}`,
    recipient: { userId: a.user_id, email: profile.email, locale: lang },
    // The internal decision note is never part of the data (MA-5).
    data: {
      name: a.full_name_ar,
      eventTitle: cycleName,
      membershipUrl: `${siteUrl()}${prefix}${template === 'membership.application_accepted' ? '/account/member-profile' : '/account/membership'}`,
      eventUrl: `${siteUrl()}${prefix}/events`,
    },
  });
}

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
