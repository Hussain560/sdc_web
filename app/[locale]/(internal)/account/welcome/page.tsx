import { requireUser } from '@/lib/auth/session';
import { getAccountState } from '@/modules/account/state';
import { redirect } from '@/i18n/navigation';
import { WelcomeTour } from '@/modules/members/components/WelcomeTour';

// ACC-009: the first-sign-in tour. Five short steps, saved one by one, skippable, and it can be reopened from the account.
export default async function WelcomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  await requireUser('/account/welcome');
  const state = await getAccountState();
  if (!state?.member) redirect({ href: '/account/profile', locale });
  return <WelcomeTour start={Math.min(4, state?.member?.onboardingStep ?? 0)} lang={lang} />;
}
