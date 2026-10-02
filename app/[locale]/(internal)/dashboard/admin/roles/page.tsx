import { Badge, Pagination } from '@/components/ui';
import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { Link } from '@/i18n/navigation';
import { can } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { pageMeta, parsePage } from '@/lib/pagination';
import {
  listAssignments,
  listCommittees,
  listPermissionLabels,
  listRoles,
  type AssignmentRow,
} from '@/modules/access/admin-queries';
import { AssignRoleDialog } from '@/modules/access/components/AssignRoleDialog';
import { EndAssignmentDialog } from '@/modules/access/components/EndAssignmentDialog';
import { getAccess } from '@/modules/access/queries';
import { PROTECTED_GLOBAL_ROLES } from '@/modules/access/types';

type Search = {
  tab?: string;
  role?: string;
  committee?: string;
  q?: string;
  page?: string;
  size?: string;
};

const stateTone = { active: 'accent', scheduled: 'warning', ended: 'neutral' } as const;
const stateLabel = {
  active: { ar: 'فعّال', en: 'Active' },
  scheduled: { ar: 'مجدول', en: 'Scheduled' },
  ended: { ar: 'منتهٍ', en: 'Ended' },
} as const;

export default async function RolesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Search>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  await requireUser('/dashboard/admin/roles');
  const access = await getAccess();
  if (!access || !can(access, 'roles.view')) return <Forbidden />;

  const sp = await searchParams;
  const tab = sp.tab === 'history' ? 'history' : sp.tab === 'matrix' ? 'matrix' : 'current';
  const isAdmin = access.positions.some((p) => p.role === 'system_admin');
  const canAssign = can(access, 'roles.assign');

  const [committees, roles, labels] = await Promise.all([
    listCommittees(),
    listRoles(),
    listPermissionLabels(),
  ]);
  const grantable = roles.filter((r) => isAdmin || !PROTECTED_GLOBAL_ROLES.includes(r.key));
  const request = parsePage(sp);
  const { rows, total }: { rows: AssignmentRow[]; total: number } =
    tab === 'matrix'
      ? { rows: [], total: 0 }
      : await listAssignments(
          { tab, roleKey: sp.role, committeeId: sp.committee, q: sp.q },
          request,
        );
  const meta = pageMeta(total, request);

  const activeAdmins = rows.filter(
    (r) => r.roleKey === 'system_admin' && r.state === 'active',
  ).length;

  const tabHref = (t: string) => `?tab=${t}`;
  const tabs = [
    { key: 'current', ar: 'المناصب الحالية', en: 'Current positions' },
    { key: 'history', ar: 'السجل', en: 'History' },
    { key: 'matrix', ar: 'الأدوار والصلاحيات', en: 'Roles & permissions' },
  ];

  return (
    <>
      <PageHeader
        title={ar ? 'الأدوار والمناصب' : 'Roles & positions'}
        description={
          ar
            ? 'من يشغل أي منصب، ولأي لجنة، وحتى متى. تنتهي الصلاحيات تلقائيًا بنهاية الفترة.'
            : 'Who holds which position, for which committee and until when. Access ends automatically with the term.'
        }
        readOnly={!canAssign}
        readOnlyLabel={ar ? 'عرض فقط' : 'View only'}
        action={
          canAssign ? (
            <AssignRoleDialog
              roles={grantable}
              committees={committees}
              permissionLabels={labels}
              canHandover={canAssign}
            />
          ) : undefined
        }
      />

      <nav aria-label={ar ? 'التبويبات' : 'Tabs'} className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={tabHref(t.key)}
            aria-current={tab === t.key ? 'page' : undefined}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              tab === t.key
                ? 'border-line-accent bg-surface-raised text-accent'
                : 'border-line text-muted hover:text-text'
            }`}
          >
            {ar ? t.ar : t.en}
          </Link>
        ))}
      </nav>

      {tab === 'matrix' ? (
        <MatrixTable roles={roles} labels={labels} lang={lang} />
      ) : (
        <>
          <form method="get" className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <input type="hidden" name="tab" value={tab} />
            <label className="flex items-center gap-2 text-xs text-muted">
              {ar ? 'الدور' : 'Role'}
              <select
                name="role"
                defaultValue={sp.role ?? ''}
                className="h-9 rounded-lg border border-line bg-surface px-3 text-sm text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent"
              >
                <option value="">{ar ? 'الكل' : 'All'}</option>
                {roles.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.name[lang]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-muted">
              {ar ? 'اللجنة' : 'Committee'}
              <select
                name="committee"
                defaultValue={sp.committee ?? ''}
                className="h-9 rounded-lg border border-line bg-surface px-3 text-sm text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent"
              >
                <option value="">{ar ? 'الكل' : 'All'}</option>
                {committees.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name[lang]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-muted">
              {ar ? 'بحث' : 'Search'}
              <input
                name="q"
                defaultValue={sp.q ?? ''}
                placeholder={ar ? 'الاسم أو البريد' : 'Name or e-mail'}
                className="h-9 rounded-lg border border-line bg-surface px-3 text-sm text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent"
              />
            </label>
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-full border border-line-accent px-4 text-sm font-semibold text-accent hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-accent"
            >
              {ar ? 'تطبيق' : 'Apply'}
            </button>
          </form>

          {rows.length === 0 ? (
            <p className="rounded-xl border border-line bg-surface p-8 text-center text-muted">
              {tab === 'history'
                ? ar
                  ? 'لا توجد فترات منتهية بعد.'
                  : 'No ended terms yet.'
                : ar
                  ? 'لا توجد مناصب مطابقة.'
                  : 'No matching positions.'}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-line bg-surface">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b border-line bg-surface-raised text-start text-xs text-muted">
                  <tr>
                    {[
                      ar ? 'المستخدم' : 'User',
                      ar ? 'الدور' : 'Role',
                      ar ? 'النطاق' : 'Scope',
                      ar ? 'من' : 'From',
                      ar ? 'إلى' : 'To',
                      ar ? 'الحالة' : 'State',
                      '',
                    ].map((h, i) => (
                      <th
                        key={i}
                        scope="col"
                        className="px-4 py-2.5 text-start text-xs font-medium"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const own = r.userId === access.userId;
                    const lastAdmin =
                      r.roleKey === 'system_admin' && r.state === 'active' && activeAdmins <= 1;
                    // Users never end their own positions (admins excepted); the last admin is protected.
                    const showEnd =
                      tab === 'current' && canAssign && r.state !== 'ended' && (!own || isAdmin);
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-line transition-colors last:border-0 hover:bg-surface-raised"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium">{r.userName}</div>
                          <div
                            dir="ltr"
                            className="text-xs text-muted"
                            style={{ textAlign: 'start' }}
                          >
                            {r.userEmail}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone="accent">{r.title?.[lang] ?? r.roleName[lang]}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {r.committeeName?.[lang] ?? (ar ? 'عام' : 'Global')}
                        </td>
                        <td className="px-4 py-3 tabular-nums">{formatDate(r.startsAt, lang)}</td>
                        <td className="px-4 py-3 tabular-nums">
                          {r.endsAt ? formatDate(r.endsAt, lang) : '—'}
                          {r.endReason && <div className="text-xs text-muted">{r.endReason}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={stateTone[r.state]}>{stateLabel[r.state][lang]}</Badge>
                        </td>
                        <td className="px-4 py-3 text-end">
                          {showEnd && (
                            <EndAssignmentDialog
                              assignmentId={r.id}
                              summary={`${r.userName} — ${r.title?.[lang] ?? r.roleName[lang]}${r.committeeName ? ` · ${r.committeeName[lang]}` : ''}`}
                              disabledReason={
                                lastAdmin
                                  ? ar
                                    ? 'لا يمكن إزالة آخر مسؤول نظام'
                                    : "The last system admin can't be removed"
                                  : undefined
                              }
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
      )}
    </>
  );
}

function MatrixTable({
  roles,
  labels,
  lang,
}: {
  roles: Awaited<ReturnType<typeof listRoles>>;
  labels: Awaited<ReturnType<typeof listPermissionLabels>>;
  lang: 'ar' | 'en';
}) {
  const ar = lang === 'ar';
  const keys = Object.keys(labels).sort((a, b) =>
    (labels[a]!.module + a).localeCompare(labels[b]!.module + b),
  );
  return (
    <>
      <p className="mb-3 text-sm text-muted">
        {ar
          ? 'هذه المصفوفة للقراءة فقط. تغييرها يتم عبر ترحيل قاعدة البيانات بعد موافقة قيادة المجتمع ومسؤول النظام.'
          : 'This matrix is read-only. Changing it is a database migration approved by the community leadership and a system admin.'}
      </p>
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-line bg-surface-raised text-xs text-muted">
            <tr>
              <th scope="col" className="px-4 py-2.5 text-start text-xs font-medium">
                {ar ? 'الصلاحية' : 'Permission'}
              </th>
              {roles.map((r) => (
                <th key={r.key} scope="col" className="px-2 py-2.5 text-center text-xs font-medium">
                  {r.name[lang]}
                  <div className="text-[10px] font-normal">
                    {r.scope === 'committee' ? (ar ? 'لجنة' : 'committee') : ar ? 'عام' : 'global'}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr
                key={k}
                className="border-b border-line transition-colors last:border-0 hover:bg-surface-raised"
              >
                <th scope="row" className="px-4 py-2 text-start font-normal">
                  <div>{labels[k]![lang]}</div>
                  <code dir="ltr" className="text-[11px] text-muted">
                    {k}
                  </code>
                </th>
                {roles.map((r) => (
                  <td key={r.key} className="px-2 py-2 text-center">
                    {r.permissions.includes(k as never) ? (
                      <span aria-label={ar ? 'ممنوحة' : 'Granted'}>
                        {r.scope === 'committee' ? '◐' : '✓'}
                      </span>
                    ) : (
                      <span aria-label={ar ? 'غير ممنوحة' : 'Not granted'} className="text-muted">
                        —
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">
        ✓ {ar ? 'في كل اللجان' : 'everywhere'} · ◐ {ar ? 'في لجنته فقط' : 'own committee only'}
      </p>
    </>
  );
}
