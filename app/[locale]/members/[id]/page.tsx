import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { listPublicArticles } from '@/modules/articles/public';
import { ProfileView } from '@/modules/members/components/public/ProfileView';
import { getDirectoryMember, getProfileExtras, getSkillCatalog } from '@/modules/members/public';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const member = await getDirectoryMember(id);
  if (!member) return {};
  const en = locale === 'en';
  const name = en ? member.nameEn : member.nameAr;
  const headline = en ? (member.headlineEn ?? member.headlineAr) : member.headlineAr;
  return {
    title: name,
    description: headline ?? undefined,
    openGraph: {
      title: name,
      description: headline ?? undefined,
      images: member.photo ? [member.photo] : undefined,
    },
  };
}

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

  const [extras, allSkills] = await Promise.all([getProfileExtras(member), getSkillCatalog()]);
  const ids = new Set(extras.articleIds);
  const articles = ids.size ? (await listPublicArticles()).filter((a) => ids.has(a.id)) : [];

  return (
    <ProfileView
      member={member}
      extras={extras}
      articles={articles}
      allSkills={allSkills}
      lang={locale === 'en' ? 'en' : 'ar'}
    />
  );
}
