import { createPublicClient } from '@/lib/supabase/public';
import { coverSrc } from './public';
import type { PublicEventCard } from './public-types';
import type { EventPhase } from './types';

export type EventListItem = PublicEventCard & {
  type: string;
  mode: 'in_person' | 'online' | 'hybrid';
  committeeSlug: string | null;
  committeeNameAr: string | null;
  committeeNameEn: string | null;
  summaryAr: string | null;
  summaryEn: string | null;
};

export const EVENT_TYPES = [
  'workshop',
  'bootcamp',
  'hackathon',
  'meeting',
  'meetup',
  'talk',
] as const;
export const EVENT_MODES = ['in_person', 'online', 'hybrid'] as const;
export const EVENTS_PAGE_SIZE = 12;

export async function listEventsForList(): Promise<EventListItem[]> {
  const { data, error } = await createPublicClient().from('public_events').select('*');
  if (error || !data) return [];
  return data.flatMap((r) =>
    r.id && r.slug && r.title_ar
      ? [
          {
            id: r.id,
            slug: r.slug,
            titleAr: r.title_ar,
            titleEn: r.title_en,
            locationAr: r.location_ar,
            locationEn: r.location_en,
            startDate: r.start_date,
            endDate: r.end_date,
            startTime: r.start_time,
            endTime: r.end_time,
            phase: (r.phase ?? 'announced') as EventPhase,
            cover: coverSrc(r.cover_image_path),
            seatsLeft: r.seats_left,
            type: r.type ?? 'workshop',
            mode: (r.location_mode ?? 'in_person') as EventListItem['mode'],
            committeeSlug: r.committee_slug,
            committeeNameAr: r.committee_name_ar,
            committeeNameEn: r.committee_name_en,
            summaryAr: r.summary_ar,
            summaryEn: r.summary_en,
          },
        ]
      : [],
  );
}

export type EventsQuery = {
  tab: 'upcoming' | 'past';
  q: string;
  type: string;
  mode: string;
  committee: string;
  page: number;
};

const UPCOMING = new Set<string>([
  'announced',
  'registration_open',
  'registration_closed',
  'in_progress',
]);
const norm = (s: string) => s.normalize('NFKD').toLowerCase().trim();

/** Upcoming: soonest first, events open for registration ahead of the rest of the same week. Past: newest first. */
export function filterEvents(all: EventListItem[], query: EventsQuery) {
  const q = norm(query.q);
  const rows = all.filter((e) => {
    const upcoming = UPCOMING.has(e.phase);
    if (query.tab === 'upcoming' ? !upcoming : upcoming) return false;
    if (query.type && e.type !== query.type) return false;
    if (query.mode && e.mode !== query.mode) return false;
    if (query.committee && e.committeeSlug !== query.committee) return false;
    if (q) {
      const hay = norm(`${e.titleAr} ${e.titleEn ?? ''} ${e.summaryAr ?? ''} ${e.summaryEn ?? ''}`);
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  if (query.tab === 'upcoming') {
    const week = (d: string | null) =>
      // Monday-based weeks (the epoch day was a Thursday, hence the + 3).
      d ? Math.floor((Date.parse(`${d}T00:00:00Z`) / 86_400_000 + 3) / 7) : Infinity;
    rows.sort((a, b) => {
      const w = week(a.startDate) - week(b.startDate);
      if (w !== 0) return w;
      const open =
        Number(b.phase === 'registration_open') - Number(a.phase === 'registration_open');
      if (open !== 0) return open;
      return (a.startDate ?? '9999').localeCompare(b.startDate ?? '9999');
    });
  } else {
    rows.sort((a, b) =>
      (b.endDate ?? b.startDate ?? '').localeCompare(a.endDate ?? a.startDate ?? ''),
    );
  }
  const size = EVENTS_PAGE_SIZE * Math.max(1, query.page);
  return { total: rows.length, items: rows.slice(0, size) };
}

export function committeeOptions(all: EventListItem[], lang: 'ar' | 'en') {
  const map = new Map<string, string>();
  for (const e of all)
    if (e.committeeSlug)
      map.set(
        e.committeeSlug,
        (lang === 'en' ? e.committeeNameEn : null) ?? e.committeeNameAr ?? e.committeeSlug,
      );
  return [...map.entries()]
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name, lang));
}
