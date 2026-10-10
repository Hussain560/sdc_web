import { Award, CalendarDays, Check, Clock, MapPin, Users } from 'lucide-react';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SectionHeader } from '@/components/patterns/SectionHeader';
import { Accordion } from '@/components/ui/Accordion';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { buttonClasses } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
import { DateChip } from '@/components/ui/DateChip';
import { Media } from '@/components/ui/Media';
import { TextLink } from '@/components/ui/TextLink';
import { formatDateRange, formatTime } from '@/lib/format';
import { EventCard } from '../EventCard';
import { eventTitle } from '../../public-types';
import { EVENT_COPY } from '../../page-copy';
import { PILL_LABEL } from '../../status-labels';
import { CLOSES_SOON_SEATS } from '../../view-state';
import type { EventPageData } from '../../page-data';
import {
  ConfirmationPanel,
  EventActionsProvider,
  EventNote,
  HeroCalendar,
  PrimaryAction,
  StatePill,
} from './EventActions';
import { SectionNav } from './SectionNav';
import { ShareButton } from './ShareButton';

type Lang = 'ar' | 'en';
const pick = (lang: Lang, ar: string | null | undefined, en: string | null | undefined) =>
  (lang === 'en' && en ? en : ar) ?? '';
const list = (lang: Lang, ar: string[], en: string[]) => (lang === 'en' && en.length ? en : ar);
const hhmm = (t: string | null) => t?.slice(0, 5) ?? null;

/** "None." filler that organisers type into optional lists; it says nothing, so the page leaves it out. */
const NOTHING = /^(لا يوجد|none)\s*\.?$/i;
const meaningful = (items: string[]) => items.filter((x) => x.trim() && !NOTHING.test(x.trim()));

/** A panel fact: icon + text (one line each). */
const Fact = ({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) => (
  <li className="flex items-start gap-3">
    <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent-text" />
    <div className="flex min-w-0 flex-col gap-0.5">{children}</div>
  </li>
);

/** A hero fact below `lg` (label over value, in the bordered 2-column grid). */
const HeroFact = ({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={cn('flex flex-col gap-0.5 p-3.5', className)}>
    <dt className="t-caption text-muted">{label}</dt>
    <dd className="text-[15px] font-semibold tabular-nums">{children}</dd>
  </div>
);

/** Section title: the two signal dots, then the title (24 px on phones, 28 px on desktop). */
const SectionTitle = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <h2
    id={id}
    className="t-h3 flex items-center gap-2.5 lg:gap-3 lg:text-[1.75rem] lg:leading-[1.3]"
  >
    <span aria-hidden="true" className="signal-dots" />
    {children}
  </h2>
);

const sectionClass = 'flex scroll-mt-32 flex-col gap-4 lg:gap-6';

/**
 * The v2 event page (PUBLIC-SCREENS-V2/02-event-page.md, "صفحة الفعالية — SDC" canvas). One home per fact per
 * breakpoint: the hero facts show below `lg`, the side panel at `lg` and up, and the action bar on phones.
 */
export function EventPageView({
  data,
  lang,
  now,
}: {
  data: EventPageData;
  lang: Lang;
  now: number;
}) {
  const { event: e, days, presenters, certificate, related, checkinOpen } = data;
  const t = EVENT_COPY[lang];
  const title = eventTitle(e, lang);
  const place =
    e.locationMode === 'online' ? t.online : pick(lang, e.locationAr, e.locationEn) || t.online;
  const dateLine = e.startDate ? formatDateRange(e.startDate, e.endDate, lang) : t.dateTbd;
  const time = formatTime(e.startTime, e.endTime, lang);
  const meta = [dateLine, place].filter(Boolean).join(' · ');
  const summary = pick(lang, e.summaryAr, e.summaryEn);
  const description = pick(lang, e.descriptionAr, e.descriptionEn);
  const goals = meaningful(list(lang, e.goalsAr, e.goalsEn));
  const audience = meaningful(list(lang, e.audience.ar, e.audience.en));
  const bring = meaningful(list(lang, e.whatToBringAr, e.whatToBringEn));
  const faq = e.show.faq ? e.faq.filter((f) => pick(lang, f.qAr, f.qEn).trim().length > 0) : [];
  const detailGroups = e.show.details
    ? (['responsibilities', 'requirements', 'deliverables', 'benefits'] as const).flatMap((k) => {
        const v = meaningful(list(lang, e[k].ar, e[k].en));
        return v.length ? [[k, v] as const] : [];
      })
    : [];
  const showPresenters = e.show.presenters && presenters.length > 0;
  const showGoals = e.show.goals && (goals.length > 0 || audience.length > 0);
  const showAgenda = days.length > 1;
  // The side panel carries the place of an in-person event on desktop; below `lg` the Place section does.
  const placeLgHidden = e.locationMode === 'in_person';

  const sections: Array<{ id: string; label: string; hideAt?: 'lg' }> = [];
  if (description) sections.push({ id: 'about', label: t.sections.about });
  if (showAgenda) sections.push({ id: 'agenda', label: t.sections.agenda });
  if (showPresenters) sections.push({ id: 'speakers', label: t.sections.speakers });
  if (showGoals) sections.push({ id: 'for-whom', label: t.sections.forWhom });
  sections.push({
    id: 'place',
    label: t.sections.place,
    hideAt: placeLgHidden ? 'lg' : undefined,
  });
  if (bring.length > 0) sections.push({ id: 'bring', label: t.sections.bring });
  if (faq.length > 0) sections.push({ id: 'faq', label: t.sections.faq });
  if (detailGroups.length > 0) sections.push({ id: 'details', label: t.sections.details });

  const committee = pick(lang, e.committeeNameAr, e.committeeNameEn);
  const certLine = !(certificate.enabled && e.certificateAvailable)
    ? null
    : e.endDate && e.endDate !== e.startDate
      ? t.cert(certificate.threshold)
      : t.certEveryone;
  const pillLabels = Object.fromEntries(Object.entries(PILL_LABEL).map(([k, v]) => [k, v[lang]]));
  const input = {
    phase: e.phase,
    startDate: e.startDate,
    seats: e.seats,
    seatsLeft: e.seatsLeft,
    waitlistEnabled: e.waitlistEnabled,
    audience: e.audienceMode,
    registrationStartAt: e.registrationStartAt,
    registrationEndAt: e.registrationEndAt,
  };
  // Seats are public only when the organiser turned `show_seats_remaining` on.
  const seatsShown =
    e.show.seats && e.phase === 'registration_open' && !!e.seats && e.seatsLeft !== null;
  const seatsLow = seatsShown && e.seatsLeft! <= CLOSES_SOON_SEATS(e.seats!);
  const seatsPct = seatsShown ? Math.round(((e.seats! - e.seatsLeft!) / e.seats!) * 100) : 0;
  const mapOk = !!e.mapUrl && e.mapUrl.startsWith('https://');
  const deadline =
    e.registrationEndAt && e.phase === 'registration_open'
      ? t.deadline(formatDateRange(e.registrationEndAt.slice(0, 10), null, lang))
      : null;
  const showCalendar = e.phase !== 'cancelled' && e.phase !== 'ended';
  const cancelled = e.phase === 'cancelled';
  const wrap = 'mx-auto w-full max-w-(--container) px-4 md:px-8';
  const certBox = certLine && (
    <p className="t-body-sm flex items-start gap-2.5 rounded-shape-md bg-accent-soft px-3.5 py-3 text-on-accent-soft">
      <Award aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <span>{certLine}</span>
    </p>
  );

  return (
    <EventActionsProvider
      event={{ id: e.id, slug: e.slug, title, meta }}
      input={input}
      checkinOpen={checkinOpen}
      now={now}
    >
      <SiteHeader />
      <main id="main" className="pb-28 lg:pb-0">
        <div className={`${wrap} pt-6`}>
          <div className="max-lg:hidden">
            <Breadcrumb
              label={t.breadcrumb}
              items={[
                { label: t.home, href: '/' },
                { label: t.events, href: '/events' },
                { label: title },
              ]}
            />
          </div>
          {/* Phones show the parent only. */}
          <TextLink href="/events" variant="standalone" className="t-body-sm min-h-11 lg:hidden">
            {t.backToEvents}
          </TextLink>
        </div>

        <div
          className={`${wrap} mt-2 grid items-start gap-12 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_var(--side-panel)]`}
        >
          <div className="flex min-w-0 flex-col gap-10 lg:gap-16">
            <header className="relative flex flex-col gap-5 lg:gap-6 lg:overflow-hidden lg:rounded-shape-xl lg:border lg:border-line lg:bg-surface lg:p-10">
              <div
                aria-hidden="true"
                className="motif-dots pointer-events-none absolute end-0 top-0 hidden h-[200px] w-[280px] text-muted lg:block ltr:[mask-image:linear-gradient(to_bottom_right,black,transparent_70%)] rtl:[mask-image:linear-gradient(to_bottom_left,black,transparent_70%)]"
              />
              <Media src={e.cover} alt="" kind="event" className="rounded-shape-lg lg:hidden" />
              {cancelled && (
                <Alert tone="warning" title={t.cancelledTitle}>
                  {e.cancelReason}
                </Alert>
              )}
              <div className="relative flex flex-wrap items-center gap-2">
                <StatePill labels={pillLabels} />
                <Badge>{t.types[e.type] ?? e.type}</Badge>
                {committee && e.committeeSlug && (
                  <TextLink
                    href={`/committees/${e.committeeSlug}`}
                    variant="standalone"
                    className="t-body-sm"
                  >
                    {committee}
                  </TextLink>
                )}
              </div>
              <div className="relative flex flex-col gap-3">
                <h1 className="t-h1 max-w-[24ch]">{title}</h1>
                {summary && <p className="t-lede max-w-[60ch] text-muted">{summary}</p>}
              </div>

              {/* Below lg only: the panel owns date, time and place from lg up. */}
              <dl
                className={cn(
                  'relative grid grid-cols-2 overflow-hidden rounded-shape-lg border border-line bg-surface lg:hidden',
                  cancelled && 'opacity-70 line-through decoration-1',
                )}
              >
                <HeroFact
                  label={t.labels.date}
                  className={cn('border-b border-line', time ? 'border-e' : 'col-span-2')}
                >
                  {dateLine}
                </HeroFact>
                {time && (
                  <HeroFact label={t.labels.time} className="border-b border-line">
                    {time}
                  </HeroFact>
                )}
                <HeroFact label={t.labels.place} className="col-span-2">
                  {place}
                </HeroFact>
              </dl>
              {deadline && <p className="t-caption -mt-2 text-muted lg:hidden">{deadline}</p>}
              <div className="empty:hidden lg:hidden">
                <EventNote skipSeats />
              </div>
              <div className="empty:hidden lg:hidden">
                <ConfirmationPanel />
              </div>
              {certBox && <div className="lg:hidden">{certBox}</div>}

              <div className="relative flex flex-wrap items-center gap-2">
                {showCalendar && <HeroCalendar eventSlug={e.slug} />}
                <ShareButton title={title} label={t.share} copied={t.copied} />
              </div>
            </header>

            <SectionNav items={sections} label={t.onThisPage} />

            {description && (
              <section id="about" aria-labelledby="h-about" className={sectionClass}>
                <SectionTitle id="h-about">{t.sections.about}</SectionTitle>
                <p className="t-body max-w-[70ch] whitespace-pre-line">{description}</p>
              </section>
            )}

            {showAgenda && (
              <section id="agenda" aria-labelledby="h-agenda" className={sectionClass}>
                <SectionTitle id="h-agenda">{t.sections.agenda}</SectionTitle>
                <ol className="flex flex-col gap-3">
                  {days.map((d, i) => {
                    const dayPlace = pick(lang, d.locationAr, d.locationEn) || place;
                    const dayTime = formatTime(
                      hhmm(d.startsAt) ?? hhmm(e.startTime),
                      hhmm(d.endsAt) ?? hhmm(e.endTime),
                      lang,
                    );
                    return (
                      <li key={d.date}>
                        <Card
                          variant="surface"
                          className="flex items-center gap-5 px-5 py-4 md:p-5"
                        >
                          <DateChip date={d.date} lang={lang} variant="block" />
                          <div className="flex min-w-0 flex-col gap-1">
                            <p className="t-h4">{t.day(i + 1)}</p>
                            <p className="t-body-sm tabular-nums text-muted">
                              {[dayTime, dayPlace].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                        </Card>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {showPresenters && (
              <section id="speakers" aria-labelledby="h-speakers" className={sectionClass}>
                <SectionTitle id="h-speakers">{t.sections.speakers}</SectionTitle>
                <ul className="grid gap-3 sm:grid-cols-2 lg:gap-4">
                  {presenters.map((p) => {
                    const name = lang === 'en' ? p.nameEn : p.nameAr;
                    const role = pick(lang, p.titleAr, p.titleEn);
                    return (
                      <li key={p.id}>
                        <Card variant="surface" className="flex items-center gap-4 p-4 md:p-4">
                          <Avatar name={name} src={p.photo} size={56} />
                          <div className="flex min-w-0 flex-col items-start gap-0.5">
                            <Badge tone="accent">{t.roles[p.role]}</Badge>
                            {p.link ? (
                              <TextLink
                                href={p.link}
                                external
                                externalLabel={t.newTab}
                                variant="standalone"
                              >
                                {name}
                              </TextLink>
                            ) : (
                              <span className="t-label">{name}</span>
                            )}
                            {role && <span className="t-body-sm text-muted">{role}</span>}
                          </div>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {showGoals && (
              <section id="for-whom" aria-labelledby="h-forwhom" className={sectionClass}>
                <SectionTitle id="h-forwhom">{t.sections.forWhom}</SectionTitle>
                <div className="grid gap-4 md:grid-cols-2 lg:gap-8">
                  {goals.length > 0 && (
                    <div className="max-lg:rounded-shape-lg max-lg:border max-lg:border-line max-lg:bg-surface max-lg:p-5">
                      <h3 className="t-h4 mb-3">{t.goals}</h3>
                      <ul className="flex flex-col gap-2">
                        {goals.map((g) => (
                          <li key={g} className="t-body flex gap-2">
                            <Check
                              aria-hidden="true"
                              className="mt-1 size-5 shrink-0 text-success"
                            />
                            {g}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {audience.length > 0 && (
                    <div className="max-lg:rounded-shape-lg max-lg:border max-lg:border-line max-lg:bg-surface max-lg:p-5">
                      <h3 className="t-h4 mb-3">{t.audience}</h3>
                      <ul className="t-body flex list-disc flex-col gap-2 ps-5 marker:text-accent-text">
                        {audience.map((a) => (
                          <li key={a}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            <section
              id="place"
              aria-labelledby="h-place"
              className={cn(sectionClass, placeLgHidden && 'lg:hidden')}
            >
              <SectionTitle id="h-place">{t.sections.place}</SectionTitle>
              <Card variant="surface" className="flex flex-col gap-4 p-5 md:p-5">
                <div className="flex items-center gap-3.5">
                  <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-shape-md bg-accent-soft text-on-accent-soft"
                  >
                    <MapPin className="size-5" />
                  </span>
                  <p className="t-h4">{place}</p>
                </div>
                {e.locationMode !== 'in_person' && (
                  <p className="t-body-sm text-muted">{t.onlineLink}</p>
                )}
                {mapOk && e.locationMode !== 'online' && (
                  <a
                    href={e.mapUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClasses({ variant: 'secondary', fullWidth: true })}
                  >
                    {t.openMaps}
                    <span className="sr-only">{t.newTab}</span>
                  </a>
                )}
              </Card>
            </section>

            {bring.length > 0 && (
              <section id="bring" aria-labelledby="h-bring" className={sectionClass}>
                <SectionTitle id="h-bring">{t.sections.bring}</SectionTitle>
                <ul className="t-body flex list-disc flex-col gap-2 ps-5 marker:text-accent-text">
                  {bring.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </section>
            )}

            {faq.length > 0 && (
              <section id="faq" aria-labelledby="h-faq" className={sectionClass}>
                <SectionTitle id="h-faq">{t.sections.faq}</SectionTitle>
                <Accordion
                  items={faq.map((f, i) => ({
                    id: `f${i}`,
                    question: pick(lang, f.qAr, f.qEn),
                    answer: pick(lang, f.aAr, f.aEn),
                  }))}
                />
              </section>
            )}

            {detailGroups.length > 0 && (
              <section id="details" aria-labelledby="h-details" className={sectionClass}>
                <SectionTitle id="h-details">{t.sections.details}</SectionTitle>
                <Accordion
                  headingLevel={3}
                  items={detailGroups.map(([k, v]) => ({
                    id: k,
                    question: t.detailGroups[k],
                    answer: (
                      <ul className="flex list-disc flex-col gap-1 ps-5 marker:text-accent-text">
                        {v.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    ),
                  }))}
                />
              </section>
            )}
          </div>

          <aside aria-label={t.panelLabel} className="max-lg:hidden">
            <div className="sticky top-24 flex flex-col gap-5 rounded-shape-xl border border-line bg-surface p-2 pb-6 text-text">
              <Media src={e.cover} alt="" kind="event" className="rounded-shape-lg" />
              <div className="flex flex-col gap-4 px-4">
                <ul
                  className={cn(
                    't-body flex flex-col gap-3.5',
                    cancelled && 'opacity-70 line-through decoration-1',
                  )}
                >
                  <Fact icon={CalendarDays}>
                    <span className="font-semibold tabular-nums">{dateLine}</span>
                  </Fact>
                  {time && (
                    <Fact icon={Clock}>
                      <span className="font-semibold tabular-nums">{time}</span>
                    </Fact>
                  )}
                  <Fact icon={MapPin}>
                    <span className="font-semibold">{place}</span>
                    {mapOk && e.locationMode !== 'online' && (
                      <TextLink
                        href={e.mapUrl!}
                        external
                        externalLabel={t.newTab}
                        variant="standalone"
                        className="t-body-sm"
                      >
                        {t.openMaps}
                      </TextLink>
                    )}
                  </Fact>
                </ul>
                {seatsShown && (
                  <div className="flex flex-col gap-2 rounded-shape-lg bg-surface-raised px-4 py-3.5">
                    <span className="inline-flex items-center gap-2 font-semibold tabular-nums">
                      <Users aria-hidden="true" className="size-5 shrink-0 text-accent-text" />
                      {t.seatsOf(e.seatsLeft!, e.seats!)}
                    </span>
                    <div
                      role="meter"
                      aria-label={t.seatsBar}
                      aria-valuemin={0}
                      aria-valuemax={e.seats!}
                      aria-valuenow={e.seats! - e.seatsLeft!}
                      className="h-2 overflow-hidden rounded-full bg-line"
                    >
                      <div
                        className={cn('h-full rounded-full', seatsLow ? 'bg-warning' : 'bg-accent')}
                        style={{ width: `${seatsPct}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-2.5">
                  <PrimaryAction eventSlug={e.slug} fullWidth />
                  <ConfirmationPanel />
                  <div className="text-center [&_p]:font-semibold">
                    <EventNote skipSeats />
                  </div>
                  {deadline && <p className="t-caption text-center text-muted">{deadline}</p>}
                </div>
                {certBox}
                {e.contactEmail && (
                  <p className="t-body-sm text-muted">
                    {t.contact}{' '}
                    <a
                      href={`mailto:${e.contactEmail}`}
                      dir="ltr"
                      className="text-accent-text underline underline-offset-[3px]"
                    >
                      {e.contactEmail}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="h-related" className={`${wrap} mt-(--section-gap)`}>
            <SectionHeader
              headingId="h-related"
              title={t.sections.related}
              dots
              action={
                <TextLink href="/events" variant="standalone" className="min-h-11">
                  {t.allEvents}
                </TextLink>
              }
            />
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {related.map((r) => (
                <li key={r.id}>
                  <EventCard event={r} lang={lang} now={now} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {/* Phone: fixed action bar (never covers content: <main> has bottom padding). Seats left, or the date. */}
      <div className="fixed inset-x-0 bottom-0 z-(--z-sticky) flex min-h-16 items-center justify-between gap-3 border-t border-line bg-surface/95 px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <p className="font-bold tabular-nums">
          {seatsShown ? (e.seatsLeft === 0 ? t.seatsFull : t.seatsLeft(e.seatsLeft!)) : dateLine}
        </p>
        <PrimaryAction eventSlug={e.slug} size="md" />
      </div>
      <SiteFooter />
    </EventActionsProvider>
  );
}
