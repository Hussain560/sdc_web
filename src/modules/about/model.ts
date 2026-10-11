import {
  Briefcase,
  Code,
  Palette,
  ShieldCheck,
  Sparkles,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import type { EventListItem } from '@/modules/events/list';
import type { PublicStats, StatKey } from '@/modules/home/sections';

/**
 * Rules of the About page that are not markup (PUBLIC-SCREENS-V2/06-about.md): which figures show, how the bento
 * lays them out, which past events become milestones. Pure, so the "hide what is missing" rules are unit tested.
 */

const FIGURE_ORDER: StatKey[] = ['events', 'committees', 'members', 'certificates'];

export type Figure = { key: StatKey; value: number };

/** Only real, positive numbers: a "0" or a missing figure is left out, never replaced by an invented one. */
export function aboutFigures(stats: PublicStats | null | undefined): Figure[] {
  if (!stats) return [];
  return FIGURE_ORDER.flatMap((key) => {
    const value = stats[key];
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? [{ key, value }] : [];
  });
}

/** Grid classes of one tile: the first is the large tile, the rest fill the grid without holes for 1 to 4 figures. */
export function bentoSpan(count: number, index: number): string {
  if (count === 1) return 'col-span-2 lg:col-span-4';
  if (count === 2) return 'col-span-2';
  if (index === 0) return 'col-span-2 lg:row-span-2';
  if (index === 1) return 'col-span-2';
  return count === 3 ? 'col-span-2' : 'col-span-1';
}

/** Ended events, oldest first, the latest `limit` of them: the milestones of the timeline. */
export function pastStations(all: EventListItem[], limit = 8): EventListItem[] {
  return all
    .filter((e) => e.phase === 'ended' && e.startDate)
    .sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))
    .slice(-limit);
}

/** The year of the first ended event, for the line under the events figure. Null when there is none. */
export function firstEventYear(all: EventListItem[]): string | null {
  const dates = all
    .filter((e) => e.phase === 'ended' && e.startDate)
    .map((e) => e.startDate!)
    .sort();
  return dates[0] ? dates[0].slice(0, 4) : null;
}

const COMMITTEE_ICONS: Record<string, LucideIcon> = {
  ai: Sparkles,
  cybersecurity: ShieldCheck,
  'tech-development': Code,
  projects: Briefcase,
  'design-identity': Palette,
};

/** One icon per committee by its slug; a committee added later gets the generic one until it is mapped. */
export const committeeIcon = (slug: string): LucideIcon => COMMITTEE_ICONS[slug] ?? UsersRound;
