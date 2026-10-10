/**
 * Name fields that keep the two scripts apart: the Arabic boxes take Arabic letters only and the English boxes
 * take Latin letters only. People type, paste or autofill into them, so the `keep*` helpers strip what does not
 * belong while typing and the `is*` checks run again on submit and on the server.
 */

/** Arabic letters, their marks (fatha, kasra…) and alef wasla. */
const AR_LETTER = '\\u0621-\\u064A\\u064B-\\u0652\\u0671';
const AR_ALLOWED = new RegExp(`[^${AR_LETTER} \\-]`, 'g');
const AR_NAME = new RegExp(`^[${AR_LETTER}]{2,}(?:[ \\-][${AR_LETTER}]+)*$`);

const EN_ALLOWED = /[^A-Za-z '\-]/g;
const EN_NAME = /^(?=(?:.*[A-Za-z]){2})[A-Za-z]+(?:[ '\-][A-Za-z]+)*$/;

const tidy = (s: string) => s.replace(/ {2,}/g, ' ').replace(/^[ \-']+/, '');

/** For an Arabic name box: drops every character that is not an Arabic letter, a space or a hyphen. */
export const keepArabic = (value: string) => tidy(value.replace(AR_ALLOWED, ''));

/** For an English name box: drops every character that is not A–Z, a space, an apostrophe or a hyphen. */
export const keepEnglish = (value: string) => tidy(value.replace(EN_ALLOWED, ''));

const MAX_PART = 40;

/** At least two Arabic letters, only Arabic letters, spaces and hyphens, at most 40 characters. */
export const isArabicName = (value: string) =>
  value.trim().length <= MAX_PART && AR_NAME.test(value.trim());

/** At least two Latin letters, only A–Z, spaces, apostrophes and hyphens, at most 40 characters. */
export const isEnglishName = (value: string) =>
  value.trim().length <= MAX_PART && EN_NAME.test(value.trim());
