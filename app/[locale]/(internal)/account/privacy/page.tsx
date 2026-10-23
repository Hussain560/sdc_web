import { redirect } from '@/i18n/navigation';

// "My data" is part of "My membership" now; old links keep working.
export default async function AccountPrivacyRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: '/account/membership#my-data', locale });
}
