import type { ReactNode } from 'react';
import { cn } from './cn';

export type IconActionVariant = 'ghost' | 'secondary' | 'primary';

/**
 * Icon-only button with an accessible name (components §1.2). `label` is required. `tone` is the dashboard's
 * row-action colouring and still works; `size="sm"` keeps the dense 32 px table action.
 */
export function IconAction({
  label,
  tone = 'neutral',
  variant = 'ghost',
  size = 'md',
  disabled,
  pressed,
  onClick,
  children,
}: {
  label: string;
  tone?: 'neutral' | 'accent' | 'danger';
  variant?: IconActionVariant;
  size?: 'sm' | 'md';
  disabled?: boolean;
  pressed?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center rounded-full text-muted',
        'transition-colors duration-(--duration-fast) motion-reduce:transition-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
        'disabled:cursor-not-allowed disabled:opacity-45',
        size === 'md' ? 'size-11' : 'size-8',
        variant === 'ghost' && 'hover:bg-surface-raised',
        variant === 'secondary' &&
          'border-[1.5px] border-line-strong text-text hover:border-accent hover:bg-surface-raised',
        variant === 'primary' && 'bg-accent text-on-accent hover:bg-accent-hover',
        variant !== 'primary' && tone === 'accent' && 'hover:text-accent-text',
        variant !== 'primary' && tone === 'danger' && 'hover:text-danger',
        variant !== 'primary' && tone === 'neutral' && 'hover:text-text',
      )}
    >
      {children}
    </button>
  );
}

/** v2 name for the same component. */
export { IconAction as IconButton };
