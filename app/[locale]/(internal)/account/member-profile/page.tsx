import { redirect } from '@/i18n/navigation';

// The member profile editor moved into "My profile". Old links (e-mails, bookmarks) keep working.
export default async function MemberProfileRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: '/account/profile', locale });
}
