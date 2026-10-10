import { ArrowLeft, ArrowRight, UsersRound } from 'lucide-react';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card, CardLink } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import type { PublicCommitteeCard } from '../../queries';

type Lang = 'ar' | 'en';

const COPY = {
  ar: {
    home: 'الرئيسية',
    title: 'اللجان',
    lede: 'فرق تطوعية تقود عمل المجتمع، لكل منها مجال واضح.',
    breadcrumb: 'مسار التنقل',
    events: (n: number) => `${n} فعالية`,
    lead: 'القائد',
    empty: 'لا توجد لجان معروضة الآن',
  },
  en: {
    home: 'Home',
    title: 'Committees',
    lede: 'Volunteer teams that run the community, each with a clear focus.',
    breadcrumb: 'Breadcrumb',
    events: (n: number) => `${n} events`,
    lead: 'Lead',
    empty: 'No committees to show right now',
  },
} as const;

/** Committees index (08-committees §1): one card per active committee. */
export function CommitteesIndexView({ lang, committees }: { lang: Lang; committees: PublicCommitteeCard[] }) {
  const t = COPY[lang];
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;
  const wrap = 'mx-auto w-full max-w-(--container) px-4 md:px-8';
  return (
    <>
      <SiteHeader />
      <main id="main">
        <div className={`${wrap} pt-6`}>
          <Breadcrumb label={t.breadcrumb} items={[{ label: t.home, href: '/' }, { label: t.title }]} />
          <h1 className="t-h1 mt-6">{t.title}</h1>
          <p className="t-lede mt-2 text-muted">{t.lede}</p>
        </div>
        <section className={`${wrap} mt-10`} aria-label={t.title}>
          {committees.length === 0 ? (
            <EmptyState variant="no-data" title={t.empty} />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {committees.map((c) => {
                const name = lang === 'en' && c.nameEn ? c.nameEn : c.nameAr;
                const about = (lang === 'en' ? c.descriptionEn : null) || c.descriptionAr;
                const lead = lang === 'en' ? c.leadEn : c.leadAr;
                return (
                  <li key={c.slug}>
                    <Card variant="surface" interactive className="flex h-full flex-col gap-3">
                      <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-shape-md bg-accent-soft text-on-accent-soft">
                        <UsersRound className="size-6" />
                      </span>
                      <h2 className="t-h4">
                        <CardLink href={`/committees/${c.slug}`}>{name}</CardLink>
                      </h2>
                      {about && <p className="t-body-sm line-clamp-2 text-muted">{about}</p>}
                      {lead && (
                        <p className="t-body-sm text-muted">
                          {t.lead}: <span className="text-text">{lead}</span>
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="t-caption tabular-nums text-muted">{t.events(c.events)}</span>
                        <Arrow aria-hidden="true" className="size-5 text-accent-text" />
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
