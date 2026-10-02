import { getUser } from '@/lib/auth/session';
import { redirect } from '@/i18n/navigation';
import { sanitizeRedirect } from '@/modules/auth/redirect';
import RegisterForm from './RegisterForm';

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { locale } = await params;
  const { redirect: redirectParam } = await searchParams;
  const redirectTo = sanitizeRedirect(redirectParam);

  if (await getUser()) redirect({ href: redirectTo === '/' ? '/account' : redirectTo, locale });

  return <RegisterForm redirectTo={redirectTo} />;
}
