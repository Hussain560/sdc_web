import { listPublicCommittees, type PublicCommitteeCard } from '@/modules/committees/queries';
import { listEventsForList, type EventListItem } from '@/modules/events/list';
import { getPublicStats } from '@/modules/home/data';
import type { PublicStats } from '@/modules/home/sections';
import { listLeadership, type LeadershipPerson } from '@/modules/members/public';

export type AboutData = {
  stats: PublicStats | null;
  committees: PublicCommitteeCard[];
  events: EventListItem[];
  leadership: LeadershipPerson[];
};

/** Everything the About page shows, read in parallel. Each read fails soft: its section just hides. */
export async function getAboutData(): Promise<AboutData> {
  const [stats, committees, events, leadership] = await Promise.all([
    getPublicStats(),
    listPublicCommittees(),
    listEventsForList(),
    listLeadership(),
  ]);
  return { stats, committees, events, leadership };
}
