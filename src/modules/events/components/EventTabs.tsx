import { ClipboardList, ListFilter, Search, X } from 'lucide-react';
import { Card, EmptyState, ExportButton, Pagination, Tabs, type TabItem } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { pageMeta, parsePage } from '@/lib/pagination';
import { todayInRiyadh } from '@/lib/time';
import { AttendanceTab } from '@/modules/attendance/components/AttendanceTab';
import { CertificatesTab } from '@/modules/attendance/components/CertificatesTab';
import { getSessionRoster, listEventCertificates } from '@/modules/attendance/queries';
import type { AttendanceOverview } from '@/modules/attendance/types';
import { ReviewTable } from '@/modules/registrations/components/ReviewTable';
import { REGISTRATION_STATUS_LABEL } from '@/modules/registrations/labels';
import { REGISTRATION_STATUSES, listRegistrations } from '@/modules/registrations/queries';

type Sp = Record<string, string | undefined>;

/** Registrations tab: the registrants of this event with status filter, search, pagination and the review actions. */
export async function RegistrationsSection({
  eventId,
  sp,
  counts,
  lang,
  canExport,
}: {
  eventId: string;
  sp: Sp;
  counts: Record<string, number>;
  lang: 'ar' | 'en';
  canExport: boolean;
}) {
  const ar = lang === 'ar';
  const status = (REGISTRATION_STATUSES as readonly string[]).includes(sp.status ?? '')
    ? sp.status
    : undefined;
  const request = parsePage(sp);
  const { rows, total } = await listRegistrations({ eventId, status, q: sp.q }, request);
  const meta = pageMeta(total, request);
  const all = Object.values(counts).reduce((a, b) => a + b, 0);

  const keep = (extra: Record<string, string | undefined>) => {
    const q = new URLSearchParams({ tab: 'registrations' });
    for (const [k, v] of Object.entries({ q: sp.q, ...extra })) if (v) q.set(k, v);
    return `?${q.toString()}`;
  };
  const tabs: TabItem[] = [
    { key: 'all', label: ar ? 'الكل' : 'All', href: keep({}), count: all },
    ...REGISTRATION_STATUSES.map((s) => ({
      key: s,
      label: REGISTRATION_STATUS_LABEL[s].label[lang],
      href: keep({ status: s }),
      count: counts[s] ?? 0,
      tone: s === 'pending' ? ('warning' as const) : undefined,
    })),
  ];
  const exportHref = `/api/registrations/export?${new URLSearchParams({
    event: eventId,
    ...(status ? { status } : {}),
  }).toString()}`;

  return (
    <div className="flex flex-col gap-1">
      <Tabs
        items={tabs}
        active={status ?? 'all'}
        label={ar ? 'حالة التسجيل' : 'Registration status'}
      />
      <form method="get" className="mb-3 flex flex-wrap items-center gap-2">
        <input type="hidden" name="tab" value="registrations" />
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
        <button
          type="submit"
          className="inline-flex h-9 items-center gap-2 rounded-full border border-line-accent px-4 text-sm font-semibold text-accent hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-accent"
        >
          <ListFilter size={15} aria-hidden="true" />
          {ar ? 'تطبيق' : 'Apply'}
        </button>
        {sp.q && (
          <Link
            href={keep({ status })}
            className="inline-flex h-9 items-center gap-1.5 text-sm text-muted hover:text-text"
          >
            <X size={15} aria-hidden="true" />
            {ar ? 'مسح البحث' : 'Clear search'}
          </Link>
        )}
        {canExport && (
          <span className="ms-auto">
            <ExportButton href={exportHref} filename="registrations.csv" />
          </span>
        )}
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={36} aria-hidden="true" />}
          title={
            sp.q || status
              ? ar
                ? 'لا توجد تسجيلات مطابقة'
                : 'No matching registrations'
              : ar
                ? 'لا توجد تسجيلات بعد'
                : 'No registrations yet'
          }
        />
      ) : (
        <ReviewTable rows={rows} showEvent={false} />
      )}
      <div className="mt-3">
        <Pagination meta={meta} searchParams={sp} lang={lang} />
      </div>
    </div>
  );
}

/** Attendance tab: picks the day (the open one, today's, or the first still to finalize) and loads its roster. */
export async function AttendanceSection({
  eventId,
  slug,
  title,
  overview,
  sp,
  canComplete,
}: {
  eventId: string;
  slug: string;
  title: string;
  overview: AttendanceOverview;
  sp: Sp;
  canComplete: boolean;
}) {
  const today = todayInRiyadh();
  const days = overview.days;
  const day =
    days.find((d) => d.eventDateId === sp.day) ??
    days.find((d) => d.status === 'open') ??
    days.find((d) => d.date === today) ??
    days.find((d) => d.status !== 'finalized') ??
    days[0];
  if (!day)
    return (
      <Card className="text-sm text-muted">
        {sp.tab === 'attendance' ? 'This event has no scheduled days yet.' : null}
      </Card>
    );
  const roster = day.sessionId ? await getSessionRoster(day.sessionId) : null;
  return (
    <AttendanceTab
      eventId={eventId}
      slug={slug}
      title={title}
      overview={overview}
      day={day}
      roster={roster}
      view={sp.view === 'qr' ? 'qr' : 'list'}
      canComplete={canComplete}
    />
  );
}

/** Certificates tab (all sessions signed off): registrants with their final percentage and certificate state. */
export async function CertificatesSection({
  eventId,
  overview,
  canManageSettings,
}: {
  eventId: string;
  overview: AttendanceOverview;
  canManageSettings: boolean;
}) {
  const rows = await listEventCertificates(eventId, overview.threshold);
  return (
    <CertificatesTab
      eventId={eventId}
      overview={overview}
      rows={rows}
      canIssue={!!overview.event.finalizedAt}
      canManageSettings={canManageSettings}
    />
  );
}
