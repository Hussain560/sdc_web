import { notFound } from 'next/navigation';
import { redirect } from '@/i18n/navigation';
import { getUser } from '@/lib/auth/session';
import CheckInCard from '@/modules/attendance/components/public/CheckInCard';
import { getCheckInContext } from '@/modules/attendance/queries';

export const dynamic = 'force-dynamic';

/** PUB-003: /events/[slug]/check-in?s=<session>&t=<token>. Signed-out visitors sign in first; the code is kept. */
export default async function CheckInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ s?: string; t?: string }>;
}) {
  const { locale, slug } = await params;
  const { s, t } = await searchParams;

  if (!(await getUser())) {
    const query = new URLSearchParams({ ...(s ? { s } : {}), ...(t ? { t } : {}) }).toString();
    const back = `/events/${slug}/check-in${query ? `?${query}` : ''}`;
    redirect({ href: `/login?redirect=${encodeURIComponent(back)}`, locale });
  }

  const ctx = await getCheckInContext(slug, s);
  if (!ctx) notFound();
  return <CheckInCard ctx={ctx} token={t ?? null} />;
}
