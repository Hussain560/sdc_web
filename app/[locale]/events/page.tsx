import { EventsListView } from '@/modules/events/components/public/EventsListView';
import {
  committeeOptions,
  filterEvents,
  listEventsForList,
  pickFeatured,
  tabCounts,
} from '@/modules/events/list';

type SP = Record<
  'tab' | 'q' | 'type' | 'mode' | 'committee' | 'page',
  string | string[] | undefined
>;

/** A repeated parameter (?q=a&q=b) counts as its first value, so a hand-edited URL never breaks the page. */
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

/** Reads the clock outside the component, so rendering stays pure. */
const clock = () => Date.now();

/** /events: segments and filters live in the URL and render on the server (back button and reload keep them). */
export default async function AllEventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SP>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const sp = await searchParams;
  const query = {
    tab: one(sp.tab) === 'past' ? ('past' as const) : ('upcoming' as const),
    q: one(sp.q).slice(0, 80),
    type: one(sp.type).slice(0, 20),
    mode: one(sp.mode).slice(0, 20),
    committee: one(sp.committee).slice(0, 80),
    page: Math.min(Math.max(Number(one(sp.page)) || 1, 1), 40),
  };
  const all = await listEventsForList();
  const { total, items } = filterEvents(all, query);
  const upcoming = filterEvents(all, {
    tab: 'upcoming',
    q: '',
    type: '',
    mode: '',
    committee: '',
    page: 40,
  }).items;
  return (
    <EventsListView
      lang={lang}
      items={items}
      total={total}
      counts={tabCounts(all)}
      featured={pickFeatured(upcoming)}
      committees={committeeOptions(all, lang)}
      query={query}
      now={clock()}
    />
  );
}
