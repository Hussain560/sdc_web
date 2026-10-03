import { notFound } from 'next/navigation';
import { getUser } from '@/lib/auth/session';
import CheckInCard from '@/modules/attendance/components/public/CheckInCard';
import { getCheckInContext, getPublicCheckInContext } from '@/modules/attendance/queries';

export const dynamic = 'force-dynamic';

/**
 * PUB-003: /events/[slug]/check-in?s=<session>&t=<token>. Opens for everyone (no sign-in): a registered person types
 * the e-mail they registered with. Someone already signed in with an accepted registration is checked in at once.
 */
export default async function CheckInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ s?: string; t?: string }>;
}) {
  const { slug } = await params;
  const { s, t } = await searchParams;

  const ctx = await getPublicCheckInContext(s);
  if (!ctx || ctx.event.slug !== slug) notFound();

  // A signed-in participant skips the e-mail form.
  let member: { accepted: boolean; checkedInAt: string | null } | null = null;
  if (await getUser()) {
    const mine = await getCheckInContext(slug, s);
    member = mine ? { accepted: mine.accepted, checkedInAt: mine.checkedInAt } : null;
  }
  return <CheckInCard ctx={ctx} token={t ?? null} member={member} />;
}
