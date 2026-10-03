import { notFound } from 'next/navigation';
import { Badge, Pagination, Tabs } from '@/components/ui';
import { Avatar } from '@/components/ui';
import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { Link } from '@/i18n/navigation';
import { can, canAny } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { pageMeta, parsePage } from '@/lib/pagination';
import { daysUntil } from '@/lib/time';
import {
  listAssignments,
  listCommittees,
  listPermissionLabels,
  listRoles,
} from '@/modules/access/admin-queries';
import { AssignRoleDialog } from '@/modules/access/components/AssignRoleDialog';
import { EndAssignmentDialog } from '@/modules/access/components/EndAssignmentDialog';
import { getAccess } from '@/modules/access/queries';
import { CommitteeActions } from '@/modules/committees/components/CommitteeActions';
import { CommitteeForm } from '@/modules/committees/components/CommitteeForm';
import { getCommittee } from '@/modules/committees/queries';

type Search = { tab?: string; page?: string; size?: string };

const stateTone = { active: 'accent', scheduled: 'warning', ended: 'neutral' } as const;
const stateLabel = {
  active: { ar: 'فعّال', en: 'Active' },
  scheduled: { ar: 'مجدول', en: 'Scheduled' },
  ended: { ar: 'منتهٍ', en: 'Ended' },
} as const;

// CMT-003 (screen 20 §1.2): the roster of one committee, with terms, history and the add / end actions.
export default async function CommitteePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Search>;
}) {
  const { locale, id } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  await requireUser(`/dashboard/committees/${id}`);
  const access = await getAccess();
  const committee = await getCommittee(id);
  if (!access || !committee) notFound();
  if (
    !canAny(access, ['committees.manage', 'roles.view']) &&
    !can(access, 'committee_members.manage', id)
  )
    return <Forbidden />;

  const sp = await searchParams;
  const tab = sp.tab === 'history' ? 'history' : 'members';
  const canManage = can(access, 'committees.manage');
  const canAssignAny = can(access, 'roles.assign');
  const canAddMembers = canAssignAny || can(access, 'committee_members.manage', id);

  const request = parsePage(sp);
  const [{ rows, total }, committees, roles, labels] = await Promise.all([
    listAssignments({ tab: tab === 'history' ? 'history' : 'current', committeeId: id }, request),
    listCommittees(),
    listRoles(),
    listPermissionLabels(),
  ]);
  const meta = pageMeta(total, request);
  // CM-6: a head adds members only; heads and deputies come from the leadership (roles.assign).
  const grantable = roles.filter(
    (r) => r.scope === 'committee' && (canAssignAny || r.key === 'committee_member'),
  );
  const openPositions = rows.filter((r) => r.state !== 'ended').length;
  const name = ar ? committee.nameAr : committee.nameEn || committee.nameAr;

  return (
    <>
      <PageHeader
        title={name}
        description={`${ar ? committee.nameEn : (committee.nameAr ?? '')} · ${committee.slug}`.replace(
          /^ · /,
          '',
        )}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {canAddMembers && committee.status === 'active' && (
              <AssignRoleDialog
                roles={grantable}
                committees={committees}
                permissionLabels={labels}
                canHandover={canAssignAny}
                fixedCommitteeId={id}
              />
            )}
            {canManage && <CommitteeForm committee={committee} trigger="edit" />}
            {canManage && (
              <CommitteeActions
                id={id}
                name={name}
                status={committee.status}
                openPositions={tab === 'members' ? openPositions : 0}
              />
            )}
          </div>
        }
      />
      <div className="-mt-3 mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Badge tone={committee.status === 'active' ? 'accent' : 'neutral'}>
          {committee.status === 'active' ? (ar ? 'نشطة' : 'Active') : ar ? 'غير نشطة' : 'Inactive'}
        </Badge>
        {committee.status === 'active' && (
          <Link href={`/committees/${committee.slug}`} className="text-accent underline">
            {ar ? 'الصفحة العامة' : 'Public page'}
          </Link>
        )}
      </div>

      <Tabs
        label={ar ? 'أقسام اللجنة' : 'Committee sections'}
        active={tab}
        items={[
          {
            key: 'members',
            label: ar ? 'الأعضاء والمناصب' : 'Members & positions',
            href: '?tab=members',
          },
          { key: 'history', label: ar ? 'سجل المناصب' : 'Position history', href: '?tab=history' },
          {
            key: 'events',
            label: ar ? 'الفعاليات' : 'Events',
            href: `/dashboard/events?committee=${id}`,
          },
          {
            key: 'articles',
            label: ar ? 'المقالات' : 'Threads',
            href: `/dashboard/articles?committee=${id}`,
          },
        ]}
      />

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-surface p-8 text-center text-muted">
          {tab === 'members'
            ? ar
              ? 'لا يوجد أعضاء في هذه اللجنة بعد.'
              : 'This committee has no members yet.'
            : ar
              ? 'لا توجد فترات منتهية.'
              : 'No ended terms yet.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-line bg-surface-raised text-xs text-muted">
              <tr>
                {[
                  ar ? 'العضو' : 'Member',
                  ar ? 'المنصب' : 'Position',
                  ar ? 'من' : 'From',
                  ar ? 'إلى' : 'To',
                  ar ? 'الحالة' : 'State',
                  '',
                ].map((h, i) => (
                  <th key={i} scope="col" className="px-4 py-2.5 text-start text-xs font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const own = r.userId === access.userId;
                const canEnd =
                  tab === 'members' &&
                  r.state !== 'ended' &&
                  !own &&
                  (canAssignAny ||
                    (can(access, 'committee_members.manage', id) &&
                      r.roleKey === 'committee_member'));
                const soon = r.endsAt && r.state !== 'ended' && daysUntil(r.endsAt) <= 30;
                return (
                  <tr
                    key={r.id}
                    className="border-b border-line align-middle transition-colors last:border-0 hover:bg-surface-raised"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.userName} />
                        <div className="min-w-0">
                          <div className="truncate font-medium">{r.userName}</div>
                          <div
                            dir="ltr"
                            className="truncate text-xs text-muted"
                            style={{ textAlign: 'start' }}
                          >
                            {r.userEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="accent">{r.title?.[lang] ?? r.roleName[lang]}</Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{formatDate(r.startsAt, lang)}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {r.endsAt ? formatDate(r.endsAt, lang) : '—'}
                      {soon && (
                        <div className="text-xs text-warning">
                          {ar ? 'تنتهي قريبًا' : 'Ends soon'}
                        </div>
                      )}
                      {r.endReason && <div className="text-xs text-muted">{r.endReason}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={stateTone[r.state]}>{stateLabel[r.state][lang]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-end">
                      {canEnd && (
                        <EndAssignmentDialog
                          assignmentId={r.id}
                          summary={`${r.userName} — ${r.title?.[lang] ?? r.roleName[lang]}`}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination meta={meta} searchParams={sp} lang={lang} />
    </>
  );
}
