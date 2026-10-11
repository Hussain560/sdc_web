import type { CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { CapsuleCover } from '@/components/patterns/CapsuleMark';
import { Badge } from '@/components/ui/Badge';
import { Card, CardLink } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { cn } from '@/components/ui/cn';
import { formatTime } from '@/lib/format';
import { PILL_LABEL, cardPill } from '../status-labels';
import { EVENT_COPY } from '../page-copy';
import {
  FALLBACK_COVER,
  eventDate,
  eventLocation,
  eventTitle,
  type PublicEventCard,
} from '../public-types';

type Lang = 'ar' | 'en';

const TEXT = { ar: { details: 'التفاصيل' }, en: { details: 'Details' } } as const;

/** The one line under a card title: the date, then the time when the organisers set one. */
export function eventWhen(event: PublicEventCard, lang: Lang) {
  const time = formatTime(event.startTime, event.endTime, lang);
  return time && event.startDate ? `${eventDate(event, lang)} · ${time}` : eventDate(event, lang);
}

/**
 * Event card (components §3.1 `event`): the cover with the event type on it, the status (and "Members only") tags,
 * a two-line title that is the card's one link, the date and place, and the seats left. A card without a cover shows
 * the capsule mark on the dot grid. `now` comes from the caller so rendering stays pure; `index` staggers the entrance.
 */
export function EventCard({
  event,
  lang,
  now,
  typeLabel,
  index = 0,
  className,
}: {
  event: PublicEventCard;
  lang: Lang;
  now: number;
  typeLabel?: string;
  index?: number;
  className?: string;
}) {
  const t = TEXT[lang];
  const title = eventTitle(event, lang);
  const pill = cardPill(event, now);
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;
  const showSeats =
    event.phase === 'registration_open' && event.seatsLeft !== null && event.seatsLeft > 0;
  const hasCover = event.cover !== FALLBACK_COVER;
  return (
    <Card
      variant="poster"
      interactive
      style={{ '--i': Math.min(index, 8) } as CSSProperties}
      className={cn(
        'pg-card pg-card-in flex h-full flex-col gap-3.5 p-2 pb-5 motion-reduce:transform-none',
        className,
      )}
    >
      <div className="relative aspect-video overflow-hidden rounded-shape-lg bg-surface-raised">
        {hasCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover}
            alt=""
            loading="lazy"
            decoding="async"
            className="pg-card-img size-full object-cover object-top"
          />
        ) : (
          <CapsuleCover className="pg-card-img" />
        )}
        {typeLabel && (
          <Badge className="absolute start-3 top-3 bg-surface text-text">{typeLabel}</Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 px-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={pill} label={PILL_LABEL[pill][lang]} />
          {event.access === 'members_only' && (
            <StatusPill status="members-only" label={PILL_LABEL['members-only'][lang]} />
          )}
        </div>
        <h3 className="t-h4 line-clamp-2">
          <CardLink href={`/events/${event.slug}`}>{title}</CardLink>
        </h3>
        <p className="t-body-sm flex flex-col gap-1 text-muted">
          <span className="flex items-center gap-1.5">
            <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-accent-text" />
            {eventWhen(event, lang)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="size-4 shrink-0 text-accent-text" />
            <span className="line-clamp-1">{eventLocation(event, lang)}</span>
          </span>
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3">
          <span className="t-caption tabular-nums text-muted">
            {showSeats ? EVENT_COPY[lang].seatsLeft(event.seatsLeft!) : ''}
          </span>
          <span
            aria-hidden="true"
            className="t-label inline-flex items-center gap-1 text-accent-text"
          >
            {t.details}
            <Arrow className="size-4" />
          </span>
        </div>
      </div>
    </Card>
  );
}
