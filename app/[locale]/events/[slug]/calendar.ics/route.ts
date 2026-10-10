import { NextResponse } from 'next/server';
import { buildIcs } from '@/modules/events/ics';
import { getEventPage } from '@/modules/events/page-data';

export const revalidate = 300;

/** GET /events/[slug]/calendar.ics: public data only (title, dates, place, the page URL), 404 for unknown events. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ locale: string; slug: string }> },
) {
  const { locale, slug } = await params;
  const data = await getEventPage(slug);
  if (!data || data.days.length === 0 || data.event.phase === 'cancelled')
    return new NextResponse('Not found', { status: 404 });

  const en = locale === 'en';
  const e = data.event;
  const place =
    e.locationMode === 'online'
      ? en
        ? 'Online'
        : 'عبر الإنترنت'
      : ((en ? e.locationEn : null) ?? e.locationAr ?? (en ? 'Online' : 'عبر الإنترنت'));
  const origin = new URL(req.url).origin;
  const ics = buildIcs(
    {
      slug,
      title: (en ? e.titleEn : null) ?? e.titleAr,
      description: (en ? e.summaryEn : null) ?? e.summaryAr,
      url: `${origin}${en ? '/en' : ''}/events/${slug}`,
      days: data.days.map((d) => ({
        date: d.date,
        startsAt: d.startsAt,
        endsAt: d.endsAt,
        place: (en ? d.locationEn : null) ?? d.locationAr,
      })),
      startTime: e.startTime,
      endTime: e.endTime,
      place,
    },
    new Date(),
  );
  return new NextResponse(ics, {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `attachment; filename="${slug}.ics"`,
      'cache-control': 'public, max-age=300',
    },
  });
}
