import { getPublicSettings } from '@/lib/site-settings';
import { todayInRiyadh } from '@/lib/time';
import { listPublicArticles } from '@/modules/articles/public';
import { listPublicPartners } from '@/modules/admin/public';
import { listPublicEvents } from '@/modules/events/public';
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
  const [events, articles, partners, cycle, settings] = await Promise.all([
    listPublicEvents(),
    listPublicArticles(4),
    listPublicPartners(),
    getJoinCycle().catch(() => null),
    getPublicSettings(),
  ]);
  const { now, today } = clock();
  const sections = homeSections({
    events,
    articles,
    partnerCount: partners.length,
    stats: null, // RDS-017: the public_stats view arrives once the owner approves the figures (Q-H2)
    today,
  });
  return (
    <HomeView
      lang={lang}
      sections={sections}
      intake={intakeState(cycle)}
      partners={partners}
      settings={settings}
      now={now}
    />
  );
}
