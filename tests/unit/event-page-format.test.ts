import { describe, expect, it } from 'vitest';
import { formatDateRange, formatTime } from '@/lib/format';
import { EVENT_COPY } from '@/modules/events/page-copy';

describe('formatTime (12-hour, never 24h)', () => {
  it('shares one period mark in Arabic and English', () => {
    expect(formatTime('18:00:00', '20:00:00', 'ar')).toBe('6:00 – 8:00 م');
    expect(formatTime('18:00', '20:00', 'en')).toBe('6:00 – 8:00 PM');
  });

  it('keeps both marks when the range crosses noon', () => {
    expect(formatTime('11:00', '13:30', 'ar')).toBe('11:00 ص – 1:30 م');
    expect(formatTime('11:00', '13:30', 'en')).toBe('11:00 AM – 1:30 PM');
  });

  it('handles midnight, noon and a missing end', () => {
    expect(formatTime('00:15', null, 'en')).toBe('12:15 AM');
    expect(formatTime('12:00', '13:00', 'en')).toBe('12:00 – 1:00 PM');
    expect(formatTime(null, '20:00', 'ar')).toBe('');
  });
});

describe('formatDateRange (one line)', () => {
  it('writes a single day with the month name', () => {
    expect(formatDateRange('2026-10-22', null, 'ar')).toBe('22 أكتوبر 2026');
    expect(formatDateRange('2026-10-22', '2026-10-22', 'en')).toBe('22 Oct 2026');
  });

  it('shares the month and year inside a range', () => {
    expect(formatDateRange('2026-10-22', '2026-10-23', 'ar')).toBe('22 – 23 أكتوبر 2026');
    expect(formatDateRange('2026-10-30', '2026-11-01', 'ar')).toBe('30 أكتوبر – 1 نوفمبر 2026');
    expect(formatDateRange('2026-10-22', '2026-10-23', 'en')).toBe('22 – 23 Oct 2026');
  });
});

describe('seatsLeft grammar', () => {
  const ar = EVENT_COPY.ar.seatsLeft;
  it('uses the dual and plural forms up to 10', () => {
    expect(ar(1)).toBe('بقي مقعد واحد');
    expect(ar(2)).toBe('بقي مقعدان');
    expect(ar(3)).toBe('بقي 3 مقاعد');
    expect(ar(10)).toBe('بقي 10 مقاعد');
  });

  it('switches to the singular noun from 11', () => {
    expect(ar(11)).toBe('11 مقعداً متبقياً');
    expect(ar(60)).toBe('60 مقعداً متبقياً');
  });

  it('English pluralises', () => {
    expect(EVENT_COPY.en.seatsLeft(1)).toBe('1 seat left');
    expect(EVENT_COPY.en.seatsLeft(5)).toBe('5 seats left');
  });
});
