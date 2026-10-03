import { useId, type InputHTMLAttributes } from 'react';
import { cn } from './cn';

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

/** Labelled input with accessible error/hint wiring (WCAG 2.2: 1.3.1, 3.3.1, 3.3.2). */
export function Field({ label, error, hint, className, id, ...rest }: FieldProps) {
  const auto = useId();
  const inputId = id ?? auto;
  const describedBy =
    [hint && `${inputId}-hint`, error && `${inputId}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-text">
        {label}
      </label>
      <input
        {...rest}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'min-h-11 rounded-xl border bg-surface-raised px-3 text-text placeholder:text-muted',
          'focus-visible:outline-2 focus-visible:outline-accent',
          error ? 'border-danger' : 'border-line',
          className,
        )}
      />
      {hint && (
        <p id={`${inputId}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
