import { CircleAlert, CircleCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from './cn';

/** Shared control look for Input, Select and Textarea (components §5.2): 48 px, `--field` fill, strong border. */
export function controlClasses(error?: boolean, success?: boolean) {
  return cn(
    'w-full rounded-shape-md border bg-field px-4 text-base text-text placeholder:text-subtle',
    'transition-colors duration-(--duration-fast) motion-reduce:transition-none',
    'focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
    'disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-raised disabled:text-subtle',
    'read-only:border-transparent read-only:bg-transparent',
    error
      ? 'border-[1.5px] border-danger'
      : success
        ? 'border-success'
        : 'border-line-strong hover:border-muted',
  );
}

/** Label row: the label, plus "(required)" / "(optional)" as text, never a bare asterisk (components §5.1). */
export function FieldLabel({
  htmlFor,
  label,
  requiredLabel,
  optionalLabel,
  hidden,
}: {
  htmlFor: string;
  label: string;
  requiredLabel?: string;
  optionalLabel?: string;
  hidden?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className={cn('t-label text-text', hidden && 'sr-only')}>
      {label}
      {requiredLabel && <span className="ms-1 font-normal text-muted">({requiredLabel})</span>}
      {optionalLabel && <span className="ms-1 font-normal text-muted">({optionalLabel})</span>}
    </label>
  );
}

/** Hint, error and success lines, wired to `aria-describedby` through the ids derived from `id`. */
export function FieldMessages({
  id,
  hint,
  error,
  success,
  extra,
}: {
  id: string;
  hint?: string;
  error?: string;
  success?: string;
  extra?: ReactNode;
}) {
  if (!hint && !error && !success && !extra) return null;
  return (
    <div className="flex justify-between gap-3">
      <div className="flex flex-col gap-1">
        {hint && (
          <p id={`${id}-hint`} className="t-body-sm text-muted">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${id}-error`} role="alert" className="t-body-sm flex gap-1.5 text-danger">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        )}
        {success && !error && (
          <p id={`${id}-success`} role="status" className="t-body-sm flex gap-1.5 text-success">
            <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {success}
          </p>
        )}
      </div>
      {extra}
    </div>
  );
}

export function describedBy(
  id: string,
  parts: { hint?: string; error?: string; success?: string },
): string | undefined {
  return (
    [
      parts.hint && `${id}-hint`,
      parts.error && `${id}-error`,
      parts.success && !parts.error && `${id}-success`,
    ]
      .filter(Boolean)
      .join(' ') || undefined
  );
}
