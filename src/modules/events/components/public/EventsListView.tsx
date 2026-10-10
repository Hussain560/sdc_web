import { Search, X } from 'lucide-react';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button, LinkButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link } from '@/i18n/navigation';
import { EVENT_COPY } from '../../page-copy';
import { EVENT_MODES, EVENT_TYPES, type EventListItem, type EventsQuery } from '../../list';
import { EventCard } from '../EventCard';

type Lang = 'ar' | 'en';

const COPY = {
  ar: {
    lede: 'ورش ولقاءات وهاكاثونات مفتوحة، حضورياً وعن بُعد.',
    upcoming: 'القادمة',
    past: 'السابقة',
    search: 'ابحث عن فعالية',
    type: 'النوع',
    mode: 'الحضور',
    committee: 'اللجنة',
    all: 'الكل',
    apply: 'تطبيق',
    clear: 'مسح الكل',
    count: (n: number) => `${n} فعالية`,
    more: 'عرض المزيد',
    modes: { in_person: 'حضوري', online: 'عن بُعد', hybrid: 'مدمج' } as Record<string, string>,
    emptyUpcoming: 'لا توجد فعاليات قادمة الآن',
    emptyUpcomingBody: 'تابعنا لتعرف بموعد الفعالية القادمة.',
    browsePast: 'تصفّح الفعاليات السابقة',
    noResults: 'لا فعاليات تطابق بحثك',
    noResultsBody: 'جرّب كلمات أقل أو امسح الفلاتر.',
    clearFilters: 'مسح الفلاتر',
    emptyPast: 'لا توجد فعاليات سابقة بعد',
    removeFilter: (v: string) => `إزالة الفلتر: ${v}`,
    tabs: 'عرض الفعاليات',
  },
  en: {
    lede: 'Open workshops, meetups and hackathons, in person and online.',
    upcoming: 'Upcoming',
    past: 'Past',
    search: 'Search events',
    type: 'Type',
    mode: 'Attendance',
    committee: 'Committee',
    all: 'All',
    apply: 'Apply',
    clear: 'Clear all',
    count: (n: number) => `${n} events`,
    more: 'Load more',
    modes: { in_person: 'In person', online: 'Online', hybrid: 'Hybrid' } as Record<string, string>,
    emptyUpcoming: 'No upcoming events right now',
    emptyUpcomingBody: 'Follow us to hear when the next event is announced.',
    browsePast: 'Browse past events',
    noResults: 'No events match your search',
    noResultsBody: 'Try fewer words or clear the filters.',
    clearFilters: 'Clear filters',
    emptyPast: 'No past events yet',
    removeFilter: (v: string) => `Remove filter: ${v}`,
    tabs: 'Events view',
  },
} as const;

function hrefWith(base: EventsQuery, change: Partial<EventsQuery>) {
  const n = { ...base, ...change };
  const sp = new URLSearchParams();
  if (n.tab === 'past') sp.set('tab', 'past');
  if (n.q) sp.set('q', n.q);
  if (n.type) sp.set('type', n.type);
  if (n.mode) sp.set('mode', n.mode);
  if (n.committee) sp.set('committee', n.committee);
  if (n.page > 1) sp.set('page', String(n.page));
  const qs = sp.toString();
  return qs ? `/events?${qs}` : '/events';
}

const field =
  'min-h-12 w-full appearance-none rounded-shape-md border border-line-strong bg-field px-4 text-base text-text focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring';

/** Events list (PUBLIC-SCREENS-V2/03-events-list.md): segments, a filter bar rendered on the server, cards, paging. */
export function EventsListView({
  lang,
  items,
  total,
  committees,
  query,
  now,
}: {
  lang: Lang;
  items: EventListItem[];
  total: number;
  committees: Array<{ slug: string; name: string }>;
  query: EventsQuery;
  now: number;
}) {
  const t = COPY[lang];
  const p = EVENT_COPY[lang];
  const wrap = 'mx-auto w-full max-w-(--container) px-4 md:px-8';
  const filtered = !!(query.q || query.type || query.mode || query.committee);
  const chips = [
    query.q && ['q', query.q],
    query.type && ['type', p.types[query.type] ?? query.type],
    query.mode && ['mode', t.modes[query.mode] ?? query.mode],
    query.committee && ['committee', committees.find((c) => c.slug === query.committee)?.name ?? query.committee],
  ].filter((c): c is [string, string] => !!c);

  return (
    <>
      <SiteHeader />
      <main id="main">
        <div className={`${wrap} pt-6`}>
          <Breadcrumb
            label={p.breadcrumb}
            items={[{ label: p.home, href: '/' }, { label: p.events }]}
          />
        </div>
        <header className={`${wrap} mt-6 flex flex-col gap-3 md:items-center md:text-center`}>
          <h1 className="t-h1">{p.events}</h1>
          <p className="t-lede max-w-[60ch] text-muted">{t.lede}</p>
          <nav aria-label={t.tabs} className="mt-3">
            <ul className="inline-flex w-full gap-1 rounded-full bg-surface-raised p-1 sm:w-auto">
              {(['upcoming', 'past'] as const).map((tab) => (
                <li key={tab} className="flex-1">
                  <Link
                    href={hrefWith(query, { tab, page: 1 })}
                    aria-current={query.tab === tab ? 'page' : undefined}
                    className={`inline-flex min-h-9 w-full items-center justify-center rounded-full px-6 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
                      query.tab === tab ? 'bg-accent text-on-accent' : 'text-muted hover:text-text'
                    }`}
                  >
                    {t[tab]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <section className={`${wrap} mt-10`} aria-label={p.events}>
          <form
            method="get"
            action={lang === 'en' ? '/en/events' : '/events'}
            role="search"
            className="grid gap-3 md:grid-cols-[1fr_170px_170px_190px_auto]"
          >
            {query.tab === 'past' && <input type="hidden" name="tab" value="past" />}
            <label className="relative block">
              <span className="sr-only">{t.search}</span>
              <Search aria-hidden="true" className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
              <input type="search" name="q" defaultValue={query.q} placeholder={t.search} className={`${field} ps-12`} />
            </label>
            <label>
              <span className="sr-only">{t.type}</span>
              <select name="type" defaultValue={query.type} className={field}>
                <option value="">{`${t.type}: ${t.all}`}</option>
                {EVENT_TYPES.map((x) => (
                  <option key={x} value={x}>
                    {p.types[x]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">{t.mode}</span>
              <select name="mode" defaultValue={query.mode} className={field}>
                <option value="">{`${t.mode}: ${t.all}`}</option>
                {EVENT_MODES.map((x) => (
                  <option key={x} value={x}>
                    {t.modes[x]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">{t.committee}</span>
              <select name="committee" defaultValue={query.committee} className={field}>
                <option value="">{`${t.committee}: ${t.all}`}</option>
                {committees.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" size="lg">
              {t.apply}
            </Button>
          </form>

          {filtered && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {chips.map(([key, label]) => (
                <Link
                  key={key}
                  href={hrefWith(query, { [key]: '', page: 1 } as Partial<EventsQuery>)}
                  aria-label={t.removeFilter(label)}
                  className="t-body-sm inline-flex min-h-9 items-center gap-2 rounded-full bg-accent-soft px-4 font-semibold text-on-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  {label}
                  <X aria-hidden="true" className="size-4" />
                </Link>
              ))}
              <Link
                href={hrefWith(query, { q: '', type: '', mode: '', committee: '', page: 1 })}
                className="t-body-sm min-h-11 content-center text-accent-text underline underline-offset-[3px]"
              >
                {t.clear}
              </Link>
            </div>
          )}

          <p role="status" aria-live="polite" className="t-body-sm mt-4 tabular-nums text-muted">
            {t.count(total)}
          </p>

          {items.length > 0 ? (
            <ul className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((e) => (
                <li key={e.id}>
                  <EventCard event={e} lang={lang} now={now} />
                </li>
              ))}
            </ul>
          ) : filtered ? (
            <EmptyState
              variant="no-results"
              title={t.noResults}
              description={t.noResultsBody}
              action={
                <LinkButton href={hrefWith(query, { q: '', type: '', mode: '', committee: '', page: 1 })} variant="secondary">
                  {t.clearFilters}
                </LinkButton>
              }
            />
          ) : query.tab === 'upcoming' ? (
            <EmptyState
              variant="no-data"
              title={t.emptyUpcoming}
              description={t.emptyUpcomingBody}
              action={
                <LinkButton href="/events?tab=past" variant="secondary">
                  {t.browsePast}
                </LinkButton>
              }
            />
          ) : (
            <EmptyState variant="no-data" title={t.emptyPast} />
          )}

          {total > items.length && (
            <div className="mt-8 flex justify-center">
              <LinkButton href={hrefWith(query, { page: query.page + 1 })} variant="secondary" size="lg">
                {t.more}
              </LinkButton>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
