/** Today's date (yyyy-mm-dd) in Saudi Arabia (UTC+3, no daylight saving). Server-side helper for "has it ended?" checks. */
export function todayInRiyadh(now: number = Date.now()): string {
  return new Date(now + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Whole days from now until an instant (at least 1 while it is still in the future). Server-side helper. */
export function daysUntil(iso: string, now: number = Date.now()): number {
  return Math.max(1, Math.ceil((Date.parse(iso) - now) / 86_400_000));
}
