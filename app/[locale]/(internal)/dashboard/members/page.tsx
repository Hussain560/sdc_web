import { ChevronLeft, ChevronRight, Eye, EyeOff, Shield, Users } from 'lucide-react';
import { Avatar, Badge, EmptyState, Pagination, Tabs, type TabItem } from '@/components/ui';
import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { Link } from '@/i18n/navigation';
import { can, canGlobal } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { pageMeta, parsePage } from '@/lib/pagination';
import { getAccess } from '@/modules/access/queries';
import { listCommittees, listRoles } from '@/modules/access/admin-queries';
import {
  ADMIN_MEMBER_TABS,
  listAdminMembers,
  type AdminMemberRow,
  type AdminMemberTab,
} from '@/modules/members/admin-queries';
import { AddMemberWizard } from '@/modules/members/components/AddMemberWizard';
import { CompletenessBar } from '@/modules/members/components/CompletenessBar';
import { MemberActions } from '@/modules/members/components/MemberActions';
import { WIZARD_ROLE_KEYS } from '@/modules/members/new-member';
import { memberThumbUrl } from '@/modules/members/photo-url';
import { MEMBER_STATUS_LABEL } from '@/modules/members/schemas';
import { getReferenceData } from '@/modules/membership/queries';

type Search = {
  status?: string;
  /** Old link format of the unclaimed tab. */
  unclaimed?: string;
  q?: string;
  committee?: string;
  track?: string;
  completeness?: string;
  page?: string;
  size?: string;
};

const selectClass =
  'h-11 w-full rounded-xl border border-line-strong bg-field px-3 text-sm text-text focus-visible:outline-2 focus-visible:outline-focus-ring';

/** Status chip of a row: not activated and unclaimed are not member statuses but things leadership acts on. */
function statusOf(r: AdminMemberRow, lang: 'ar' | 'en') {
  if (!r.linked)
    return { tone: 'warning' as const, text: lang === 'ar' ? 'لم يُربط بحساب' : 'Not linked' };
  if (r.status === 'active' && !r.activated)
    return { tone: 'info' as const, text: lang === 'ar' ? 'لم يُفعَّل الحساب' : 'Not activated' };
  const st = MEMBER_STATUS_LABEL[r.status];
  return { tone: st.tone, text: st[lang] };
}

// MEM-015 (screen 19, Sprint 17): every member record, including hidden and moved ones, with what leadership needs to
// act: committee and position, account state, profile completeness, directory visibility.
export default async function MembersAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Search>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  await requireUser('/dashboard/members');
  const access = await getAccess();
  if (!access || !(canGlobal(access, 'members.view') || canGlobal(access, 'members.manage')))
    return <Forbidden />;
  const canManage = can(access, 'members.manage');
  const canCreate = can(access, 'members.create');
  const canAssign = can(access, 'roles.assign');

  const sp = await searchParams;
  const request = parsePage(sp);
  const wanted = sp.unclaimed === '1' ? 'unclaimed' : sp.status;
  const tab: AdminMemberTab = (ADMIN_MEMBER_TABS as readonly string[]).includes(wanted ?? '')
    ? (wanted as AdminMemberTab)
    : 'all';

  const [list, reference, committees, allRoles] = await Promise.all([
    listAdminMembers(
      {
        status: tab,
        q: sp.q,
        committee: sp.committee,
        track: sp.track,
        completeness: sp.completeness,
      },
      request,
    ),
    getReferenceData(),
    listCommittees(),
    canCreate && canAssign ? listRoles() : Promise.resolve([]),
  ]);
  const wizardRoles = allRoles.filter((r) =>
    (WIZARD_ROLE_KEYS as readonly string[]).includes(r.key),
  );
  const meta = pageMeta(list.total, request);

  const keep = (extra: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged = {
      q: sp.q,
      committee: sp.committee,
      track: sp.track,
      completeness: sp.completeness,
      ...extra,
    };
    for (const [k, v] of Object.entries(merged)) if (v) q.set(k, v);
    const s = q.toString();
    return s ? `?${s}` : '?';
  };
  const tabLabels: Record<AdminMemberTab, string> = {
    all: L('الكل', 'All'),
    active: L('نشط', 'Active'),
    not_activated: L('لم يُفعَّل', 'Not activated'),
    suspended: L('موقوف', 'Suspended'),
    inactive: L('غير نشط', 'Inactive'),
    unclaimed: L('لم يُطالَب به', 'Unclaimed'),
  };
  const tabs: TabItem[] = ADMIN_MEMBER_TABS.map((k) => ({
    key: k,
    label: tabLabels[k],
    href: keep(k === 'all' ? {} : { status: k }),
    count: list.counts[k],
    tone: k === 'unclaimed' || k === 'not_activated' ? ('warning' as const) : undefined,
  }));
  const hasFilters = !!(sp.q || sp.committee || sp.track || sp.completeness);
  const Arrow = ar ? ChevronLeft : ChevronRight;
  const nameOf = (r: AdminMemberRow) => (ar ? r.nameAr : (r.nameEn ?? r.nameAr));

  const kpi = (label: string, value: string | number, hint?: string) => (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );

  return (
    <>
      <PageHeader
        title={L('الأعضاء', 'Members')}
        description={L(
          'كل سجلات الأعضاء، بما فيها المخفية والمنقولة من الموقع السابق.',
          'Every member record, including hidden ones and those moved from the old site.',
        )}
        readOnly={!canManage && !canCreate}
        readOnlyLabel={L('عرض فقط', 'View only')}
        action={
          canCreate ? (
            <AddMemberWizard
              reference={reference}
              committees={committees}
              roles={wizardRoles}
              canAssign={canAssign}
            />
          ) : undefined
        }
      />

      <section
        aria-label={L('ملخص', 'Summary')}
        className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {kpi(L('أعضاء نشطون', 'Active members'), list.kpis.active)}
        {kpi(L('ظاهرون في الدليل', 'Listed in the directory'), list.kpis.listed)}
        {kpi(L('متوسط اكتمال الملفات', 'Average completeness'), `${list.kpis.avgCompleteness}%`)}
        {kpi(
          L('ملفات أقل من 40٪', 'Profiles under 40%'),
          list.kpis.lowCompleteness,
          L(
            'تذكيرهم بإكمال الملف يحتاج اعتماد قالب بريد جديد.',
            'Reminding them needs a new e-mail type to be approved.',
          ),
        )}
      </section>

      <Tabs items={tabs} active={tab} label={L('حالة العضو', 'Member status')} />

      <form
        method="get"
        role="search"
        className="mb-4 grid gap-3 md:grid-cols-[1fr_200px_200px_200px_auto]"
      >
        {tab !== 'all' && <input type="hidden" name="status" value={tab} />}
        <label className="block">
          <span className="sr-only">{L('بحث', 'Search')}</span>
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder={
              list.canContact
                ? L(
                    'أي جزء من الاسم بالعربية أو الإنجليزية، أو البريد',
                    'Any part of the name in Arabic or English, or the e-mail',
                  )
                : L(
                    'أي جزء من الاسم بالعربية أو الإنجليزية',
                    'Any part of the name in Arabic or English',
                  )
            }
            className={selectClass}
          />
        </label>
        <label className="block">
          <span className="sr-only">{L('اللجنة', 'Committee')}</span>
          <select name="committee" defaultValue={sp.committee ?? ''} className={selectClass}>
            <option value="">{L('كل اللجان', 'All committees')}</option>
            <option value="none">{L('بلا لجنة', 'No committee')}</option>
            {committees.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name[lang]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">{L('المسار', 'Track')}</span>
          <select name="track" defaultValue={sp.track ?? ''} className={selectClass}>
            <option value="">{L('كل المسارات', 'All tracks')}</option>
            {reference.tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {ar ? t.nameAr : t.nameEn || t.nameAr}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">{L('اكتمال الملف', 'Profile completeness')}</span>
          <select name="completeness" defaultValue={sp.completeness ?? ''} className={selectClass}>
            <option value="">{L('كل نسب الاكتمال', 'Any completeness')}</option>
            <option value="complete">{L('مكتمل (100٪)', 'Complete (100%)')}</option>
            <option value="low">{L('أقل من 40٪', 'Under 40%')}</option>
          </select>
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex h-11 items-center rounded-full border border-line-accent px-5 text-sm font-semibold text-accent hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-focus-ring"
          >
            {L('تطبيق', 'Apply')}
          </button>
          {hasFilters && (
            <Link
              href={tab === 'all' ? '?' : `?status=${tab}`}
              className="inline-flex h-11 items-center px-2 text-sm text-muted hover:text-text"
            >
              {L('مسح', 'Clear')}
            </Link>
          )}
        </div>
      </form>

      {list.rows.length === 0 ? (
        <EmptyState
          icon={<Users size={36} aria-hidden="true" />}
          title={
            hasFilters
              ? L('لا أعضاء بهذا البحث', 'No members match')
              : L('لا يوجد أعضاء بعد', 'No members yet')
          }
          description={
            hasFilters
              ? L(
                  'نبحث في الاسم الأول والأوسط والأخير باللغتين.',
                  'We search the first, middle and last name in both languages.',
                )
              : undefined
          }
        />
      ) : (
        <>
          {/* Phones get cards, wider screens a table. */}
          <ul className="flex flex-col gap-3 md:hidden">
            {list.rows.map((r) => {
              const st = statusOf(r, lang);
              return (
                <li key={r.id} className="rounded-xl border border-line bg-surface p-3">
                  <Link href={`/dashboard/members/${r.id}`} className="flex items-center gap-3">
                    <Avatar name={nameOf(r)} src={memberThumbUrl(r.photoPath)} size={56} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{nameOf(r)}</span>
                      <span className="block truncate text-sm text-muted">
                        {[ar ? r.committeeAr : r.committeeEn, ar ? r.roleAr : r.roleEn]
                          .filter(Boolean)
                          .join(' · ') || L('بلا لجنة', 'No committee')}
                      </span>
                    </span>
                  </Link>
                  <div className="mt-3 flex items-center gap-3">
                    <CompletenessBar
                      percent={r.completeness}
                      label={L('اكتمال الملف', 'Profile completeness')}
                      className="flex-1"
                    />
                    <Badge tone={st.tone}>{st.text}</Badge>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="hidden overflow-x-auto rounded-xl border border-line bg-surface md:block">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="border-b border-line bg-surface-raised text-xs text-muted">
                <tr>
                  {[
                    L('العضو', 'Member'),
                    L('اللجنة والمنصب', 'Committee and position'),
                    L('الحالة', 'Status'),
                    L('اكتمال الملف', 'Profile'),
                    L('في الدليل', 'In directory'),
                    L('انضم', 'Joined'),
                    '',
                  ].map((h, i) => (
                    <th key={i} scope="col" className="px-4 py-2.5 text-start text-xs font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.rows.map((r) => {
                  const st = statusOf(r, lang);
                  const committee = ar ? r.committeeAr : r.committeeEn;
                  const role = ar ? r.roleAr : r.roleEn;
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-line align-middle transition-colors last:border-0 hover:bg-surface-raised"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={nameOf(r)} src={memberThumbUrl(r.photoPath)} size={40} />
                          <div className="min-w-0">
                            <Link
                              href={`/dashboard/members/${r.id}`}
                              className="block truncate font-semibold hover:text-accent-text focus-visible:outline-2 focus-visible:outline-focus-ring"
                            >
                              {nameOf(r)}
                            </Link>
                            {list.canContact && (
                              <p dir="ltr" className="truncate text-start text-xs text-muted">
                                {r.email ?? L('لم يُربط بحساب', 'Not linked to an account')}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {committee || role ? (
                          <>
                            <p>{committee ?? '—'}</p>
                            <p className="text-xs text-muted">{role}</p>
                          </>
                        ) : (
                          <span className="text-muted">{L('بلا لجنة', 'No committee')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={st.tone}>{st.text}</Badge>
                      </td>
                      <td className="w-56 px-4 py-3">
                        <CompletenessBar
                          percent={r.completeness}
                          label={L('اكتمال الملف', 'Profile completeness')}
                        />
                      </td>
                      <td className="px-4 py-3 text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          {r.listed ? (
                            <Eye aria-hidden="true" className="size-4" />
                          ) : (
                            <EyeOff aria-hidden="true" className="size-4" />
                          )}
                          {r.listed ? L('ظاهر', 'Visible') : L('مخفي', 'Hidden')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap tabular-nums text-muted">
                        {formatDate(r.joinedAt, lang)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          {/* A record with no account is waiting for its owner: the invite is one click away. */}
                          {!r.linked && (
                            <MemberActions
                              id={r.id}
                              status={r.status}
                              linked={false}
                              claimEmail={null}
                              canManage={canManage}
                            />
                          )}
                          <Link
                            href={`/dashboard/members/${r.id}`}
                            aria-label={`${L('فتح', 'Open')} ${nameOf(r)}`}
                            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-muted hover:bg-surface-raised hover:text-text focus-visible:outline-2 focus-visible:outline-focus-ring"
                          >
                            <Arrow aria-hidden="true" className="size-5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      <Pagination meta={meta} searchParams={sp} lang={lang} />

      <p className="mt-4 flex items-start gap-2 text-xs text-muted">
        <Shield aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {list.canContact
          ? L(
              'يظهر البريد لأن لديك صلاحية members.view_contact. بدونها يُخفى عمود الاتصال كاملاً.',
              'The e-mail shows because you hold members.view_contact. Without it the contact column is hidden entirely.',
            )
          : L(
              'لا تملك صلاحية members.view_contact، فلا يظهر البريد ولا الجوال ولا يُبحث بهما.',
              'You do not hold members.view_contact, so e-mail and phone are not shown or searchable.',
            )}
      </p>
    </>
  );
}
