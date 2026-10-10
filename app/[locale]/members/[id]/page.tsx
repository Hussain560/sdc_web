import { notFound, permanentRedirect } from 'next/navigation';
import { createPublicClient } from '@/lib/supabase/public';
import { listPublicArticles } from '@/modules/articles/public';
import { ProfileView } from '@/modules/members/components/public/ProfileView';
import { getDirectoryMember } from '@/modules/members/public';

export const revalidate = 60;

/** A listed member's profile. Unlisted, inactive and unknown ids are the same 404 as any unknown URL. */
export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const member = await getDirectoryMember(id);
  if (!member) notFound();
  // Old numeric links redirect to the public id, only while the member is listed.
  if (/^\d+$/.test(id)) permanentRedirect(`${locale === 'en' ? '/en' : ''}/members/${member.id}`);

  const { data: rows } = await createPublicClient()
    .from('member_public_articles')
    .select('article_id')
    .eq('member_id', member.id);
  const ids = new Set((rows ?? []).map((r) => r.article_id));
  const articles = ids.size ? (await listPublicArticles()).filter((a) => ids.has(a.id)) : [];

  return <ProfileView member={member} articles={articles} lang={locale === 'en' ? 'en' : 'ar'} />;
}
