import { useId, type SelectHTMLAttributes } from 'react';
import { cn } from './cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
}

/** Labelled native select with the same accessible wiring as Field. */
export function Select({ label, error, hint, className, id, children, ...rest }: SelectProps) {
  const auto = useId();
  const selectId = id ?? auto;
  const describedBy =
    [hint && `${selectId}-hint`, error && `${selectId}-error`].filter(Boolean).join(' ') ||
    undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-text">
        {label}
      </label>
      <select
        {...rest}
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'min-h-11 rounded-xl border bg-surface-raised px-3 text-text',
          'focus-visible:outline-2 focus-visible:outline-accent',
          error ? 'border-danger' : 'border-line',
          className,
        )}
      >
        {children}
      </select>
      {hint && (
        <p id={`${selectId}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${selectId}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
