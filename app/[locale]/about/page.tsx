import { AboutView } from '@/modules/about/AboutView';
import { getPublicStats } from '@/modules/home/data';
import { listLeadership } from '@/modules/members/public';

export const revalidate = 60;

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [stats, leadership] = await Promise.all([getPublicStats(), listLeadership()]);
  return <AboutView lang={locale === 'en' ? 'en' : 'ar'} stats={stats} leadership={leadership} />;
}
