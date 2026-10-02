/** Dates are shown in Saudi time (UTC+3), Gregorian calendar, in the active language. */
export function formatDate(iso: string | null, lang: 'ar' | 'en'): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
    dateStyle: 'medium',
    timeZone: 'Asia/Riyadh',
  }).format(new Date(iso));
}

/** "10 Nov 2026" or a range "10–12 Nov 2026" from yyyy-mm-dd strings, in the active language. */
export function formatDateRange(
  start: string | null,
  end: string | null,
  lang: 'ar' | 'en',
): string {
  if (!start) return lang === 'ar' ? 'يُعلن لاحقًا' : 'To be announced';
  const fmt = (d: string) =>
    new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
      dateStyle: 'medium',
      timeZone: 'UTC',
    }).format(new Date(`${d}T00:00:00Z`));
  return end && end !== start ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
}

/** "18:00–20:00" (Asia/Riyadh wall-clock, as stored). */
export function formatTimeRange(start: string | null, end: string | null): string {
  const s = start?.slice(0, 5);
  const e = end?.slice(0, 5);
  if (s && e) return `${s}–${e}`;
  return s ?? '';
}

/** Relative time ("3 hours ago") for review queues and history. */
export function formatRelative(iso: string, lang: 'ar' | 'en', now = Date.now()): string {
  const diff = new Date(iso).getTime() - now;
  const rtf = new Intl.RelativeTimeFormat(lang === 'ar' ? 'ar' : 'en', { numeric: 'auto' });
  const abs = Math.abs(diff);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000],
  ];
  for (const [unit, ms] of units) {
    if (abs >= ms) return rtf.format(Math.round(diff / ms), unit);
  }
  return rtf.format(0, 'minute');
}
