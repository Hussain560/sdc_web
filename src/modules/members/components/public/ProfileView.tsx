import { PageMain } from '@/components/motion/PageMain';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { ViewTransition } from 'react';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { CapsuleCover } from '@/components/patterns/CapsuleMark';
import { Avatar } from '@/components/ui/Avatar';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { LinkButton } from '@/components/ui/Button';
import { cn } from '@/components/ui/cn';
import { TextLink } from '@/components/ui/TextLink';
import { Link } from '@/i18n/navigation';
import { articleTitle } from '@/modules/articles/types';
import { formatDate } from '@/lib/format';
import type { PublicArticleCard } from '@/modules/articles/types';
import type { DirectoryMember, ProfileExtras, PublicSkill } from '../../public';
import { MEMBERS_COPY, OPEN_TO_LABEL, SKILL_CATEGORY_LABEL } from './members-copy';
import { OwnProfileBar } from './OwnProfileBar';
import { ShareButton } from './ShareButton';

const LINK_LABELS: Array<[keyof DirectoryMember['links'], string, string]> = [
  ['linkedin', 'LinkedIn', 'LinkedIn'],
  ['github', 'GitHub', 'GitHub'],
  ['x', 'X', 'X'],
  ['portfolio', 'الموقع الشخصي', 'Portfolio'],
  ['website', 'الموقع', 'Website'],
  ['behance', 'Behance', 'Behance'],
  ['dribbble', 'Dribbble', 'Dribbble'],
  ['youtube', 'YouTube', 'YouTube'],
];

function Title({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="t-h3 mb-5 flex items-center gap-3">
      <span aria-hidden="true" className="signal-dots" />
      {children}
    </h2>
  );
}

/**
 * Member profile (Sprint 17 design): a header with the photo, name, headline and the committee line, a stat row,
 * about, skills, projects, events, articles and similar members. Every block renders only with data the member chose
 * to make public; a member with only a name still gets a complete page with a "meet other members" invitation.
 */
export function ProfileView({
  member,
  extras,
  articles,
  lang,
}: {
  member: DirectoryMember;
  extras: ProfileExtras;
  articles: PublicArticleCard[];
  lang: 'ar' | 'en';
}) {
  const t = MEMBERS_COPY[lang];
  const en = lang === 'en';
  const name = en ? member.nameEn : member.nameAr;
  const headline = en ? (member.headlineEn ?? member.headlineAr) : member.headlineAr;
  const bio = (en ? member.bioEn : null) || member.bioAr;
  const track = en ? (member.trackEn ?? member.trackAr) : member.trackAr;
  const university = en ? (member.universityEn ?? member.universityAr) : member.universityAr;
  const major = en ? (member.majorEn ?? member.majorAr) : member.majorAr;
  const status = en ? (member.statusEn ?? member.statusAr) : member.statusAr;
  const study = [university, major, status].filter(Boolean).join(' · ');
  const links = LINK_LABELS.flatMap(([key, ar, enLabel]) => {
    const href = member.links[key];
    return href ? [{ key, label: en ? enLabel : ar, href }] : [];
  });
  const open = member.openTo.flatMap((k) => {
    const l = OPEN_TO_LABEL[k]?.[lang];
    return l ? [l] : [];
  });
  const year = member.joinedAt ? new Date(member.joinedAt).getFullYear() : null;
  const sparse = !bio && extras.skills.length === 0 && extras.projects.length === 0;
  const wrap = 'mx-auto w-full max-w-(--container) px-4 md:px-8';
  const stats: Array<[string, string]> = [
    ...(year ? ([[t.sinceStat, String(year)]] as Array<[string, string]>) : []),
    ...(extras.projects.length ? ([[t.projectsStat, String(extras.projects.length)]] as Array<[string, string]>) : []),
    ...(articles.length ? ([[t.articlesStat, String(articles.length)]] as Array<[string, string]>) : []),
    ...(extras.events.length ? ([[t.eventsStat, String(extras.events.length)]] as Array<[string, string]>) : []),
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name,
      ...(headline ? { description: headline } : {}),
      ...(member.photo ? { image: member.photo } : {}),
      ...(links.length ? { sameAs: links.map((l) => l.href) } : {}),
    },
  };

  const Arrow = en ? ArrowRight : ArrowLeft;
  const monthFmt = new Intl.DateTimeFormat(en ? 'en' : 'ar-SA-u-ca-gregory', {
    month: 'long',
    year: 'numeric',
  });
  const dayFmt = new Intl.DateTimeFormat(en ? 'en' : 'ar-SA-u-ca-gregory', { day: '2-digit' });
  const monShort = new Intl.DateTimeFormat(en ? 'en' : 'ar-SA-u-ca-gregory', { month: 'short' });

  // Skills grouped by category, in the order the member put them.
  const byCategory: Array<[string, PublicSkill[]]> = [];
  for (const s of extras.skills) {
    const row = byCategory.find(([c]) => c === s.category);
    if (row) row[1].push(s);
    else byCategory.push([s.category, [s]]);
  }
  const topSkill = extras.skills[0];

  const panel = 'rounded-shape-xl border border-line bg-surface p-5 md:p-7';

  const communityPanel = member.committees.length > 0 && (
    <section aria-labelledby="p-comm" className={panel}>
      <Title id="p-comm">{t.inCommunity}</Title>
      <ul className="flex flex-col gap-4">
        {member.committees.map((c) => (
          <li key={c.slug} className="flex items-start gap-3">
            <span aria-hidden="true" className="mt-2 size-2.5 shrink-0 rounded-full bg-signal" />
            <div className="min-w-0">
              <p className="t-body font-semibold">{en ? c.nameEn : c.nameAr}</p>
              <p className="t-body-sm text-muted">
                {en ? c.roleEn : c.roleAr}
                {c.since && ` · ${t.since} ${monthFmt.format(new Date(c.since))}`}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );

  const similarPanel = extras.similar.length > 0 && (
    <section aria-labelledby="p-sim" className={panel}>
      <Title id="p-sim">{sparse ? t.meetOthers : t.similar}</Title>
      <ul className="flex gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {extras.similar.map((m) => {
          const n = en ? m.nameEn : m.nameAr;
          const line = en ? (m.headlineEn ?? m.headlineAr) : m.headlineAr;
          return (
            <li key={m.id} className="shrink-0 lg:shrink">
              <Link
                href={`/members/${m.id}`}
                className="flex items-center gap-3 rounded-full border border-line-strong py-1.5 pe-5 ps-1.5 hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring lg:rounded-none lg:border-0 lg:p-0"
              >
                <Avatar name={n} src={m.thumb} size={40} />
                <span className="min-w-0">
                  <span className="t-body-sm block font-semibold">{n}</span>
                  {line && (
                    <span className="t-caption hidden truncate text-muted lg:block">{line}</span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {topSkill && (
        <Link
          href={`/members?skill=${topSkill.slug}`}
          className="t-body-sm mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-accent-text hover:underline"
        >
          {t.seeSkill(en ? topSkill.nameEn : topSkill.nameAr)}
          <Arrow aria-hidden="true" className="size-4" />
        </Link>
      )}
    </section>
  );

  return (
    <>
      <SiteHeader />
      <PageMain className="pb-4">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        <div className={`${wrap} pt-6`}>
          <Breadcrumb
            label={t.breadcrumb}
            items={[
              { label: t.home, href: '/' },
              { label: t.members, href: '/members' },
              { label: name },
            ]}
          />
        </div>

        <header className={`${wrap} m-enter mt-6`}>
          <div className="overflow-hidden rounded-shape-2xl border border-line bg-surface">
            <div aria-hidden="true" className="relative h-28 overflow-hidden bg-accent-soft md:h-36">
              <div
                className="absolute inset-0 opacity-45"
                style={{
                  backgroundImage: 'url("/assets/P3%202.png")',
                  backgroundRepeat: 'repeat',
                  backgroundSize: '140px auto',
                  backgroundPosition: 'center',
                }}
              />
            </div>
            <div className="px-5 pb-6 md:px-8">
              <div className="-mt-14 flex flex-col items-center gap-4 text-center md:flex-row md:items-start md:gap-6 md:text-start">
                <ViewTransition name={`member-photo-${member.id}`} share="morph" default="none">
                  <Avatar
                    name={name}
                    src={member.photo}
                    size={120}
                    className="shrink-0 ring-4 ring-surface"
                  />
                </ViewTransition>
                <div className="flex min-w-0 flex-1 flex-col items-center gap-2 md:mt-16 md:items-start">
                  <ViewTransition name={`member-name-${member.id}`} share="morph" default="none">
                    <h1 className="t-h1">{name}</h1>
                  </ViewTransition>
                  {headline && <p className="t-lede">{headline}</p>}
                  {member.committees[0] && (
                    <p className="t-body-sm text-muted">
                      {en ? member.committees[0].nameEn : member.committees[0].nameAr}
                      {' · '}
                      {en ? member.committees[0].roleEn : member.committees[0].roleAr}
                    </p>
                  )}
                  {(track || study) && (
                    <p className="t-body-sm text-muted">
                      {[track, study].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {open.length > 0 && (
                    <ul className="mt-1 flex flex-wrap justify-center gap-2 md:justify-start">
                      {open.map((o) => (
                        <li
                          key={o}
                          className="t-body-sm inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 font-semibold text-on-accent-soft"
                        >
                          <span aria-hidden="true" className="size-2 rounded-full bg-signal" />
                          {o}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex shrink-0 justify-center md:mt-16">
                  <ShareButton label={t.share} doneLabel={t.shared} title={name} />
                </div>
              </div>
              {links.length > 0 && (
                <ul className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
                  {links.map((l) => (
                    <li key={l.key}>
                      <TextLink
                        href={l.href}
                        external
                        externalLabel={t.newTab}
                        variant="standalone"
                        className="t-body-sm min-h-11 rounded-full border border-line-strong px-4 hover:border-accent"
                      >
                        {l.label}
                      </TextLink>
                    </li>
                  ))}
                </ul>
              )}
              <OwnProfileBar memberId={member.id} edit={t.editProfile} note={t.ownNote} />
            </div>
            {stats.length > 0 && (
              <dl
                className={cn(
                  'grid divide-x divide-line border-t border-line rtl:divide-x-reverse',
                  stats.length === 1 && 'grid-cols-1',
                  stats.length === 2 && 'grid-cols-2',
                  stats.length === 3 && 'grid-cols-3',
                  stats.length >= 4 && 'grid-cols-4',
                )}
              >
                {stats.map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-1 px-4 py-4 text-start md:px-8">
                    <dd className="t-h2 tabular-nums">{value}</dd>
                    <dt className="t-body-sm text-muted">{label}</dt>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </header>

        <div className={`${wrap} mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]`}>
          <div className="flex min-w-0 flex-col gap-6">
            {bio && (
              <section aria-labelledby="p-bio" className={panel}>
                <Title id="p-bio">{t.about}</Title>
                <p className="t-body max-w-[70ch] whitespace-pre-line">{bio}</p>
              </section>
            )}

            {byCategory.length > 0 && (
              <section aria-labelledby="p-skills" className={panel}>
                <Title id="p-skills">{t.skills}</Title>
                <ul className="divide-y divide-line">
                  {byCategory.map(([cat, list]) => (
                    <li
                      key={cat}
                      className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 md:flex-row md:items-center md:gap-6"
                    >
                      <span className="t-body-sm font-semibold text-muted md:w-28 md:shrink-0">
                        {SKILL_CATEGORY_LABEL[cat]?.[lang] ?? cat}
                      </span>
                      <ul className="flex flex-wrap gap-2">
                        {list.map((s) => (
                          <li key={s.slug}>
                            <Link
                              href={`/members?skill=${s.slug}`}
                              aria-label={t.seeSkill(en ? s.nameEn : s.nameAr)}
                              className="t-body-sm inline-flex min-h-9 items-center rounded-full bg-surface-raised px-4 font-semibold hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                            >
                              {en ? s.nameEn : s.nameAr}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {extras.projects.length > 0 && (
              <section aria-labelledby="p-proj" className={panel}>
                <Title id="p-proj">{t.projects}</Title>
                <ul className="flex snap-x gap-4 overflow-x-auto pb-1 md:grid md:grid-cols-2 md:overflow-visible md:pb-0">
                  {extras.projects.map((p) => {
                    const title = en ? (p.titleEn ?? p.titleAr) : p.titleAr;
                    const desc = en ? (p.descriptionEn ?? p.descriptionAr) : p.descriptionAr;
                    const github = /^https:\/\/(www\.)?github\.com\//.test(p.url);
                    return (
                      <li key={p.id} className="w-[85%] shrink-0 snap-start md:w-auto">
                        <div className="m-in flex h-full flex-col overflow-hidden rounded-shape-xl border border-line bg-surface-raised">
                          <div className="aspect-[16/9] w-full overflow-hidden">
                            {p.cover ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.cover} alt="" className="size-full object-cover" loading="lazy" />
                            ) : (
                              <CapsuleCover />
                            )}
                          </div>
                          <div className="flex flex-1 flex-col gap-2 p-4">
                            <h3 className="t-h4">{title}</h3>
                            {desc && <p className="t-body-sm text-muted">{desc}</p>}
                            <TextLink
                              href={p.url}
                              external
                              externalLabel={t.newTab}
                              variant="standalone"
                              className="mt-auto min-h-11"
                            >
                              <ExternalLink aria-hidden="true" className="me-1 inline size-4" />
                              {github ? t.codeOnGithub : t.visitProject}
                            </TextLink>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <div className="lg:hidden">{communityPanel}</div>

            {articles.length > 0 && (
              <section aria-labelledby="p-art" className={panel}>
                <Title id="p-art">{t.articles}</Title>
                <ul className="divide-y divide-line">
                  {articles.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/articles/${a.slug}`}
                        className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0 focus-visible:outline-2 focus-visible:outline-focus-ring"
                      >
                        <span className="min-w-0">
                          <span className="t-body block font-semibold">
                            {articleTitle(a, lang)}
                          </span>
                          <span className="t-body-sm block text-muted">
                            {formatDate(a.publishedAt, lang)} · {a.readingMinutes}{' '}
                            {en ? 'min read' : 'د قراءة'}
                          </span>
                        </span>
                        <Arrow aria-hidden="true" className="size-5 shrink-0 text-accent-text" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {extras.events.length > 0 && (
              <section aria-labelledby="p-events" className={panel}>
                <div className="mb-5 flex items-baseline justify-between gap-3">
                  <h2 id="p-events" className="t-h3 flex items-center gap-3">
                    <span aria-hidden="true" className="signal-dots" />
                    {t.events}
                  </h2>
                  <p className="t-caption text-muted">{t.eventsNote}</p>
                </div>
                <ul className="divide-y divide-line">
                  {extras.events.map((e) => (
                    <li key={e.eventId}>
                      <Link
                        href={`/events/${e.slug}`}
                        className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 focus-visible:outline-2 focus-visible:outline-focus-ring"
                      >
                        {e.startDate && (
                          <span
                            aria-hidden="true"
                            className="flex size-14 shrink-0 flex-col items-center justify-center rounded-shape-md bg-accent-soft text-on-accent-soft"
                          >
                            <span className="t-h4 leading-none tabular-nums">
                              {dayFmt.format(new Date(e.startDate))}
                            </span>
                            <span className="t-caption">{monShort.format(new Date(e.startDate))}</span>
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="t-body block font-semibold">
                            {en ? (e.titleEn ?? e.titleAr) : e.titleAr}
                          </span>
                          {(en ? (e.locationEn ?? e.locationAr) : e.locationAr) && (
                            <span className="t-body-sm block text-muted">
                              {en ? (e.locationEn ?? e.locationAr) : e.locationAr}
                            </span>
                          )}
                        </span>
                        <span className="t-badge shrink-0 rounded-full bg-accent-soft px-3 py-1 text-on-accent-soft">
                          {e.role === 'presenter' ? t.presenter : t.attended}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="lg:hidden">{similarPanel}</div>
            {sparse && extras.similar.length === 0 && (
              <section aria-labelledby="p-more" className={panel}>
                <Title id="p-more">{t.meetOthers}</Title>
                <LinkButton href="/members" variant="secondary">
                  {t.members}
                </LinkButton>
              </section>
            )}
          </div>

          <aside className="hidden flex-col gap-6 lg:flex">
            {communityPanel}
            {similarPanel}
          </aside>
        </div>

        <div className={`${wrap} mt-8`}>
          <TextLink href="/members" variant="standalone" className="min-h-11">
            <Arrow aria-hidden="true" className="me-2 inline size-4" />
            {t.back}
          </TextLink>
        </div>
      </PageMain>
      <SiteFooter />
    </>
  );
}
