import type { EventPhase } from './types';

/**
 * What the public event page shows for an event and a viewer (PUBLIC-SCREENS-V2/02-event-page.md §4, states S1-S13).
 * Pure: the page passes in the data and the clock, the tests walk every row of the table.
 */

/** Q-E4: "closes soon" thresholds. Change these two constants if the owner decides differently. */
export const CLOSES_SOON_HOURS = 48;
export const CLOSES_SOON_SEATS = (seats: number) => Math.max(3, Math.ceil(seats * 0.1));

export type EventViewInput = {
  phase: EventPhase;
  startDate: string | null;
  seats: number | null;
  seatsLeft: number | null;
  waitlistEnabled: boolean;
  audience: 'public' | 'members_only';
  registrationStartAt: string | null;
  registrationEndAt: string | null;
};

export type ViewerRegistration = 'accepted' | 'pending' | 'waitlisted';

export type EventViewer = {
  /** Signed in with an active membership. */
  isMember: boolean;
  /** The viewer's own, non-cancelled registration for this event. */
  registration: ViewerRegistration | null;
};

/** An attendance session for today exists and is open (from `check_in_public_context`). */
export type CheckInSession = { open: boolean } | null;

export type EventStateId =
  'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8' | 'S9' | 'S10' | 'S11' | 'S12' | 'S13';

/** Status pill keys (the vocabulary lives in `ui/StatusPill`; extra keys are mapped by the page). */
export type PillKey =
  | 'opens-soon'
  | 'registration-open'
  | 'closes-soon'
  | 'full-waitlist'
  | 'full'
  | 'closed'
  | 'members-only'
  | 'registered'
  | 'under-review'
  | 'on-waitlist'
  | 'running-now'
  | 'finished'
  | 'cancelled';

export type PrimaryAction =
  | { kind: 'register' }
  | { kind: 'waitlist' }
  | { kind: 'apply' }
  | { kind: 'check-in' }
  | { kind: 'calendar' }
  | { kind: 'disabled'; reason: 'opens' | 'full' | 'closed' }
  | { kind: 'none' };

export type EventViewState = {
  id: EventStateId;
  pill: PillKey;
  action: PrimaryAction;
  /** Extra line under the action. */
  note: 'closes-in' | 'seats-left' | 'waitlist-promise' | 'date-tbd' | null;
  /** Show the viewer's confirmation panel in place of the action (S8). */
  confirmation: ViewerRegistration | null;
  /** The cancelled-event alert above the hero (S12). */
  showCancelAlert: boolean;
  /** The "happening now" marker on today's agenda card (S9, S10). */
  markToday: boolean;
};

const base: Omit<EventViewState, 'id' | 'pill' | 'action'> = {
  note: null,
  confirmation: null,
  showCancelAlert: false,
  markToday: false,
};

const HOUR = 3_600_000;

/** True when registration ends within 48 h, or the seats left are at or under max(3, 10 %). */
export function isClosingSoon(e: EventViewInput, now: number): boolean {
  if (e.registrationEndAt) {
    const left = Date.parse(e.registrationEndAt) - now;
    if (left > 0 && left < CLOSES_SOON_HOURS * HOUR) return true;
  }
  if (e.seats !== null && e.seatsLeft !== null && e.seatsLeft > 0) {
    return e.seatsLeft <= CLOSES_SOON_SEATS(e.seats);
  }
  return false;
}

export function eventViewState(
  event: EventViewInput,
  viewer: EventViewer,
  session: CheckInSession,
  now: number,
): EventViewState {
  const { phase } = event;

  if (phase === 'cancelled')
    return {
      ...base,
      id: 'S12',
      pill: 'cancelled',
      action: { kind: 'none' },
      showCancelAlert: true,
    };

  if (phase === 'ended') return { ...base, id: 'S11', pill: 'finished', action: { kind: 'none' } };

  if (phase === 'in_progress') {
    if (session?.open)
      return {
        ...base,
        id: 'S9',
        pill: 'running-now',
        action: { kind: 'check-in' },
        markToday: true,
      };
    return { ...base, id: 'S10', pill: 'running-now', action: { kind: 'none' }, markToday: true };
  }

  // From here on: announced, registration_open, registration_closed.
  if (viewer.registration) {
    return {
      ...base,
      id: 'S8',
      pill:
        viewer.registration === 'accepted'
          ? 'registered'
          : viewer.registration === 'pending'
            ? 'under-review'
            : 'on-waitlist',
      action: { kind: 'calendar' },
      confirmation: viewer.registration,
    };
  }

  if (phase === 'announced') {
    if (event.startDate === null)
      return {
        ...base,
        id: 'S13',
        pill: 'opens-soon',
        action: event.registrationStartAt
          ? { kind: 'disabled', reason: 'opens' }
          : { kind: 'none' },
        note: 'date-tbd',
      };
    return {
      ...base,
      id: 'S1',
      pill: 'opens-soon',
      action: event.registrationStartAt ? { kind: 'disabled', reason: 'opens' } : { kind: 'none' },
    };
  }

  if (phase === 'registration_closed')
    return { ...base, id: 'S6', pill: 'closed', action: { kind: 'disabled', reason: 'closed' } };

  // registration_open
  if (event.audience === 'members_only' && !viewer.isMember)
    return { ...base, id: 'S7', pill: 'members-only', action: { kind: 'apply' } };

  const full = event.seats !== null && event.seatsLeft !== null && event.seatsLeft <= 0;
  if (full && event.waitlistEnabled)
    return {
      ...base,
      id: 'S4',
      pill: 'full-waitlist',
      action: { kind: 'waitlist' },
      note: 'waitlist-promise',
    };
  if (full)
    return { ...base, id: 'S5', pill: 'full', action: { kind: 'disabled', reason: 'full' } };

  if (isClosingSoon(event, now)) {
    const byTime =
      !!event.registrationEndAt &&
      Date.parse(event.registrationEndAt) - now < CLOSES_SOON_HOURS * HOUR;
    return {
      ...base,
      id: 'S3',
      pill: 'closes-soon',
      action: { kind: 'register' },
      note: byTime ? 'closes-in' : 'seats-left',
    };
  }

  return { ...base, id: 'S2', pill: 'registration-open', action: { kind: 'register' } };
}
