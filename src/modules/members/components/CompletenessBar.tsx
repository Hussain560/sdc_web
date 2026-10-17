import { cn } from '@/components/ui/cn';

/**
 * Profile completeness as five segments (one per check) and the percentage (Sprint 17 design). Under 40 % the filled
 * segments use the warning tone, otherwise the brand tone. A meter for assistive technology, never colour alone: the
 * number is always written.
 */
export function CompletenessBar({
  percent,
  label,
  showNumber = true,
  className,
}: {
  percent: number;
  /** Accessible name, for example "Profile completeness". */
  label: string;
  showNumber?: boolean;
  className?: string;
}) {
  const filled = Math.max(0, Math.min(5, Math.round(percent / 20)));
  const low = percent < 40;
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showNumber && (
        <span aria-hidden="true" className="w-10 shrink-0 text-xs tabular-nums text-muted">
          {Math.round(percent)}%
        </span>
      )}
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        aria-valuetext={`${Math.round(percent)}%`}
        className="grid h-1.5 min-w-16 flex-1 grid-cols-5 gap-0.5"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn(
              'rounded-full',
              i < filled ? (low ? 'bg-warning' : 'bg-accent') : 'bg-surface-raised',
            )}
          />
        ))}
      </div>
    </div>
  );
}
