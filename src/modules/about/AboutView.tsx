import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Mic,
  Tent,
  Trophy,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import type { CSSProperties } from 'react';
import { CapsuleCover } from '@/components/patterns/CapsuleMark';
import { SectionHeader } from '@/components/patterns/SectionHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { LinkButton } from '@/components/ui/Button';
import { Card, CardLink } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
import { TextLink } from '@/components/ui/TextLink';
import { Link } from '@/i18n/navigation';
import { EVENT_COPY } from '@/modules/events/page-copy';
import { FALLBACK_COVER, eventTitle } from '@/modules/events/public-types';
import { SignedOutOnly } from '@/modules/home/SignedOutOnly';
import { ABOUT_COPY } from './copy';
import type { AboutData } from './data';
import { aboutFigures, bentoSpan, committeeIcon, firstEventYear, pastStations } from './model';
import { TopicsMarquee } from './components/TopicsMarquee';
import { ValuesList } from './components/ValuesList';
import { VisionMission } from './components/VisionMission';

type Lang = 'ar' | 'en';

const OFFER_ICON: Record<string, LucideIcon> = { Wrench, Tent, Trophy, Mic, BookOpen, Award };

const wrap = 'mx-auto w-full max-w-(--container) px-4 md:px-8';
const section = 'mt-(--section-gap)';

/**
 * About (PUBLIC-SCREENS-V2/06-about.md): who we are, the real figures, the fields we work in, vision and mission, what
 * we offer, how we work, committees, values, milestones, leadership, then the invitation. Server-rendered; the only
 * client pieces are the vision/mission toggle, the values rows and the marquee's pause button. A section whose data
 * is missing is left out instead of showing a placeholder.
 */
export function AboutView({ lang, data }: { lang: Lang; data: AboutData }) {
  const t = ABOUT_COPY[lang];
  const ev = EVENT_COPY[lang];
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;
  const figures = aboutFigures(data.stats);
  const since = firstEventYear(data.events);
  const stations = pastStations(data.events);
  const monthYear = new Intl.DateTimeFormat(
    lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB',
    { month: 'long', year: 'numeric', timeZone: 'UTC' },
  );
  return (
    <>
      <SiteHeader />
      <main id="main" className="overflow-x-clip">
        <div className={`${wrap} pt-6`}>
          <Breadcrumb
            label={t.breadcrumb}
            items={[{ label: t.home, href: '/' }, { label: t.title }]}
          />
        </div>

        <header className={`${wrap} mt-10 grid items-center gap-12 lg:grid-cols-2 lg:gap-16`}>
          <div className="flex flex-col gap-6">
            <h1 className="t-display">{t.title}</h1>
            <p className="max-w-[38ch] text-[length:clamp(1.125rem,1rem+0.5vw,1.5rem)] leading-[1.75]">
              {t.intro}
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <SignedOutOnly>
                <LinkButton href="/join" size="lg">
                  {t.apply}
                </LinkButton>
              </SignedOutOnly>
              <LinkButton href="/events" variant="secondary" size="lg">
                {t.browseEvents}
              </LinkButton>
            </div>
          </div>
          <div className="relative p-6">
            <div
              aria-hidden="true"
              className="absolute end-0 top-0 size-36 rotate-12 rounded-[32px] bg-accent-soft"
            />
            <div
              aria-hidden="true"
              className="absolute start-0 bottom-0 size-24 rounded-full bg-brand opacity-55"
            />
            <div className="motif-dots relative aspect-[4/3] overflow-hidden rounded-shape-2xl border border-line bg-band text-muted">
              <Image
                src="/brand/hero-mark-dark.png"
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="logo-on-dark pg-float object-cover"
              />
              <Image
                src="/brand/hero-mark-light.png"
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="logo-on-light pg-float object-cover"
              />
            </div>
          </div>
        </header>

        {figures.length > 0 && (
          <section aria-labelledby="ab-num" className={cn(wrap, section)}>
            <h2 id="ab-num" className="sr-only">
              {t.numbers}
            </h2>
            <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {figures.map((f, i) => {
                const big = i === 0 && figures.length >= 3;
                const copy = t.figures[f.key];
                const note =
                  f.key === 'events'
                    ? since
                      ? t.figures.events.note(since)
                      : ''
                    : (copy.note as string);
                return (
                  <li key={f.key} className={cn('pg-rv', bentoSpan(figures.length, i))}>
                    <div
                      className={cn(
                        'relative flex h-full flex-col gap-1 overflow-hidden rounded-shape-xl',
                        big
                          ? 'min-h-80 bg-accent-soft p-8 text-on-accent-soft md:p-10'
                          : i === 1
                            ? 'min-h-40 bg-band p-8'
                            : 'min-h-40 bg-surface-raised p-7',
                      )}
                    >
                      <span className={cn('font-bold', big ? 'text-2xl text-text' : 'text-xl')}>
                        {copy.title}
                      </span>
                      {note && (
                        <span className={cn('t-body-sm', big ? '' : 'text-muted')}>{note}</span>
                      )}
                      <b
                        aria-hidden="true"
                        style={{ '--to': f.value } as CSSProperties}
                        className={cn(
                          'pg-count mt-auto leading-[1.1] font-bold text-signal tabular-nums',
                          big ? 'text-[length:clamp(3rem,2rem+3vw,5rem)]' : 'text-5xl',
                        )}
                      />
                      <span className="sr-only">{`${f.value.toLocaleString(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US')} ${copy.title}`}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <TopicsMarquee label={t.topicsLabel} topics={t.topics} pause={t.pause} play={t.play} />

        <div className={wrap}>
          <VisionMission
            title={t.visionMission}
            choose={t.choose}
            vision={{ label: t.vision, text: t.visionText }}
            mission={{ label: t.mission, text: t.missionText }}
          />

          <section aria-labelledby="ab-offer" className={section}>
            <SectionHeader headingId="ab-offer" title={t.offerTitle} lede={t.offerLede} dots />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {t.offers.map(([icon, title, text]) => {
                const Icon = OFFER_ICON[icon]!;
                return (
                  <li key={title} className="pg-rv">
                    <div className="pg-tile flex min-h-[230px] flex-col justify-between gap-6 rounded-shape-xl border border-line bg-surface p-8">
                      <span
                        aria-hidden="true"
                        className="pg-ico flex size-[60px] items-center justify-center rounded-[18px] bg-accent-soft text-on-accent-soft"
                      >
                        <Icon className="size-7" strokeWidth={1.75} />
                      </span>
                      <div className="flex flex-col gap-1.5">
                        <h3 className="t-h3">{title}</h3>
                        <p className="t-body text-muted">{text}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="ab-how" className={section}>
            <SectionHeader headingId="ab-how" title={t.how} lede={t.howLede} dots />
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute inset-x-[16%] top-8 hidden h-0.5 bg-line md:block"
              />
              <div
                aria-hidden="true"
                className="pg-line absolute inset-x-[16%] top-8 hidden h-0.5 bg-accent md:block"
              />
              <ol className="relative grid gap-10 text-center md:grid-cols-3 md:gap-6">
                {t.steps.map(([title, text, href], i) => (
                  <li key={href} className="pg-rv flex flex-col items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="grid size-16 place-items-center rounded-full bg-accent text-2xl font-bold text-on-accent shadow-[0_0_0_8px_var(--canvas)]"
                    >
                      {i + 1}
                    </span>
                    <h3 className="t-h3 mt-2">{title}</h3>
                    <p className="t-body max-w-[28ch] text-muted">{text}</p>
                    <TextLink href={href} variant="standalone" className="min-h-11">
                      {title}
                      <Arrow aria-hidden="true" className="size-4" />
                    </TextLink>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {data.committees.length > 0 && (
            <section aria-labelledby="ab-com" className={section}>
              <SectionHeader
                headingId="ab-com"
                title={t.committees}
                lede={t.committeesLede}
                dots
                action={
                  <LinkButton href="/committees" variant="secondary">
                    {t.allCommittees}
                  </LinkButton>
                }
              />
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {data.committees.map((c, i) => {
                  const Icon = committeeIcon(c.slug);
                  const name = (lang === 'en' ? c.nameEn : null) ?? c.nameAr;
                  return (
                    <li key={c.slug} className="pg-rv">
                      <div className="pg-tile relative flex min-h-[250px] flex-col gap-4 rounded-shape-xl border border-line bg-surface px-6 py-7">
                        <span className="text-base font-semibold text-muted tabular-nums">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span
                          aria-hidden="true"
                          className="pg-ico flex size-14 items-center justify-center rounded-shape-lg bg-accent-soft text-on-accent-soft"
                        >
                          <Icon className="size-7" strokeWidth={1.75} />
                        </span>
                        <h3 className="t-h4 mt-auto">
                          <CardLink href={`/committees/${c.slug}`}>{name}</CardLink>
                        </h3>
                        <span
                          aria-hidden="true"
                          className="pg-arrow absolute end-6 top-6 grid size-10 place-items-center rounded-full border-[1.5px] border-line-strong"
                        >
                          <Arrow className="size-5" />
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section
            aria-labelledby="ab-val"
            className={cn(
              section,
              'grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)] lg:gap-16',
            )}
          >
            <div className="pg-rv flex flex-col gap-3 lg:sticky lg:top-28">
              <h2 id="ab-val" className="t-h2 flex items-center gap-3">
                <span aria-hidden="true" className="signal-dots" />
                {t.values}
              </h2>
              <p className="t-lede max-w-[32ch] text-muted">{t.valuesLede}</p>
            </div>
            <ValuesList items={t.valueList} />
          </section>
        </div>

        {stations.length > 0 && (
          <section aria-labelledby="ab-time" className={`${section} bg-band py-12 md:py-20`}>
            <div className={wrap}>
              <SectionHeader
                headingId="ab-time"
                title={t.timeline}
                lede={t.timelineLede}
                dots
                action={
                  <LinkButton href="/events?tab=past" variant="secondary">
                    {t.pastEvents}
                  </LinkButton>
                }
              />
              <ol
                tabIndex={0}
                aria-label={t.timelineLabel}
                className="pg-snap -mx-1 flex gap-5 overflow-x-auto px-1 pt-1 pb-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                {stations.map((e) => (
                  <li key={e.id} className="flex flex-[0_0_300px] flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[2rem] font-bold text-signal tabular-nums">
                        {e.startDate!.slice(0, 4)}
                      </span>
                      <span aria-hidden="true" className="h-0.5 flex-1 bg-line-accent" />
                    </div>
                    <Card variant="poster" interactive className="flex flex-col gap-3 p-2 pb-5">
                      <div className="aspect-[4/3] overflow-hidden rounded-shape-lg bg-surface-raised">
                        {e.cover !== FALLBACK_COVER ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={e.cover}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="size-full object-cover object-top"
                          />
                        ) : (
                          <CapsuleCover />
                        )}
                      </div>
                      <div className="flex flex-col gap-1 px-3">
                        <span className="t-caption text-muted">
                          {`${monthYear.format(new Date(`${e.startDate}T00:00:00Z`))} · ${ev.types[e.type] ?? e.type}`}
                        </span>
                        <h3 className="t-h4 text-[1.125rem]">
                          <CardLink href={`/events/${e.slug}`}>{eventTitle(e, lang)}</CardLink>
                        </h3>
                      </div>
                    </Card>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        <div className={wrap}>
          {data.leadership.length > 0 && (
            <section aria-labelledby="ab-lead" className={section}>
              <SectionHeader
                headingId="ab-lead"
                title={t.leadership}
                lede={t.leadershipLede}
                dots
                action={
                  <LinkButton href="/members" variant="secondary">
                    {t.allMembers}
                  </LinkButton>
                }
              />
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {data.leadership.slice(0, 8).map((p) => {
                  const name = lang === 'en' ? p.nameEn : p.nameAr;
                  return (
                    <li key={p.id} className="pg-rv">
                      <Card
                        variant="surface"
                        className="pg-tile flex h-full flex-col items-start gap-3 p-7"
                      >
                        <Avatar name={name} size={72} />
                        <h3 className="t-h4 mt-2">{name}</h3>
                        <p className="font-semibold text-accent-text">
                          {lang === 'en' ? p.roleEn : p.roleAr}
                        </p>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <SignedOutOnly>
            <section
              aria-labelledby="ab-cta"
              className={cn(
                section,
                'pg-rv relative flex flex-wrap items-center justify-between gap-8 overflow-hidden rounded-shape-2xl bg-brand p-10 text-on-brand md:p-20',
              )}
            >
              <div aria-hidden="true" className="absolute -top-10 -bottom-10 end-[6%] w-64">
                <span className="absolute start-24 top-0 h-[340px] w-16 rotate-[32deg] rounded-full bg-signal opacity-35" />
                <span className="absolute start-24 top-0 h-[340px] w-16 -rotate-[32deg] rounded-full bg-signal opacity-20" />
              </div>
              <div className="relative flex max-w-[40ch] flex-col gap-2">
                <h2 id="ab-cta" className="t-h2">
                  {t.cta}
                </h2>
                <p className="text-lg opacity-90">{t.ctaLine}</p>
              </div>
              <Link
                href="/join"
                className="relative inline-flex min-h-13 items-center justify-center rounded-full bg-surface px-7 text-base font-semibold whitespace-nowrap text-text hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                {t.apply}
              </Link>
            </section>
          </SignedOutOnly>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
