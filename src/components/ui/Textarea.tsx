import { useId, type TextareaHTMLAttributes } from 'react';
import { cn } from './cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  /** Shows "n/max" under the field when `maxLength` is set. */
  counter?: boolean;
  /** Keep the label for assistive tech but hide it visually (when the page shows its own heading). */
  hideLabel?: boolean;
}

export function Textarea({
  label,
  error,
  hint,
  counter,
  hideLabel,
  className,
  id,
  value,
  maxLength,
  ...rest
}: TextareaProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  const describedBy =
    [hint && `${fieldId}-hint`, error && `${fieldId}-error`].filter(Boolean).join(' ') || undefined;
  const length = typeof value === 'string' ? value.length : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={fieldId}
        className={cn('text-sm font-medium text-text', hideLabel && 'sr-only')}
      >
        {label}
      </label>
      <textarea
        {...rest}
        id={fieldId}
        value={value}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'min-h-24 rounded-xl border bg-surface-raised px-3 py-2 text-text placeholder:text-muted',
          'focus-visible:outline-2 focus-visible:outline-accent',
          error ? 'border-danger' : 'border-line',
          className,
        )}
      />
      <div className="flex justify-between gap-3">
        <div>
          {hint && (
            <p id={`${fieldId}-hint`} className="text-xs text-muted">
              {hint}
            </p>
          )}
          {error && (
            <p id={`${fieldId}-error`} role="alert" className="text-xs text-danger">
              {error}
            </p>
          )}
        </div>
        {counter && maxLength && (
          <p className="text-xs tabular-nums text-muted" aria-hidden="true">
            {length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}
