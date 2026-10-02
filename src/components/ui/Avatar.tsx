import { cn } from './cn';

/** Initial-letter avatar for people in tables (no photos are stored for internal lists). */
export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-raised text-xs font-bold text-accent ring-1 ring-line',
        className,
      )}
    >
      {(name.trim().charAt(0) || '?').toUpperCase()}
    </span>
  );
}
