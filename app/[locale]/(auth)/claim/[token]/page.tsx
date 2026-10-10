import { notFound } from 'next/navigation';
import { Alert, LinkButton } from '@/components/ui';
import { getUser } from '@/lib/auth/session';
import { redirect } from '@/i18n/navigation';
import { AuthHeading } from '@/modules/auth/components/AuthShell';
import { ClaimConfirm } from '@/modules/members/components/ClaimConfirm';
import { previewClaim } from '@/modules/members/actions';

/**
 * Claim flow for legacy members (ME-6): the e-mailed one-time link. Signed-out visitors sign in with the invited
 * e-mail first; the database re-checks token, expiry and e-mail before linking anything.
 */
export default async function ClaimPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  const ar = locale !== 'en';
  if (!/^[0-9a-f]{64}$/.test(token)) notFound();

  const user = await getUser();
  if (!user)
    redirect({ href: { pathname: '/login', query: { redirect: `/claim/${token}` } }, locale });

  const preview = await previewClaim(token, { lang: ar ? 'ar' : 'en' });
  return preview.ok ? (
    <ClaimConfirm token={token} nameAr={preview.data.nameAr} nameEn={preview.data.nameEn} />
  ) : (
    <>
      <AuthHeading title={ar ? 'تعذّر ربط الملف' : "We couldn't link this profile"} />
      <Alert tone="warning">{preview.message}</Alert>
      <LinkButton href="/account" variant="secondary" size="lg" fullWidth>
        {ar ? 'العودة إلى حسابي' : 'Back to my account'}
      </LinkButton>
    </>
  );
}
