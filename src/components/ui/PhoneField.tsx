'use client';

import { ChevronDown } from 'lucide-react';
import { useId } from 'react';
import {
  PHONE_COUNTRIES,
  callingCode,
  cleanNational,
  countryName,
  formatNational,
  phonePlaceholder,
  type PhoneCountry,
} from '@/lib/phone';
import { cn } from './cn';
import { describedBy, FieldLabel, FieldMessages } from './field-parts';

/**
 * Mobile number input: a country picker with its calling code ("SA +966") and the national number, formatted as
 * the person types (Saudi numbers read 5x xxx xxxx). `value` holds the national digits only; the parent combines it
 * with the country (`toE164`) on submit. The control is always left-to-right, because numbers are.
 */
export function PhoneField({
  label,
  country,
  onCountryChange,
  value,
  onChange,
  lang,
  countryLabel,
  error,
  hint,
  requiredLabel,
  optionalLabel,
  readOnly,
  onBlur,
  id,
}: {
  label: string;
  country: PhoneCountry;
  onCountryChange: (country: PhoneCountry) => void;
  /** National digits, no spaces and no leading zero. */
  value: string;
  onChange: (digits: string) => void;
  lang: 'ar' | 'en';
  /** Accessible name of the country picker, e.g. "Country calling code". */
  countryLabel: string;
  error?: string;
  hint?: string;
  requiredLabel?: string;
  optionalLabel?: string;
  readOnly?: boolean;
  onBlur?: () => void;
  id?: string;
}) {
  const auto = useId();
  const inputId = id ?? auto;
  const shown = formatNational(country, value);

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel
        htmlFor={inputId}
        label={label}
        requiredLabel={requiredLabel}
        optionalLabel={optionalLabel}
      />
      <div
        dir="ltr"
        className={cn(
          'flex min-h-12 items-stretch overflow-hidden rounded-shape-md border bg-field text-base text-text',
          'transition-colors duration-(--duration-fast) motion-reduce:transition-none',
          'focus-within:border-accent focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring',
          error ? 'border-[1.5px] border-danger' : 'border-line-strong hover:border-muted',
        )}
      >
        {/* The visible text is short ("SA +966"); the native list underneath carries the full country names. */}
        <div className="relative flex shrink-0 items-center gap-1 border-e border-line px-3">
          <span aria-hidden="true" className="font-semibold tabular-nums">
            {country} {callingCode(country)}
          </span>
          <ChevronDown aria-hidden="true" className="size-4 text-muted" />
          <select
            aria-label={countryLabel}
            value={country}
            disabled={readOnly}
            onChange={(e) => onCountryChange(e.target.value as PhoneCountry)}
            className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          >
            {/* Country names come from the ICU data of the runtime: the server and the browser can spell a few of
                them differently ("Palestine" and "Palestinian Territories"). That is harmless text, not a bug. */}
            {PHONE_COUNTRIES.map((c) => (
              <option key={c} value={c} suppressHydrationWarning>
                {`${countryName(c, lang)} (${callingCode(c)})`}
              </option>
            ))}
          </select>
        </div>
        <input
          id={inputId}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          dir="ltr"
          readOnly={readOnly}
          onBlur={onBlur}
          value={shown}
          placeholder={phonePlaceholder(country)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, { hint, error })}
          onChange={(e) => {
            let digits = cleanNational(country, e.target.value);
            // Backspace over a space only removes the space from the display: take the digit before it instead.
            if (e.target.value.length < shown.length && digits === value)
              digits = value.slice(0, -1);
            onChange(digits);
          }}
          className="min-w-0 flex-1 bg-transparent px-4 text-start tabular-nums outline-none placeholder:text-subtle read-only:text-muted"
        />
      </div>
      <FieldMessages id={inputId} hint={hint} error={error} />
    </div>
  );
}
