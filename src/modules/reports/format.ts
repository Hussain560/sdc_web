/** A rate in 0–100 as "62%", or an en dash when the metric is not computable (never a made-up 0). */
export const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v)}%`);

/** Small groups are hidden by the database (null); the UI shows "<5" instead of a number. */
export const small = (v: number | null) => (v === null ? '<5' : String(v));

export type Trend = { dir: 'up' | 'down' | 'flat'; text: string } | null;

/** Change versus the previous period; null when there is nothing to compare against. */
export function trend(cur: number | null, prev: number | null, unit: 'pct' | 'pp' = 'pct'): Trend {
  if (cur === null || prev === null) return null;
  if (unit === 'pp') {
    const d = Math.round(cur - prev);
    return { dir: d > 0 ? 'up' : d < 0 ? 'down' : 'flat', text: `${Math.abs(d)} pp` };
  }
  if (prev === 0) return cur === 0 ? { dir: 'flat', text: '0%' } : null;
  const d = Math.round(((cur - prev) / prev) * 100);
  return { dir: d > 0 ? 'up' : d < 0 ? 'down' : 'flat', text: `${Math.abs(d)}%` };
}

/** "2026-03" as a short month and two-digit year in the active language. */
export function monthLabel(ym: string, lang: 'ar' | 'en') {
  const d = new Date(`${ym.slice(0, 7)}-01T00:00:00Z`);
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  }).format(d);
}
