'use client';

import { Check, Minus } from 'lucide-react';
import { useEffect, useId, useRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  hint?: string;
  error?: string;
  /** Mixed state of a parent checkbox. The native `checked` is ignored visually while it is set. */
  indeterminate?: boolean;
}

/** 20 px box, clickable row of at least 44 px (components §5.5). Error text sits under the control. */
export function Checkbox({
  label,
  hint,
  error,
  indeterminate,
  className,
  id,
  ...rest
}: CheckboxProps) {
  const auto = useId();
  const inputId = id ?? auto;
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);
  const described =
    [hint && `${inputId}-hint`, error && `${inputId}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label
        htmlFor={inputId}
        className={cn(
          'flex min-h-11 cursor-pointer items-center gap-3',
          rest.disabled && 'cursor-not-allowed opacity-45',
        )}
      >
        <input
          {...rest}
          ref={ref}
          id={inputId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={described}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={cn(
            'inline-flex size-5 shrink-0 items-center justify-center rounded-shape-xs border-[1.5px] bg-field text-on-accent',
            'transition-colors duration-(--duration-fast) motion-reduce:transition-none',
            'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring',
            'peer-checked:border-accent peer-checked:bg-accent peer-indeterminate:border-accent peer-indeterminate:bg-accent',
            error ? 'border-danger' : 'border-line-strong',
            '[&>.on]:hidden [&>.mix]:hidden peer-checked:[&>.on]:block peer-indeterminate:[&>.on]:hidden peer-indeterminate:[&>.mix]:block',
          )}
        >
          <Check className="on size-4" strokeWidth={3} />
          <Minus className="mix size-4" strokeWidth={3} />
        </span>
        <span className="t-body text-text">{label}</span>
      </label>
      {hint && (
        <p id={`${inputId}-hint`} className="t-body-sm ps-8 text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} role="alert" className="t-body-sm ps-8 text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
