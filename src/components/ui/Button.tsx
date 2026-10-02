import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover',
  secondary: 'border border-line-accent text-accent hover:bg-surface-raised',
  danger: 'bg-danger text-text hover:opacity-90',
  ghost: 'text-muted hover:text-text hover:bg-surface-raised',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  /** Why the action is unavailable right now (tooltip). Allowed-but-not-now actions are disabled with a reason. */
  disabledReason?: string;
}

/** Capsule button (frozen identity, D-009). */
export function Button({
  variant = 'primary',
  loading,
  disabledReason,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading || !!disabledReason;
  return (
    <button
      {...rest}
      disabled={isDisabled}
      title={disabledReason ?? rest.title}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}
