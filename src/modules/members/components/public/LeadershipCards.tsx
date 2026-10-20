import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardLink } from '@/components/ui/Card';
import { cn } from '@/components/ui/cn';
import { Link } from '@/i18n/navigation';
import type { LeadershipPerson } from '../../public';

type Lang = 'ar' | 'en';

const TOP_ROLES = ['community_leader', 'founder', 'advisor'];

/** The people at the top (leader, founders, advisors): a large card with the photo, the role over it and a short bio. */
export function LeaderCard({ person, lang }: { person: LeadershipPerson; lang: Lang }) {
  const name = lang === 'en' ? person.nameEn : person.nameAr;
  const role = lang === 'en' ? person.roleEn : person.roleAr;
  const bio = lang === 'en' ? person.bioEn : person.bioAr;
  const body = (
    <>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-accent-soft">
        {person.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.photo} alt="" className="size-full object-cover" loading="lazy" />
        ) : (
          <div aria-hidden="true" className="motif-dots flex size-full items-end justify-center text-line-accent">
            <Avatar name={name} size={120} className="mb-[-24px] ring-4 ring-surface" />
          </div>
        )}
        <span className="t-badge absolute start-3 top-3 rounded-full bg-surface px-3 py-1 font-semibold text-text shadow-(--elev-1)">
          {role}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-5">
        <h3 className="t-h4">{name}</h3>
        {bio && <p className="t-body-sm line-clamp-3 text-muted">{bio}</p>}
      </div>
    </>
  );
  return (
    <div className="m-reveal h-full"><Card variant="surface" interactive={!!person.memberId} className={cn("h-full overflow-hidden p-0")}>
      {person.memberId ? (
        <CardLink href={`/members/${person.memberId}`} className="block h-full">
          {body}
        </CardLink>
      ) : (
        body
      )}
    </Card></div>
  );
}

/** Committee heads and deputies: a small horizontal card. */
export function CommitteeLeadCard({ person, lang }: { person: LeadershipPerson; lang: Lang }) {
  const name = lang === 'en' ? person.nameEn : person.nameAr;
  const committee = lang === 'en' ? person.committeeEn : person.committeeAr;
  const role = lang === 'en' ? person.roleEn : person.roleAr;
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;
  const inner = (
    <div className="flex items-center gap-3">
      <Avatar name={name} src={person.thumb} size={56} />
      <div className="min-w-0 flex-1">
        <p className="t-body line-clamp-2 font-semibold">{name}</p>
        <p className="t-body-sm line-clamp-2 text-accent-text">{committee ?? role}</p>
      </div>
      {person.memberId && <Arrow aria-hidden="true" className="size-5 shrink-0 text-muted" />}
    </div>
  );
  return (
    <Card variant="surface" interactive={!!person.memberId} className="h-full p-3">
      {person.memberId ? (
        <Link href={`/members/${person.memberId}`} className="block focus-visible:outline-2 focus-visible:outline-focus-ring">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </Card>
  );
}

/** Splits the leadership into the top row and the committee heads, in the order the database returns them. */
export function splitLeadership(all: LeadershipPerson[]) {
  return {
    top: all.filter((p) => TOP_ROLES.includes(p.roleKey)),
    committee: all.filter((p) => !TOP_ROLES.includes(p.roleKey)),
  };
}
