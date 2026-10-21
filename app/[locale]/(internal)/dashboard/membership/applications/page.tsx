import { Inbox, Search } from 'lucide-react';
import { EmptyState, ExportButton, Pagination, Tabs, type TabItem } from '@/components/ui';
import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterSelect } from '@/components/patterns/FilterControls';
import { Link } from '@/i18n/navigation';
import { canGlobal } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { pageMeta, parsePage } from '@/lib/pagination';
import { getAccess } from '@/modules/access/queries';
import { ApplicationsTable } from '@/modules/membership/components/ApplicationsTable';
import {
  getReviewCounts,
  listApplications,
  listReviewCycles,
} from '@/modules/membership/review-queries';
import { getReferenceData } from '@/modules/membership/queries';
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABEL } from '@/modules/membership/types';

type Search = {
  cycle?: string;
  status?: string;
  q?: string;
  track?: string;
  reviewer?: string;
  sort?: string;
  page?: string;
  size?: string;
};

const TAB_ORDER = [
  'submitted',
  'under_review',
  'info_requested',
  'waitlisted',
  'accepted',
  'lapsed',
  'rejected',
  'withdrawn',
] as const;
const field =
  'h-11 w-full rounded-shape-md border border-line-strong bg-field px-3 text-sm text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-focus-ring';

// MBR-004 / MBR-010 (screen 18): the reviewer queue. Permission: membership.review (global).
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
  const cycles = await listReviewCycles();
  // The open cycle first, then the latest one that ran.
  const defaultCycle =
    cycles.find((c) => c.phase === 'open') ?? cycles.find((c) => c.phase === 'closed') ?? cycles[0];
  const cycleId = sp.cycle === 'all' ? undefined : (sp.cycle ?? defaultCycle?.id);
  const cycle = cycles.find((c) => c.id === cycleId);
  const status = (APPLICATION_STATUSES as readonly string[]).includes(sp.status ?? '')
    ? sp.status
    : undefined;
  const sort = sp.sort === 'score' || sp.sort === 'newest' ? sp.sort : 'oldest';
  const request = parsePage(sp);
  const [{ rows, total }, counts, reference] = await Promise.all([
    listApplications(
      { cycleId, status, q: sp.q, track: sp.track, reviewer: sp.reviewer, sort, userId: user.id },
      request,
    ),
    getReviewCounts(cycleId),
    getReferenceData(),
  ]);
  const meta = pageMeta(total, request);
  const all = Object.values(counts).reduce((a, b) => a + b, 0);
  const canExport = canGlobal(access, 'membership.export');
  const cycleName = cycle ? (ar ? cycle.nameAr : cycle.nameEn || cycle.nameAr) : '';

  const keep = (extra: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({
      cycle: sp.cycle,
      q: sp.q,
      track: sp.track,
      reviewer: sp.reviewer,
      sort: sp.sort,
      ...extra,
    }))
      if (v) q.set(k, v);
    const s = q.toString();
    return s ? `?${s}` : '?';
  };
  const tabs: TabItem[] = [
    { key: 'all', label: ar ? 'الكل' : 'All', href: keep({ status: undefined }), count: all },
    ...TAB_ORDER.map((s) => ({
      key: s,
      label: APPLICATION_STATUS_LABEL[s].label[lang],
      href: keep({ status: s }),
      count: counts[s] ?? 0,
      ...(s === 'submitted' || s === 'info_requested' ? { tone: 'warning' as const } : {}),
    })),
  ];
  const exportHref = `/api/membership/export?${new URLSearchParams({ ...(cycleId ? { cycle: cycleId } : {}), ...(status ? { status } : {}) }).toString()}`;
  const filtered = Boolean(sp.q || sp.track || sp.reviewer);

  return (
    <>
      <PageHeader
        title={ar ? 'طلبات العضوية' : 'Membership applications'}
        description={
          cycle
            ? [
                cycleName,
                cycle.capacity !== null
                  ? ar
                    ? `المقبولون ${cycle.accepted} من ${cycle.capacity} مقعداً`
                    : `${cycle.accepted} of ${cycle.capacity} places accepted`
                  : null,
                cycle.reviewEndsAt
                  ? ar
                    ? `القرار المتوقع ${formatDate(cycle.reviewEndsAt, lang)}`
                    : `decision expected ${formatDate(cycle.reviewEndsAt, lang)}`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')
            : ar
              ? 'راجع الطلبات واتخذ القرار. يصل المتقدّمين رسائل القرار تلقائياً.'
              : 'Review applications and decide. Applicants are e-mailed automatically.'
        }
        action={
          canExport ? (
            <ExportButton href={exportHref} filename="membership-applications.csv" />
          ) : undefined
        }
      />

      <Tabs
        items={tabs}
        active={status ?? 'all'}
        label={ar ? 'حالة الطلب' : 'Application status'}
      />

      <form
        method="get"
        className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]"
      >
        {status && <input type="hidden" name="status" value={status} />}
        <label className="relative sm:col-span-2 lg:col-span-1">
          <span className="sr-only">{ar ? 'بحث' : 'Search'}</span>
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 start-3 my-auto text-muted"
          />
          <input
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder={
              ar
                ? 'جزء من الاسم، البريد، الجوال، أو الرقم المرجعي'
                : 'Part of a name, e-mail, phone or reference'
            }
            className={`${field} ps-9`}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          {ar ? 'الدورة' : 'Cycle'}
          <FilterSelect
            auto
            name="cycle"
            defaultValue={sp.cycle ?? defaultCycle?.id ?? 'all'}
            className={field}
          >
            <option value="all">{ar ? 'كل الدورات' : 'All cycles'}</option>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {ar ? c.nameAr : c.nameEn || c.nameAr}
              </option>
            ))}
          </FilterSelect>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          {ar ? 'المسار' : 'Track'}
          <FilterSelect auto name="track" defaultValue={sp.track ?? ''} className={field}>
            <option value="">{ar ? 'كل المسارات' : 'All tracks'}</option>
            {reference.tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {ar ? t.nameAr : t.nameEn || t.nameAr}
              </option>
            ))}
          </FilterSelect>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          {ar ? 'المراجع' : 'Reviewer'}
          <FilterSelect auto name="reviewer" defaultValue={sp.reviewer ?? ''} className={field}>
            <option value="">{ar ? 'كل المراجعين' : 'All reviewers'}</option>
            <option value="me">{ar ? 'أنا' : 'Me'}</option>
            <option value="none">{ar ? 'غير مسند' : 'Unassigned'}</option>
          </FilterSelect>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          {ar ? 'الترتيب' : 'Sort'}
          <FilterSelect auto name="sort" defaultValue={sort} className={field}>
            <option value="oldest">{ar ? 'الأقدم أولاً' : 'Oldest first'}</option>
            <option value="newest">{ar ? 'الأحدث أولاً' : 'Newest first'}</option>
            {(cycle?.rubric.length ?? 0) > 0 && (
              <option value="score">{ar ? 'الأعلى درجة' : 'Highest score'}</option>
            )}
          </FilterSelect>
        </label>
        <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-full border-[1.5px] border-line-strong px-5 text-sm font-semibold hover:border-accent hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-focus-ring"
          >
            {ar ? 'تطبيق' : 'Apply'}
          </button>
          {filtered && (
            <Link
              href={
                status
                  ? `?status=${status}${sp.cycle ? `&cycle=${sp.cycle}` : ''}`
                  : sp.cycle
                    ? `?cycle=${sp.cycle}`
                    : '?'
              }
              className="text-sm text-muted hover:text-text"
            >
              {ar ? 'مسح التصفية' : 'Reset filters'}
            </Link>
          )}
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Inbox size={36} aria-hidden="true" />}
          title={
            filtered
              ? ar
                ? 'لا توجد طلبات مطابقة'
                : 'No matching applications'
              : all === 0
                ? ar
                  ? 'لم يصل أي طلب بعد'
                  : 'No application has arrived yet'
                : ar
                  ? 'لا طلبات في هذه الحالة'
                  : 'No applications in this status'
          }
          description={
            all === 0 && cycle?.phase === 'open'
              ? ar
                ? 'الدورة مفتوحة. شارك رابط الانضمام لتصل الطلبات.'
                : 'The cycle is open. Share the join link so applications arrive.'
              : undefined
          }
        />
      ) : (
        <ApplicationsTable
          rows={rows}
          userId={user.id}
          hasRubric={(cycle?.rubric.length ?? 0) > 0}
        />
      )}
      <Pagination meta={meta} searchParams={sp} lang={lang} />
    </>
  );
}
