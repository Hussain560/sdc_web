import { describe, expect, it } from 'vitest';
import { buildDayIcs } from '@/lib/ics-day';
import { rubricKey, validateCycle } from '@/modules/membership/schemas';
import type { CycleFormValues } from '@/modules/membership/types';

const cycle = (over: Partial<CycleFormValues> = {}): CycleFormValues => ({
  nameAr: 'استقبال 2027',
  nameEn: '',
  descriptionAr: '',
  descriptionEn: '',
  opensAt: '2027-02-01T09:00',
  closesAt: '2027-02-10T23:59',
  reviewEndsAt: '',
  capacity: '',
  questions: [],
  termEndsAt: '',
  activationDeadlineDays: '7',
  rubric: [],
  ...over,
});

const crit = (key: string, weight: 1 | 2 | 3 = 1) => ({
  key,
  label_ar: 'معيار',
  label_en: 'Criterion',
  weight,
});

describe('cycle term, deadline and rubric', () => {
  it('the term must end after the window closes', () => {
    expect(validateCycle(cycle({ termEndsAt: '2027-12-31' }), 'en')).toEqual({});
    expect(validateCycle(cycle({ termEndsAt: '2027-02-05' }), 'en').termEndsAt).toBeTruthy();
  });

  it('the activation deadline is 1 to 30 whole days', () => {
    for (const bad of ['0', '31', '2.5', 'x'])
      expect(
        validateCycle(cycle({ activationDeadlineDays: bad }), 'en').activationDeadlineDays,
      ).toBeTruthy();
    for (const ok of ['1', '7', '30'])
      expect(validateCycle(cycle({ activationDeadlineDays: ok }), 'en')).toEqual({});
  });

  it('the rubric holds at most six criteria with weights 1 to 3', () => {
    const six = ['a', 'b', 'c', 'd', 'e', 'f'].map((k) => crit(k));
    expect(validateCycle(cycle({ rubric: six }), 'en')).toEqual({});
    expect(validateCycle(cycle({ rubric: [...six, crit('g')] }), 'en').rubric).toBeTruthy();
    expect(
      validateCycle(cycle({ rubric: [{ ...crit('a'), weight: 4 as unknown as 3 }] }), 'en').rubric,
    ).toBeTruthy();
  });
});

describe('rubric keys', () => {
  it('make a database-safe key from a label and avoid duplicates', () => {
    expect(rubricKey('Motivation', [])).toBe('motivation');
    expect(rubricKey('Motivation', ['motivation'])).toBe('motivation_2');
    expect(rubricKey('الدافع', [])).toBe('criterion');
    expect(rubricKey('2nd round', [])).toMatch(/^[a-z][a-z0-9_]{0,23}$/);
  });
});

describe('day calendar entry', () => {
  it('is an all-day entry that ends the next day and holds no personal data', () => {
    const ics = buildDayIcs({
      uid: 'abc',
      date: '2026-11-11',
      title: 'Decision date',
      now: new Date('2026-10-22T10:00:00Z'),
    });
    expect(ics).toContain('DTSTART;VALUE=DATE:20261111');
    expect(ics).toContain('DTEND;VALUE=DATE:20261112');
    expect(ics).toContain('SUMMARY:Decision date');
    expect(ics).not.toMatch(/ATTENDEE|ORGANIZER|@example/);
  });
  it('rolls over the end of a month', () => {
    const ics = buildDayIcs({ uid: 'x', date: '2026-12-31', title: 'T' });
    expect(ics).toContain('DTEND;VALUE=DATE:20270101');
  });
});
