import { describe, expect, it } from 'vitest';
import {
  eventDate,
  eventDuration,
  statusLabel,
  statusTone,
  type PublicEventCard,
} from '@/modules/events/public-types';

const card = (over: Partial<PublicEventCard> = {}): PublicEventCard => ({
  id: 'x',
  slug: 's',
  titleAr: 'ع',
  titleEn: 'E',
  locationAr: null,
  locationEn: null,
  startDate: '2026-11-10',
  endDate: null,
  startTime: null,
  endTime: null,
  phase: 'registration_open',
  cover: '/a.png',
  seatsLeft: null,
  ...over,
});

describe('public event helpers', () => {
  it('keeps the existing "Coming Soon" badge for announced events', () => {
    expect(statusLabel('announced', 'en')).toBe('Coming Soon');
    expect(statusLabel('announced', 'ar')).toBe('قريبًا');
    expect(statusTone('announced')).toBe('coming-soon');
    expect(statusLabel('ended', 'ar')).toBe('منتهي');
  });

  it('says the date is to be announced until one is set', () => {
    expect(eventDate(card({ startDate: null }), 'ar')).toBe('قريبًا سيعلن عنه');
    expect(eventDate(card({ startDate: null }), 'en')).toBe('To be announced soon');
    expect(eventDate(card(), 'en')).toMatch(/10 Nov 2026/);
  });

  it('derives the duration from days or times', () => {
    expect(eventDuration(card({ endDate: '2026-11-14' }), 'en')).toBe('5 days');
    expect(eventDuration(card({ endDate: '2026-11-14' }), 'ar')).toBe('5 أيام');
    expect(eventDuration(card({ startTime: '18:00', endTime: '20:30' }), 'en')).toBe('2.5 hours');
    expect(eventDuration(card(), 'en')).toBe('Not specified');
  });
});
