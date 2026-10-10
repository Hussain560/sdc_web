import { CalendarDays } from 'lucide-react';
import { Badge, EmptyState, Pagination, Tabs, type TabItem } from '@/components/ui';
import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { Link } from '@/i18n/navigation';
import { can } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { formatDateRange, formatTimeRange } from '@/lib/format';
import { pageMeta, parsePage } from '@/lib/pagination';
import { listCommittees } from '@/modules/access/admin-queries';
import { getAccess } from '@/modules/access/queries';
import { getStatusCounts, listEvents } from '@/modules/events/queries';
import {
  EVENT_STATUSES,
  EVENT_TYPES,
  LOCATION_LABEL,
  PHASE_LABEL,
  STATUS_LABEL,
  TYPE_LABEL,
  type EventStatus,
} from '@/modules/events/types';

type Search = {
  status?: string;
  committee?: string;
  type?: string;
  period?: string;
  q?: string;
  page?: string;
  size?: string;
};

export default async function EventsListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Search>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  await requireUser('/dashboard/events');
  const access = await getAccess();
  if (!access || !can(access, 'events.view_drafts')) return <Forbidden />;

  const sp = await searchParams;
  const status = (EVENT_STATUSES as readonly string[]).includes(sp.status ?? '')
    ? sp.status
    : undefined;
  const period = sp.period === 'upcoming' || sp.period === 'past' ? sp.period : 'all';
  const request = parsePage(sp);

  const [{ rows, total }, counts, committees] = await Promise.all([
    listEvents({ status, committeeId: sp.committee, type: sp.type, period, q: sp.q }, request),
    getStatusCounts(),
    listCommittees(),
  ]);
  const meta = pageMeta(total, request);
  const allCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const canCreate = can(access, 'events.create');
  const canApprove = can(access, 'events.approve');

  const keep = (extra: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({
      committee: sp.committee,
      type: sp.type,
      period: sp.period,
      q: sp.q,
      ...extra,
    }))
      if (v) q.set(k, v);
    const s = q.toString();
    return s ? `?${s}` : '?';
  };

  const tabs: TabItem[] = [
    ...(canApprove
      ? [
          {
            key: 'pending_review',
            label: STATUS_LABEL.pending_review.label[lang],
            href: keep({ status: 'pending_review' }),
            count: counts.pending_review ?? 0,
            tone: 'warning' as const,
          },
        ]
      : []),
    { key: 'all', label: ar ? 'الكل' : 'All', href: keep({}), count: allCount },
    ...EVENT_STATUSES.filter((s) => !(canApprove && s === 'pending_review')).map((s) => ({
      key: s,
      label: STATUS_LABEL[s].label[lang],
      href: keep({ status: s }),
      count: counts[s] ?? 0,
    })),
  ];

  const filtersActive = Boolean(
    sp.q || sp.committee || sp.type || (sp.period && sp.period !== 'all'),
  );

  return (
    <>
      <PageHeader
        title={ar ? 'الفعاليات' : 'Events'}
        description={
          ar
            ? 'إدارة فعاليات اللجان ومتابعة مراحلها.'
            : 'Manage committee events and follow their stages.'
        }
        readOnly={!canCreate}
        readOnlyLabel={ar ? 'عرض فقط' : 'View only'}
        action={
          canCreate ? (
            <Link
              href="/dashboard/events/new"
              className="inline-flex min-h-10 items-center rounded-full bg-accent px-5 text-sm font-semibold text-on-accent hover:bg-accent-hover"
            >
              {ar ? '+ فعالية جديدة' : '+ New event'}
            </Link>
          ) : undefined
        }
      />

      <Tabs items={tabs} active={status ?? 'all'} label={ar ? 'حالة الفعالية' : 'Event status'} />

      <form method="get" className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {status && <input type="hidden" name="status" value={status} />}
        <label className="flex items-center gap-2 text-xs text-muted">
          {ar ? 'بحث' : 'Search'}
          <input
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder={ar ? 'العنوان…' : 'Title…'}
            className="h-9 w-56 rounded-lg border border-line bg-surface px-3 text-sm text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-focus-ring"
          />
        </label>
        {committees.length > 1 && (
          <label className="flex items-center gap-2 text-xs text-muted">
            {ar ? 'اللجنة' : 'Committee'}
            <select
              name="committee"
              defaultValue={sp.committee ?? ''}
              className="h-9 rounded-lg border border-line bg-surface px-3 text-sm text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-focus-ring"
            >
              <option value="">{ar ? 'الكل' : 'All'}</option>
              {committees.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name[lang]}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex items-center gap-2 text-xs text-muted">
          {ar ? 'النوع' : 'Type'}
          <select
            name="type"
            defaultValue={sp.type ?? ''}
            className="h-9 rounded-lg border border-line bg-surface px-3 text-sm text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-focus-ring"
          >
            <option value="">{ar ? 'الكل' : 'All'}</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t][lang]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs text-muted">
          {ar ? 'الفترة' : 'Period'}
          <select
            name="period"
            defaultValue={period}
            className="h-9 rounded-lg border border-line bg-surface px-3 text-sm text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-focus-ring"
          >
            <option value="all">{ar ? 'الكل' : 'All'}</option>
            <option value="upcoming">{ar ? 'القادمة' : 'Upcoming'}</option>
            <option value="past">{ar ? 'السابقة' : 'Past'}</option>
          </select>
        </label>
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-full border border-line-accent px-4 text-sm font-semibold text-accent hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-focus-ring"
        >
          {ar ? 'تطبيق' : 'Apply'}
        </button>
        {filtersActive && (
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
          icon={<CalendarDays size={36} aria-hidden="true" />}
          title={
            filtersActive || status
              ? ar
                ? 'لا توجد فعاليات مطابقة'
                : 'No matching events'
              : ar
                ? 'لا توجد فعاليات بعد'
                : 'No events yet'
          }
          description={
            canCreate && !filtersActive
              ? ar
                ? 'ابدأ بإنشاء أول فعالية للجنتك.'
                : 'Start by creating your committee’s first event.'
              : undefined
          }
          action={
            canCreate && !filtersActive ? (
              <Link
                href="/dashboard/events/new"
                className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-on-accent"
              >
                {ar ? '+ فعالية جديدة' : '+ New event'}
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-line bg-surface-raised text-xs text-muted">
              <tr>
                {[
                  ar ? 'الفعالية' : 'Event',
                  ar ? 'اللجنة' : 'Committee',
                  ar ? 'الموعد' : 'Date',
                  ar ? 'الحالة' : 'Status',
                  '',
                ].map((h, i) => (
                  <th key={i} scope="col" className="px-4 py-2.5 text-start text-xs font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const st = STATUS_LABEL[e.status as EventStatus];
                const title = ar ? e.titleAr : e.titleEn || e.titleAr;
                const other = ar ? e.titleEn : e.titleAr;
                return (
                  <tr
                    key={e.id}
                    className="border-b border-line align-middle transition-colors last:border-0 hover:bg-surface-raised"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/events/${e.id}`}
                        className="font-medium hover:text-accent"
                      >
                        {title}
                      </Link>
                      {other && other !== title && (
                        <div
                          dir={ar ? 'ltr' : 'rtl'}
                          className="text-xs text-muted"
                          style={{ textAlign: 'start' }}
                        >
                          {other}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-muted">{TYPE_LABEL[e.type][lang]}</div>
                      {e.status === 'changes_requested' && e.reviewNote && (
                        <p
                          className="mt-1 max-w-md truncate text-xs text-danger"
                          title={e.reviewNote}
                        >
                          ↳ {e.reviewNote}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">{e.committeeName[lang]}</td>
                    <td className="px-4 py-3 tabular-nums">
                      <div>{formatDateRange(e.startDate, e.endDate, lang)}</div>
                      <div className="text-xs text-muted">
                        {[
                          formatTimeRange(e.startTime, null),
                          e.locationMode === 'online'
                            ? LOCATION_LABEL.online[lang]
                            : ar
                              ? e.locationAr
                              : e.locationEn || e.locationAr,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone={st.tone}>{st.label[lang]}</Badge>
                        {e.phase && e.status === 'published' && (
                          <Badge tone={PHASE_LABEL[e.phase].tone}>
                            {PHASE_LABEL[e.phase].label[lang]}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Link
                        href={`/dashboard/events/${e.id}`}
                        className="text-sm text-accent underline"
                      >
                        {ar ? 'فتح' : 'Open'}
                      </Link>
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
