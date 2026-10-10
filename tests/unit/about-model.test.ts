import { UsersRound } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import {
  aboutFigures,
  bentoSpan,
  committeeIcon,
  firstEventYear,
  pastStations,
} from '@/modules/about/model';
import type { EventListItem } from '@/modules/events/list';

let n = 0;
const ev = (o: Partial<EventListItem>): EventListItem => ({
  id: `e${++n}`,
  slug: `e${n}`,
  titleAr: 'عنوان',
  titleEn: 'Title',
  locationAr: null,
  locationEn: null,
  startDate: '2025-03-10',
  endDate: '2025-03-10',
  startTime: null,
  endTime: null,
  phase: 'ended',
  cover: '/x.png',
  seatsLeft: null,
  access: 'public',
  waitlistEnabled: false,
  type: 'workshop',
  mode: 'in_person',
  committeeSlug: null,
  committeeNameAr: null,
  committeeNameEn: null,
  summaryAr: null,
  summaryEn: null,
  ...o,
});

describe('aboutFigures', () => {
  it('keeps real positive numbers in the page order', () => {
    expect(aboutFigures({ members: 8, events: 6, committees: 5, certificates: 120 })).toEqual([
      { key: 'events', value: 6 },
      { key: 'committees', value: 5 },
      { key: 'members', value: 8 },
      { key: 'certificates', value: 120 },
    ]);
  });

  it('leaves out zero, missing and invalid figures instead of showing them', () => {
    expect(
      aboutFigures({ events: 6, committees: 0, members: undefined, certificates: Number.NaN }),
    ).toEqual([{ key: 'events', value: 6 }]);
  });

  it('shows nothing when the stats could not be read', () => {
    expect(aboutFigures(null)).toEqual([]);
    expect(aboutFigures(undefined)).toEqual([]);
    expect(aboutFigures({})).toEqual([]);
  });
});

describe('bentoSpan', () => {
  const spans = (count: number) => Array.from({ length: count }, (_, i) => bentoSpan(count, i));

  it('lays out one to four figures without a hole in the four-column row', () => {
    expect(spans(4)).toEqual([
      'col-span-2 lg:row-span-2',
      'col-span-2',
      'col-span-1',
      'col-span-1',
    ]);
    expect(spans(3)).toEqual(['col-span-2 lg:row-span-2', 'col-span-2', 'col-span-2']);
    expect(spans(2)).toEqual(['col-span-2', 'col-span-2']);
    expect(spans(1)).toEqual(['col-span-2 lg:col-span-4']);
  });
});

describe('pastStations', () => {
  it('takes only ended events, oldest first, and keeps the latest ones', () => {
    const all = [
      ev({ id: 'c', startDate: '2025-09-01' }),
      ev({ id: 'a', startDate: '2023-03-01' }),
      ev({ id: 'up', phase: 'registration_open', startDate: '2026-12-01' }),
      ev({ id: 'b', startDate: '2024-09-01' }),
      ev({ id: 'x', phase: 'cancelled', startDate: '2024-01-01' }),
      ev({ id: 'undated', startDate: null }),
    ];
    expect(pastStations(all).map((e) => e.id)).toEqual(['a', 'b', 'c']);
    expect(pastStations(all, 2).map((e) => e.id)).toEqual(['b', 'c']);
  });

  it('is empty with no past events', () => {
    expect(pastStations([ev({ phase: 'announced' })])).toEqual([]);
  });
});

describe('firstEventYear', () => {
  it('is the year of the earliest ended event', () => {
    expect(firstEventYear([ev({ startDate: '2025-02-01' }), ev({ startDate: '2023-03-14' })])).toBe(
      '2023',
    );
  });

  it('is null when nothing has ended yet', () => {
    expect(firstEventYear([ev({ phase: 'registration_open' })])).toBeNull();
    expect(firstEventYear([])).toBeNull();
  });
});

describe('committeeIcon', () => {
  it('maps the known committees and falls back to a generic icon', () => {
    expect(committeeIcon('ai')).not.toBe(committeeIcon('cybersecurity'));
    expect(committeeIcon('a-new-committee')).toBe(UsersRound);
  });
});
