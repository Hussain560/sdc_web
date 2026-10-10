import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardLink } from '@/components/ui/Card';

/**
 * Directory card (components §3.1 `member`): avatar, name as the card's one link, track, and a round arrow. Only
 * what the public directory view already exposes (name and track); a photo needs the member's opt-in, so
 * initials are shown until the consent model (RDS-020) supplies one.
 */
export function MemberCard({
  id,
  name,
  track,
  lang,
}: {
  id: string;
  name: string;
  track: string | null;
  lang: 'ar' | 'en';
}) {
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;
  return (
    <Card variant="surface" interactive className="flex flex-col items-center gap-3 text-center">
      <Avatar name={name} size={72} />
      <h3 className="t-h4 line-clamp-2">
        <CardLink href={`/members/${id}`}>{name}</CardLink>
      </h3>
      {track && <p className="t-body-sm text-accent-text">{track}</p>}
      <span
        aria-hidden="true"
        className="mt-1 flex size-10 items-center justify-center rounded-full border-[1.5px] border-line-strong text-text"
      >
        <Arrow className="size-5" />
      </span>
    </Card>
  );
}
