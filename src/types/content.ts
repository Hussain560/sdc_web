import type { Lang } from '../context/LanguageContext';

/** A value available in both UI languages. */
export type Localized<T = string> = Record<Lang, T>;

/** Summary shape of the legacy hardcoded events (to be replaced by the `events` table — docs/05-database/entities/events.md). */
export interface LegacyEventSummary {
  id: number;
  title: Localized;
  location: Localized;
  date: Localized;
  status: Localized;
  image: string;
}
