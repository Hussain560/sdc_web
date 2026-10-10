import { Users } from 'lucide-react';
import { Badge, EmptyState, Pagination, Tabs, type TabItem, Avatar } from '@/components/ui';
import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { Link } from '@/i18n/navigation';
import { can, canGlobal } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { pageMeta, parsePage } from '@/lib/pagination';
import { getAccess } from '@/modules/access/queries';
import { AddMemberDialog } from '@/modules/members/components/AddMemberDialog';
import { MemberActions } from '@/modules/members/components/MemberActions';
import { getReferenceData } from '@/modules/membership/queries';
import { getMemberCounts, listMembers } from '@/modules/members/queries';
import { MEMBER_STATUSES, MEMBER_STATUS_LABEL } from '@/modules/members/schemas';

type Search = { status?: string; q?: string; unclaimed?: string; page?: string; size?: string };

const VIA = {
  application: { ar: 'طلب عضوية', en: 'Application' },
  legacy: { ar: 'قديم', en: 'Legacy' },
  manual: { ar: 'يدوي', en: 'Manual' },
} as const;

// MEM-003/004 (screen 19): leadership sees all members with private fields, changes status, sends claim invites.
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
  await requireUser('/dashboard/members');
  const access = await getAccess();
  if (!access || !(canGlobal(access, 'members.view') || canGlobal(access, 'members.manage')))
    return <Forbidden />;
  const canManage = can(access, 'members.manage');
  const canCreate = can(access, 'members.create');
  const reference = canCreate ? await getReferenceData() : null;

  const sp = await searchParams;
  const status = (MEMBER_STATUSES as readonly string[]).includes(sp.status ?? '')
    ? sp.status
    : undefined;
  const unclaimed = sp.unclaimed === '1';
  const request = parsePage(sp);
  const [{ rows, total }, counts] = await Promise.all([
    listMembers({ status, q: sp.q, unclaimed }, request),
    getMemberCounts(),
  ]);
  const meta = pageMeta(total, request);
  const all = (counts.active ?? 0) + (counts.inactive ?? 0) + (counts.suspended ?? 0);

  const keep = (extra: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ q: sp.q, ...extra })) if (v) q.set(k, v);
    const s = q.toString();
    return s ? `?${s}` : '?';
  };
  const tabs: TabItem[] = [
    { key: 'all', label: ar ? 'الكل' : 'All', href: keep({}), count: all },
    ...MEMBER_STATUSES.map((s) => ({
      key: s,
      label: MEMBER_STATUS_LABEL[s][lang],
      href: keep({ status: s }),
      count: counts[s] ?? 0,
    })),
    {
      key: 'unclaimed',
      label: ar ? 'غير مطالَب بها' : 'Unclaimed',
      href: keep({ unclaimed: '1' }),
      count: counts.unclaimed ?? 0,
      tone: 'warning' as const,
    },
  ];

  return (
    <>
      <PageHeader
        title={ar ? 'الأعضاء' : 'Members'}
        description={
          ar
            ? 'سجل الأعضاء وحالاتهم. «غير مرتبطة» هي ملفات أعضاء قدامى لم يربطوها بحساب بعد؛ أرسل لهم رابطًا ليربطوا ملفهم بحسابهم.'
            : 'Member records and statuses. "Unclaimed" are old member profiles not yet linked to an account; send them a link so they can attach the profile to their account.'
        }
        readOnly={!canManage && !canCreate}
        readOnlyLabel={ar ? 'عرض فقط' : 'View only'}
        action={reference ? <AddMemberDialog reference={reference} /> : undefined}
      />
      <Tabs
        items={tabs}
        active={unclaimed ? 'unclaimed' : (status ?? 'all')}
        label={ar ? 'حالة العضو' : 'Member status'}
      />

      <form method="get" className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {status && <input type="hidden" name="status" value={status} />}
        {unclaimed && <input type="hidden" name="unclaimed" value="1" />}
        <label className="flex items-center gap-2 text-xs text-muted">
          {ar ? 'بحث' : 'Search'}
          <input
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder={ar ? 'الاسم…' : 'Name…'}
            className="h-9 w-56 rounded-lg border border-line bg-surface px-3 text-sm text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-focus-ring"
          />
        </label>
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-full border border-line-accent px-4 text-sm font-semibold text-accent hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-focus-ring"
        >
          {ar ? 'تطبيق' : 'Apply'}
        </button>
        {sp.q && (
          <Link
            href={keep({ q: undefined, status, unclaimed: unclaimed ? '1' : undefined })}
            className="inline-flex h-9 items-center text-sm text-muted hover:text-text"
          >
            {ar ? 'مسح البحث' : 'Clear search'}
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Users size={36} aria-hidden="true" />}
          title={ar ? 'لا يوجد أعضاء مطابقون' : 'No matching members'}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b border-line bg-surface-raised text-xs text-muted">
              <tr>
                {[
                  ar ? 'العضو' : 'Member',
                  ar ? 'الجامعة / المسار' : 'University / track',
                  ar ? 'المصدر' : 'Source',
                  ar ? 'الحالة' : 'Status',
                  ar ? 'الدليل' : 'Directory',
                  '',
                ].map((h, i) => (
                  <th key={i} scope="col" className="px-4 py-2.5 text-start text-xs font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const st = MEMBER_STATUS_LABEL[m.status];
                return (
                  <tr
                    key={m.id}
                    className="border-b border-line align-middle transition-colors last:border-0 hover:bg-surface-raised"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={ar ? m.nameAr : m.nameEn || m.nameAr} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {ar ? m.nameAr : m.nameEn || m.nameAr}
                          </p>
                          <p className="text-xs text-muted">
                            {m.linked
                              ? ar
                                ? 'مرتبط بحساب'
                                : 'Linked to an account'
                              : ar
                                ? 'بدون حساب'
                                : 'No account yet'}
                            {m.claimEmail && !m.linked ? ` · ${m.claimEmail}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {[m.university, m.track].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {VIA[m.joinedVia][lang]}
                      <p className="text-xs tabular-nums text-muted">
                        {formatDate(m.joinedAt, lang)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={st.tone}>{st[lang]}</Badge>
                      {m.statusReason && (
                        <p className="mt-1 text-xs text-muted">{m.statusReason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {m.visible ? (ar ? 'ظاهر' : 'Visible') : ar ? 'مخفي' : 'Hidden'}
                    </td>
                    <td className="px-4 py-3">
                      <MemberActions
                        id={m.id}
                        status={m.status}
                        linked={m.linked}
                        claimEmail={m.claimEmail}
                        canManage={canManage}
                      />
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
