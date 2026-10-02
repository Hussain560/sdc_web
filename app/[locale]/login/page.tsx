import { getUser } from '@/lib/auth/session';
import { redirect } from '@/i18n/navigation';
import { errorMessage, isLang } from '@/modules/auth/messages';
import { sanitizeRedirect } from '@/modules/auth/redirect';
import LoginForm from './LoginForm';

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { redirect: redirectParam, error } = await searchParams;
  const redirectTo = sanitizeRedirect(redirectParam);

  // A signed-in visitor has nothing to do here (server-side, so there is no flash).
  if (await getUser()) redirect({ href: redirectTo === '/' ? '/account' : redirectTo, locale });

  const lang = isLang(locale) ? locale : 'ar';
  return (
    <LoginForm
      redirectTo={redirectTo}
      initialError={error === 'LINK_EXPIRED' ? errorMessage('LINK_EXPIRED', lang) : undefined}
    />
  );
}
