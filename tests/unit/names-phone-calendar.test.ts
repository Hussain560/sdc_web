import { describe, expect, it } from 'vitest';
import { googleCalendarUrl, icsUrl } from '@/modules/events/calendar-links';
import { isArabicName, isEnglishName, keepArabic, keepEnglish } from '@/lib/names';
import {
  callingCode,
  cleanNational,
  formatNational,
  normalizeInternational,
  toE164,
} from '@/lib/phone';

describe('names keep their script', () => {
  it('keepArabic strips Latin letters, digits and symbols', () => {
    expect(keepArabic('محمد Ali 123')).toBe('محمد ');
    expect(keepArabic('عبد-الله')).toBe('عبد-الله');
    expect(keepArabic('  سارة')).toBe('سارة');
  });

  it('keepEnglish strips Arabic letters, digits and symbols', () => {
    expect(keepEnglish("O'Brien-Smith محمد 9")).toBe("O'Brien-Smith ");
  });

  it('checks need two letters of the right script', () => {
    expect(isArabicName('سارة')).toBe(true);
    expect(isArabicName('عبد الله')).toBe(true);
    expect(isArabicName('س')).toBe(false);
    expect(isArabicName('Sara')).toBe(false);
    expect(isArabicName('سارة Sara')).toBe(false);
    expect(isEnglishName('Al Otaibi')).toBe(true);
    expect(isEnglishName("O'Brien")).toBe(true);
    expect(isEnglishName('S')).toBe(false);
    expect(isEnglishName('سارة')).toBe(false);
    expect(isEnglishName('Sara2')).toBe(false);
  });
});

describe('phone numbers', () => {
  it('formats Saudi numbers as 5x xxx xxxx and caps them at nine digits', () => {
    expect(formatNational('SA', '501234567')).toBe('50 123 4567');
    expect(formatNational('SA', '5012')).toBe('50 12');
    expect(cleanNational('SA', '0501234567')).toBe('501234567');
    expect(cleanNational('SA', '+966 50 123 4567')).toBe('501234567');
    expect(cleanNational('SA', '٠٥٠١٢٣٤٥٦٧')).toBe('501234567');
    expect(cleanNational('SA', '5012345678999')).toBe('501234567');
  });

  it('builds the international number only when it is valid for the country', () => {
    expect(callingCode('SA')).toBe('+966');
    expect(toE164('SA', '501234567')).toBe('+966501234567');
    expect(toE164('SA', '401234567')).toBeNull();
    expect(toE164('SA', '50123456')).toBeNull();
    expect(toE164('AE', '501234567')).toBe('+971501234567');
    expect(normalizeInternational('+966 50 123 4567')).toBe('+966501234567');
    expect(normalizeInternational('0501234567')).toBeNull();
  });
});

describe('calendar links', () => {
  const base = {
    title: 'Workshop',
    startDate: '2026-10-22',
    endDate: '2026-10-22',
    startTime: '18:00:00',
    endTime: '20:00:00',
    place: 'Al-Ahsa',
    url: 'https://example.test/events/demo',
  };

  it('a single day with times is a timed Google event in Saudi time', () => {
    const url = new URL(googleCalendarUrl(base));
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('dates')).toBe('20261022T180000/20261022T200000');
    expect(url.searchParams.get('ctz')).toBe('Asia/Riyadh');
    expect(url.searchParams.get('text')).toBe('Workshop');
  });

  it('a multi-day event is an all-day block with an exclusive end', () => {
    const url = new URL(googleCalendarUrl({ ...base, endDate: '2026-10-24' }));
    expect(url.searchParams.get('dates')).toBe('20261022/20261025');
    expect(url.searchParams.get('ctz')).toBeNull();
  });

  it('the Apple link is the .ics file under the right language prefix', () => {
    expect(icsUrl('demo', 'ar')).toBe('/events/demo/calendar.ics');
    expect(icsUrl('demo', 'en')).toBe('/en/events/demo/calendar.ics');
  });
});
