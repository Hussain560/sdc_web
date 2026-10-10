import { describe, expect, it } from 'vitest';
import {
  CLOSES_SOON_SEATS,
  eventViewState,
  isClosingSoon,
  type EventViewInput,
  type EventViewer,
} from '@/modules/events/view-state';

const NOW = Date.parse('2026-10-10T09:00:00Z');
const hours = (h: number) => new Date(NOW + h * 3_600_000).toISOString();

const open: EventViewInput = {
  phase: 'registration_open',
  startDate: '2026-10-20',
  seats: 60,
  seatsLeft: 40,
  waitlistEnabled: false,
  audience: 'public',
  registrationStartAt: hours(-100),
  registrationEndAt: hours(24 * 6),
};
const guest: EventViewer = { isMember: false, registration: null };
const member: EventViewer = { isMember: true, registration: null };
const state = (
  e: Partial<EventViewInput> = {},
  v: EventViewer = guest,
  session: { open: boolean } | null = null,
) => eventViewState({ ...open, ...e }, v, session, NOW);

describe('eventViewState: every row of the table', () => {
  it('S1 announced with a registration date: disabled "opens" action', () => {
    const s = state({ phase: 'announced', registrationStartAt: hours(72) });
    expect(s.id).toBe('S1');
    expect(s.pill).toBe('opens-soon');
    expect(s.action).toEqual({ kind: 'disabled', reason: 'opens' });
  });

  it('S1 announced without a registration date: no button', () => {
    const s = state({ phase: 'announced', registrationStartAt: null });
    expect(s.id).toBe('S1');
    expect(s.action).toEqual({ kind: 'none' });
  });

  it('S2 open with seats left', () => {
    const s = state();
    expect(s.id).toBe('S2');
    expect(s.pill).toBe('registration-open');
    expect(s.action).toEqual({ kind: 'register' });
  });

  it('S2 open with no seat limit', () => {
    expect(state({ seats: null, seatsLeft: null }).id).toBe('S2');
  });

  it('S3 closes soon by time (< 48 h)', () => {
    const s = state({ registrationEndAt: hours(47) });
    expect(s.id).toBe('S3');
    expect(s.pill).toBe('closes-soon');
    expect(s.note).toBe('closes-in');
    expect(s.action).toEqual({ kind: 'register' });
  });

  it('S3 closes soon by seats (<= max(3, 10 %))', () => {
    const s = state({ seats: 100, seatsLeft: 10 });
    expect(s.id).toBe('S3');
    expect(s.note).toBe('seats-left');
  });

  it('S4 full with a waiting list', () => {
    const s = state({ seatsLeft: 0, waitlistEnabled: true });
    expect(s.id).toBe('S4');
    expect(s.action).toEqual({ kind: 'waitlist' });
    expect(s.note).toBe('waitlist-promise');
  });

  it('S5 full without a waiting list', () => {
    const s = state({ seatsLeft: 0 });
    expect(s.id).toBe('S5');
    expect(s.action).toEqual({ kind: 'disabled', reason: 'full' });
  });

  it('S6 registration closed', () => {
    const s = state({ phase: 'registration_closed' });
    expect(s.id).toBe('S6');
    expect(s.action).toEqual({ kind: 'disabled', reason: 'closed' });
  });

  it('S7 members only, viewer is not a member: apply for membership', () => {
    const s = state({ audience: 'members_only' });
    expect(s.id).toBe('S7');
    expect(s.pill).toBe('members-only');
    expect(s.action).toEqual({ kind: 'apply' });
  });

  it('S7 does not apply to members: they see S2 to S6 as usual', () => {
    expect(state({ audience: 'members_only' }, member).id).toBe('S2');
    expect(state({ audience: 'members_only', seatsLeft: 0 }, member).id).toBe('S5');
  });

  it.each([
    ['accepted', 'registered'],
    ['pending', 'under-review'],
    ['waitlisted', 'on-waitlist'],
  ] as const)('S8 registered as %s shows the confirmation panel', (registration, pill) => {
    const s = state({}, { isMember: true, registration });
    expect(s.id).toBe('S8');
    expect(s.pill).toBe(pill);
    expect(s.confirmation).toBe(registration);
    expect(s.action).toEqual({ kind: 'calendar' });
  });

  it('S8 wins over full and members-only states', () => {
    expect(
      state(
        { seatsLeft: 0, audience: 'members_only' },
        { isMember: true, registration: 'accepted' },
      ).id,
    ).toBe('S8');
  });

  it('S9 running with an open check-in session', () => {
    const s = state({ phase: 'in_progress' }, member, { open: true });
    expect(s.id).toBe('S9');
    expect(s.action).toEqual({ kind: 'check-in' });
    expect(s.markToday).toBe(true);
  });

  it('S10 running without an open session', () => {
    expect(state({ phase: 'in_progress' }, guest, null).id).toBe('S10');
    expect(state({ phase: 'in_progress' }, guest, { open: false }).id).toBe('S10');
    expect(state({ phase: 'in_progress' }).action).toEqual({ kind: 'none' });
  });

  it('S11 finished', () => {
    const s = state({ phase: 'ended' });
    expect(s.id).toBe('S11');
    expect(s.pill).toBe('finished');
    expect(s.action).toEqual({ kind: 'none' });
  });

  it('S12 cancelled shows the alert and no action', () => {
    const s = state({ phase: 'cancelled' }, { isMember: true, registration: 'accepted' });
    expect(s.id).toBe('S12');
    expect(s.showCancelAlert).toBe(true);
    expect(s.action).toEqual({ kind: 'none' });
  });

  it('S13 date to be announced', () => {
    const s = state({ phase: 'announced', startDate: null });
    expect(s.id).toBe('S13');
    expect(s.note).toBe('date-tbd');
  });
});

describe('closes-soon thresholds (Q-E4)', () => {
  it('seats: max(3, 10 %)', () => {
    expect(CLOSES_SOON_SEATS(20)).toBe(3);
    expect(CLOSES_SOON_SEATS(100)).toBe(10);
    expect(CLOSES_SOON_SEATS(101)).toBe(11);
  });

  it('exactly at the seat threshold is soon, one above is not', () => {
    expect(isClosingSoon({ ...open, seats: 100, seatsLeft: 10 }, NOW)).toBe(true);
    expect(isClosingSoon({ ...open, seats: 100, seatsLeft: 11 }, NOW)).toBe(false);
  });

  it('small events use 3 seats', () => {
    expect(isClosingSoon({ ...open, seats: 20, seatsLeft: 3 }, NOW)).toBe(true);
    expect(isClosingSoon({ ...open, seats: 20, seatsLeft: 4 }, NOW)).toBe(false);
  });

  it('time: strictly under 48 h and still in the future', () => {
    expect(isClosingSoon({ ...open, registrationEndAt: hours(47.9) }, NOW)).toBe(true);
    expect(isClosingSoon({ ...open, registrationEndAt: hours(48) }, NOW)).toBe(false);
    expect(isClosingSoon({ ...open, registrationEndAt: hours(-1) }, NOW)).toBe(false);
  });

  it('zero seats left is full, not closing soon', () => {
    expect(isClosingSoon({ ...open, seatsLeft: 0 }, NOW)).toBe(false);
  });
});
