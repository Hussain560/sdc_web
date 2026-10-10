import type { PublicArticleCard } from '@/modules/articles/types';
import type { PublicEventCard } from '@/modules/events/public-types';
import type { PublicCycle } from '@/modules/membership/types';

/**
 * Which blocks the home page shows and with what data (PUBLIC-SCREENS-V2/01-home.md). Pure, so the rules
 * "a section with no data is hidden" and "never two bands in a row" are unit tested.
 */

/** Why-join and FAQ copy is drafted (Q-H3, Q-H4): the owner reviews the wording, the sections ship on. */
export const HOME_FLAGS = { whyJoin: true, faq: true } as const;

export type PublicStats = {
  events?: number;
  members?: number;
  committees?: number;
  certificates?: number;
};

export type StatKey = keyof PublicStats;
const STAT_ORDER: StatKey[] = ['members', 'events', 'committees', 'certificates'];

/** Figures the row may show: only real numbers, and the row needs at least three (Q-H2). */
export function visibleStats(stats: PublicStats | null | undefined): Array<[StatKey, number]> {
  if (!stats) return [];
  const list = STAT_ORDER.flatMap((k) => {
    const v = stats[k];
    return typeof v === 'number' && Number.isFinite(v) && v >= 0
      ? [[k, v] as [StatKey, number]]
      : [];
  });
  return list.length >= 3 ? list : [];
}

const UPCOMING_PHASES = new Set([
  'announced',
  'registration_open',
  'registration_closed',
  'in_progress',
]);

export type HomeEvents =
  | { kind: 'upcoming'; items: PublicEventCard[] }
  | { kind: 'past'; items: PublicEventCard[] }
  | { kind: 'none'; items: [] };

/** The 3 nearest upcoming events; with none, the 3 latest ended ones; with no events at all, nothing. */
export function selectHomeEvents(events: PublicEventCard[], today: string, count = 3): HomeEvents {
  const upcoming = events
    .filter((e) => UPCOMING_PHASES.has(e.phase) && (e.endDate ?? e.startDate ?? today) >= today)
    .sort((a, b) => {
      if (!a.startDate && !b.startDate) return 0;
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return a.startDate.localeCompare(b.startDate);
    })
    .slice(0, count);
  if (upcoming.length > 0) return { kind: 'upcoming', items: upcoming };
  const past = events
    .filter((e) => e.phase === 'ended')
    .sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))
    .slice(0, count);
  return past.length > 0 ? { kind: 'past', items: past } : { kind: 'none', items: [] };
}

/** The nearest event whose registration is open, for the announcement strip. */
export function announcementEvent(
  events: PublicEventCard[],
  today: string,
): PublicEventCard | null {
  return (
    events
      .filter(
        (e) => e.phase === 'registration_open' && (e.endDate ?? e.startDate ?? today) >= today,
      )
      .sort((a, b) => (a.startDate ?? '9999').localeCompare(b.startDate ?? '9999'))[0] ?? null
  );
}

export type IntakeState =
  { phase: 'open'; until: string } | { phase: 'scheduled'; opensAt: string } | { phase: 'closed' };

/** Maps the cycle the join page talks about to the hero/CTA wording. Draft and completed cycles read as closed. */
export function intakeState(cycle: PublicCycle | null): IntakeState {
  if (cycle?.phase === 'open') return { phase: 'open', until: cycle.effectiveClosesAt };
  if (cycle?.phase === 'scheduled') return { phase: 'scheduled', opensAt: cycle.opensAt };
  return { phase: 'closed' };
}

export type HomeSections = {
  announcement: PublicEventCard | null;
  stats: Array<[StatKey, number]>;
  events: HomeEvents;
  whyJoin: boolean;
  articles: PublicArticleCard[];
  partners: boolean;
  faq: boolean;
  members: boolean;
  /** Bands (tinted full-width blocks) never touch each other. */
  bands: { whyJoin: boolean; partners: boolean };
};

export function homeSections(input: {
  events: PublicEventCard[];
  articles: PublicArticleCard[];
  partnerCount: number;
  memberCount?: number;
  stats: PublicStats | null;
  today: string;
  flags?: { whyJoin: boolean; faq: boolean };
}): HomeSections {
  const flags = input.flags ?? HOME_FLAGS;
  const articles = input.articles.slice(0, 4);
  // "Why join" is a band; it keeps its band only when the articles section follows it (never two bands in a row).
  // "Partners" is a band; if it is hidden the CTA band keeps its own ground.
  return {
    announcement: announcementEvent(input.events, input.today),
    stats: visibleStats(input.stats),
    events: selectHomeEvents(input.events, input.today),
    whyJoin: flags.whyJoin,
    articles,
    partners: input.partnerCount > 0,
    faq: flags.faq,
    members: (input.memberCount ?? 0) > 0,
    bands: { whyJoin: flags.whyJoin && articles.length > 0, partners: input.partnerCount > 0 },
  };
}
