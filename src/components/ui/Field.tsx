'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useId, useState, type InputHTMLAttributes } from 'react';
import { cn } from './cn';
import { controlClasses, describedBy, FieldLabel, FieldMessages } from './field-parts';

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  success?: string;
  /** Translated "required" / "optional" shown after the label as text. */
  requiredLabel?: string;
  optionalLabel?: string;
}

const LTR_TYPES = new Set(['email', 'tel', 'url']);

/** Labelled input with accessible error/hint wiring (WCAG 2.2: 1.3.1, 3.3.1, 3.3.2). */
export function Field({
  label,
  error,
  hint,
  success,
  requiredLabel,
  optionalLabel,
  className,
  id,
  type,
  dir,
  ...rest
}: FieldProps) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel
        htmlFor={inputId}
        label={label}
        requiredLabel={requiredLabel}
        optionalLabel={optionalLabel}
      />
      <input
        {...rest}
        id={inputId}
        type={type}
        dir={dir ?? (type && LTR_TYPES.has(type) ? 'ltr' : undefined)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(inputId, { hint, error, success })}
        className={cn('min-h-12', controlClasses(!!error, !!success), className)}
      />
      <FieldMessages id={inputId} hint={hint} error={error} success={success} />
    </div>
  );
}

export interface PasswordFieldProps extends Omit<FieldProps, 'type'> {
  /** Translated "Show password" / "Hide password". */
  showLabel: string;
  hideLabel: string;
}

/** Password input with a show/hide toggle at the inline-end (components §5.2). */
export function PasswordField({
  label,
  error,
  hint,
  success,
  requiredLabel,
  optionalLabel,
  showLabel,
  hideLabel,
  className,
  id,
  ...rest
}: PasswordFieldProps) {
  const auto = useId();
  const inputId = id ?? auto;
  const [shown, setShown] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel
        htmlFor={inputId}
        label={label}
        requiredLabel={requiredLabel}
        optionalLabel={optionalLabel}
      />
      <div className="relative">
        <input
          {...rest}
          id={inputId}
          type={shown ? 'text' : 'password'}
          dir="ltr"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, { hint, error, success })}
          className={cn('min-h-12 pe-12 text-start', controlClasses(!!error, !!success), className)}
        />
        <button
          type="button"
          aria-label={shown ? hideLabel : showLabel}
          aria-pressed={shown}
          onClick={() => setShown((v) => !v)}
          className="absolute inset-y-0 end-0 inline-flex w-12 items-center justify-center rounded-e-shape-md text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-focus-ring"
        >
          {shown ? (
            <EyeOff aria-hidden="true" className="size-5" />
          ) : (
            <Eye aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>
      <FieldMessages id={inputId} hint={hint} error={error} success={success} />
    </div>
  );
}
