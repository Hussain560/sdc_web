import { PageMain } from '@/components/motion/PageMain';
import { Search, Users, X } from 'lucide-react';
import { FilterSelect, FilterSheet } from '@/components/patterns/FilterControls';
import { CtaBand } from '@/components/patterns/CtaBand';
import { SectionHeader } from '@/components/patterns/SectionHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { AvatarGroup } from '@/components/ui/Avatar';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button, LinkButton } from '@/components/ui/Button';
import { cn } from '@/components/ui/cn';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link } from '@/i18n/navigation';
import { SignedOutOnly } from '@/modules/home/SignedOutOnly';
import {
  PAGE_SIZE,
  type DirectoryFacets,
  type DirectoryMember,
  type DirectoryQuery,
  type LeadershipPerson,
  type PublicSkill,
} from '../../public';
import { DirectoryCard } from './DirectoryCard';
import { CommitteeLeadCard, LeaderCard, splitLeadership } from './LeadershipCards';
import { MEMBERS_COPY } from './members-copy';

type Lang = 'ar' | 'en';
type Query = Omit<DirectoryQuery, 'n'> & { n: number };

/** A link back to this page with some of the query changed (an empty value removes it). */
function hrefWith(base: Query, change: Partial<Query>) {
  const next = { ...base, ...change };
  const sp = new URLSearchParams();
  if (next.q) sp.set('q', next.q);
  if (next.skill) sp.set('skill', next.skill);
  if (next.committee) sp.set('committee', next.committee);
  if (next.track) sp.set('track', next.track);
  if (next.n > PAGE_SIZE) sp.set('n', String(next.n));
  const qs = sp.toString();
  return qs ? `/members?${qs}` : '/members';
}

const selectClass =
  'min-h-12 w-full appearance-none rounded-shape-md border border-line-strong bg-field px-4 text-base text-text focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring';

/**
 * Members directory (Sprint 17 design): a header with the live count, the skill band, leadership (with each person's
 * consent), then the filtered directory with removable filters and a live count. Search and filters live in the URL;
 * every control is a plain GET form, so it works without JavaScript. A member shows only what they chose to show.
 */
export function MembersView({
  lang,
  leadership,
  members,
  total,
  facets,
  skills,
  query,
  loadError,
}: {
  lang: Lang;
  leadership: LeadershipPerson[];
  members: DirectoryMember[];
  total: number;
  facets: DirectoryFacets;
  skills: Map<string, PublicSkill>;
  query: Query;
  /** The directory query failed: say so, with a retry, instead of an empty list. */
  loadError?: boolean;
}) {
  const t = MEMBERS_COPY[lang];
  const wrap = 'mx-auto w-full max-w-(--container) px-4 md:px-8';
  const action = lang === 'en' ? '/en/members' : '/members';
  const filtered = !!(query.q || query.skill || query.committee || query.track);
  const { top, committee } = splitLeadership(leadership);
  const skillName = (slug: string) => {
    const s = skills.get(slug);
    return s ? (lang === 'en' ? s.nameEn : s.nameAr) : slug;
  };
  const committeeName = (slug: string) => {
    const c = facets.committees.find((x) => x.slug === slug);
    return c ? (lang === 'en' ? c.nameEn : c.nameAr) : slug;
  };
  const chips: Array<[keyof Query, string]> = [
    ...(query.skill ? ([['skill', skillName(query.skill)]] as Array<[keyof Query, string]>) : []),
    ...(query.committee
      ? ([['committee', committeeName(query.committee)]] as Array<[keyof Query, string]>)
      : []),
    ...(query.track ? ([['track', query.track]] as Array<[keyof Query, string]>) : []),
  ];
  const activeFilters = chips.length;
  const hasAny = facets.total > 0;

  const search = (
    <label className="relative block flex-1">
      <span className="sr-only">{t.searchLabel}</span>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted"
      />
      <input
        type="search"
        name="q"
        defaultValue={query.q}
        placeholder={t.search}
        className={cn(selectClass, 'ps-12')}
      />
    </label>
  );
  const selects = (prefix: string, auto: boolean) => (
    <>
      <label>
        <span className="sr-only">{t.skill}</span>
        <FilterSelect
          name="skill"
          id={`${prefix}-skill`}
          defaultValue={query.skill}
          className={selectClass}
          auto={auto}
        >
          <option value="">{t.allSkills}</option>
          {facets.skills.map((s) => (
            <option key={s.slug} value={s.slug}>
              {lang === 'en' ? s.nameEn : s.nameAr}
            </option>
          ))}
        </FilterSelect>
      </label>
      <label>
        <span className="sr-only">{t.committee}</span>
        <FilterSelect
          name="committee"
          id={`${prefix}-committee`}
          defaultValue={query.committee}
          className={selectClass}
          auto={auto}
        >
          <option value="">{t.allCommittees}</option>
          {facets.committees.map((c) => (
            <option key={c.slug} value={c.slug}>
              {lang === 'en' ? c.nameEn : c.nameAr}
            </option>
          ))}
        </FilterSelect>
      </label>
      <label>
        <span className="sr-only">{t.track}</span>
        <FilterSelect
          name="track"
          id={`${prefix}-track`}
          defaultValue={query.track}
          className={selectClass}
          auto={auto}
        >
          <option value="">{t.allTracks}</option>
          {facets.tracks.map((x) => {
            const label = lang === 'en' ? x.nameEn : x.nameAr;
            return (
              <option key={x.nameAr} value={x.nameAr}>
                {label}
              </option>
            );
          })}
        </FilterSelect>
      </label>
    </>
  );

  const shownPeople = members.slice(0, 5).map((m) => ({
    name: lang === 'en' ? m.nameEn : m.nameAr,
    src: m.thumb,
  }));

  return (
    <>
      <SiteHeader />
      <PageMain className="pb-4">
        <div className={`${wrap} pt-6`}>
          <Breadcrumb
            label={t.breadcrumb}
            items={[{ label: t.home, href: '/' }, { label: t.members }]}
          />
        </div>

        <header className={`${wrap} m-enter mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between`}>
          <div className="flex max-w-3xl flex-col gap-3">
            <h1 className="t-display">{t.title}</h1>
            <p className="t-lede text-muted">{t.lede}</p>
          </div>
          {hasAny && (
            <div className="flex items-center gap-4">
              <AvatarGroup people={shownPeople} max={5} />
              <p className="t-body text-muted">
                {t.countLine(facets.total, facets.committees.length)}
              </p>
            </div>
          )}
        </header>

        {hasAny && facets.skills.length > 0 && (
          <section
            aria-labelledby="m-skills"
            className={`${wrap} mt-10`}
          >
            <div className="rounded-shape-2xl bg-band p-5 md:p-8">
              <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
                <h2 id="m-skills" className="t-h3 flex items-center gap-3">
                  <span aria-hidden="true" className="signal-dots" />
                  {t.skillsTitle}
                </h2>
                <p className="t-body-sm text-muted">{t.skillsHint}</p>
              </div>
              <ul className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
                {facets.skills.slice(0, 14).map((s) => {
                  const on = query.skill === s.slug;
                  return (
                    <li key={s.slug} className="shrink-0">
                      <Link
                        href={on ? hrefWith(query, { skill: '', n: PAGE_SIZE }) : hrefWith(query, { skill: s.slug, n: PAGE_SIZE })}
                        aria-current={on ? 'true' : undefined}
                        className={cn(
                          't-body-sm inline-flex min-h-11 items-center gap-2 rounded-full border px-4 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
                          on
                            ? 'border-accent bg-accent text-on-accent'
                            : 'border-line-strong bg-surface text-text hover:border-accent',
                        )}
                      >
                        {lang === 'en' ? s.nameEn : s.nameAr}
                        <span className={cn('tabular-nums', on ? 'text-on-accent' : 'text-muted')}>
                          {s.count}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}

        {top.length > 0 && (
          <section aria-labelledby="m-lead" className={`${wrap} mt-(--section-gap)`}>
            <SectionHeader headingId="m-lead" title={t.leadership} lede={t.leadershipLede} dots />
            <ul className="grid gap-5 md:grid-cols-3">
              {top.map((p) => (
                <li key={p.id}>
                  <LeaderCard person={p} lang={lang} />
                </li>
              ))}
            </ul>
            {committee.length > 0 && (
              <div className="mt-8">
                <h3 className="t-h4 mb-4 text-muted">{t.committeeLeads}</h3>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {committee.map((p) => (
                    <li key={p.id}>
                      <CommitteeLeadCard person={p} lang={lang} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
        {top.length === 0 && committee.length > 0 && (
          <section aria-labelledby="m-lead" className={`${wrap} mt-(--section-gap)`}>
            <SectionHeader headingId="m-lead" title={t.leadership} lede={t.leadershipLede} dots />
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {committee.map((p) => (
                <li key={p.id}>
                  <CommitteeLeadCard person={p} lang={lang} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="m-dir" className={`${wrap} mt-(--section-gap)`}>
          <SectionHeader headingId="m-dir" title={t.directory} dots />

          <form
            method="get"
            action={action}
            role="search"
            aria-label={t.directory}
            className="hidden gap-3 rounded-shape-xl border border-line bg-surface p-3 md:grid md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]"
          >
            {search}
            {selects('d', true)}
            <Button type="submit" size="lg">
              {t.apply}
            </Button>
          </form>
          <form
            method="get"
            action={action}
            role="search"
            aria-label={t.directory}
            className="sticky top-[72px] z-10 -mx-4 flex gap-2 bg-canvas px-4 py-2 md:hidden"
          >
            {search}
            <FilterSheet
              label={t.filters(0).replace(/\s*\(0\)/, '')}
              count={activeFilters}
              title={t.filtersTitle}
              apply={t.apply}
              closeLabel={t.close}
            >
              {selects('m', false)}
            </FilterSheet>
          </form>

          <div className="mt-4 flex min-h-10 flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {chips.map(([key, label]) => (
                <Link
                  key={key}
                  href={hrefWith(query, { [key]: '', n: PAGE_SIZE } as Partial<Query>)}
                  aria-label={t.removeFilter(label)}
                  className="t-body-sm inline-flex min-h-11 items-center gap-2 rounded-full bg-accent-soft px-4 font-semibold text-on-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  {label}
                  <X aria-hidden="true" className="size-4" />
                </Link>
              ))}
              {filtered && (
                <LinkButton href="/members" variant="ghost" size="sm">
                  {t.clear}
                </LinkButton>
              )}
            </div>
            {!loadError && (
              <p role="status" aria-live="polite" className="t-body-sm tabular-nums text-muted">
                {t.showing(members.length, total)}
              </p>
            )}
          </div>

          {loadError ? (
            <EmptyState
              className="mt-6"
              icon={<Users size={36} aria-hidden="true" />}
              title={t.loadError}
              description={t.loadErrorBody}
              action={
                <LinkButton href={hrefWith(query, {})} variant="secondary">
                  {t.retry}
                </LinkButton>
              }
            />
          ) : members.length > 0 ? (
            <>
              <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {members.map((m, i) => (
                  <li key={m.id}>
                    <DirectoryCard member={m} skills={skills} lang={lang} index={i} />
                  </li>
                ))}
              </ul>
              {members.length < total && (
                <div className="mt-8 flex justify-center">
                  <LinkButton
                    href={hrefWith(query, { n: query.n + PAGE_SIZE })}
                    variant="secondary"
                  >
                    {t.more}
                  </LinkButton>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              className="mt-6"
              icon={<Users size={36} aria-hidden="true" />}
              title={hasAny || filtered ? t.noResults : t.emptyTitle}
              description={hasAny || filtered ? t.noResultsBody : t.emptyBody}
              action={
                filtered ? (
                  <LinkButton href="/members" variant="secondary">
                    {t.clearFilters}
                  </LinkButton>
                ) : (
                  <SignedOutOnly>
                    <LinkButton href="/join">{t.ctaApply}</LinkButton>
                  </SignedOutOnly>
                )
              }
            />
          )}
        </section>

        <SignedOutOnly>
          <div className={`${wrap} mt-(--section-gap)`}>
            <CtaBand
              title={t.ctaTitle}
              line={t.ctaBody}
              action={<LinkButton href="/join">{t.ctaApply}</LinkButton>}
            />
          </div>
        </SignedOutOnly>
      </PageMain>
      <SiteFooter />
    </>
  );
}
