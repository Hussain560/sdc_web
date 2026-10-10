import { Loader2 } from 'lucide-react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { cn } from './cn';

/** `danger` is the old name of `destructive` and stays as an alias for the dashboard. */
export type ButtonVariant =
  'primary' | 'secondary' | 'brand' | 'ghost' | 'destructive' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

const destructive =
  'bg-danger-fill text-on-danger-fill hover:[background:color-mix(in_srgb,var(--danger-fill),var(--canvas)_8%)]';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover',
  secondary:
    'border-[1.5px] border-line-strong text-text hover:border-accent hover:bg-surface-raised',
  brand: 'bg-brand text-on-brand hover:[background:color-mix(in_srgb,var(--brand),var(--text)_8%)]',
  ghost: 'text-muted hover:text-text hover:bg-surface-raised',
  destructive,
  danger: destructive,
  link: 'min-h-0 rounded-none px-0 text-accent-text hover:underline',
};

const sizes: Record<ButtonSize, string> = {
  // sm is 36 px tall; the before: pseudo-element pads the touch target to 44 px.
  sm: 'relative min-h-9 px-4 text-sm before:absolute before:inset-x-0 before:-inset-y-1 before:content-[""]',
  md: 'min-h-11 px-5 t-label',
  lg: 'min-h-13 px-7 text-base',
};

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

/** Shared class list so Button, LinkButton and any styled anchor look identical. */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
}: ButtonStyleOptions = {}) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap',
    'transition-[background-color,border-color,color,transform] duration-(--duration-fast) ease-(--ease-standard)',
    'active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
    'disabled:cursor-not-allowed disabled:opacity-45 aria-disabled:cursor-not-allowed aria-disabled:opacity-45',
    sizes[size],
    variants[variant],
    fullWidth && 'w-full',
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
  /** Why the action is unavailable right now (tooltip). Allowed-but-not-now actions are disabled with a reason. */
  disabledReason?: string;
}

/** Capsule button (Design System v2, components §1.1). */
export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  fullWidth,
  iconStart,
  iconEnd,
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
      className={buttonClasses({ variant, size, fullWidth, className })}
    >
      {loading ? (
        <Loader2 aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />
      ) : (
        iconStart
      )}
      {children}
      {iconEnd}
    </button>
  );
}

export interface LinkButtonProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>, ButtonStyleOptions {
  /** Locale-aware path (goes through @/i18n/navigation). */
  href: string;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
}

/** A link that looks like a Button; keeps navigation locale-aware. */
export function LinkButton({
  href,
  variant,
  size,
  fullWidth,
  iconStart,
  iconEnd,
  className,
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link {...rest} href={href} className={buttonClasses({ variant, size, fullWidth, className })}>
      {iconStart}
      {children}
      {iconEnd}
    </Link>
  );
}
