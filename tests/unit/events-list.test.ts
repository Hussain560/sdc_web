import { describe, expect, it } from 'vitest';
import {
  committeeOptions,
  filterEvents,
  pickFeatured,
  tabCounts,
  type EventListItem,
  type EventsQuery,
} from '@/modules/events/list';

let n = 0;
const ev = (o: Partial<EventListItem>): EventListItem => ({
  id: `e${++n}`,
  slug: `e${n}`,
  titleAr: 'عنوان',
  titleEn: 'Title',
  locationAr: null,
  locationEn: null,
  startDate: '2026-10-20',
  endDate: '2026-10-20',
  startTime: null,
  endTime: null,
  phase: 'registration_open',
  cover: '/x',
  seatsLeft: 5,
  access: 'public',
  waitlistEnabled: false,
  type: 'workshop',
  mode: 'in_person',
  committeeSlug: 'tech',
  committeeNameAr: 'التقنية',
  committeeNameEn: 'Tech',
  summaryAr: null,
  summaryEn: null,
  ...o,
});
const q = (o: Partial<EventsQuery> = {}): EventsQuery => ({
  tab: 'upcoming',
  q: '',
  type: '',
  mode: '',
  committee: '',
  page: 1,
  ...o,
});

describe('filterEvents (filter to query mapping)', () => {
  const all = [
    ev({ titleEn: 'React workshop', startDate: '2026-10-25', endDate: '2026-10-25' }),
    ev({
      titleEn: 'AI talk',
      type: 'talk',
      mode: 'online',
      committeeSlug: 'ai',
      startDate: '2026-10-12',
      endDate: '2026-10-12',
    }),
    ev({
      titleEn: 'Old hack',
      type: 'hackathon',
      phase: 'ended',
      startDate: '2026-01-01',
      endDate: '2026-01-02',
    }),
    ev({
      titleEn: 'Cancelled',
      phase: 'cancelled',
      startDate: '2026-03-01',
      endDate: '2026-03-01',
    }),
  ];

  it('upcoming shows the open phases, past shows ended and cancelled', () => {
    expect(filterEvents(all, q()).items.map((e) => e.titleEn)).toEqual([
      'AI talk',
      'React workshop',
    ]);
    expect(filterEvents(all, q({ tab: 'past' })).items.map((e) => e.titleEn)).toEqual([
      'Cancelled',
      'Old hack',
    ]);
  });

  it('filters by type, mode and committee', () => {
    expect(filterEvents(all, q({ type: 'talk' })).total).toBe(1);
    expect(filterEvents(all, q({ mode: 'online' })).total).toBe(1);
    expect(filterEvents(all, q({ committee: 'tech' })).total).toBe(1);
    expect(filterEvents(all, q({ type: 'talk', mode: 'in_person' })).total).toBe(0);
  });

  it('searches title and summary in both languages', () => {
    const rows = [ev({ titleEn: 'Alpha', summaryAr: 'مقدمة عن الويب' }), ev({ titleEn: 'Beta' })];
    expect(filterEvents(rows, q({ q: 'alpha' })).total).toBe(1);
    expect(filterEvents(rows, q({ q: 'الويب' })).total).toBe(1);
    expect(filterEvents(rows, q({ q: 'zzz' })).total).toBe(0);
  });

  it('within the same week, open registration comes first', () => {
    const rows = [
      ev({
        titleEn: 'Closed',
        phase: 'registration_closed',
        startDate: '2026-10-20',
        endDate: '2026-10-20',
      }),
      ev({
        titleEn: 'Open',
        phase: 'registration_open',
        startDate: '2026-10-22',
        endDate: '2026-10-22',
      }),
    ];
    expect(filterEvents(rows, q()).items[0]!.titleEn).toBe('Open');
  });

  it('pages 12 at a time and keeps the total', () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      ev({
        titleEn: `E${i}`,
        startDate: `2026-11-${String((i % 28) + 1).padStart(2, '0')}`,
        endDate: `2026-11-${String((i % 28) + 1).padStart(2, '0')}`,
      }),
    );
    expect(filterEvents(many, q({ page: 1 })).items).toHaveLength(12);
    expect(filterEvents(many, q({ page: 2 })).items).toHaveLength(24);
    expect(filterEvents(many, q({ page: 3 })).total).toBe(30);
  });

  it('lists each committee once', () => {
    expect(
      committeeOptions(all, 'en')
        .map((c) => c.slug)
        .sort(),
    ).toEqual(['ai', 'tech']);
  });
});

describe('tabCounts', () => {
  it('counts each segment before any filter', () => {
    const all = [
      ev({ phase: 'registration_open' }),
      ev({ phase: 'announced' }),
      ev({ phase: 'in_progress' }),
      ev({ phase: 'ended' }),
      ev({ phase: 'cancelled' }),
    ];
    expect(tabCounts(all)).toEqual({ upcoming: 3, past: 2 });
    expect(tabCounts([])).toEqual({ upcoming: 0, past: 0 });
  });
});

describe('pickFeatured', () => {
  it('is the dated event that starts first', () => {
    const near = ev({ id: 'near', startDate: '2026-10-12' });
    expect(
      pickFeatured([ev({ startDate: '2026-11-01' }), near, ev({ startDate: '2026-10-20' })]),
    ).toBe(near);
  });

  it('prefers the one still open for registration on the same day', () => {
    const open = ev({ id: 'open', startDate: '2026-10-12', phase: 'registration_open' });
    const closed = ev({ startDate: '2026-10-12', phase: 'registration_closed' });
    expect(pickFeatured([closed, open])).toBe(open);
    expect(pickFeatured([open, closed])).toBe(open);
  });

  it('ignores undated events and gives none when nothing is dated', () => {
    const dated = ev({ id: 'dated', startDate: '2026-12-01' });
    expect(pickFeatured([ev({ startDate: null }), dated])).toBe(dated);
    expect(pickFeatured([ev({ startDate: null })])).toBeNull();
    expect(pickFeatured([])).toBeNull();
  });
});
