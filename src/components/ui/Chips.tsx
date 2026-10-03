import { useId } from 'react';
import { cn } from './cn';

/** Single-choice chip group (a radio group): used for type, schedule type, location mode, audience. */
export function Chips<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  error,
  id,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  disabled?: boolean;
  error?: string;
  id?: string;
}) {
  const name = useId();
  return (
    <fieldset id={id} disabled={disabled} className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium text-text">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              'cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors',
              'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
              value === o.value
                ? 'border-line-accent bg-surface-raised font-semibold text-accent'
                : 'border-line text-muted hover:text-text',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
