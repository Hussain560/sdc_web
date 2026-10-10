import { UsersRound } from 'lucide-react';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { CtaBand } from '@/components/patterns/CtaBand';
import { SectionHeader } from '@/components/patterns/SectionHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card } from '@/components/ui/Card';
import { DateChip } from '@/components/ui/DateChip';
import { LinkButton } from '@/components/ui/Button';
import { TextLink } from '@/components/ui/TextLink';
import { SignedOutOnly } from '@/modules/home/SignedOutOnly';
import type { PublicCommittee } from '../../queries';

type Lang = 'ar' | 'en';

const COPY = {
  ar: {
    home: 'الرئيسية',
    committees: 'اللجان',
    breadcrumb: 'مسار التنقل',
    leadership: 'القيادة',
    events: 'الفعاليات',
    articles: 'المقالات',
    noEvents: 'لا فعاليات لهذه اللجنة الآن.',
    noArticles: 'لا مقالات لهذه اللجنة بعد.',
    allEvents: 'كل الفعاليات',
    allArticles: 'كل المقالات',
    noDescription: 'سيُضاف وصف اللجنة قريباً.',
    cta: (n: string) => `هل تريد المساهمة في ${n}؟`,
    ctaLine: 'قدّم طلب العضوية واذكر اهتمامك.',
    apply: 'قدّم طلب العضوية',
  },
  en: {
    home: 'Home',
    committees: 'Committees',
    breadcrumb: 'Breadcrumb',
    leadership: 'Leadership',
    events: 'Events',
    articles: 'Articles',
    noEvents: 'No events from this committee right now.',
    noArticles: 'No articles from this committee yet.',
    allEvents: 'All events',
    allArticles: 'All articles',
    noDescription: 'The committee description is coming soon.',
    cta: (n: string) => `Want to contribute to ${n}?`,
    ctaLine: 'Apply for membership and tell us your interest.',
    apply: 'Apply for membership',
  },
} as const;

/** Public committee page (08-committees §2): description, leadership, events and articles, then a call to action. */
export default function CommitteeView({ committee, lang }: { committee: PublicCommittee; lang: Lang }) {
  const t = COPY[lang];
  const en = lang === 'en';
  const name = en ? committee.nameEn || committee.nameAr : committee.nameAr;
  const description = (en ? committee.descriptionEn : null) || committee.descriptionAr || '';
  const wrap = 'mx-auto w-full max-w-(--container) px-4 md:px-8';
  return (
    <>
      <SiteHeader />
      <main id="main">
        <div className={`${wrap} pt-6`}>
          <Breadcrumb
            label={t.breadcrumb}
            items={[{ label: t.home, href: '/' }, { label: t.committees, href: '/committees' }, { label: name }]}
          />
        </div>
        <header className={`${wrap} mt-8 flex items-start gap-5`}>
          <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-shape-lg bg-accent-soft text-on-accent-soft">
            <UsersRound className="size-8" />
          </span>
          <div className="flex flex-col gap-3">
            <h1 className="t-h1">{name}</h1>
            <p className="t-lede max-w-[60ch] whitespace-pre-line text-muted">{description || t.noDescription}</p>
          </div>
        </header>

        {committee.leaders.length > 0 && (
          <section aria-labelledby="c-lead" className={`${wrap} mt-(--section-gap)`}>
            <SectionHeader headingId="c-lead" title={t.leadership} />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {committee.leaders.map((l, i) => (
                <li key={`${l.roleKey}-${i}`}>
                  <Card variant="surface" className="flex items-center gap-4">
                    <Avatar name={l.name[lang]} size={56} />
                    <div className="flex flex-col">
                      <span className="t-label">{l.name[lang]}</span>
                      <span className="t-body-sm text-muted">{l.title?.[lang] ?? l.role[lang]}</span>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="c-events" className={`${wrap} mt-(--section-gap)`}>
          <SectionHeader
            headingId="c-events"
            title={t.events}
            action={
              <TextLink href="/events" variant="standalone" className="min-h-11">
                {t.allEvents}
              </TextLink>
            }
          />
          {committee.events.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {committee.events.map((e) => (
                <li key={e.slug}>
                  <Card variant="surface" interactive className="flex items-center gap-4">
                    {e.startDate && <DateChip date={e.startDate} lang={lang} variant="block" />}
                    <h3 className="t-h4">
                      <TextLink
                        href={`/events/${e.slug}`}
                        variant="nav"
                        className="text-text after:absolute after:inset-0 after:content-['']"
                      >
                        {en ? e.titleEn || e.titleAr : e.titleAr}
                      </TextLink>
                    </h3>
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <p className="t-body text-muted">{t.noEvents}</p>
          )}
        </section>

        <section aria-labelledby="c-articles" className={`${wrap} mt-(--section-gap)`}>
          <SectionHeader
            headingId="c-articles"
            title={t.articles}
            action={
              <TextLink href="/articles" variant="standalone" className="min-h-11">
                {t.allArticles}
              </TextLink>
            }
          />
          {committee.articles.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {committee.articles.map((a) => (
                <li key={a.slug}>
                  <Card variant="surface" interactive>
                    <h3 className="t-h4">
                      <TextLink
                        href={`/articles/${a.slug}`}
                        variant="nav"
                        className="text-text after:absolute after:inset-0 after:content-['']"
                      >
                        {en ? a.titleEn || a.titleAr : a.titleAr}
                      </TextLink>
                    </h3>
                  </Card>
                </li>
              ))}
            </ul>
          ) : (
            <p className="t-body text-muted">{t.noArticles}</p>
          )}
        </section>

        <SignedOutOnly>
          <div className={`${wrap} mt-(--section-gap)`}>
            <CtaBand
              title={t.cta(name)}
              line={t.ctaLine}
              action={
                <LinkButton href="/join" size="lg">
                  {t.apply}
                </LinkButton>
              }
            />
          </div>
        </SignedOutOnly>
      </main>
      <SiteFooter />
    </>
  );
}
