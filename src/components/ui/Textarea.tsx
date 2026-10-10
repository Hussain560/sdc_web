import { useId, type TextareaHTMLAttributes } from 'react';
import { cn } from './cn';
import { controlClasses, describedBy, FieldLabel, FieldMessages } from './field-parts';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  success?: string;
  requiredLabel?: string;
  optionalLabel?: string;
  /** Shows "n/max" under the field when `maxLength` is set. */
  counter?: boolean;
  /** Keep the label for assistive tech but hide it visually (when the page shows its own heading). */
  hideLabel?: boolean;
}

/** Multi-line input (components §5.3): at least 4 rows, grows with the content where the browser supports it. */
export function Textarea({
  label,
  error,
  hint,
  success,
  requiredLabel,
  optionalLabel,
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
  const length = typeof value === 'string' ? value.length : 0;
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel
        htmlFor={fieldId}
        label={label}
        requiredLabel={requiredLabel}
        optionalLabel={optionalLabel}
        hidden={hideLabel}
      />
      <textarea
        rows={4}
        {...rest}
        id={fieldId}
        value={value}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, { hint, error, success })}
        className={cn(
          'min-h-28 max-h-80 [field-sizing:content] py-3',
          controlClasses(!!error, !!success),
          className,
        )}
      />
      <FieldMessages
        id={fieldId}
        hint={hint}
        error={error}
        success={success}
        extra={
          counter && maxLength ? (
            <p className="t-caption shrink-0 tabular-nums text-muted" aria-hidden="true">
              {length}/{maxLength}
            </p>
          ) : undefined
        }
      />
    </div>
  );
}
