import { cn } from './cn';

/** Icon-only row action with a tooltip and an accessible name (Accept, Reject, Claim…). */
export function IconAction({
  label,
  tone = 'neutral',
  disabled,
  onClick,
  children,
}: {
  label: string;
  tone?: 'neutral' | 'accent' | 'danger';
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-canvas',
        'focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50',
        tone === 'accent' && 'hover:text-accent',
        tone === 'danger' && 'hover:text-danger',
        tone === 'neutral' && 'hover:text-text',
      )}
    >
      {children}
    </button>
  );
}
