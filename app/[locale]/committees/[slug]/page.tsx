import { notFound } from 'next/navigation';
import CommitteeView from '@/modules/committees/components/public/CommitteeView';
import { getPublicCommittee } from '@/modules/committees/queries';

// Public data, cookie-less read: refreshed every minute (and on every committee change via revalidatePath).
export const revalidate = 60;

export default async function CommitteePublicPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const committee = await getPublicCommittee(slug);
  if (!committee) notFound();
  return <CommitteeView committee={committee} />;
}
