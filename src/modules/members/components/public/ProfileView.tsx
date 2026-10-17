import { ExternalLink } from 'lucide-react';
import { ViewTransition } from 'react';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SectionHeader } from '@/components/patterns/SectionHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card } from '@/components/ui/Card';
import { LinkButton } from '@/components/ui/Button';
import { TextLink } from '@/components/ui/TextLink';
import { Link } from '@/i18n/navigation';
import { ArticleCard } from '@/modules/articles/components/ArticleCard';
import type { PublicArticleCard } from '@/modules/articles/types';
import type { DirectoryMember, ProfileExtras, PublicSkill } from '../../public';
import { DirectoryCard } from './DirectoryCard';
import { MEMBERS_COPY, OPEN_TO_LABEL } from './members-copy';
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

/**
 * Member profile (Sprint 17 design): a header with the photo, name, headline and the committee line, a stat row,
 * about, skills, projects, events, articles and similar members. Every block renders only with data the member chose
 * to make public; a member with only a name still gets a complete page with a "meet other members" invitation.
 */
export function ProfileView({
  member,
  extras,
  articles,
  allSkills,
  lang,
}: {
  member: DirectoryMember;
  extras: ProfileExtras;
  articles: PublicArticleCard[];
  allSkills: Map<string, PublicSkill>;
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
  const sectionGap = `${wrap} mt-(--section-gap)`;
  const dateFmt = new Intl.DateTimeFormat(en ? 'en' : 'ar-SA-u-ca-gregory', {
    year: 'numeric',
    month: 'short',
  });
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

  return (
    <>
      <SiteHeader />
      <main id="main" className="pb-4">
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

        <header className={`${wrap} m-enter mt-8`}>
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:text-start">
            <ViewTransition name={`member-photo-${member.id}`} share="auto" default="none">
              <Avatar name={name} src={member.photo} size={120} className="ring-4 ring-surface" />
            </ViewTransition>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-2 md:items-start">
              <ViewTransition name={`member-name-${member.id}`} share="auto" default="none">
                <h1 className="t-h1">{name}</h1>
              </ViewTransition>
              {headline && <p className="t-lede">{headline}</p>}
              {member.committees.length > 0 && (
                <ul className="flex flex-wrap justify-center gap-2 md:justify-start" aria-label={t.committee}>
                  {member.committees.map((c) => (
                    <li
                      key={c.slug}
                      className="t-body-sm rounded-full bg-accent-soft px-3 py-1 font-semibold text-on-accent-soft"
                    >
                      {en ? `${c.nameEn} · ${c.roleEn}` : `${c.nameAr} · ${c.roleAr}`}
                    </li>
                  ))}
                </ul>
              )}
              {(track || study) && (
                <p className="t-body text-muted">{[track, study].filter(Boolean).join(' · ')}</p>
              )}
              {open.length > 0 && (
                <ul className="flex flex-wrap justify-center gap-3 md:justify-start">
                  {open.map((o) => (
                    <li key={o} className="t-body-sm inline-flex items-center gap-1.5 font-semibold text-accent-text">
                      <span aria-hidden="true" className="size-2 rounded-full bg-signal" />
                      {o}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap justify-center gap-3">
              <ShareButton label={t.share} doneLabel={t.shared} title={name} />
            </div>
          </div>
          {links.length > 0 && (
            <ul className="mt-5 flex flex-wrap justify-center gap-x-5 md:justify-start">
              {links.map((l) => (
                <li key={l.key}>
                  <TextLink href={l.href} external externalLabel={t.newTab} variant="standalone" className="min-h-11">
                    {l.label}
                  </TextLink>
                </li>
              ))}
            </ul>
          )}
          <OwnProfileBar memberId={member.id} edit={t.editProfile} note={t.ownNote} />
        </header>

        {stats.length > 0 && (
          <dl className={`${wrap} m-in mt-8 grid grid-cols-2 gap-3 md:grid-cols-4`}>
            {stats.map(([label, value]) => (
              <div key={label} className="rounded-shape-xl border border-line bg-surface p-4 text-center">
                <dd className="t-h3 tabular-nums">{value}</dd>
                <dt className="t-body-sm text-muted">{label}</dt>
              </div>
            ))}
          </dl>
        )}

        {bio && (
          <section aria-labelledby="p-bio" className={sectionGap}>
            <SectionHeader headingId="p-bio" title={t.about} className="mb-4" />
            <p className="t-body max-w-[70ch] whitespace-pre-line">{bio}</p>
          </section>
        )}

        {extras.skills.length > 0 && (
          <section aria-labelledby="p-skills" className={sectionGap}>
            <SectionHeader headingId="p-skills" title={t.skills} className="mb-4" />
            <ul className="flex flex-wrap gap-2">
              {extras.skills.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/members?skill=${s.slug}`}
                    aria-label={t.seeSkill(en ? s.nameEn : s.nameAr)}
                    className="t-body-sm inline-flex min-h-11 items-center rounded-full border border-line-strong bg-surface px-4 font-semibold hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  >
                    {en ? s.nameEn : s.nameAr}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {extras.projects.length > 0 && (
          <section aria-labelledby="p-proj" className={sectionGap}>
            <SectionHeader headingId="p-proj" title={t.projects} />
            <ul className="grid gap-5 md:grid-cols-2">
              {extras.projects.map((p) => {
                const title = en ? (p.titleEn ?? p.titleAr) : p.titleAr;
                const desc = en ? (p.descriptionEn ?? p.descriptionAr) : p.descriptionAr;
                return (
                  <li key={p.id}>
                    <Card variant="surface" className="m-in flex h-full flex-col gap-3 overflow-hidden p-0">
                      {p.cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.cover} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" />
                      )}
                      <div className="flex flex-1 flex-col gap-2 p-5">
                        <h3 className="t-h4">{title}</h3>
                        {desc && <p className="t-body-sm text-muted">{desc}</p>}
                        <TextLink
                          href={p.url}
                          external
                          externalLabel={t.newTab}
                          variant="standalone"
                          className="mt-auto min-h-11"
                        >
                          {t.visitProject}
                          <ExternalLink aria-hidden="true" className="ms-1 inline size-4" />
                        </TextLink>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {extras.events.length > 0 && (
          <section aria-labelledby="p-events" className={sectionGap}>
            <SectionHeader headingId="p-events" title={t.events} lede={t.eventsNote} />
            <ul className="grid gap-3 md:grid-cols-2">
              {extras.events.map((e) => (
                <li key={e.eventId}>
                  <Card variant="surface" interactive className="p-4">
                    <Link
                      href={`/events/${e.slug}`}
                      className="flex items-center justify-between gap-3 focus-visible:outline-2 focus-visible:outline-focus-ring"
                    >
                      <span className="min-w-0">
                        <span className="t-body block font-semibold">
                          {en ? (e.titleEn ?? e.titleAr) : e.titleAr}
                        </span>
                        {e.startDate && (
                          <span className="t-body-sm block text-muted">
                            {dateFmt.format(new Date(e.startDate))}
                          </span>
                        )}
                      </span>
                      <span className="t-badge shrink-0 rounded-full bg-surface-raised px-3 py-1">
                        {e.role === 'presenter' ? t.presenter : t.attended}
                      </span>
                    </Link>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        )}

        {articles.length > 0 && (
          <section aria-labelledby="p-art" className={sectionGap}>
            <SectionHeader headingId="p-art" title={t.articles} />
            <ul className="grid gap-4 md:grid-cols-2">
              {articles.map((a) => (
                <li key={a.id}>
                  <ArticleCard article={a} lang={lang} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {extras.similar.length > 0 && (
          <section aria-labelledby="p-sim" className={sectionGap}>
            <SectionHeader headingId="p-sim" title={sparse ? t.meetOthers : t.similar} />
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {extras.similar.map((m, i) => (
                <li key={m.id}>
                  <DirectoryCard member={m} skills={allSkills} lang={lang} index={i} />
                </li>
              ))}
            </ul>
          </section>
        )}
        {sparse && extras.similar.length === 0 && (
          <section aria-labelledby="p-more" className={sectionGap}>
            <SectionHeader headingId="p-more" title={t.meetOthers} />
            <LinkButton href="/members" variant="secondary">
              {t.members}
            </LinkButton>
          </section>
        )}

        <div className={sectionGap}>
          <TextLink href="/members" variant="standalone" className="min-h-11">
            {t.back}
          </TextLink>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
