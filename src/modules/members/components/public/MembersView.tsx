import { Search, X } from 'lucide-react';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { CtaBand } from '@/components/patterns/CtaBand';
import { SectionHeader } from '@/components/patterns/SectionHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button, LinkButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link } from '@/i18n/navigation';
import { SignedOutOnly } from '@/modules/home/SignedOutOnly';
import {
  PAGE_SIZE,
  type DirectoryMember,
  type LeadershipPerson,
} from '../../public';
import { MemberCard } from '../MemberCard';
import { MEMBERS_COPY } from './members-copy';

type Lang = 'ar' | 'en';

/** A link back to this page with some of the query changed (an empty value removes it). */
function hrefWith(
  base: { q: string; track: string; university: string; n: number },
  change: Partial<{ q: string; track: string; university: string; n: number }>,
) {
  const next = { ...base, ...change };
  const sp = new URLSearchParams();
  if (next.q) sp.set('q', next.q);
  if (next.track) sp.set('track', next.track);
  if (next.university) sp.set('university', next.university);
  if (next.n > PAGE_SIZE) sp.set('n', String(next.n));
  const qs = sp.toString();
  return qs ? `/members?${qs}` : '/members';
}

const selectClass =
  'min-h-12 w-full appearance-none rounded-shape-md border border-line-strong bg-field px-4 text-base text-text focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring';

/** Members directory (PUBLIC-SCREENS-V2/04-members.md): leadership, then the consent-filtered directory. */
export function MembersView({
  lang,
  leadership,
  members,
  total,
  options,
  query,
  hasAny,
}: {
  lang: Lang;
  leadership: LeadershipPerson[];
  members: DirectoryMember[];
  total: number;
  options: { tracks: string[]; universities: string[] };
  query: { q: string; track: string; university: string; n: number };
  hasAny: boolean;
}) {
  const t = MEMBERS_COPY[lang];
  const wrap = 'mx-auto w-full max-w-(--container) px-4 md:px-8';
  const filtered = !!(query.q || query.track || query.university);
  const name = (m: DirectoryMember) => (lang === 'en' ? m.nameEn : m.nameAr);

  return (
    <>
      <SiteHeader />
      <main id="main" className="pb-4">
        <div className={`${wrap} pt-6`}>
          <Breadcrumb
            label={t.breadcrumb}
            items={[{ label: t.home, href: '/' }, { label: t.members }]}
          />
          <h1 className="t-h1 mt-6">{t.members}</h1>
          <p className="t-lede mt-2 text-muted">{t.lede}</p>
        </div>

        {leadership.length > 0 && (
          <section aria-labelledby="m-lead" className={`${wrap} mt-(--section-gap)`}>
            <SectionHeader headingId="m-lead" title={t.leadership} />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {leadership.map((p) => {
                const n = lang === 'en' ? p.nameEn : p.nameAr;
                const bio = lang === 'en' ? p.bioEn : p.bioAr;
                return (
                  <li key={p.id}>
                    <Card variant="surface" className="flex h-full flex-col gap-3">
                      <Avatar name={n} size={56} />
                      <h3 className="t-h4">{n}</h3>
                      <p className="t-body-sm font-semibold text-accent-text">
                        {lang === 'en' ? p.roleEn : p.roleAr}
                      </p>
                      {bio && <p className="t-body-sm line-clamp-2 text-muted">{bio}</p>}
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section aria-labelledby="m-dir" className={`${wrap} mt-(--section-gap)`}>
          <SectionHeader headingId="m-dir" title={t.directory} />

          <form
            method="get"
            action={lang === 'en' ? '/en/members' : '/members'}
            role="search"
            aria-label={t.directory}
            className="grid gap-3 md:grid-cols-[1fr_200px_200px_auto]"
          >
            <label className="relative block">
              <span className="sr-only">{t.search}</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                name="q"
                defaultValue={query.q}
                placeholder={t.search}
                className={`${selectClass} ps-12`}
              />
            </label>
            <label>
              <span className="sr-only">{t.track}</span>
              <select name="track" defaultValue={query.track} className={selectClass}>
                <option value="">{`${t.track}: ${t.all}`}</option>
                {options.tracks.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">{t.university}</span>
              <select name="university" defaultValue={query.university} className={selectClass}>
                <option value="">{`${t.university}: ${t.all}`}</option>
                {options.universities.map((o) => (
                  <option key={o} value={o}>
                    {o}
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
              {(
                [
                  ['q', query.q],
                  ['track', query.track],
                  ['university', query.university],
                ] as const
              ).flatMap(([key, value]) =>
                value ? (
                  <Link
                    key={key}
                    href={hrefWith(query, { [key]: '', n: 0 })}
                    aria-label={t.removeFilter(value)}
                    className="t-body-sm inline-flex min-h-9 items-center gap-2 rounded-full bg-accent-soft px-4 font-semibold text-on-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    {value}
                    <X aria-hidden="true" className="size-4" />
                  </Link>
                ) : (
                  []
                ),
              )}
              <Link href="/members" className="t-body-sm min-h-11 content-center text-accent-text underline underline-offset-[3px]">
                {t.clear}
              </Link>
            </div>
          )}

          <p aria-live="polite" role="status" className="t-body-sm mt-4 tabular-nums text-muted">
            {t.count(total)}
          </p>

          {members.length > 0 ? (
            <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {members.map((m) => (
                <li key={m.id}>
                  <MemberCard
                    id={m.id}
                    lang={lang}
                    name={name(m)}
                    track={lang === 'en' ? (m.trackEn ?? m.trackAr) : m.trackAr}
                    photo={m.photo}
                  />
                </li>
              ))}
            </ul>
          ) : !hasAny ? (
            <EmptyState
              variant="no-data"
              title={t.emptyTitle}
              description={t.emptyBody}
              action={
                <SignedOutOnly>
                  <LinkButton href="/join" variant="secondary">
                    {t.ctaApply}
                  </LinkButton>
                </SignedOutOnly>
              }
            />
          ) : (
            <EmptyState
              variant="no-results"
              title={t.noResults}
              description={t.noResultsBody}
              action={
                <LinkButton href="/members" variant="secondary">
                  {t.clearFilters}
                </LinkButton>
              }
            />
          )}

          {total > members.length && (
            <div className="mt-8 flex justify-center">
              <LinkButton href={hrefWith(query, { n: query.n + PAGE_SIZE })} variant="secondary" size="lg">
                {t.more}
              </LinkButton>
            </div>
          )}
        </section>

        <SignedOutOnly>
          <div className={`${wrap} mt-(--section-gap)`}>
            <CtaBand
              title={t.ctaTitle}
              action={
                <LinkButton href="/join" size="lg">
                  {t.ctaApply}
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
