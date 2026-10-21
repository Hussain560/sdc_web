import type { CSSProperties } from 'react';
import { cn } from '@/components/ui';
import type { CycleFunnel } from '../queries';

/**
 * The cycle funnel at a glance: applied → in review → accepted → activated → lapsed. Each bar is as long as its
 * share of the applications; the number and the label sit under it. Pure markup (no client code), so it works in
 * the cycle list, the waiting list and the digest alike.
 */
export function FunnelBars({
  funnel,
  ar,
  compact = false,
}: {
  funnel: CycleFunnel;
  ar: boolean;
  compact?: boolean;
}) {
  const max = Math.max(1, funnel.applied);
  const cells: Array<{
    key: string;
    label: string;
    value: number;
    tone: 'solid' | 'soft' | 'warn';
  }> = [
    { key: 'applied', label: ar ? 'تقدّموا' : 'Applied', value: funnel.applied, tone: 'solid' },
    {
      key: 'review',
      label: ar ? 'قيد المراجعة' : 'In review',
      value: funnel.inReview,
      tone: 'soft',
    },
    { key: 'accepted', label: ar ? 'مقبولون' : 'Accepted', value: funnel.accepted, tone: 'soft' },
    { key: 'activated', label: ar ? 'فعّلوا' : 'Activated', value: funnel.activated, tone: 'soft' },
    { key: 'lapsed', label: ar ? 'سقط التفعيل' : 'Lapsed', value: funnel.lapsed, tone: 'warn' },
  ];
  return (
    <ol
      className={cn('grid grid-cols-5 gap-2 sm:gap-3')}
      aria-label={ar ? 'قمع الطلبات' : 'Application funnel'}
    >
      {cells.map((c, i) => (
        <li key={c.key} className="m-reveal min-w-0" style={{ '--i': i } as CSSProperties}>
          <div
            aria-hidden="true"
            className={cn(
              'relative overflow-hidden rounded-shape-md bg-surface-raised',
              compact ? 'h-6' : 'h-10 sm:h-12',
            )}
          >
            <div
              className={cn(
                'absolute inset-y-0 start-0 rounded-shape-md',
                c.tone === 'solid' && 'bg-accent',
                c.tone === 'soft' && 'bg-accent-soft',
                c.tone === 'warn' && 'bg-warning-soft',
              )}
              style={{ width: `${Math.max(c.value > 0 ? 8 : 0, (c.value / max) * 100)}%` }}
            />
          </div>
          <p
            className={cn(
              'mt-2 font-bold tabular-nums',
              compact ? 'text-lg' : 'text-xl sm:text-2xl',
            )}
          >
            {c.value}
          </p>
          <p className="truncate text-xs text-muted sm:text-sm">{c.label}</p>
        </li>
      ))}
    </ol>
  );
}
