import type { ReactNode } from 'react';
import { cn } from '@/components/ui/cn';

/**
 * Section title block (patterns §2): a large h2, a short muted lede and, at the inline-end, one link or segmented
 * control. `headingId` lets a section be labelled by its title.
 */
export function SectionHeader({
  title,
  lede,
  action,
  headingId,
  dots,
  className,
}: {
  title: string;
  lede?: string;
  action?: ReactNode;
  headingId?: string;
  /** Lead the title with the two signal dots. */
  dots?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <h2 id={headingId} className={cn('t-h2', dots && 'flex items-center gap-3')}>
          {dots && <span aria-hidden="true" className="signal-dots" />}
          {title}
        </h2>
        {lede && <p className="t-lede text-muted">{lede}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
