import { errorMessage, isLang } from '@/modules/auth/messages';
import ForgotPasswordForm from './ForgotPasswordForm';

export default async function ForgotPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  const lang = isLang(locale) ? locale : 'ar';

  return (
    <ForgotPasswordForm
      initialError={error === 'LINK_EXPIRED' ? errorMessage('LINK_EXPIRED', lang) : undefined}
    />
  );
}
