import { useId } from 'react';
import { cn } from './cn';

export interface ChipsProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  disabled?: boolean;
  error?: string;
  id?: string;
  /** `segmented` renders the pill-track toggle of components §1.4 (same radio-group semantics). */
  appearance?: 'chip' | 'segmented';
}

/** Single-choice chip group (a radio group): used for type, schedule type, location mode, audience. */
export function Chips<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  error,
  id,
  appearance = 'chip',
}: ChipsProps<T>) {
  const name = useId();
  const segmented = appearance === 'segmented';
  return (
    <fieldset id={id} disabled={disabled} className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium text-text">{label}</legend>
      <div
        className={
          segmented
            ? 'inline-flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-surface-raised p-1'
            : 'flex flex-wrap gap-2'
        }
      >
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              'cursor-pointer text-sm transition-colors',
              'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus-ring',
              segmented
                ? cn(
                    'inline-flex min-h-9 items-center rounded-full px-5 font-semibold whitespace-nowrap',
                    value === o.value ? 'bg-accent text-on-accent' : 'text-muted hover:text-text',
                  )
                : cn(
                    'rounded-full border px-4 py-1.5',
                    value === o.value
                      ? 'border-line-accent bg-surface-raised font-semibold text-accent'
                      : 'border-line text-muted hover:text-text',
                  ),
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

/** Two to four views of the same data (components §1.4): Upcoming / Past, For members / For partners. */
export function SegmentedToggle<T extends string>(props: Omit<ChipsProps<T>, 'appearance'>) {
  return <Chips {...props} appearance="segmented" />;
}
