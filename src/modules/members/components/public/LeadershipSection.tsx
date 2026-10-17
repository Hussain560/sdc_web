import type { ReactNode } from 'react';
import { SectionHeader } from '@/components/patterns/SectionHeader';
import type { LeadershipPerson } from '../../public';
import { CommitteeLeadCard, LeaderCard, splitLeadership } from './LeadershipCards';
import { MEMBERS_COPY } from './members-copy';

type Lang = 'ar' | 'en';

/**
 * Community leadership (Sprint 17): the leader and founders as large cards, then the committee heads. Shown on the
 * About page's leadership section; the members directory keeps its space for search and filters. Renders nothing when
 * nobody has agreed to be listed.
 */
export function LeadershipSection({
  leadership,
  lang,
  headingId,
  title,
  lede,
  action,
}: {
  leadership: LeadershipPerson[];
  lang: Lang;
  headingId: string;
  title: string;
  lede?: string;
  action?: ReactNode;
}) {
  const t = MEMBERS_COPY[lang];
  const { top, committee } = splitLeadership(leadership);
  if (top.length === 0 && committee.length === 0) return null;
  return (
    <section aria-labelledby={headingId}>
      <SectionHeader headingId={headingId} title={title} lede={lede} dots action={action} />
      {top.length > 0 && (
        <ul className="grid gap-5 md:grid-cols-3">
          {top.map((p) => (
            <li key={p.id}>
              <LeaderCard person={p} lang={lang} />
            </li>
          ))}
        </ul>
      )}
      {committee.length > 0 && (
        <div className={top.length > 0 ? 'mt-8' : undefined}>
          <h3 className="t-h4 mb-4 text-muted">{t.committeeLeads}</h3>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {committee.map((p) => (
              <li key={p.id}>
                <CommitteeLeadCard person={p} lang={lang} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
