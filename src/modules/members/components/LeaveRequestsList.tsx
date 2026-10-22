'use client';

import { CalendarClock } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { Avatar, Button } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { Link } from '@/i18n/navigation';
import { formatDate } from '@/lib/format';
import { nowMs } from '@/lib/now';
import type { AdminMemberRow } from '../admin-queries';
import { memberThumbUrl } from '../photo-url';
import {
  MemberActionDialogs,
  type ActionTarget,
  type MemberActionKind,
} from './MemberActionDialogs';

/**
 * The leave requests as cards (design: «طلبات المغادرة»): who, since when, the reason in their own words and the two
 * decisions. The same on a phone and on a desktop, so the decision is never hidden in a menu or a wide table.
 */
export function LeaveRequestsList({ rows }: { rows: AdminMemberRow[] }) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const [action, setAction] = useState<MemberActionKind | null>(null);
  const [targets, setTargets] = useState<ActionTarget[]>([]);

  const target = (r: AdminMemberRow): ActionTarget => ({
    id: r.id,
    actionId: r.leaveRequest!.id,
    nameAr: r.nameAr,
    nameEn: r.nameEn,
    status: r.status,
    termEndsAt: r.termEndsAt,
    noCommittee: !r.committeeAr,
    committeeLabel: ar ? r.committeeAr : r.committeeEn,
    leave: {
      reason: r.leaveRequest!.reason,
      preferredLastDay: r.leaveRequest!.preferredLastDay,
      createdAt: r.leaveRequest!.createdAt,
    },
  });
  const decide = (r: AdminMemberRow, kind: 'leave_approve' | 'leave_decline') => {
    setTargets([target(r)]);
    setAction(kind);
  };
  const since = (iso: string) => {
    const d = Math.floor((nowMs() - Date.parse(iso)) / 86_400_000);
    if (d <= 0) return L('اليوم', 'today');
    if (d === 1) return L('منذ يوم', '1 day ago');
    if (d === 2) return L('منذ يومين', '2 days ago');
    return L(`منذ ${d} أيام`, `${d} days ago`);
  };

  return (
    <>
      <ul className="m-stagger grid gap-4 md:grid-cols-2">
        {rows.map((r, i) => {
          const name = ar ? r.nameAr : (r.nameEn ?? r.nameAr);
          const l = r.leaveRequest!;
          return (
            <li
              key={r.id}
              style={{ '--i': Math.min(i, 8) } as CSSProperties}
              className="flex flex-col gap-4 rounded-shape-2xl border border-line bg-surface p-5"
            >
              <div className="flex items-start gap-3">
                <Avatar name={name} src={memberThumbUrl(r.photoPath)} size={56} />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/members/${r.id}`}
                    className="block truncate text-lg font-bold hover:text-accent-text"
                  >
                    {name}
                  </Link>
                  <p className="text-sm text-muted">
                    {[ar ? r.committeeAr : r.committeeEn, ar ? r.roleAr : r.roleEn]
                      .filter(Boolean)
                      .join(' · ') || L('بلا لجنة', 'No committee')}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                    <span>{since(l.createdAt)}</span>
                    {l.preferredLastDay && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock size={14} aria-hidden="true" />
                        {L('يفضّل', 'prefers')} {formatDate(l.preferredLastDay, lang)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <p className="rounded-shape-lg bg-surface-raised p-4 text-sm leading-7">
                {l.reason ?? (
                  <span className="text-muted">{L('لم يذكر سبباً.', 'No reason given.')}</span>
                )}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button size="lg" onClick={() => decide(r, 'leave_approve')}>
                  {L('موافقة', 'Approve')}
                </Button>
                <Button size="lg" variant="secondary" onClick={() => decide(r, 'leave_decline')}>
                  {L('رفض', 'Decline')}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <MemberActionDialogs
        action={action}
        targets={targets}
        onClose={() => setAction(null)}
        onDone={() => undefined}
      />
    </>
  );
}
