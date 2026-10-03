import type { EventPhase, EventStatus } from './types';

/**
 * Derived timing phase (EV-6): mirrors `private.event_phase()` in the database, line for line.
 * Both are tested against the same truth table (supabase/tests/05_events.sql, tests/unit/events-phase.test.ts).
 * Dates are Asia/Riyadh wall-clock time (UTC+3, no daylight saving).
 */
export type PhaseInput = {
  status: EventStatus;
  startDate: string | null; // yyyy-mm-dd
  lastDate: string | null;
  startTime: string | null; // hh:mm[:ss]
  endTime: string | null;
  registrationStartAt: string | null; // ISO
  registrationEndAt: string | null;
  seats: number | null;
  accepted: number;
  autoClose: boolean;
};

const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Wall-clock milliseconds in Riyadh for an instant (so comparisons need no further conversion). */
const riyadhMs = (instant: Date | string) => new Date(instant).getTime() + RIYADH_OFFSET_MS;

/** yyyy-mm-dd + time → Riyadh wall-clock ms. */
function wall(date: string, time: string): number {
  const t = time.length === 5 ? `${time}:00` : time;
  return Date.parse(`${date}T${t}Z`);
}

export function derivePhase(input: PhaseInput, now: Date | string = new Date()): EventPhase | null {
  const { status } = input;
  if (status === 'cancelled') return 'cancelled';
  if (status === 'completed' || status === 'archived') return 'ended';
  if (status !== 'published') return null;

  const n = riyadhMs(now);
  const firstStart = input.startDate ? wall(input.startDate, input.startTime ?? '00:00:00') : null;
  const lastEnd = input.lastDate ? wall(input.lastDate, input.endTime ?? '23:59:59') : null;
  const regStart = input.registrationStartAt ? riyadhMs(input.registrationStartAt) : null;
  const regEnd = input.registrationEndAt
    ? riyadhMs(input.registrationEndAt)
    : input.startDate
      ? wall(input.startDate, '23:59:59')
      : null;

  if (lastEnd !== null && n >= lastEnd) return 'ended';
  if (firstStart === null) return 'announced';
  if (regStart !== null && n < regStart) return 'announced';
  const full = input.autoClose && input.seats !== null && input.accepted >= input.seats;
  if (regEnd !== null && regEnd > n && !full) return 'registration_open';
  if (n < firstStart) return 'registration_closed';
  return 'in_progress';
}
