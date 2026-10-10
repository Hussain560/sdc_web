import { notFound, permanentRedirect } from 'next/navigation';
import { EventPageView } from '@/modules/events/components/page/EventPageView';
import { getEventPage } from '@/modules/events/page-data';
import { slugForLegacyId } from '@/modules/events/public';

export const revalidate = 60;

/** Reads the clock outside the component, so rendering stays pure. */
const clock = () => Date.now();

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  // Old numeric URLs (/events/2) answer 301 to the readable slug, keeping bookmarks and shared links alive.
  if (/^\d+$/.test(slug)) {
    const target = await slugForLegacyId(Number(slug));
    if (target) permanentRedirect(`${locale === 'en' ? '/en' : ''}/events/${target}`);
    notFound();
  }

  const data = await getEventPage(slug);
  if (!data) notFound();
  return <EventPageView data={data} lang={locale === 'en' ? 'en' : 'ar'} now={clock()} />;
}
