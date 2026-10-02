import { notFound, permanentRedirect } from 'next/navigation';
import EventDetailView from '@/modules/events/components/public/EventDetailView';
import { getPublicEvent, slugForLegacyId } from '@/modules/events/public';

export const revalidate = 60;

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

  const event = await getPublicEvent(slug);
  if (!event) notFound();
  return <EventDetailView event={event} />;
}
