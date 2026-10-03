import { ClipboardList, ListFilter, Search, X } from 'lucide-react';
import { EmptyState, ExportButton, Pagination, Tabs, type TabItem } from '@/components/ui';
import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { Link } from '@/i18n/navigation';
import { canAny } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { pageMeta, parsePage } from '@/lib/pagination';
import { getAccess } from '@/modules/access/queries';
import { REGISTRATION_STATUS_LABEL } from '@/modules/registrations/labels';
import {
  REGISTRATION_STATUSES,
  getRegistrationCounts,
  listRegistrations,
  listReviewEvents,
} from '@/modules/registrations/queries';
import { ReviewTable } from '@/modules/registrations/components/ReviewTable';

type Search = { event?: string; status?: string; q?: string; page?: string; size?: string };

// REG-004/005: the reviewer's queue. RLS limits the rows to the committees the person may review.
export default async function RegistrationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Search>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  await requireUser('/dashboard/registrations');
  const access = await getAccess();
  if (!access || !canAny(access, ['registrations.review'])) return <Forbidden />;

  const sp = await searchParams;
  const status = (REGISTRATION_STATUSES as readonly string[]).includes(sp.status ?? '')
    ? sp.status
    : undefined;
  const request = parsePage(sp);

  const [{ rows, total }, counts, events] = await Promise.all([
    listRegistrations({ eventId: sp.event, status, q: sp.q }, request),
    getRegistrationCounts(sp.event),
    listReviewEvents(),
  ]);
  const meta = pageMeta(total, request);
  const allCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const selectedEvent = events.find((e) => e.id === sp.event);
  const canExport = canAny(access, ['registrations.export']);

  const keep = (extra: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ event: sp.event, q: sp.q, ...extra })) if (v) q.set(k, v);
    const s = q.toString();
    return s ? `?${s}` : '?';
  };

  const tabs: TabItem[] = [
    {
      key: 'pending',
      label: REGISTRATION_STATUS_LABEL.pending.label[lang],
      href: keep({ status: 'pending' }),
      count: counts.pending ?? 0,
      tone: 'warning',
    },
    { key: 'all', label: ar ? 'الكل' : 'All', href: keep({}), count: allCount },
    ...REGISTRATION_STATUSES.filter((s) => s !== 'pending').map((s) => ({
      key: s,
      label: REGISTRATION_STATUS_LABEL[s].label[lang],
      href: keep({ status: s }),
      count: counts[s] ?? 0,
    })),
  ];

  const exportHref = `/api/registrations/export?${new URLSearchParams({
    ...(sp.event ? { event: sp.event } : {}),
    ...(status ? { status } : {}),
  }).toString()}`;

  return (
    <>
      <PageHeader
        title={ar ? 'التسجيلات' : 'Registrations'}
        description={
          ar
            ? 'راجع طلبات التسجيل في فعاليات لجانك واتخذ القرار.'
            : 'Review registrations for your committees’ events and decide.'
        }
        action={
          canExport ? <ExportButton href={exportHref} filename="registrations.csv" /> : undefined
        }
      />

      {selectedEvent && selectedEvent.seats !== null && (
        <p className="mb-3 text-sm text-muted tabular-nums">
          {ar
            ? `المقاعد: ${selectedEvent.accepted} مقبول من ${selectedEvent.seats}`
            : `Seats: ${selectedEvent.accepted} accepted of ${selectedEvent.seats}`}
        </p>
      )}

      <Tabs
        items={tabs}
        active={status ?? 'all'}
        label={ar ? 'حالة التسجيل' : 'Registration status'}
      />

      <form method="get" className="mb-4 flex flex-wrap items-center gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <label className="relative">
          <span className="sr-only">{ar ? 'بحث' : 'Search'}</span>
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 start-3 my-auto text-muted"
          />
          <input
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder={ar ? 'ابحث بالاسم أو البريد' : 'Search by name or e-mail'}
            className="h-9 w-64 rounded-lg border border-line bg-surface ps-9 pe-3 text-sm text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent"
          />
        </label>
        <label>
          <span className="sr-only">{ar ? 'الفعالية' : 'Event'}</span>
          <select
            name="event"
            defaultValue={sp.event ?? ''}
            className="h-9 max-w-64 rounded-lg border border-line bg-surface px-3 text-sm text-text focus-visible:outline-2 focus-visible:outline-accent"
          >
            <option value="">{ar ? 'كل الفعاليات' : 'All events'}</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {ar ? e.titleAr : e.titleEn || e.titleAr}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="inline-flex h-9 items-center gap-2 rounded-full border border-line-accent px-4 text-sm font-semibold text-accent hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-accent"
        >
          <ListFilter size={15} aria-hidden="true" />
          {ar ? 'تطبيق' : 'Apply'}
        </button>
        {(sp.q || sp.event) && (
          <Link
            href={status ? `?status=${status}` : '?'}
            className="inline-flex h-9 items-center gap-1.5 text-sm text-muted hover:text-text"
          >
            <X size={15} aria-hidden="true" />
            {ar ? 'مسح التصفية' : 'Reset filters'}
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={36} aria-hidden="true" />}
          title={
            status === 'pending'
              ? ar
                ? 'لا توجد طلبات بانتظار المراجعة'
                : 'Nothing waiting for review'
              : ar
                ? 'لا توجد تسجيلات مطابقة'
                : 'No matching registrations'
          }
        />
      ) : (
        <ReviewTable rows={rows} />
      )}
      <Pagination meta={meta} searchParams={sp} lang={lang} />
    </>
  );
}
