import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Lang } from '@/modules/auth/messages';
import { notify } from './notify';

const siteUrl = () => (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/**
 * review.pending — tells the people who can publish this article (committee head / deputy of its committee and
 * global publishers) that it is waiting. One mail per person per submission (idempotent on the submission time);
 * the author is never notified of their own submission.
 */
export async function notifyArticleSubmitted(articleId: string): Promise<{ sent: number }> {
  const db = createAdminClient();
  const { data: a } = await db
    .from('articles')
    .select('id, title_ar, title_en, committee_id, submitted_at, submitted_by, status')
    .eq('id', articleId)
    .maybeSingle();
  if (!a || a.status !== 'in_review' || !a.submitted_at) return { sent: 0 };

  const now = new Date().toISOString();
  const { data: grants } = await db
    .from('role_assignments')
    .select(
      'user_id, committee_id, role_key, roles!inner(scope, role_permissions!inner(permission_key))',
    )
    .eq('roles.role_permissions.permission_key', 'articles.publish')
    .lte('starts_at', now)
    .or(`ends_at.is.null,ends_at.gt.${now}`);

  const recipients = new Set<string>();
  for (const g of grants ?? []) {
    const global = g.roles?.scope === 'global';
    if (
      (global || (a.committee_id && g.committee_id === a.committee_id)) &&
      g.user_id !== a.submitted_by
    )
      recipients.add(g.user_id);
  }

  let sent = 0;
  for (const userId of recipients) {
    const { data: profile } = await db
      .from('profiles')
      .select('email, full_name_ar, full_name_en, preferred_locale')
      .eq('id', userId)
      .maybeSingle();
    if (!profile) continue;
    const lang: Lang = profile.preferred_locale === 'en' ? 'en' : 'ar';
    const outcome = await notify({
      templateKey: 'review.pending',
      entityType: 'article',
      entityId: `${a.id}:${userId}`,
      state: String(new Date(a.submitted_at).getTime()),
      recipient: { userId, email: profile.email, locale: lang },
      data: {
        name: (lang === 'en' ? profile.full_name_en : null) || profile.full_name_ar,
        eventTitle: (lang === 'en' ? a.title_en : null) || a.title_ar,
        reviewUrl: `${siteUrl()}${lang === 'en' ? '/en' : ''}/dashboard/articles/${a.id}`,
      },
    });
    if (outcome === 'sent') sent += 1;
  }
  return { sent };
}
