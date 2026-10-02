/** Dates are shown in Saudi time (UTC+3), Gregorian calendar, in the active language. */
export function formatDate(iso: string | null, lang: 'ar' | 'en'): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
    dateStyle: 'medium',
    timeZone: 'Asia/Riyadh',
  }).format(new Date(iso));
}
