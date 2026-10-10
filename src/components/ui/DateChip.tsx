import { CalendarDays, Clock } from 'lucide-react';
import { cn } from './cn';

type Lang = 'ar' | 'en';

const locale = (lang: Lang) => (lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB');
const parts = (date: string, lang: Lang) => {
  const d = new Date(`${date}T00:00:00Z`);
  const f = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale(lang), { ...o, timeZone: 'UTC' }).format(d);
  return {
    day: f({ day: 'numeric' }),
    month: f({ month: 'short' }),
    short: f({ day: 'numeric', month: 'short' }),
    long: f({ dateStyle: 'long' }),
  };
};

export interface DateChipProps {
  /** yyyy-mm-dd (Riyadh calendar day). */
  date: string;
  lang: Lang;
  /** Optional wall-clock times, `HH:MM[:SS]` as stored. */
  start?: string | null;
  end?: string | null;
  variant?: 'block' | 'inline';
  className?: string;
}

const hhmm = (t?: string | null) => t?.slice(0, 5);

/** Compact date block (components §2.4): `block` is the 56×64 tile, `inline` is the card meta row. */
export function DateChip({ date, lang, start, end, variant = 'inline', className }: DateChipProps) {
  const p = parts(date, lang);
  const time = hhmm(start) && hhmm(end) ? `${hhmm(start)} – ${hhmm(end)}` : hhmm(start);
  if (variant === 'block') {
    return (
      <time
        dateTime={date}
        aria-label={p.long}
        className={cn(
          'inline-flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-shape-lg bg-surface-raised',
          className,
        )}
      >
        <span aria-hidden="true" className="t-h3 tabular-nums">
          {p.day}
        </span>
        <span aria-hidden="true" className="t-caption text-muted">
          {p.month}
        </span>
      </time>
    );
  }
  return (
    <span
      className={cn('t-body-sm inline-flex flex-wrap items-center gap-x-3 text-muted', className)}
    >
      <time dateTime={date} className="inline-flex items-center gap-1.5">
        <CalendarDays aria-hidden="true" className="size-4 text-accent-text" />
        {p.short}
      </time>
      {time && (
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          <Clock aria-hidden="true" className="size-4 text-accent-text" />
          {time}
        </span>
      )}
    </span>
  );
}

/** Relative wording (`now` comes from the caller so render stays pure) ("in 3 days") with the absolute date kept in `title` and for screen readers. */
export function CountdownChip({
  date,
  lang,
  now,
  className,
}: {
  date: string;
  lang: Lang;
  now: number;
  className?: string;
}) {
  const days = Math.round((Date.parse(`${date}T00:00:00Z`) - now) / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat(lang === 'ar' ? 'ar' : 'en', { numeric: 'auto' });
  const abs = parts(date, lang).long;
  return (
    <time dateTime={date} title={abs} className={cn('t-body-sm text-muted', className)}>
      {rtf.format(days, 'day')}
      <span className="sr-only"> ({abs})</span>
    </time>
  );
}
