import { describe, expect, it } from 'vitest';
import { buildIcs, fold, icsText } from '@/modules/events/ics';

const base = {
  slug: 'demo',
  title: 'ورشة, Git; و GitHub',
  description: 'سطر أول\nسطر ثان',
  url: 'https://sdc.sa/events/demo',
  startTime: '18:00:00',
  endTime: '20:00:00',
  place: 'الرياض',
};
const now = new Date('2026-10-10T09:00:00Z');

describe('ics', () => {
  it('escapes commas, semicolons, backslashes and newlines', () => {
    expect(icsText(String.raw`a,b;c\d` + '\ne')).toBe(String.raw`a\,b\;c\\d\ne`);
  });

  it('is a valid VCALENDAR with CRLF line endings and Asia/Riyadh times', () => {
    const ics = buildIcs(
      { ...base, days: [{ date: '2026-10-14', startsAt: null, endsAt: null, place: null }] },
      now,
    );
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('DTSTART;TZID=Asia/Riyadh:20261014T180000');
    expect(ics).toContain('DTEND;TZID=Asia/Riyadh:20261014T200000');
    expect(ics).toContain('UID:demo-2026-10-14@sdc');
    expect(ics).toContain('URL:https://sdc.sa/events/demo');
  });

  it('writes one VEVENT per day with its own time and place', () => {
    const ics = buildIcs(
      {
        ...base,
        days: [
          { date: '2026-10-14', startsAt: '09:00:00', endsAt: '12:00:00', place: 'جدة' },
          { date: '2026-10-15', startsAt: null, endsAt: null, place: null },
        ],
      },
      now,
    );
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('DTSTART;TZID=Asia/Riyadh:20261014T090000');
    expect(ics).toContain('LOCATION:جدة');
    expect(ics).toContain('LOCATION:الرياض');
    expect(ics).toContain('(1/2)');
  });

  it('carries no personal data fields', () => {
    const ics = buildIcs(
      { ...base, days: [{ date: '2026-10-14', startsAt: null, endsAt: null, place: null }] },
      now,
    );
    expect(ics).not.toMatch(/ATTENDEE|ORGANIZER|mailto/);
  });

  it('folds long lines at 75 octets without splitting a character', () => {
    const folded = fold(`SUMMARY:${'ع'.repeat(80)}`);
    for (const l of folded.split('\r\n'))
      expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
    expect(folded.replace(/\r\n /g, '')).toBe(`SUMMARY:${'ع'.repeat(80)}`);
  });
});
