import { cn } from './cn';

/**
 * 4 px bar for waiting feedback (components §8.3). Without `value` it is indeterminate: a segment slides in the
 * reading direction. With `value` (0 to 100) it fills. Paired with a visible `label` ("Registering you…") that is
 * announced politely. Under reduced motion the bar is static and only the text carries the state.
 */
export function Progress({
  value,
  label,
  className,
}: {
  value?: number;
  label: string;
  className?: string;
}) {
  const determinate = typeof value === 'number';
  return (
    <div className={className}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={determinate ? 0 : undefined}
        aria-valuemax={determinate ? 100 : undefined}
        aria-valuenow={determinate ? Math.round(value) : undefined}
        className="relative h-1 w-full overflow-hidden rounded-full bg-surface-raised"
      >
        {determinate ? (
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200 motion-reduce:transition-none"
            style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          />
        ) : (
          <div className="ui-progress-indeterminate h-full w-[30%] rounded-full bg-accent" />
        )}
      </div>
      <p role="status" className={cn('t-body-sm mt-2 text-muted')}>
        {label}
      </p>
    </div>
  );
}
