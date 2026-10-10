'use client';

import { useId } from 'react';
import { cn } from './cn';

export interface RadioOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
  disabled?: boolean;
}

/**
 * Radio group (components §5.6): always a fieldset with a legend. For two to four short options prefer
 * SegmentedToggle or Chips.
 */
export function RadioGroup<T extends string>({
  legend,
  value,
  options,
  onChange,
  error,
  disabled,
  name,
}: {
  legend: string;
  value: T | '';
  options: ReadonlyArray<RadioOption<T>>;
  onChange: (value: T) => void;
  error?: string;
  disabled?: boolean;
  name?: string;
}) {
  const auto = useId();
  const group = name ?? auto;
  return (
    <fieldset
      disabled={disabled}
      aria-describedby={error ? `${group}-error` : undefined}
      className="flex flex-col gap-1"
    >
      <legend className="t-label mb-1 text-text">{legend}</legend>
      {options.map((o) => (
        <label
          key={o.value}
          className={cn(
            'flex min-h-11 cursor-pointer items-start gap-3 py-2',
            (disabled || o.disabled) && 'cursor-not-allowed opacity-45',
          )}
        >
          <input
            type="radio"
            name={group}
            value={o.value}
            checked={value === o.value}
            disabled={o.disabled}
            onChange={() => onChange(o.value)}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className={cn(
              'mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] bg-field',
              'transition-colors duration-(--duration-fast) motion-reduce:transition-none',
              'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring',
              'peer-checked:border-[2px] peer-checked:border-accent',
              'after:size-2 after:rounded-full after:bg-accent after:opacity-0 peer-checked:after:opacity-100',
              error ? 'border-danger' : 'border-line-strong',
            )}
          />
          <span className="flex flex-col">
            <span className="t-body text-text">{o.label}</span>
            {o.hint && <span className="t-body-sm text-muted">{o.hint}</span>}
          </span>
        </label>
      ))}
      {error && (
        <p id={`${group}-error`} role="alert" className="t-body-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
