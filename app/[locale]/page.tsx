import { getPublicSettings } from '@/lib/site-settings';
import { todayInRiyadh } from '@/lib/time';
import { listPublicArticles } from '@/modules/articles/public';
import { listPublicPartners } from '@/modules/admin/public';
import { listPublicEvents } from '@/modules/events/public';
import { getPublicStats, listHomeMembers } from '@/modules/home/data';
import { HomeView } from '@/modules/home/HomeView';
import { homeSections, intakeState } from '@/modules/home/sections';
import { getJoinCycle } from '@/modules/membership/queries';

// The events and articles blocks read the same public data as /events and /articles (revalidated every minute).
export const revalidate = 60;

/** Reads the clock outside the component, so rendering stays pure. */
const clock = () => {
  const now = Date.now();
  return { now, today: todayInRiyadh(now) };
};

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const [events, articles, partners, cycle, settings, stats, members] = await Promise.all([
    listPublicEvents(),
    listPublicArticles(4),
    listPublicPartners(),
    getJoinCycle().catch(() => null),
    getPublicSettings(),
    getPublicStats(),
    listHomeMembers(4),
  ]);
  const { now, today } = clock();
  const sections = homeSections({
    events,
    articles,
    partnerCount: partners.filter((p) => p.logoUrl).length,
    memberCount: members.length,
    stats,
    today,
  });
  return (
    <HomeView
      lang={lang}
      sections={sections}
      intake={intakeState(cycle)}
      partners={partners}
      members={members}
      settings={settings}
      now={now}
    />
  );
}
