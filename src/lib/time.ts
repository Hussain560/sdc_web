/** Today's date (yyyy-mm-dd) in Saudi Arabia (UTC+3, no daylight saving). Server-side helper for "has it ended?" checks. */
export function todayInRiyadh(now: number = Date.now()): string {
  return new Date(now + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
