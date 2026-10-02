import type { HTMLAttributes } from 'react';
import { cn } from './cn';

type Tone = 'info' | 'success' | 'warning' | 'danger';

const tones: Record<Tone, string> = {
  info: 'border-line text-text',
  success: 'border-line-accent text-accent',
  warning: 'border-warning text-warning',
  danger: 'border-danger text-danger',
};

export function Alert({
  tone = 'info',
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { tone?: Tone }) {
  return (
    <div
      {...rest}
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      className={cn('rounded-xl border bg-surface px-4 py-3 text-sm', tones[tone], className)}
    />
  );
}
