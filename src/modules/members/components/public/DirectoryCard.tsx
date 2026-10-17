import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ViewTransition } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardLink } from '@/components/ui/Card';
import type { DirectoryMember, PublicSkill } from '../../public';
import { MEMBERS_COPY, OPEN_TO_LABEL } from './members-copy';

type Lang = 'ar' | 'en';

/**
 * A member in the directory (Sprint 17 design): photo or initials, name as the one link of the card, headline,
 * committee and position, the first three skills, and what they are open to. Everything shown is something the member
 * chose to show; with only a name it is still a complete card. The photo and the name carry view-transition names so
 * opening the profile moves them into the profile header.
 */
export function DirectoryCard({
  member,
  skills,
  lang,
  index = 0,
}: {
  member: DirectoryMember;
  /** The skill catalogue (to turn slugs into names). */
  skills: Map<string, PublicSkill>;
  lang: Lang;
  /** Position in the grid: the first eight cards enter one after another. */
  index?: number;
}) {
  const t = MEMBERS_COPY[lang];
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;
  const name = lang === 'en' ? member.nameEn : member.nameAr;
  const headline = lang === 'en' ? (member.headlineEn ?? member.headlineAr) : member.headlineAr;
  const top = member.committees[0];
  const committeeLine = top
    ? lang === 'en'
      ? `${top.nameEn} · ${top.roleEn}`
      : `${top.nameAr} · ${top.roleAr}`
    : null;
  const chosen = member.skillSlugs.flatMap((s) => {
    const k = skills.get(s);
    return k ? [lang === 'en' ? k.nameEn : k.nameAr] : [];
  });
  const shown = chosen.slice(0, 3);
  const rest = chosen.length - shown.length;
  const open = member.openTo[0] ? OPEN_TO_LABEL[member.openTo[0]]?.[lang] : null;

  return (
    <Card
      variant="surface"
      interactive
      style={{ '--i': Math.min(index, 8) } as React.CSSProperties}
      className="m-in relative flex h-full flex-col items-center gap-3 overflow-hidden p-0 pb-5 text-center"
    >
      <div aria-hidden="true" className="motif-dots h-16 w-full bg-accent-soft text-line-accent" />
      <ViewTransition name={`member-photo-${member.id}`} share="morph" default="none">
        <Avatar
          name={name}
          src={member.thumb ?? member.photo}
          size={120}
          className="-mt-12 ring-4 ring-surface"
        />
      </ViewTransition>
      <div className="flex min-w-0 flex-1 flex-col items-center gap-2 px-4">
        <h3 className="t-h4 line-clamp-2">
          <ViewTransition name={`member-name-${member.id}`} share="morph" default="none">
            <CardLink href={`/members/${member.id}`}>{name}</CardLink>
          </ViewTransition>
        </h3>
        {headline && <p className="t-body-sm line-clamp-2 text-muted">{headline}</p>}
        {committeeLine && (
          <p className="t-body-sm line-clamp-1 font-semibold text-accent-text">{committeeLine}</p>
        )}
        {shown.length > 0 && (
          <ul className="mt-1 flex flex-wrap justify-center gap-1.5" aria-label={t.skills}>
            {shown.map((s) => (
              <li
                key={s}
                className="t-badge rounded-full bg-surface-raised px-2.5 py-1 text-text"
              >
                {s}
              </li>
            ))}
            {rest > 0 && (
              <li className="t-badge rounded-full bg-surface-raised px-2.5 py-1 text-muted">
                {t.moreSkills(rest)}
              </li>
            )}
          </ul>
        )}
      </div>
      <div className="mt-2 flex w-full items-center justify-between gap-3 px-4">
        <span
          aria-hidden="true"
          className="m-arrow flex size-10 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line-strong text-text"
        >
          <Arrow className="size-5" />
        </span>
        {open && (
          <span className="t-body-sm inline-flex items-center gap-1.5 font-semibold text-accent-text">
            <span aria-hidden="true" className="size-2 rounded-full bg-signal" />
            {open}
          </span>
        )}
      </div>
    </Card>
  );
}
