import 'server-only';
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
