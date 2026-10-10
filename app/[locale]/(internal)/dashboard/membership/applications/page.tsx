import { Inbox } from 'lucide-react';
import { EmptyState, ExportButton, Pagination, Tabs, type TabItem } from '@/components/ui';
import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { Link } from '@/i18n/navigation';
import { canGlobal } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { pageMeta, parsePage } from '@/lib/pagination';
import { getAccess } from '@/modules/access/queries';
import { ApplicationsTable } from '@/modules/membership/components/ApplicationsTable';
import {
  getReviewCounts,
  listApplications,
  listReviewCycles,
} from '@/modules/membership/review-queries';
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABEL } from '@/modules/membership/types';

type Search = { cycle?: string; status?: string; q?: string; page?: string; size?: string };

// MBR-004 (screen 18): the reviewer queue. Permission: membership.review (global).
export default async function ApplicationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Search>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  const user = await requireUser('/dashboard/membership/applications');
  const access = await getAccess();
  if (!access || !canGlobal(access, 'membership.review')) return <Forbidden />;

  const sp = await searchParams;
  const status = (APPLICATION_STATUSES as readonly string[]).includes(sp.status ?? '')
    ? sp.status
    : undefined;
  const request = parsePage(sp);
  const [{ rows, total }, counts, cycles] = await Promise.all([
    listApplications({ cycleId: sp.cycle, status, q: sp.q }, request),
    getReviewCounts(sp.cycle),
    listReviewCycles(),
  ]);
  const meta = pageMeta(total, request);
  const all = Object.values(counts).reduce((a, b) => a + b, 0);
  const cycle = cycles.find((c) => c.id === sp.cycle);
  const canExport = canGlobal(access, 'membership.export');

  const keep = (extra: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ cycle: sp.cycle, q: sp.q, ...extra })) if (v) q.set(k, v);
    const s = q.toString();
    return s ? `?${s}` : '?';
  };
  const tabs: TabItem[] = [
    {
      key: 'submitted',
      label: APPLICATION_STATUS_LABEL.submitted.label[lang],
      href: keep({ status: 'submitted' }),
      count: counts.submitted ?? 0,
      tone: 'warning',
    },
    { key: 'all', label: ar ? 'الكل' : 'All', href: keep({}), count: all },
    ...APPLICATION_STATUSES.filter((s) => s !== 'submitted').map((s) => ({
      key: s,
      label: APPLICATION_STATUS_LABEL[s].label[lang],
      href: keep({ status: s }),
      count: counts[s] ?? 0,
    })),
  ];
  const exportHref = `/api/membership/export?${new URLSearchParams({ ...(sp.cycle ? { cycle: sp.cycle } : {}), ...(status ? { status } : {}) }).toString()}`;

  return (
    <>
      <PageHeader
        title={ar ? 'طلبات العضوية' : 'Membership applications'}
        description={
          ar
            ? 'راجع الطلبات واتخذ القرار. تصل المتقدمين رسائل القرار تلقائيًا.'
            : 'Review applications and decide. Applicants are e-mailed automatically.'
        }
        action={
          canExport ? (
            <ExportButton href={exportHref} filename="membership-applications.csv" />
          ) : undefined
        }
      />
      {cycle && cycle.capacity !== null && (
        <p className="mb-3 text-sm tabular-nums text-muted">
          {ar
            ? `المقبولون: ${cycle.accepted} من ${cycle.capacity}`
            : `Accepted: ${cycle.accepted} of ${cycle.capacity}`}
        </p>
      )}
      <Tabs
        items={tabs}
        active={status ?? 'all'}
        label={ar ? 'حالة الطلب' : 'Application status'}
      />

      <form method="get" className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {status && <input type="hidden" name="status" value={status} />}
        <label className="flex items-center gap-2 text-xs text-muted">
          {ar ? 'بحث' : 'Search'}
          <input
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder={ar ? 'الاسم أو البريد…' : 'Name or e-mail…'}
            className="h-9 w-56 rounded-lg border border-line bg-surface px-3 text-sm text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-focus-ring"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-muted">
          {ar ? 'الدورة' : 'Cycle'}
          <select
            name="cycle"
            defaultValue={sp.cycle ?? ''}
            className="h-9 max-w-64 rounded-lg border border-line bg-surface px-3 text-sm text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-focus-ring"
          >
            <option value="">{ar ? 'الكل' : 'All'}</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {ar ? c.nameAr : c.nameEn || c.nameAr}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-full border border-line-accent px-4 text-sm font-semibold text-accent hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-focus-ring"
        >
          {ar ? 'تطبيق' : 'Apply'}
        </button>
        {(sp.q || sp.cycle) && (
          <Link
            href={status ? `?status=${status}` : '?'}
            className="inline-flex h-9 items-center text-sm text-muted hover:text-text"
          >
            {ar ? 'مسح التصفية' : 'Reset filters'}
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Inbox size={36} aria-hidden="true" />}
          title={
            status === 'submitted'
              ? ar
                ? 'لا توجد طلبات بانتظار المراجعة'
                : 'Nothing waiting for review'
              : ar
                ? 'لا توجد طلبات مطابقة'
                : 'No matching applications'
          }
        />
      ) : (
        <ApplicationsTable
          rows={rows}
          userId={user.id}
          isAdmin={access.positions.some((p) => p.role === 'system_admin')}
        />
      )}
      <Pagination meta={meta} searchParams={sp} lang={lang} />
    </>
  );
}
