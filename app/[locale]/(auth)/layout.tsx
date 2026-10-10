import { AuthShell } from '@/modules/auth/components/AuthShell';
import { CHROME } from '@/components/layout/chrome-strings';

// Login, forgot-password, reset-password and claim: no public header or footer (ADR-014, 05-auth.md).
export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const s = CHROME[locale === 'en' ? 'en' : 'ar'];
  return <AuthShell labels={{ logoHome: s.logoHome, logoAlt: s.logoAlt }}>{children}</AuthShell>;
}
