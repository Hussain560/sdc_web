import { redirect } from '@/i18n/navigation';

// The set-up moved to its own full-screen page; old links and bookmarks keep working.
export default async function WelcomeRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: '/welcome', locale });
}
