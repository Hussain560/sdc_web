import { useId } from 'react';
import { cn } from './cn';

/** Accessible on/off switch (checkbox with role="switch"); the track follows the reading direction. */
export function Switch({
  checked,
  onChange,
  label,
  hint,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
  id?: string;
}) {
  const auto = useId();
  const switchId = id ?? auto;
  return (
    <label
      htmlFor={switchId}
      className={cn(
        'flex cursor-pointer items-start gap-3',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <input
        id={switchId}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          'relative mt-0.5 inline-block h-6 w-11 shrink-0 rounded-full border transition-colors',
          'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent',
          checked ? 'border-line-accent bg-accent' : 'border-line bg-surface-raised',
          'after:absolute after:top-0.5 after:size-4.5 after:rounded-full after:transition-all',
          checked
            ? 'after:start-[calc(100%-1.375rem)] after:bg-on-accent'
            : 'after:start-0.5 after:bg-muted',
        )}
      />
      <span className="flex flex-col">
        <span className="text-sm font-medium text-text">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}
