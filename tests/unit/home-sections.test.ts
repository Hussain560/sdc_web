import { describe, expect, it } from 'vitest';
import type { PublicArticleCard } from '@/modules/articles/types';
import type { PublicEventCard } from '@/modules/events/public-types';
import {
  announcementEvent,
  homeSections,
  intakeState,
  selectHomeEvents,
  visibleStats,
} from '@/modules/home/sections';
import type { PublicCycle } from '@/modules/membership/types';

const TODAY = '2026-10-10';
let n = 0;
const ev = (o: Partial<PublicEventCard>): PublicEventCard => ({
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
  cover: '/x.png',
  seatsLeft: 10,
  ...o,
});
const art = (i: number): PublicArticleCard => ({
  id: `a${i}`,
  slug: `a${i}`,
  titleAr: 't',
  titleEn: null,
  excerptAr: null,
  excerptEn: null,
  authors: [],
  publishedAt: '2026-10-01T00:00:00Z',
  readingMinutes: 3,
  tags: [],
});
const cycle = (o: Partial<PublicCycle>): PublicCycle =>
  ({
    id: 'c',
    nameAr: 'a',
    nameEn: 'a',
    descriptionAr: null,
    descriptionEn: null,
    opensAt: '2026-11-01T00:00:00Z',
    closesAt: '2026-11-30T00:00:00Z',
    effectiveClosesAt: '2026-11-30T00:00:00Z',
    status: 'published',
    phase: 'open',
    questions: [],
    ...o,
  }) as PublicCycle;

describe('selectHomeEvents', () => {
  it('shows the 3 nearest upcoming events, soonest first', () => {
    const events = [
      ev({ startDate: '2026-12-01', endDate: '2026-12-01' }),
      ev({ startDate: '2026-10-12', endDate: '2026-10-12' }),
      ev({ startDate: '2026-11-01', endDate: '2026-11-01' }),
      ev({ startDate: '2026-10-30', endDate: '2026-10-30' }),
    ];
    const r = selectHomeEvents(events, TODAY);
    expect(r.kind).toBe('upcoming');
    expect(r.items.map((e) => e.startDate)).toEqual(['2026-10-12', '2026-10-30', '2026-11-01']);
  });

  it('puts events without a date after the dated ones', () => {
    const r = selectHomeEvents(
      [
        ev({ phase: 'announced', startDate: null, endDate: null }),
        ev({ startDate: '2026-10-15', endDate: '2026-10-15' }),
      ],
      TODAY,
    );
    expect(r.items[1]!.startDate).toBeNull();
  });

  it('ignores ended and cancelled events and past dates', () => {
    const r = selectHomeEvents(
      [
        ev({ phase: 'cancelled' }),
        ev({ startDate: '2026-10-01', endDate: '2026-10-02', phase: 'registration_closed' }),
      ],
      TODAY,
    );
    expect(r.kind).toBe('none');
  });

  it('with no upcoming events falls back to the 3 latest ended ones', () => {
    const events = [
      ev({ phase: 'ended', startDate: '2026-01-01' }),
      ev({ phase: 'ended', startDate: '2026-09-01' }),
      ev({ phase: 'ended', startDate: '2026-05-01' }),
      ev({ phase: 'ended', startDate: '2026-08-01' }),
    ];
    const r = selectHomeEvents(events, TODAY);
    expect(r.kind).toBe('past');
    expect(r.items.map((e) => e.startDate)).toEqual(['2026-09-01', '2026-08-01', '2026-05-01']);
  });

  it('with no events at all there is nothing', () => {
    expect(selectHomeEvents([], TODAY)).toEqual({ kind: 'none', items: [] });
  });
});

describe('announcementEvent', () => {
  it('is the nearest event with registration open', () => {
    const near = ev({ startDate: '2026-10-12', endDate: '2026-10-12' });
    const far = ev({ startDate: '2026-11-12', endDate: '2026-11-12' });
    expect(announcementEvent([far, near, ev({ phase: 'announced' })], TODAY)).toBe(near);
  });
  it('is hidden when no registration is open', () => {
    expect(
      announcementEvent([ev({ phase: 'announced' }), ev({ phase: 'ended' })], TODAY),
    ).toBeNull();
  });
});

describe('visibleStats', () => {
  it('hides the row with fewer than three real figures', () => {
    expect(visibleStats({ members: 10, events: 5 })).toEqual([]);
    expect(visibleStats(null)).toEqual([]);
  });
  it('keeps the order and drops figures without a source', () => {
    expect(
      visibleStats({ certificates: 7, events: 5, members: 10, committees: 4 }).map(([k]) => k),
    ).toEqual(['members', 'events', 'committees', 'certificates']);
    expect(
      visibleStats({ members: 10, events: 5, committees: 4, certificates: undefined }),
    ).toHaveLength(3);
  });
  it('a zero is a real figure; NaN and negatives are not', () => {
    expect(visibleStats({ members: 0, events: 0, committees: 0 })).toHaveLength(3);
    expect(visibleStats({ members: NaN, events: -1, committees: 1 })).toEqual([]);
  });
});

describe('intakeState', () => {
  it('open shows the closing date', () => {
    expect(intakeState(cycle({ phase: 'open' }))).toEqual({
      phase: 'open',
      until: '2026-11-30T00:00:00Z',
    });
  });
  it('scheduled shows the opening date', () => {
    expect(intakeState(cycle({ phase: 'scheduled' }))).toEqual({
      phase: 'scheduled',
      opensAt: '2026-11-01T00:00:00Z',
    });
  });
  it('closed, completed, draft and none all read as closed', () => {
    for (const phase of ['closed', 'completed', 'draft'] as const)
      expect(intakeState(cycle({ phase: phase as PublicCycle['phase'] }))).toEqual({
        phase: 'closed',
      });
    expect(intakeState(null)).toEqual({ phase: 'closed' });
  });
});

describe('homeSections', () => {
  const off = { whyJoin: false, faq: false };
  const base = { events: [], articles: [], partnerCount: 0, stats: null, today: TODAY, flags: off };

  it('an empty site shows only the always-on blocks', () => {
    const s = homeSections(base);
    expect(s.announcement).toBeNull();
    expect(s.stats).toEqual([]);
    expect(s.events.kind).toBe('none');
    expect(s.articles).toEqual([]);
    expect(s.partners).toBe(false);
    expect(s.whyJoin).toBe(false);
    expect(s.faq).toBe(false);
  });

  it('shows at most four articles and the partners when there are some', () => {
    const s = homeSections({ ...base, articles: [1, 2, 3, 4, 5, 6].map(art), partnerCount: 3 });
    expect(s.articles).toHaveLength(4);
    expect(s.partners).toBe(true);
  });

  it('copy-dependent sections stay hidden by default and follow the flags', () => {
    expect(homeSections(base).whyJoin).toBe(false);
    expect(homeSections({ ...base, flags: undefined }).whyJoin).toBe(true);
    const on = homeSections({ ...base, articles: [art(1)], flags: { whyJoin: true, faq: true } });
    expect(on.whyJoin).toBe(true);
    expect(on.faq).toBe(true);
  });

  it('why-join only keeps its band when the articles section follows it', () => {
    const flags = { whyJoin: true, faq: false };
    expect(homeSections({ ...base, articles: [art(1)], flags }).bands.whyJoin).toBe(true);
    expect(homeSections({ ...base, articles: [], flags }).bands.whyJoin).toBe(false);
  });
});
