import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

/** Soft filled tones (components §2.1). Every fill/text pair is in the contrast gate. */
export const badgeTones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-raised text-muted',
  accent: 'bg-accent-soft text-on-accent-soft',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
};

export function Badge({
  tone = 'neutral',
  icon,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; icon?: ReactNode }) {
  return (
    <span
      {...rest}
      className={cn(
        't-badge inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 tabular-nums',
        badgeTones[tone],
        className,
      )}
    >
      {icon && (
        <span aria-hidden="true" className="inline-flex size-3.5 shrink-0 items-center">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
