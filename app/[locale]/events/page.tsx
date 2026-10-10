import { EventsListView } from '@/modules/events/components/public/EventsListView';
import { committeeOptions, filterEvents, listEventsForList } from '@/modules/events/list';

type SP = {
  tab?: string;
  q?: string;
  type?: string;
  mode?: string;
  committee?: string;
  page?: string;
};

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
    tab: sp.tab === 'past' ? ('past' as const) : ('upcoming' as const),
    q: (sp.q ?? '').slice(0, 80),
    type: (sp.type ?? '').slice(0, 20),
    mode: (sp.mode ?? '').slice(0, 20),
    committee: (sp.committee ?? '').slice(0, 80),
    page: Math.min(Math.max(Number(sp.page) || 1, 1), 40),
  };
  const all = await listEventsForList();
  const { total, items } = filterEvents(all, query);
  return (
    <EventsListView
      lang={lang}
      items={items}
      total={total}
      committees={committeeOptions(all, lang)}
      query={query}
      now={clock()}
    />
  );
}
