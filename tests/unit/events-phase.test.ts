import { describe, expect, it } from 'vitest';
import { derivePhase, type PhaseInput } from '@/modules/events/phase';

// The SAME cases as supabase/tests/05_events.sql ("phase truth table"): SQL and TypeScript must agree.
const base: PhaseInput = {
  status: 'published',
  startDate: '2026-11-10',
  lastDate: '2026-11-10',
  startTime: '18:00',
  endTime: '20:00',
  registrationStartAt: null,
  registrationEndAt: '2026-11-09T20:59:00Z',
  seats: 60,
  accepted: 10,
  autoClose: true,
};

const cases: Array<[string, Partial<PhaseInput>, string, string | null]> = [
  ['registration open before the deadline', {}, '2026-11-01T09:00Z', 'registration_open'],
  [
    'announced before registration opens',
    { registrationStartAt: '2026-11-05T00:00Z' },
    '2026-11-01T09:00Z',
    'announced',
  ],
  ['closed after the deadline, before the start', {}, '2026-11-09T21:30Z', 'registration_closed'],
  ['in progress during the event', {}, '2026-11-10T16:00Z', 'in_progress'],
  ['ended after the last day', {}, '2026-11-10T18:00Z', 'ended'],
  [
    'an extended deadline reopens registration while in progress',
    { registrationEndAt: '2026-11-10T20:59:00Z' },
    '2026-11-10T16:00Z',
    'registration_open',
  ],
  [
    'full + auto-close closes registration',
    { accepted: 60 },
    '2026-11-01T09:00Z',
    'registration_closed',
  ],
  [
    'full without auto-close stays open',
    { accepted: 60, autoClose: false },
    '2026-11-01T09:00Z',
    'registration_open',
  ],
  [
    'no date yet is announced',
    {
      startDate: null,
      lastDate: null,
      startTime: null,
      endTime: null,
      registrationEndAt: null,
      seats: null,
      accepted: 0,
    },
    '2026-11-01T09:00Z',
    'announced',
  ],
  [
    'no deadline = open until the end of the first day',
    {
      lastDate: '2026-11-12',
      startTime: null,
      endTime: null,
      registrationEndAt: null,
      seats: null,
      accepted: 0,
    },
    '2026-11-10T10:00Z',
    'registration_open',
  ],
  [
    'multi-day event is in progress on day 2',
    {
      lastDate: '2026-11-12',
      startTime: null,
      endTime: null,
      registrationEndAt: null,
      seats: null,
      accepted: 0,
    },
    '2026-11-11T09:00Z',
    'in_progress',
  ],
  ['drafts have no phase', { status: 'draft' }, '2026-11-01T00:00Z', null],
  ['cancelled', { status: 'cancelled' }, '2026-11-01T00:00Z', 'cancelled'],
  ['completed events are ended', { status: 'completed' }, '2026-11-01T00:00Z', 'ended'],
  [
    'Riyadh date boundary (first day, no times)',
    { startTime: null, endTime: null, registrationEndAt: null, seats: null, accepted: 0 },
    '2026-11-09T21:00Z',
    'registration_open',
  ],
];

describe('derivePhase mirrors private.event_phase()', () => {
  it.each(cases)('%s', (_name, patch, now, expected) => {
    expect(derivePhase({ ...base, ...patch }, now)).toBe(expected);
  });

  it('treats the Riyadh midnight boundary exactly (21:00Z is already the next day)', () => {
    const input = {
      ...base,
      startTime: null,
      endTime: null,
      registrationEndAt: null,
      seats: null,
      accepted: 0,
    };
    // 10 Nov 00:00 Riyadh: still the first day → registration open until 23:59:59
    expect(derivePhase(input, '2026-11-09T21:00Z')).toBe('registration_open');
    // 11 Nov 00:00 Riyadh: the day ended
    expect(derivePhase(input, '2026-11-10T21:00Z')).toBe('ended');
  });
});
