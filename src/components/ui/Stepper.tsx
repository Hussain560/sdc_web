import { Check } from 'lucide-react';
import { cn } from './cn';

export type StepperStep = { label: string; warning?: boolean };

/**
 * Wizard progress (KFUCS style): numbered circles, completed steps show a check and are clickable,
 * the current step has an accent ring, future steps are muted. Collapses to "Step n of N" on small screens.
 */
export function Stepper({
  steps,
  current,
  onSelect,
  maxReached,
  labelOf,
}: {
  steps: StepperStep[];
  /** 1-based current step. */
  current: number;
  onSelect: (step: number) => void;
  /** Highest step the user may jump to. */
  maxReached: number;
  /** "Step {n} of {total}" text for the compact (mobile) view. */
  labelOf: (n: number, total: number, label: string) => string;
}) {
  return (
    <nav aria-label="Progress">
      <p className="mb-2 text-sm text-muted md:hidden">
        {labelOf(current, steps.length, steps[current - 1]?.label ?? '')}
      </p>
      <div className="mb-1 h-1 rounded-full bg-surface-raised md:hidden">
        <div
          className="h-1 rounded-full bg-accent transition-all"
          style={{ width: `${(current / steps.length) * 100}%` }}
        />
      </div>
      <ol className="hidden items-center md:flex">
        {steps.map((s, i) => {
          const n = i + 1;
          const done = n < current || (n <= maxReached && n !== current);
          const active = n === current;
          const clickable = n <= maxReached && !active;
          return (
            <li key={s.label} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                disabled={!clickable}
                aria-current={active ? 'step' : undefined}
                onClick={() => onSelect(n)}
                className={cn(
                  'flex items-center gap-2 rounded-full py-1 pe-3 text-sm',
                  clickable ? 'cursor-pointer' : 'cursor-default',
                  active ? 'font-semibold text-text' : done ? 'text-accent' : 'text-muted',
                )}
              >
                <span
                  className={cn(
                    'relative flex size-8 items-center justify-center rounded-full border text-sm font-semibold',
                    active && 'border-accent ring-2 ring-accent/40',
                    done && !active && 'border-accent bg-accent text-on-accent',
                    !done && !active && 'border-line',
                  )}
                >
                  {done && !active ? <Check size={16} aria-hidden="true" /> : n}
                  {s.warning && (
                    <span
                      aria-hidden="true"
                      className="absolute -end-0.5 -top-0.5 size-2.5 rounded-full bg-warning"
                    />
                  )}
                </span>
                {s.label}
              </button>
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn('mx-2 h-px flex-1', n < current ? 'bg-accent' : 'bg-line')}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
