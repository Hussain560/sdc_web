import { redirect } from '@/i18n/navigation';

/** The overview was merged into "My profile": the account area opens on the profile. */
export default async function AccountIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: '/account/profile', locale });
}
