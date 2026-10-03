import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Lang } from '@/modules/auth/messages';
import { notify, type NotifyOutcome } from './notify';

const siteUrl = () => (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/** committee.assigned — one mail per assignment, telling the person what their new position opens. */
export async function notifyCommitteeAssigned(
  assignmentId: string,
): Promise<NotifyOutcome | 'none'> {
  const db = createAdminClient();
  const { data: a } = await db
    .from('role_assignments')
    .select(
      'id, user_id, created_at, display_title_ar, display_title_en, roles(name_ar, name_en), committees(name_ar, name_en)',
    )
    .eq('id', assignmentId)
    .maybeSingle();
  if (!a) return 'none';
  const { data: profile } = await db
    .from('profiles')
    .select('email, full_name_ar, full_name_en, preferred_locale')
    .eq('id', a.user_id)
    .maybeSingle();
  if (!profile) return 'none';

  const lang: Lang = profile.preferred_locale === 'en' ? 'en' : 'ar';
  const en = lang === 'en';
  const role =
    (en ? a.display_title_en || a.roles?.name_en : a.display_title_ar || a.roles?.name_ar) ||
    a.roles?.name_ar ||
    '';
  const committee = en
    ? (a.committees?.name_en ?? a.committees?.name_ar)
    : (a.committees?.name_ar ?? a.committees?.name_en);
  return notify({
    templateKey: 'committee.assigned',
    entityType: 'role_assignment',
    entityId: a.id,
    state: String(new Date(a.created_at).getTime()),
    recipient: { userId: a.user_id, email: profile.email, locale: lang },
    data: {
      name: (en ? profile.full_name_en : null) || profile.full_name_ar,
      eventTitle: committee ? `${role} · ${committee}` : role,
      dashboardUrl: `${siteUrl()}${en ? '/en' : ''}/dashboard`,
    },
  });
}
