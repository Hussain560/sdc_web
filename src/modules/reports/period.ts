import { todayInRiyadh } from '@/lib/time';

export type PeriodKind = 'last12' | 'year' | 'month' | 'custom';

export type Period = { kind: PeriodKind; from: string; to: string };

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const valid = (s: string | undefined): s is string =>
  !!s && ISO.test(s) && !Number.isNaN(Date.parse(s));
const shift = (iso: string, days: number) =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

/**
 * The reporting period from the URL. RP-4 says "current membership year"; no membership year is defined yet (Q-008),
 * so the default is the last 12 months. Also: this calendar year so far, this month, or a custom range (≤ 5 years).
 */
export function parsePeriod(
  sp: { period?: string; from?: string; to?: string },
  today = todayInRiyadh(),
): Period {
  if (sp.period === 'custom' && valid(sp.from) && valid(sp.to) && sp.to >= sp.from) {
    const capped = sp.to > shift(sp.from, 1830) ? shift(sp.from, 1830) : sp.to;
    return { kind: 'custom', from: sp.from, to: capped };
  }
  if (sp.period === 'year') return { kind: 'year', from: `${today.slice(0, 4)}-01-01`, to: today };
  if (sp.period === 'month') return { kind: 'month', from: `${today.slice(0, 7)}-01`, to: today };
  return { kind: 'last12', from: shift(today, -364), to: today };
}

/** Query string for a preset (kept in the URL so a dashboard is linkable). */
export const periodQuery = (p: Period) =>
  p.kind === 'custom' ? `period=custom&from=${p.from}&to=${p.to}` : `period=${p.kind}`;
