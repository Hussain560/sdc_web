import { notFound } from 'next/navigation';
import { Alert } from '@/components/ui';
import { getUser } from '@/lib/auth/session';
import { redirect } from '@/i18n/navigation';
import { JoinFrame } from '@/modules/membership/components/JoinFrame';
import { ClaimConfirm } from '@/modules/members/components/ClaimConfirm';
import { previewClaim } from '@/modules/members/actions';
import { Link } from '@/i18n/navigation';

/**
 * Claim flow for legacy members (ME-6): the e-mailed one-time link. Signed-out visitors sign in (or register)
 * with the invited e-mail first; the database re-checks token, expiry and e-mail before linking anything.
 */
export default async function ClaimPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  if (!/^[0-9a-f]{64}$/.test(token)) notFound();

  const user = await getUser();
  if (!user)
    redirect({ href: { pathname: '/login', query: { redirect: `/claim/${token}` } }, locale });

  const preview = await previewClaim(token, { lang });
  return (
    <JoinFrame ar={ar}>
      {preview.ok ? (
        <ClaimConfirm token={token} nameAr={preview.data.nameAr} nameEn={preview.data.nameEn} />
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          <Alert tone="danger">{preview.message}</Alert>
          <Link href="/account" className="text-accent underline">
            {ar ? 'العودة إلى حسابي' : 'Back to my account'}
          </Link>
        </div>
      )}
    </JoinFrame>
  );
}
