import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Lang } from '@/modules/auth/messages';
import { notify, type NotifyOutcome } from './notify';

/** A message from leadership to one member (free text or a template body), in the member's language. */
export async function sendMemberMessage(
  memberId: string,
  subject: string,
  text: string,
): Promise<NotifyOutcome | 'none'> {
  const { data } = await createAdminClient()
    .from('members')
    .select('id, user_id, first_name_ar, first_name_en, profiles:user_id(email, preferred_locale)')
    .eq('id', memberId)
    .maybeSingle();
  const m = data as unknown as {
    id: string;
    user_id: string | null;
    first_name_ar: string;
    first_name_en: string | null;
    profiles: { email: string; preferred_locale: string } | null;
  } | null;
  if (!m?.profiles) return 'none';
  const lang: Lang = m.profiles.preferred_locale === 'en' ? 'en' : 'ar';
  return notify({
    templateKey: 'member.message',
    entityType: 'member',
    entityId: m.id,
    state: `msg:${Date.now()}`,
    recipient: { userId: m.user_id, email: m.profiles.email, locale: lang },
    data: {
      name: lang === 'en' ? (m.first_name_en ?? m.first_name_ar) : m.first_name_ar,
      eventTitle: '',
      subject,
      text,
    },
  });
}
