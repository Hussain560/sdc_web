/** Dates are shown in Saudi time (UTC+3), Gregorian calendar, in the active language. */
export function formatDate(iso: string | null, lang: 'ar' | 'en'): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
    dateStyle: 'medium',
    timeZone: 'Asia/Riyadh',
  }).format(new Date(iso));
}

/**
 * One line for a date or a range: "22 October 2026", "22 – 23 October 2026", "30 October – 1 November 2026". The
 * month is written out in Arabic and abbreviated in English; a range shares the month and year when it can.
 */
export function formatDateRange(
  start: string | null,
  end: string | null,
  lang: 'ar' | 'en',
): string {
  if (!start) return lang === 'ar' ? 'يُعلن لاحقًا' : 'To be announced';
  const fmt = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: lang === 'ar' ? 'long' : 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const a = new Date(`${start}T00:00:00Z`);
  if (!end || end === start) return fmt.format(a);
  return fmt.formatRange(a, new Date(`${end}T00:00:00Z`)).replace(/\s*–\s*/, ' – ');
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

const PERIOD = { ar: { am: 'ص', pm: 'م' }, en: { am: 'AM', pm: 'PM' } } as const;

/**
 * 12-hour clock for people, never 24h: "6:00 – 8:00 م" / "6:00 – 8:00 PM". Both ends share one period mark; a
 * range that crosses noon keeps both ("11:00 ص – 1:00 م"). Input is the stored "HH:MM[:SS]" wall-clock time.
 */
export function formatTime(start: string | null, end: string | null, lang: 'ar' | 'en'): string {
  const part = (t: string | null) => {
    const m = t?.match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    const h = Number(m[1]);
    return { clock: `${h % 12 || 12}:${m[2]}`, period: h < 12 ? 'am' : 'pm' } as const;
  };
  const a = part(start);
  const b = part(end);
  if (!a) return '';
  const mark = (p: 'am' | 'pm') => PERIOD[lang][p];
  if (!b) return `${a.clock} ${mark(a.period)}`;
  return a.period === b.period
    ? `${a.clock} – ${b.clock} ${mark(b.period)}`
    : `${a.clock} ${mark(a.period)} – ${b.clock} ${mark(b.period)}`;
}
