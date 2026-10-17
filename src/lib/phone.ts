import {
  AsYouType,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js/min';

/**
 * Mobile numbers for forms: a country (Saudi Arabia first), the national digits the person types, and the
 * international number (E.164) the server stores. `libphonenumber-js` owns the per-country rules.
 */

export type PhoneCountry = CountryCode;

export const DEFAULT_PHONE_COUNTRY: PhoneCountry = 'SA';

/** The countries offered in the picker: the Gulf and the Arab world first, then the most common others. */
export const PHONE_COUNTRIES: readonly PhoneCountry[] = [
  'SA',
  'AE',
  'KW',
  'QA',
  'BH',
  'OM',
  'EG',
  'JO',
  'LB',
  'IQ',
  'SY',
  'YE',
  'SD',
  'LY',
  'TN',
  'DZ',
  'MA',
  'PS',
  'TR',
  'PK',
  'IN',
  'BD',
  'ID',
  'MY',
  'PH',
  'US',
  'CA',
  'GB',
  'DE',
  'FR',
];

/** "+966" */
export const callingCode = (country: PhoneCountry) => `+${getCountryCallingCode(country)}`;

export function countryName(country: PhoneCountry, lang: 'ar' | 'en'): string {
  try {
    return new Intl.DisplayNames(lang, { type: 'region' }).of(country) ?? country;
  } catch {
    return country;
  }
}

/** What the box shows when it is empty. Saudi mobile numbers are 5x xxx xxxx. */
export const phonePlaceholder = (country: PhoneCountry) => (country === 'SA' ? '5x xxx xxxx' : '');

const MAX_DIGITS: Partial<Record<PhoneCountry, number>> = { SA: 9 };
const DEFAULT_MAX_DIGITS = 12;

/**
 * Keeps only the digits a person may type for this country: Arabic-Indic digits are converted, a leading "0"
 * or the country's own prefix (they pasted "+966…" or "00966…") is dropped, and the length is capped.
 */
export function cleanNational(country: PhoneCountry, raw: string): string {
  const latin = raw.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  let digits = latin.replace(/\D/g, '');
  const code = String(getCountryCallingCode(country));
  const pastedInternational = /^\s*(\+|00)/.test(latin);
  if (pastedInternational && digits.startsWith(code)) digits = digits.slice(code.length);
  else if (digits.startsWith('00')) digits = digits.slice(2);
  if (country === 'SA') {
    if (digits.startsWith('0')) digits = digits.slice(1);
  } else if (digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, MAX_DIGITS[country] ?? DEFAULT_MAX_DIGITS);
}

/** "5x xxx xxxx" for Saudi numbers (2-3-4), the library's grouping for everyone else. */
export function formatNational(country: PhoneCountry, digits: string): string {
  if (country === 'SA') {
    return [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 9)].filter(Boolean).join(' ');
  }
  return new AsYouType(country).input(digits);
}

/** The E.164 number ("+966501234567"), or null when the digits are not a valid number for the country. */
export function toE164(country: PhoneCountry, digits: string): string | null {
  const parsed = parsePhoneNumberFromString(digits, country);
  return parsed?.isValid() ? parsed.number : null;
}

/** Validates a full international number sent to the server. Returns it normalised, or null. */
export function normalizeInternational(value: string): string | null {
  const parsed = parsePhoneNumberFromString(value.trim());
  return parsed?.isValid() ? parsed.number : null;
}

/** Splits a stored international number into the country and the national digits the form shows; null if unreadable. */
export function splitInternational(value: string | null | undefined): {
  country: PhoneCountry;
  national: string;
} | null {
  if (!value) return null;
  const parsed = parsePhoneNumberFromString(value.trim());
  if (!parsed?.country) return null;
  return { country: parsed.country, national: String(parsed.nationalNumber) };
}
