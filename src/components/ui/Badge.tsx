import type { HTMLAttributes } from 'react';
import { cn } from './cn';

type Tone = 'neutral' | 'accent' | 'warning' | 'danger';

const tones: Record<Tone, string> = {
  neutral: 'border-line text-muted',
  accent: 'border-line-accent text-accent',
  warning: 'border-warning text-warning',
  danger: 'border-danger text-danger',
};

export function Badge({
  tone = 'neutral',
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      {...rest}
      className={cn(
        'inline-flex h-6 items-center whitespace-nowrap rounded-full border px-3 text-xs font-medium',
        tones[tone],
        className,
      )}
    />
  );
}
