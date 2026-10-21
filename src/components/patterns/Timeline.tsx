import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/components/ui';

export type TimelineItem = {
  key: string | number;
  icon: ReactNode;
  title: string;
  /** Under the title: the date, a sentence, who did it. */
  detail?: ReactNode;
  /** `done` is filled, `now` is the current step (ringed), `pending` is outlined, `warn` / `danger` mark a problem. */
  tone?: 'done' | 'now' | 'pending' | 'warn' | 'danger';
  /** A muted line after the detail (an internal note, the reference…). */
  note?: ReactNode;
};

const NODE: Record<NonNullable<TimelineItem['tone']>, string> = {
  done: 'bg-accent text-on-accent',
  now: 'bg-accent-soft text-on-accent-soft ring-2 ring-accent',
  pending: 'border-[1.5px] border-line-strong text-muted',
  warn: 'bg-warning-soft text-warning ring-2 ring-warning',
  danger: 'bg-danger-soft text-danger',
};

/**
 * A vertical timeline: one node per step, joined by a line at the inline-start. Used by the applicant's tracking
 * page, the review history and the member record. The line mirrors in RTL because it is a logical border.
 */
export function Timeline({
  items,
  className,
  label,
}: {
  items: TimelineItem[];
  className?: string;
  label?: string;
}) {
  return (
    <ol aria-label={label} className={cn('flex flex-col', className)}>
      {items.map((it, i) => (
        <li
          key={it.key}
          className="m-reveal relative flex gap-3 pb-5 last:pb-0"
          style={{ '--i': Math.min(i, 8) } as CSSProperties}
        >
          {i < items.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute start-4 top-9 bottom-1 w-px -translate-x-1/2 bg-line rtl:translate-x-1/2"
            />
          )}
          <span
            aria-hidden="true"
            className={cn(
              'relative z-[1] flex size-8 shrink-0 items-center justify-center rounded-full',
              NODE[it.tone ?? 'done'],
            )}
          >
            <span className="size-4 [&>svg]:size-4">{it.icon}</span>
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="t-label leading-snug">{it.title}</p>
            {it.detail && <div className="mt-0.5 text-sm text-muted">{it.detail}</div>}
            {it.note && <div className="mt-1 text-sm">{it.note}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
