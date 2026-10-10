import { describe, expect, it } from 'vitest';
import {
  RESULTS,
  outcomeForCode,
  outcomeForStatus,
  resultFor,
  type ResultOutcome,
} from '@/modules/registrations/result';

// Sprint 15 test T5: each outcome gets its own dialog, in Arabic and English.
const table: Array<[ResultOutcome, string, string, string]> = [
  ['accepted', 'CircleCheck', "You're registered", 'calendar'],
  ['pending', 'Clock', 'We got your request', 'done'],
  ['waitlisted', 'ListOrdered', "You're on the waiting list", 'done'],
  ['ALREADY_REGISTERED', 'Info', "You're already registered", 'done'],
  ['EVENT_FULL', 'Users', 'This event is full', 'browse'],
  ['CAPACITY_REACHED', 'Users', 'This event is full', 'browse'],
  ['REGISTRATION_CLOSED', 'CalendarX', 'Registration has closed', 'browse'],
  ['RATE_LIMITED', 'Timer', 'Too many attempts', 'ok'],
  ['TOO_FAST', 'Timer', 'Too many attempts', 'ok'],
  ['HONEYPOT', 'Timer', 'Too many attempts', 'ok'],
  ['MEMBERS_ONLY', 'UserRound', 'This event is for members', 'apply'],
  ['INTERNAL', 'CircleX', "We couldn't register you", 'retry'],
  ['TIMEOUT', 'CircleX', "We couldn't register you", 'retry'],
];

describe('registration results', () => {
  it.each(table)('%s -> %s icon, "%s", action %s', (outcome, icon, titleEn, action) => {
    const r = resultFor(outcome, 'en', 'a@b.sa');
    expect(r.kind).toBe('result');
    expect(r.icon).toBe(icon);
    expect(r.titleText).toBe(titleEn);
    expect(r.action).toBe(action);
  });

  it('every outcome has Arabic and English text', () => {
    for (const r of Object.values(RESULTS)) {
      expect(r.title.ar.length).toBeGreaterThan(0);
      expect(r.title.en.length).toBeGreaterThan(0);
      expect(r.body.ar.length).toBeGreaterThan(0);
      expect(r.body.en.length).toBeGreaterThan(0);
    }
  });

  it('puts the e-mail into the sentence', () => {
    expect(resultFor('accepted', 'ar', 'sara@x.sa').bodyText).toBe(
      'أرسلنا التفاصيل إلى ⁦sara@x.sa⁩.',
    );
    expect(resultFor('pending', 'en', 'sara@x.sa').bodyText).toContain('sara@x.sa');
  });

  it('the three throttle-like refusals look identical (no oracle for bots)', () => {
    expect(RESULTS.TOO_FAST).toBe(RESULTS.RATE_LIMITED);
    expect(RESULTS.HONEYPOT).toBe(RESULTS.RATE_LIMITED);
    expect(RESULTS.RATE_LIMITED.countdown).toBe(true);
  });

  it('validation and consent go back to the form, not to a result dialog', () => {
    expect(RESULTS.VALIDATION_FAILED.kind).toBe('form');
    expect(RESULTS.CONSENT_REQUIRED.kind).toBe('form');
  });

  it('refusals are announced as alerts, successes as status', () => {
    expect(RESULTS.accepted.alert).toBe(false);
    expect(RESULTS.pending.alert).toBe(false);
    expect(RESULTS.REGISTRATION_CLOSED.alert).toBe(true);
    expect(RESULTS.INTERNAL.alert).toBe(true);
  });

  it('maps server codes, and unknown codes become a generic failure', () => {
    expect(outcomeForCode('ALREADY_REGISTERED')).toBe('ALREADY_REGISTERED');
    expect(outcomeForCode('TOO_FAST')).toBe('TOO_FAST');
    expect(outcomeForCode('SOMETHING_NEW')).toBe('INTERNAL');
    expect(outcomeForCode('INTERNAL')).toBe('INTERNAL');
  });

  it('maps registration statuses', () => {
    expect(outcomeForStatus('accepted')).toBe('accepted');
    expect(outcomeForStatus('waitlisted')).toBe('waitlisted');
    expect(outcomeForStatus('pending')).toBe('pending');
  });
});
