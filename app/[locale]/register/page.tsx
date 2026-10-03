import { redirect } from '@/i18n/navigation';

// Sign-up is gone (owner decision): non-members never create accounts. Applying to join is the way in.
export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: '/join', locale });
}
