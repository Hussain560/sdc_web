import { ArrowLeft, ArrowRight, MapPin } from 'lucide-react';
import { Card, CardLink } from '@/components/ui/Card';
import { DateChip } from '@/components/ui/DateChip';
import { Media } from '@/components/ui/Media';
import { StatusPill } from '@/components/ui/StatusPill';
import { cn } from '@/components/ui/cn';
import { PILL_LABEL, cardPill } from '../status-labels';
import { eventLocation, eventTitle, type PublicEventCard } from '../public-types';

type Lang = 'ar' | 'en';

const TEXT = {
  ar: {
    details: 'التفاصيل',
    seats: (n: number) => `متبقي ${n} مقعداً`,
    tbd: 'يُعلن الموعد قريباً',
  },
  en: { details: 'Details', seats: (n: number) => `${n} seats left`, tbd: 'Date to be announced' },
} as const;

/**
 * Event card (components §3.1 `event`): cover, status pill and date, a two-line title that is the card's one link,
 * the place, and the seats left. `now` comes from the caller so rendering stays pure.
 */
export function EventCard({
  event,
  lang,
  now,
  className,
}: {
  event: PublicEventCard;
  lang: Lang;
  now: number;
  className?: string;
}) {
  const t = TEXT[lang];
  const title = eventTitle(event, lang);
  const pill = cardPill(event, now);
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;
  const showSeats =
    event.phase === 'registration_open' && event.seatsLeft !== null && event.seatsLeft > 0;
  return (
    <Card variant="surface" interactive className={cn('flex h-full flex-col gap-4', className)}>
      <Media src={event.cover} alt="" kind="event" className="rounded-shape-lg" priority={false} />
      <div className="flex flex-wrap items-center gap-3">
        <StatusPill status={pill} label={PILL_LABEL[pill][lang]} />
        {event.startDate ? (
          <DateChip
            date={event.startDate}
            lang={lang}
            start={event.startTime}
            end={event.endTime}
          />
        ) : (
          <span className="t-body-sm text-muted">{t.tbd}</span>
        )}
      </div>
      <h3 className="t-h4 line-clamp-2">
        <CardLink href={`/events/${event.slug}`}>{title}</CardLink>
      </h3>
      <p className="t-body-sm flex items-center gap-1.5 text-muted">
        <MapPin aria-hidden="true" className="size-4 shrink-0" />
        <span className="line-clamp-1">{eventLocation(event, lang)}</span>
      </p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-2">
        <span className="t-caption tabular-nums text-muted">
          {showSeats ? t.seats(event.seatsLeft!) : ''}
        </span>
        <span
          aria-hidden="true"
          className="t-label inline-flex items-center gap-1 text-accent-text"
        >
          {t.details}
          <Arrow className="size-4" />
        </span>
      </div>
    </Card>
  );
}
