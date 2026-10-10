import { Award, CalendarDays, Check, Clock, MapPin, Users } from 'lucide-react';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SectionHeader } from '@/components/patterns/SectionHeader';
import { Accordion } from '@/components/ui/Accordion';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card } from '@/components/ui/Card';
import { DateChip } from '@/components/ui/DateChip';
import { Media } from '@/components/ui/Media';
import { Progress } from '@/components/ui/Progress';
import { TextLink } from '@/components/ui/TextLink';
import { formatDateRange } from '@/lib/format';
import { EventCard } from '../EventCard';
import { eventTitle } from '../../public-types';
import { EVENT_COPY } from '../../page-copy';
import { PILL_LABEL } from '../../status-labels';
import type { EventPageData } from '../../page-data';
import {
  ConfirmationPanel,
  EventActionsProvider,
  EventNote,
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

const Facts = ({ children }: { children: React.ReactNode }) => (
  <ul className="t-body flex flex-wrap gap-x-6 gap-y-3 text-muted">{children}</ul>
);
const Fact = ({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) => (
  <li className="flex items-center gap-2">
    <Icon aria-hidden="true" className="size-5 shrink-0 text-accent-text" />
    <span>{children}</span>
  </li>
);

/** The v2 event page (PUBLIC-SCREENS-V2/02-event-page.md): hero, sticky side panel, sections, related events. */
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
  const time =
    hhmm(e.startTime) && hhmm(e.endTime)
      ? `${hhmm(e.startTime)} – ${hhmm(e.endTime)}`
      : hhmm(e.startTime);
  const meta = [dateLine, place].filter(Boolean).join(' · ');
  const summary = pick(lang, e.summaryAr, e.summaryEn);
  const description = pick(lang, e.descriptionAr, e.descriptionEn);
  const goals = list(lang, e.goalsAr, e.goalsEn);
  const audience = list(lang, e.audience.ar, e.audience.en);
  const bring = list(lang, e.whatToBringAr, e.whatToBringEn);
  const faq = e.show.faq ? e.faq.filter((f) => f.qAr || f.qEn) : [];
  const detailGroups = e.show.details
    ? (['responsibilities', 'requirements', 'deliverables', 'benefits'] as const).flatMap((k) => {
        const v = list(lang, e[k].ar, e[k].en);
        return v.length ? [[k, v] as const] : [];
      })
    : [];
  const showPresenters = e.show.presenters && presenters.length > 0;
  const showGoals = e.show.goals && (goals.length > 0 || audience.length > 0);
  const showAgenda = days.length > 1;
  const showPlace = true;

  const sections: Array<{ id: string; label: string }> = [];
  if (description) sections.push({ id: 'about', label: t.sections.about });
  if (showAgenda) sections.push({ id: 'agenda', label: t.sections.agenda });
  if (showPresenters) sections.push({ id: 'speakers', label: t.sections.speakers });
  if (showGoals) sections.push({ id: 'for-whom', label: t.sections.forWhom });
  if (showPlace) sections.push({ id: 'place', label: t.sections.place });
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
  const seatsPct =
    e.seats && e.seatsLeft !== null ? Math.round(((e.seats - e.seatsLeft) / e.seats) * 100) : null;
  const mapOk = !!e.mapUrl && e.mapUrl.startsWith('https://');
  const wrap = 'mx-auto w-full max-w-(--container) px-4 md:px-8';

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
          <Breadcrumb
            label={t.breadcrumb}
            items={[
              { label: t.home, href: '/' },
              { label: t.events, href: '/events' },
              { label: title },
            ]}
          />
        </div>

        <div className={`${wrap} mt-6 grid gap-10 lg:grid-cols-[1fr_480px]`}>
          <div className="min-w-0">
            <header className="flex flex-col gap-5">
              {e.phase === 'cancelled' && (
                <Alert tone="warning" title={t.cancelledTitle}>
                  {e.cancelReason}
                </Alert>
              )}
              <div className="flex flex-wrap items-center gap-2">
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
              <h1 className="t-h1 max-w-[24ch]">{title}</h1>
              {summary && <p className="t-lede text-muted">{summary}</p>}
              <div
                className={
                  e.phase === 'cancelled' ? 'opacity-70 line-through decoration-1' : undefined
                }
              >
                <Facts>
                  <Fact icon={CalendarDays}>{dateLine}</Fact>
                  {time && (
                    <Fact icon={Clock}>
                      <span className="tabular-nums">{time}</span>
                    </Fact>
                  )}
                  <Fact icon={MapPin}>{place}</Fact>
                  {e.show.seats && e.seatsLeft !== null && e.phase === 'registration_open' && (
                    <Fact icon={Users}>{t.seatsLeft(e.seatsLeft)}</Fact>
                  )}
                </Facts>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="max-lg:hidden">
                  <PrimaryAction eventSlug={e.slug} />
                </div>
                <ShareButton title={title} label={t.share} copied={t.copied} />
              </div>
              <EventNote />
              <ConfirmationPanel />
              {certLine && (
                <p className="t-body-sm flex gap-2 text-muted lg:hidden">
                  <Award aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent-text" />
                  {certLine}
                </p>
              )}
            </header>

            <div className="mt-8">
              <SectionNav items={sections} label={t.onThisPage} />
            </div>

            {description && (
              <section id="about" aria-labelledby="h-about" className="mt-10 scroll-mt-32">
                <SectionHeader headingId="h-about" title={t.sections.about} className="mb-4" />
                <p className="t-body max-w-[70ch] whitespace-pre-line">{description}</p>
              </section>
            )}

            {showAgenda && (
              <section id="agenda" aria-labelledby="h-agenda" className="mt-12 scroll-mt-32">
                <SectionHeader headingId="h-agenda" title={t.sections.agenda} className="mb-4" />
                <ol className="flex flex-col gap-3">
                  {days.map((d, i) => {
                    const dayPlace = pick(lang, d.locationAr, d.locationEn) || place;
                    const s = hhmm(d.startsAt) ?? hhmm(e.startTime);
                    const en = hhmm(d.endsAt) ?? hhmm(e.endTime);
                    return (
                      <li key={d.date}>
                        <Card variant="surface" className="flex items-center gap-4">
                          <DateChip date={d.date} lang={lang} variant="block" />
                          <div className="flex flex-col gap-1">
                            <p className="t-h4">{t.day(i + 1)}</p>
                            <p className="t-body-sm tabular-nums text-muted">
                              {[s && en ? `${s} – ${en}` : s, dayPlace].filter(Boolean).join(' · ')}
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
              <section id="speakers" aria-labelledby="h-speakers" className="mt-12 scroll-mt-32">
                <SectionHeader
                  headingId="h-speakers"
                  title={t.sections.speakers}
                  className="mb-4"
                />
                <ul className="grid gap-4 sm:grid-cols-2">
                  {presenters.map((p) => {
                    const name = lang === 'en' ? p.nameEn : p.nameAr;
                    const role = pick(lang, p.titleAr, p.titleEn) || t.roles[p.role];
                    return (
                      <li key={p.id} className="flex items-center gap-4">
                        <Avatar name={name} src={p.photo} size={56} />
                        <div className="flex flex-col">
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
                          <span className="t-body-sm text-muted">{role}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {showGoals && (
              <section id="for-whom" aria-labelledby="h-forwhom" className="mt-12 scroll-mt-32">
                <SectionHeader headingId="h-forwhom" title={t.sections.forWhom} className="mb-4" />
                <div className="grid gap-8 md:grid-cols-2">
                  {goals.length > 0 && (
                    <div>
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
                    <div>
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

            {showPlace && (
              <section id="place" aria-labelledby="h-place" className="mt-12 scroll-mt-32">
                <SectionHeader headingId="h-place" title={t.sections.place} className="mb-4" />
                <p className="t-body flex items-start gap-2">
                  <MapPin aria-hidden="true" className="mt-1 size-5 shrink-0 text-accent-text" />
                  {place}
                </p>
                {mapOk && (
                  <TextLink
                    href={e.mapUrl!}
                    external
                    externalLabel={t.newTab}
                    variant="standalone"
                    className="mt-2 min-h-11"
                  >
                    {t.openMaps}
                  </TextLink>
                )}
                {e.locationMode !== 'in_person' && (
                  <p className="t-body-sm mt-2 text-muted">{t.onlineLink}</p>
                )}
              </section>
            )}

            {bring.length > 0 && (
              <section id="bring" aria-labelledby="h-bring" className="mt-12 scroll-mt-32">
                <SectionHeader headingId="h-bring" title={t.sections.bring} className="mb-4" />
                <ul className="t-body flex list-disc flex-col gap-2 ps-5 marker:text-accent-text">
                  {bring.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </section>
            )}

            {faq.length > 0 && (
              <section id="faq" aria-labelledby="h-faq" className="mt-12 scroll-mt-32">
                <SectionHeader headingId="h-faq" title={t.sections.faq} className="mb-4" />
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
              <section id="details" aria-labelledby="h-details" className="mt-12 scroll-mt-32">
                <SectionHeader headingId="h-details" title={t.sections.details} className="mb-4" />
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

          <aside className="max-lg:hidden">
            <Card variant="surface" className="sticky top-28 flex flex-col gap-6 p-8">
              <Media src={e.cover} alt="" kind="event" className="rounded-shape-lg" />
              <ul className="t-lede flex flex-col gap-4 text-text">
                <Fact icon={CalendarDays}>{dateLine}</Fact>
                {time && (
                  <Fact icon={Clock}>
                    <span className="tabular-nums">{time}</span>
                  </Fact>
                )}
                <Fact icon={MapPin}>{place}</Fact>
              </ul>
              {mapOk && (
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
              {e.seats && e.seatsLeft !== null && seatsPct !== null && (
                <div>
                  <p className="t-body-sm mb-2 tabular-nums text-muted">
                    {t.seatsOf(e.seatsLeft, e.seats)}
                  </p>
                  <Progress value={seatsPct} label={t.seatsBar} className="[&>p]:sr-only" />
                </div>
              )}
              <PrimaryAction eventSlug={e.slug} fullWidth />
              <EventNote />
              {e.registrationEndAt && e.phase === 'registration_open' && (
                <p className="t-caption text-muted">
                  {t.deadline(formatDateRange(e.registrationEndAt.slice(0, 10), null, lang))}
                </p>
              )}
              {certLine && (
                <p className="t-body-sm flex gap-2 text-muted">
                  <Award aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent-text" />
                  {certLine}
                </p>
              )}
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
            </Card>
          </aside>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="h-related" className={`${wrap} mt-(--section-gap)`}>
            <SectionHeader
              headingId="h-related"
              title={t.sections.related}
              action={
                <TextLink href="/events" variant="standalone" className="min-h-11">
                  {t.allEvents}
                </TextLink>
              }
            />
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <li key={r.id}>
                  <EventCard event={r} lang={lang} now={now} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {/* Phone: fixed action bar (never covers content: <main> has bottom padding). */}
      <div className="fixed inset-x-0 bottom-0 z-(--z-sticky) flex items-center justify-between gap-3 border-t border-line bg-surface/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <p className="t-body-sm tabular-nums text-muted">
          {e.seatsLeft !== null && e.phase === 'registration_open'
            ? t.seatsLeft(e.seatsLeft)
            : dateLine}
        </p>
        <PrimaryAction eventSlug={e.slug} size="md" />
      </div>
      <SiteFooter />
    </EventActionsProvider>
  );
}
