import { useId } from 'react';
import { cn } from './cn';

/**
 * On/off switch (components §5.7): a checkbox with role="switch". Track 44×24, thumb 18 px; the thumb moves toward
 * the inline-end when on, so it mirrors in RTL. For settings that apply immediately.
 */
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
        'flex min-h-11 cursor-pointer items-start gap-3 py-2',
        disabled && 'cursor-not-allowed opacity-45',
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
          'relative mt-0.5 inline-block h-6 w-11 shrink-0 rounded-full border-[1.5px]',
          'transition-colors duration-(--duration-fast) motion-reduce:transition-none',
          'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring',
          checked ? 'border-accent bg-accent' : 'border-line-strong bg-surface-raised',
          'after:absolute after:top-[2.5px] after:size-4.5 after:rounded-full',
          'after:transition-[inset-inline-start] after:duration-(--duration-fast) motion-reduce:after:transition-none',
          checked
            ? 'after:start-[calc(100%-1.25rem-2px)] after:bg-on-accent'
            : 'after:start-[2.5px] after:bg-muted',
        )}
      />
      <span className="flex flex-col">
        <span className="t-label text-text">{label}</span>
        {hint && <span className="t-body-sm text-muted">{hint}</span>}
      </span>
    </label>
  );
}
