import { Check, X } from 'lucide-react';
import { cn } from './cn';

const base =
  'inline-flex items-center gap-1.5 rounded-full text-sm transition-colors duration-(--duration-fast) ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring';

/** Static topic label (components §2.3). The "+N" overflow chip passes the hidden tags as `title`. */
export function TagChip({
  children,
  title,
  className,
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <span
      title={title}
      aria-label={title ? `${children} ${title}` : undefined}
      className={cn(base, 'min-h-7 bg-surface-raised px-3 text-muted', className)}
    >
      {children}
    </span>
  );
}

/** Filter toggle: a button with `aria-pressed`; selected shows a check at the inline-start. 44 px hit area. */
export function FilterChip({
  children,
  pressed,
  onClick,
  className,
}: {
  children: React.ReactNode;
  pressed: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        base,
        'relative min-h-9 px-4 before:absolute before:inset-x-0 before:-inset-y-1 before:content-[""]',
        pressed
          ? 'bg-accent-soft font-semibold text-on-accent-soft'
          : 'border border-line-strong text-text hover:bg-surface-raised',
        className,
      )}
    >
      {pressed && <Check aria-hidden="true" className="size-4" />}
      {children}
    </button>
  );
}

/** Active-filter chip with a remove button. `removeLabel` is the translated "Remove filter: {name}". */
export function RemovableChip({
  children,
  removeLabel,
  onRemove,
}: {
  children: React.ReactNode;
  removeLabel: string;
  onRemove: () => void;
}) {
  return (
    <span
      className={cn(base, 'min-h-9 bg-accent-soft ps-4 pe-1 font-semibold text-on-accent-soft')}
    >
      {children}
      <button
        type="button"
        aria-label={removeLabel}
        onClick={onRemove}
        className="inline-flex size-7 items-center justify-center rounded-full hover:bg-surface/40 focus-visible:outline-2 focus-visible:outline-focus-ring"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </span>
  );
}
