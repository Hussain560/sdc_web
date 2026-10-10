import { ChevronDown } from 'lucide-react';
import { useId, type SelectHTMLAttributes } from 'react';
import { cn } from './cn';
import { controlClasses, describedBy, FieldLabel, FieldMessages } from './field-parts';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  success?: string;
  requiredLabel?: string;
  optionalLabel?: string;
}

/** Labelled native select (components §5.4) with a chevron that does not mirror. */
export function Select({
  label,
  error,
  hint,
  success,
  requiredLabel,
  optionalLabel,
  className,
  id,
  children,
  ...rest
}: SelectProps) {
  const auto = useId();
  const selectId = id ?? auto;
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel
        htmlFor={selectId}
        label={label}
        requiredLabel={requiredLabel}
        optionalLabel={optionalLabel}
      />
      <div className="relative">
        <select
          {...rest}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(selectId, { hint, error, success })}
          className={cn(
            'min-h-12 appearance-none pe-11',
            controlClasses(!!error, !!success),
            className,
          )}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute end-4 top-1/2 size-5 -translate-y-1/2 text-muted"
        />
      </div>
      <FieldMessages id={selectId} hint={hint} error={error} success={success} />
    </div>
  );
}
