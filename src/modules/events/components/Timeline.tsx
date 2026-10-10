import { Check } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { cn } from '@/components/ui';
import type { EventDetail } from '../queries';

/** Lifecycle rail: Draft → Pending review → Published → Completed (a red terminal node when cancelled). */
export function Timeline({ event, lang }: { event: EventDetail; lang: 'ar' | 'en' }) {
  const ar = lang === 'ar';
  const s = event.status;
  const cancelled = s === 'cancelled';
  const rank: Record<string, number> = {
    draft: 0,
    changes_requested: 0,
    pending_review: 1,
    published: 2,
    cancelled: 2,
    completed: 3,
    archived: 3,
  };
  const at = rank[s] ?? 0;

  const nodes = [
    { label: ar ? 'مسودة' : 'Draft', date: event.createdAt },
    { label: ar ? 'بانتظار الاعتماد' : 'Pending review', date: event.submittedAt },
    cancelled
      ? { label: ar ? 'ملغاة' : 'Cancelled', date: event.cancelledAt, danger: true }
      : { label: ar ? 'منشورة' : 'Published', date: event.publishedAt },
    { label: ar ? 'مكتملة' : 'Completed', date: null as string | null },
  ];

  return (
    <ol
      className="flex items-start overflow-x-auto py-2"
      aria-label={ar ? 'مراحل الفعالية' : 'Event stages'}
    >
      {nodes.map((n, i) => {
        const done =
          i < at ||
          (i === at &&
            s !== 'draft' &&
            s !== 'changes_requested' &&
            !(i === 1 && s !== 'pending_review'));
        const current = i === at;
        const danger = 'danger' in n && n.danger;
        return (
          <li key={n.label} className="flex min-w-32 flex-1 flex-col items-start last:flex-none">
            <div className="flex w-full items-center">
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs',
                  danger && 'border-danger-fill bg-danger-fill text-on-danger-fill',
                  !danger && done && !current && 'border-accent bg-accent text-on-accent',
                  !danger && current && 'border-accent ring-2 ring-accent/40',
                  !danger && !done && !current && 'border-line text-muted',
                )}
                aria-current={current ? 'step' : undefined}
              >
                {done && !current ? <Check size={14} aria-hidden="true" /> : i + 1}
              </span>
              {i < nodes.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn('mx-2 h-px flex-1', i < at ? 'bg-accent' : 'bg-line')}
                />
              )}
            </div>
            <p className={cn('mt-2 text-sm', current ? 'font-semibold' : 'text-muted')}>
              {n.label}
            </p>
            {n.date && (
              <p className="text-xs tabular-nums text-muted">{formatDate(n.date, lang)}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
