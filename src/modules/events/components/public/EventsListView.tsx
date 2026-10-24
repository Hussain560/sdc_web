import { PageMain } from '@/components/motion/PageMain';
import { CalendarDays, MapPin, Search, ShieldCheck, X } from 'lucide-react';
import { CapsuleCover } from '@/components/patterns/CapsuleMark';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button, LinkButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusPill } from '@/components/ui/StatusPill';
import { cn } from '@/components/ui/cn';
import { Link } from '@/i18n/navigation';
import { SignedOutOnly } from '@/modules/home/SignedOutOnly';
import { EVENT_COPY } from '../../page-copy';
import {
  EVENT_MODES,
  EVENT_TYPES,
  type EventListItem,
  type EventsQuery,
} from '../../list';
import { FALLBACK_COVER, eventLocation, eventTitle } from '../../public-types';
import { PILL_LABEL, cardPill } from '../../status-labels';
import { EventCard, eventWhen } from '../EventCard';
import { FilterSelect, FilterSheet } from '@/components/patterns/FilterControls';

type Lang = 'ar' | 'en';

const COPY = {
  ar: {
    lede: 'ورش ولقاءات وهاكاثونات مفتوحة، حضورياً وعن بُعد.',
    upcoming: 'القادمة',
    past: 'السابقة',
    period: 'الفترة',
    featured: 'الفعالية الأقرب',
    register: 'سجّل الآن',
    details: 'التفاصيل',
    search: 'ابحث عن فعالية',
    searchPlaceholder: 'ابحث عن فعالية…',
    type: 'النوع',
    mode: 'الحضور',
    committee: 'اللجنة',
    allTypes: 'كل الأنواع',
    allModes: 'حضوري وعن بُعد',
    allCommittees: 'كل اللجان',
    apply: 'تطبيق',
    filters: 'الفلاتر',
    filtersTitle: 'فلترة الفعاليات',
    close: 'إغلاق',
    clear: 'مسح الكل',
    count: (n: number) => (n === 1 ? 'فعالية واحدة' : n === 2 ? 'فعاليتان' : `${n} ${n <= 10 ? 'فعاليات' : 'فعالية'}`),
    more: 'عرض المزيد',
    modes: { in_person: 'حضوري', online: 'عن بُعد', hybrid: 'مدمج' } as Record<string, string>,
    emptyUpcoming: 'لا توجد فعاليات قادمة الآن',
    emptyUpcomingBody: 'تابعنا لتعرف بموعد الفعالية القادمة.',
    browsePast: 'تصفّح الفعاليات السابقة',
    noResults: 'لا فعاليات تطابق بحثك',
    noResultsBody: 'جرّب كلمة أخرى أو امسح الفلاتر.',
    clearFilters: 'مسح الفلاتر',
    emptyPast: 'لا توجد فعاليات سابقة بعد',
    removeFilter: (v: string) => `إزالة الفلتر: ${v}`,
    verifyTitle: 'حضرت فعالية؟',
    verifyBody: 'تحقّق من شهادة الحضور برقمها.',
    verify: 'تحقّق من شهادة',
    joinTitle: 'انضم إلى المجتمع',
    joinBody: 'الأعضاء يصلون إلى فعاليات خاصة بهم، ويشاركون في اللجان.',
    join: 'قدّم طلب العضوية',
  },
  en: {
    lede: 'Open workshops, meetups and hackathons, in person and online.',
    upcoming: 'Upcoming',
    past: 'Past',
    period: 'Period',
    featured: 'Nearest event',
    register: 'Register now',
    details: 'Details',
    search: 'Search events',
    searchPlaceholder: 'Search events…',
    type: 'Type',
    mode: 'Attendance',
    committee: 'Committee',
    allTypes: 'All types',
    allModes: 'In person and online',
    allCommittees: 'All committees',
    apply: 'Apply',
    filters: 'Filters',
    filtersTitle: 'Filter events',
    close: 'Close',
    clear: 'Clear all',
    count: (n: number) => (n === 1 ? '1 event' : `${n} events`),
    more: 'Load more',
    modes: { in_person: 'In person', online: 'Online', hybrid: 'Hybrid' } as Record<string, string>,
    emptyUpcoming: 'No upcoming events right now',
    emptyUpcomingBody: 'Follow us to hear when the next event is announced.',
    browsePast: 'Browse past events',
    noResults: 'No events match your search',
    noResultsBody: 'Try another word or clear the filters.',
    clearFilters: 'Clear filters',
    emptyPast: 'No past events yet',
    removeFilter: (v: string) => `Remove filter: ${v}`,
    verifyTitle: 'Attended an event?',
    verifyBody: 'Check an attendance certificate by its number.',
    verify: 'Verify a certificate',
    joinTitle: 'Join the community',
    joinBody: 'Members get access to their own events and take part in committees.',
    join: 'Apply for membership',
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

/**
 * Events list (PUBLIC-SCREENS-V2/03-events-list.md): a centred header with the Upcoming / Past switch and its counts,
 * the nearest event as a spotlight, one filter card (a bottom sheet on phones), removable filter chips, a live count,
 * the card grid with "load more", and two closing cards. Everything is a link or a GET form, so the URL is the state.
 */
export function EventsListView({
  lang,
  items,
  total,
  counts,
  featured,
  committees,
  query,
  now,
}: {
  lang: Lang;
  items: EventListItem[];
  total: number;
  counts: { upcoming: number; past: number };
  featured: EventListItem | null;
  committees: Array<{ slug: string; name: string }>;
  query: EventsQuery;
  now: number;
}) {
  const t = COPY[lang];
  const p = EVENT_COPY[lang];
  const wrap = 'mx-auto w-full max-w-(--container) px-4 md:px-8';
  const filtered = !!(query.q || query.type || query.mode || query.committee);
  const activeFilters = [query.type, query.mode, query.committee].filter(Boolean).length;
  const chips = [
    query.q && ['q', query.q],
    query.type && ['type', p.types[query.type] ?? query.type],
    query.mode && ['mode', t.modes[query.mode] ?? query.mode],
    query.committee &&
      ['committee', committees.find((c) => c.slug === query.committee)?.name ?? query.committee],
  ].filter((c): c is [string, string] => !!c);
  const clearAll = hrefWith(query, { q: '', type: '', mode: '', committee: '', page: 1 });
  const action = lang === 'en' ? '/en/events' : '/events';
  // The spotlight is for the plain first page of the upcoming list; the grid then shows the rest.
  const spot = query.tab === 'upcoming' && !filtered && query.page === 1 ? featured : null;
  const gridItems = spot ? items.filter((e) => e.id !== spot.id) : items;

  const selects = (id: string, auto: boolean) => (
    <>
      <label className="relative block">
        <span className="sr-only">{t.type}</span>
        <FilterSelect name="type" defaultValue={query.type} className={field} id={`${id}-type`} auto={auto}>
          <option value="">{t.allTypes}</option>
          {EVENT_TYPES.map((x) => (
            <option key={x} value={x}>
              {p.types[x]}
            </option>
          ))}
        </FilterSelect>
      </label>
      <label className="relative block">
        <span className="sr-only">{t.mode}</span>
        <FilterSelect name="mode" defaultValue={query.mode} className={field} id={`${id}-mode`} auto={auto}>
          <option value="">{t.allModes}</option>
          {EVENT_MODES.map((x) => (
            <option key={x} value={x}>
              {t.modes[x]}
            </option>
          ))}
        </FilterSelect>
      </label>
      <label className="relative block">
        <span className="sr-only">{t.committee}</span>
        <FilterSelect
          name="committee"
          defaultValue={query.committee}
          className={field}
          id={`${id}-committee`}
          auto={auto}
        >
          <option value="">{t.allCommittees}</option>
          {committees.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </FilterSelect>
      </label>
    </>
  );

  const search = (
    <label className="relative block min-w-0 flex-1">
      <span className="sr-only">{t.search}</span>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted"
      />
      <input
        type="search"
        name="q"
        defaultValue={query.q}
        placeholder={t.searchPlaceholder}
        className={`${field} ps-12`}
      />
    </label>
  );

  return (
    <>
      <SiteHeader />
      <PageMain>
        <div className={`${wrap} pt-6`}>
          <Breadcrumb
            label={p.breadcrumb}
            items={[{ label: p.home, href: '/' }, { label: p.events }]}
          />
        </div>

        <header className={`${wrap} m-enter relative mt-10 flex flex-col items-start gap-4 text-start md:items-center md:text-center`}>
          <div
            aria-hidden="true"
            className="motif-dots pointer-events-none absolute inset-x-0 -top-6 h-52 text-muted [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
          />
          <h1 className="t-display relative">{p.events}</h1>
          <p className="t-lede relative max-w-[52ch] text-muted">{t.lede}</p>
          <nav aria-label={t.period} className="relative mt-2 w-full sm:w-auto">
            <ul className="inline-flex w-full gap-1 rounded-full bg-surface-raised p-1 sm:w-auto">
              {(['upcoming', 'past'] as const).map((tab) => (
                <li key={tab} className="flex-1">
                  <Link
                    href={hrefWith(query, { tab, page: 1 })}
                    aria-current={query.tab === tab ? 'page' : undefined}
                    className={cn(
                      'inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full px-6 font-semibold transition-colors duration-(--duration-fast) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
                      query.tab === tab ? 'bg-accent text-on-accent' : 'text-muted hover:text-text',
                    )}
                  >
                    {t[tab]}
                    <span className="tabular-nums">{`(${counts[tab]})`}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        {spot && <FeaturedEvent event={spot} lang={lang} now={now} t={t} wrap={wrap} />}

        <section className={`${wrap} mt-12 flex flex-col gap-5`} aria-label={p.events}>
          {/* Two forms, never one: a hidden copy of a field would still be sent with the other. */}
          <form
            method="get"
            action={action}
            role="search"
            className="hidden gap-3 rounded-shape-xl border border-line bg-surface p-3 md:grid md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]"
          >
            {query.tab === 'past' && <input type="hidden" name="tab" value="past" />}
            {search}
            {selects('d', true)}
            <Button type="submit" size="lg">
              {t.apply}
            </Button>
          </form>
          {/* Phone: search plus a button that opens the filters sheet; sticky under the header. */}
          <form
            method="get"
            action={action}
            role="search"
            className="sticky top-[72px] z-10 -mx-4 flex gap-2 bg-canvas px-4 py-2 md:hidden"
          >
            {query.tab === 'past' && <input type="hidden" name="tab" value="past" />}
            {search}
            <FilterSheet
              label={t.filters}
              count={activeFilters}
              title={t.filtersTitle}
              apply={t.apply}
              closeLabel={t.close}
            >
              {selects('m', false)}
            </FilterSheet>
          </form>

          <div className="flex min-h-10 flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {chips.map(([key, label]) => (
                <Link
                  key={key}
                  href={hrefWith(query, { [key]: '', page: 1 } as Partial<EventsQuery>)}
                  aria-label={t.removeFilter(label)}
                  className="t-body-sm inline-flex min-h-11 items-center gap-2 rounded-full bg-accent-soft px-4 font-semibold text-on-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  {label}
                  <X aria-hidden="true" className="size-4" />
                </Link>
              ))}
              {filtered && (
                <LinkButton href={clearAll} variant="ghost" size="sm">
                  {t.clear}
                </LinkButton>
              )}
            </div>
            <p role="status" aria-live="polite" className="t-body-sm tabular-nums text-muted">
              {t.count(total)}
            </p>
          </div>

          {gridItems.length > 0 ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gridItems.map((e, i) => (
                <li key={e.id}>
                  <EventCard
                    event={e}
                    lang={lang}
                    now={now}
                    index={i}
                    typeLabel={p.types[e.type] ?? e.type}
                  />
                </li>
              ))}
            </ul>
          ) : spot ? null : filtered ? (
            <EmptyState
              variant="no-results"
              title={t.noResults}
              description={t.noResultsBody}
              action={
                <LinkButton href={clearAll} variant="secondary">
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
            <div className="mt-4 flex justify-center">
              <LinkButton
                href={hrefWith(query, { page: query.page + 1 })}
                variant="secondary"
                size="lg"
                className="max-sm:w-full"
              >
                {t.more}
              </LinkButton>
            </div>
          )}
        </section>

        <section
          aria-label={t.joinTitle}
          className={`${wrap} mt-(--section-gap) grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))]`}
        >
          <div className="flex flex-col items-start gap-3 rounded-shape-xl bg-band p-8 md:p-10">
            <span
              aria-hidden="true"
              className="flex size-14 items-center justify-center rounded-shape-lg bg-accent-soft text-on-accent-soft"
            >
              <ShieldCheck className="size-7" strokeWidth={1.75} />
            </span>
            <h2 className="t-h3">{t.verifyTitle}</h2>
            <p className="t-body text-muted">{t.verifyBody}</p>
            <LinkButton href="/certificates" variant="secondary">
              {t.verify}
            </LinkButton>
          </div>
          <SignedOutOnly>
            <div className="flex flex-col items-start gap-3 rounded-shape-xl bg-brand p-8 text-on-brand md:p-10">
              <h2 className="t-h3">{t.joinTitle}</h2>
              <p className="t-body opacity-90">{t.joinBody}</p>
              <Link
                href="/join"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-surface px-5 font-semibold whitespace-nowrap text-text hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                {t.join}
              </Link>
            </div>
          </SignedOutOnly>
        </section>
      </PageMain>
      <SiteFooter />
    </>
  );
}

/** The nearest event as a wide card: the picture (or the capsule mark), its status, when and where, and the way in. */
function FeaturedEvent({
  event,
  lang,
  now,
  t,
  wrap,
}: {
  event: EventListItem;
  lang: Lang;
  now: number;
  t: (typeof COPY)[Lang];
  wrap: string;
}) {
  const p = EVENT_COPY[lang];
  const pill = cardPill(event, now);
  const open = event.phase === 'registration_open';
  const showSeats = open && event.seatsLeft !== null && event.seatsLeft > 0;
  return (
    <section aria-labelledby="ev-feat" className={`${wrap} mt-12`}>
      <h2 id="ev-feat" className="sr-only">
        {t.featured}
      </h2>
      <article className="relative grid overflow-hidden rounded-shape-2xl border border-line bg-band md:grid-cols-2">
        <div className="relative min-h-56 bg-accent-soft md:min-h-80">
          {event.cover !== FALLBACK_COVER ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.cover}
              alt=""
              loading="eager"
              decoding="async"
              className="absolute inset-0 size-full object-cover object-top"
            />
          ) : (
            <CapsuleCover size="lg" className="absolute inset-0" />
          )}
        </div>
        <div className="flex flex-col justify-center gap-4 p-6 md:p-12">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={pill} label={PILL_LABEL[pill][lang]} />
            <Badge>{p.types[event.type] ?? event.type}</Badge>
            {event.access === 'members_only' && (
              <StatusPill status="members-only" label={PILL_LABEL['members-only'][lang]} />
            )}
            <span className="t-caption text-muted">{t.featured}</span>
          </div>
          <h3 className="text-[length:clamp(1.5rem,1.2rem+1.2vw,2.25rem)] leading-[1.35] font-bold">
            {eventTitle(event, lang)}
          </h3>
          {(lang === 'en' ? event.summaryEn : null) ?? event.summaryAr ? (
            <p className="t-body text-muted">
              {(lang === 'en' ? event.summaryEn : null) ?? event.summaryAr}
            </p>
          ) : null}
          <p className="flex flex-wrap gap-x-5 gap-y-1 text-[0.9375rem] text-muted">
            <span className="flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-accent-text" />
              {eventWhen(event, lang)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin aria-hidden="true" className="size-4 shrink-0 text-accent-text" />
              {eventLocation(event, lang)}
            </span>
          </p>
          {showSeats && (
            <p
              className={cn(
                't-body-sm font-semibold',
                pill === 'closes-soon' ? 'text-warning' : 'text-muted',
              )}
            >
              {p.seatsLeft(event.seatsLeft!)}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {open ? (
              <>
                <LinkButton href={`/events/${event.slug}`} size="lg" className="max-sm:w-full">
                  {t.register}
                </LinkButton>
                <LinkButton
                  href={`/events/${event.slug}`}
                  variant="ghost"
                  size="lg"
                  className="max-sm:w-full"
                >
                  {t.details}
                </LinkButton>
              </>
            ) : (
              <LinkButton href={`/events/${event.slug}`} size="lg" className="max-sm:w-full">
                {t.details}
              </LinkButton>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}
