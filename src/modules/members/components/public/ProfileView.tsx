import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SectionHeader } from '@/components/patterns/SectionHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { TextLink } from '@/components/ui/TextLink';
import { ArticleCard } from '@/modules/articles/components/ArticleCard';
import type { PublicArticleCard } from '@/modules/articles/types';
import type { DirectoryMember } from '../../public';
import { MEMBERS_COPY } from './members-copy';
import { OwnProfileBar } from './OwnProfileBar';

/** Member profile (04-members §3). Every block renders only with data the member chose to make public. */
export function ProfileView({
  member,
  articles,
  lang,
}: {
  member: DirectoryMember;
  articles: PublicArticleCard[];
  lang: 'ar' | 'en';
}) {
  const t = MEMBERS_COPY[lang];
  const en = lang === 'en';
  const name = en ? member.nameEn : member.nameAr;
  const track = en ? (member.trackEn ?? member.trackAr) : member.trackAr;
  const status = en ? (member.statusEn ?? member.statusAr) : member.statusAr;
  const university = en ? (member.universityEn ?? member.universityAr) : member.universityAr;
  const major = en ? (member.majorEn ?? member.majorAr) : member.majorAr;
  const bio = (en ? member.bioEn : null) || member.bioAr;
  const links = [
    member.links.linkedin && { label: 'LinkedIn', href: member.links.linkedin },
    member.links.github && { label: 'GitHub', href: member.links.github },
    member.links.x && { label: 'X', href: member.links.x },
    member.links.portfolio && { label: t.portfolio, href: member.links.portfolio },
  ].filter((l): l is { label: string; href: string } => !!l);
  const wrap = 'mx-auto w-full max-w-(--container) px-4 md:px-8';

  return (
    <>
      <SiteHeader />
      <main id="main">
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

        <header className={`${wrap} mt-8`}>
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:text-start">
            <Avatar name={name} src={member.photo} size={120} />
            <div className="flex flex-col gap-2">
              <h1 className="t-h1">{name}</h1>
              {(track || status) && (
                <p className="t-lede">
                  {track && <span className="text-accent-text">{track}</span>}
                  {track && status && <span aria-hidden="true"> · </span>}
                  {status && <span className="text-muted">{status}</span>}
                </p>
              )}
              {(university || major) && (
                <p className="t-body text-muted">
                  {[university, major].filter(Boolean).join(' · ')}
                </p>
              )}
              {links.length > 0 && (
                <ul className="mt-2 flex flex-wrap justify-center gap-x-5 md:justify-start">
                  {links.map((l) => (
                    <li key={l.label}>
                      <TextLink
                        href={l.href}
                        external
                        externalLabel={t.newTab}
                        variant="standalone"
                        className="min-h-11"
                      >
                        {l.label}
                      </TextLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <OwnProfileBar memberId={member.id} edit={t.editProfile} note={t.ownNote} />
        </header>

        {bio && (
          <section aria-labelledby="p-bio" className={`${wrap} mt-(--section-gap)`}>
            <SectionHeader headingId="p-bio" title={t.about} className="mb-4" />
            <p className="t-body max-w-[70ch] whitespace-pre-line">{bio}</p>
          </section>
        )}

        {articles.length > 0 && (
          <section aria-labelledby="p-art" className={`${wrap} mt-(--section-gap)`}>
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

        <div className={`${wrap} mt-(--section-gap)`}>
          <TextLink href="/members" variant="standalone" className="min-h-11">
            {t.back}
          </TextLink>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
