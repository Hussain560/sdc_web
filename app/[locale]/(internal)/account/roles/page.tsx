import { redirect } from '@/i18n/navigation';

// Positions are part of "My membership" now; old links keep working.
export default async function AccountRolesRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: '/account/membership', locale });
}
