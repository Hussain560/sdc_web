import { ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { CtaBand } from '@/components/patterns/CtaBand';
import { SectionHeader } from '@/components/patterns/SectionHeader';
import { StatsRow } from '@/components/patterns/StatsRow';
import { LinkButton } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { TextLink } from '@/components/ui/TextLink';
import { DateChip } from '@/components/ui/DateChip';
import { Link } from '@/i18n/navigation';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { formatDate } from '@/lib/format';
import { ArticleCard } from '@/modules/articles/components/ArticleCard';
import { EventCard } from '@/modules/events/components/EventCard';
import { eventTitle } from '@/modules/events/public-types';
import { PILL_LABEL } from '@/modules/events/status-labels';
import { HOME_COPY } from './copy';
import { SignedInOnly, SignedOutOnly } from './SignedOutOnly';
import type { HomeSections, IntakeState } from './sections';
import type { PublicPartner } from '@/modules/admin/public';
import { socialLinks } from '@/components/layout/chrome-strings';
import type { PublicSettings } from '@/lib/site-settings-defaults';

type Lang = 'ar' | 'en';

export function HomeView({
  lang,
  sections,
  intake,
  partners,
  settings,
  now,
}: {
  lang: Lang;
  sections: HomeSections;
  intake: IntakeState;
  partners: PublicPartner[];
  settings: PublicSettings;
  now: number;
}) {
  const t = HOME_COPY[lang];
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;
  const wrap = 'mx-auto w-full max-w-(--container) px-4 md:px-8';
  const heroPrimary = intake.phase === 'open' ? t.apply : t.join;
  const ctaLine =
    intake.phase === 'open'
      ? t.ctaOpen(formatDate(intake.until, lang))
      : intake.phase === 'scheduled'
        ? t.ctaScheduled(formatDate(intake.opensAt, lang))
        : t.ctaClosed;
  const socials = socialLinks(settings);
  const ann = sections.announcement;
  const eventsTitle = sections.events.kind === 'past' ? t.pastTitle : t.eventsTitle;
  const eventsLede = sections.events.kind === 'past' ? t.pastLede : t.eventsLede;

  return (
    <>
      <SiteHeader />
      <main id="main">
        {ann && (
          <div className="bg-accent-soft text-on-accent-soft">
            <Link
              href={`/events/${ann.slug}`}
              className="mx-auto flex min-h-11 max-w-(--container) items-center gap-3 px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-focus-ring md:px-8"
            >
              <StatusPill
                status="registration-open"
                label={PILL_LABEL['registration-open'][lang]}
              />
              <span className="t-label line-clamp-1 flex-1">{eventTitle(ann, lang)}</span>
              {ann.startDate && (
                <DateChip date={ann.startDate} lang={lang} className="max-sm:hidden" />
              )}
              <Arrow aria-hidden="true" className="size-5 shrink-0" />
            </Link>
          </div>
        )}

        <section aria-labelledby="home-hero" className={`${wrap} pt-10 md:pt-16`}>
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col items-start gap-6">
              <h1 id="home-hero" className="t-display max-w-[18ch]">
                {t.heroTitle}
              </h1>
              <p className="t-lede text-muted">{t.heroLede}</p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 max-sm:w-full max-sm:flex-col max-sm:items-stretch">
                <SignedOutOnly>
                  <LinkButton href="/join" size="lg">
                    {heroPrimary}
                  </LinkButton>
                </SignedOutOnly>
                <SignedInOnly>
                  <LinkButton href="/events" size="lg">
                    {t.browse}
                  </LinkButton>
                </SignedInOnly>
                <SignedOutOnly>
                  <TextLink
                    href="/events"
                    variant="standalone"
                    className="min-h-11 max-sm:justify-center"
                  >
                    {t.browse}
                    <Arrow aria-hidden="true" className="size-4" />
                  </TextLink>
                </SignedOutOnly>
              </div>
            </div>
            <div className="relative flex justify-center">
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_50%,color-mix(in_srgb,var(--signal)_14%,transparent),transparent)]"
              />
              <Image
                src="/brand/hero-mark-dark.png"
                alt=""
                width={546}
                height={380}
                priority
                sizes="(max-width: 1024px) 60vw, 480px"
                className="logo-on-dark h-auto w-3/5 lg:w-full"
              />
              <Image
                src="/brand/hero-mark-light.png"
                alt=""
                width={1504}
                height={1046}
                priority
                sizes="(max-width: 1024px) 60vw, 480px"
                className="logo-on-light h-auto w-3/5 rounded-shape-xl lg:w-full"
              />
            </div>
          </div>
          {sections.stats.length > 0 && (
            <StatsRow
              className="mt-12 border-t border-line pt-8"
              label={t.statsLabel}
              locale={lang}
              items={sections.stats.map(([key, value]) => ({
                key,
                value,
                label: t.stats[key],
              }))}
            />
          )}
        </section>

        {sections.events.kind !== 'none' && (
          <section aria-labelledby="home-events" className={`${wrap} mt-(--section-gap)`}>
            <SectionHeader
              headingId="home-events"
              title={eventsTitle}
              lede={eventsLede}
              action={
                <TextLink href="/events" variant="standalone" className="min-h-11">
                  {t.eventsAll}
                  <Arrow aria-hidden="true" className="size-4" />
                </TextLink>
              }
            />
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sections.events.items.map((e) => (
                <li key={e.id}>
                  <EventCard event={e} lang={lang} now={now} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {sections.articles.length > 0 && (
          <section aria-labelledby="home-articles" className={`${wrap} mt-(--section-gap)`}>
            <SectionHeader
              headingId="home-articles"
              title={t.articlesTitle}
              lede={t.articlesLede}
              action={
                <TextLink href="/articles" variant="standalone" className="min-h-11">
                  {t.articlesAll}
                  <Arrow aria-hidden="true" className="size-4" />
                </TextLink>
              }
            />
            <ul className="grid gap-4 md:grid-cols-2">
              {sections.articles.map((a) => (
                <li key={a.id}>
                  <ArticleCard article={a} lang={lang} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {sections.partners && (
          <section
            aria-labelledby="home-partners"
            className="mt-(--section-gap) bg-band py-12 md:py-16"
          >
            <div className={wrap}>
              <SectionHeader headingId="home-partners" title={t.partnersTitle} />
              <ul className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                {partners
                  .filter((p) => p.logoUrl)
                  .map((p) => {
                    const name = lang === 'en' && p.nameEn ? p.nameEn : p.nameAr;
                    const logo = (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.logoUrl ?? ''}
                        alt={name}
                        loading="lazy"
                        decoding="async"
                        className="max-h-12 w-auto max-w-32 object-contain"
                      />
                    );
                    return (
                      <li
                        key={p.id}
                        className="flex h-20 min-w-32 items-center justify-center rounded-shape-lg bg-qr-ground px-5"
                      >
                        {p.websiteUrl ? (
                          <a
                            href={p.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${name} ${t.newTab}`}
                            className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring"
                          >
                            {logo}
                          </a>
                        ) : (
                          logo
                        )}
                      </li>
                    );
                  })}
              </ul>
            </div>
          </section>
        )}

        <SignedOutOnly>
          <div className={`${wrap} mt-(--section-gap)`}>
            <CtaBand
              title={t.ctaTitle}
              line={ctaLine}
              action={
                <LinkButton href="/join" size="lg">
                  {intake.phase === 'open' ? t.apply : t.join}
                </LinkButton>
              }
              extra={
                intake.phase === 'closed' && socials.length > 0 ? (
                  <ul aria-label={t.follow} className="mt-2 flex flex-wrap justify-center gap-4">
                    {socials.map((s) => (
                      <li key={s.key}>
                        <TextLink
                          href={s.href}
                          variant="standalone"
                          external
                          externalLabel={t.newTab}
                          className="min-h-11"
                        >
                          {s.label}
                        </TextLink>
                      </li>
                    ))}
                  </ul>
                ) : undefined
              }
            />
          </div>
        </SignedOutOnly>
      </main>
      <SiteFooter />
    </>
  );
}
