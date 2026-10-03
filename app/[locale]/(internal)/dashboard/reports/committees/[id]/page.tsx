import { notFound } from 'next/navigation';
import { Badge, EmptyState } from '@/components/ui';
import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { Link } from '@/i18n/navigation';
import { can } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { formatDate, formatDateRange } from '@/lib/format';
import { getAccess } from '@/modules/access/queries';
import { PeriodPicker } from '@/modules/reports/components/PeriodPicker';
import { MetricTile } from '@/modules/reports/components/Tiles';
import { pct, small, trend } from '@/modules/reports/format';
import { parsePeriod } from '@/modules/reports/period';
import { getCommitteeStats } from '@/modules/reports/queries';

// RPT-002 (screen 22 §2): one committee's numbers and the events behind them.
export default async function CommitteeReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const { locale, id } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  await requireUser(`/dashboard/reports/committees/${id}`);
  const access = await getAccess();
  if (
    !access ||
    !(can(access, 'reports.view_committee', id) || can(access, 'reports.view_community'))
  )
    return <Forbidden />;

  const period = parsePeriod(await searchParams);
  const stats = await getCommitteeStats(id, period);
  if (!stats) notFound();

  const base = `/dashboard/reports/committees/${id}`;
  const c = stats.current;
  const p = stats.previous;
  const vs = ar ? 'عن الفترة السابقة' : 'vs previous period';
  const name = ar ? stats.committee.nameAr : (stats.committee.nameEn ?? stats.committee.nameAr);

  return (
    <>
      <PageHeader
        title={ar ? `تقرير ${name}` : `${name} report`}
        description={`${ar ? 'الفترة' : 'Period'}: ${formatDateRange(period.from, period.to, lang)}`}
        action={
          can(access, 'reports.view_community') ? (
            <Link
              href="/dashboard/reports"
              className="inline-flex min-h-10 items-center rounded-full border border-line px-4 text-sm font-semibold text-muted hover:text-text"
            >
              {ar ? 'تقارير المجتمع' : 'Community reports'}
            </Link>
          ) : undefined
        }
      />
      <PeriodPicker base={base} period={period} ar={ar} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label={ar ? 'فعاليات أُقيمت' : 'Events held'}
          value={String(c.eventsHeld)}
          trend={trend(c.eventsHeld, p.eventsHeld)}
          vsLabel={vs}
        />
        <MetricTile
          label={ar ? 'التسجيلات' : 'Registrations'}
          value={String(c.registrations)}
          trend={trend(c.registrations, p.registrations)}
          vsLabel={vs}
        />
        <MetricTile
          label={ar ? 'نسبة القبول' : 'Acceptance rate'}
          value={pct(c.acceptanceRate)}
          trend={trend(c.acceptanceRate, p.acceptanceRate, 'pp')}
          note={ar ? 'لا تسجيلات بعد' : 'No registrations yet'}
          vsLabel={vs}
        />
        <MetricTile
          label={ar ? 'نسبة الحضور' : 'Attendance rate'}
          value={pct(c.attendanceRate)}
          trend={trend(c.attendanceRate, p.attendanceRate, 'pp')}
          note={ar ? 'لم تُسجَّل جلسات حضور' : 'No attendance recorded'}
          vsLabel={vs}
        />
        <MetricTile
          label={ar ? 'حصة الأعضاء من التسجيلات' : 'Member share of registrations'}
          value={pct(c.memberShare)}
        />
        <MetricTile
          label={ar ? 'مقالات منشورة' : 'Articles published'}
          value={String(c.articlesPublished)}
          trend={trend(c.articlesPublished, p.articlesPublished)}
          vsLabel={vs}
        />
        <MetricTile
          label={ar ? 'شهادات صدرت' : 'Certificates issued'}
          value={String(c.certificatesSent)}
          trend={trend(c.certificatesSent, p.certificatesSent)}
          vsLabel={vs}
        />
        <MetricTile
          label={ar ? 'مناصب اللجنة الحالية' : 'Current committee positions'}
          value={small(c.committeeSize)}
        />
      </div>

      <section aria-labelledby="events-h" className="mt-6">
        <h2 id="events-h" className="mb-3 text-lg font-bold">
          {ar ? 'الفعاليات في هذه الفترة' : 'Events in this period'}
        </h2>
        {stats.events.length === 0 ? (
          <EmptyState title={ar ? 'لا توجد فعاليات في هذه الفترة' : 'No events in this period'} />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-line text-xs text-muted">
                <tr>
                  {(ar
                    ? ['الفعالية', 'التاريخ', 'التسجيلات', 'المقبولون', 'الحضور']
                    : ['Event', 'Date', 'Registrations', 'Accepted', 'Attendance']
                  ).map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={`px-4 py-3 font-medium ${i < 2 ? 'text-start' : 'text-end'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.events.map((e) => (
                  <tr key={e.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/events/${e.id}`}
                        className="font-semibold text-accent hover:underline"
                      >
                        {ar ? e.titleAr : (e.titleEn ?? e.titleAr)}
                      </Link>
                      {e.status === 'cancelled' && (
                        <Badge tone="danger" className="ms-2">
                          {ar ? 'ملغاة' : 'Cancelled'}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(e.lastDate, lang)}</td>
                    <td className="px-4 py-3 text-end tabular-nums">{e.registrations}</td>
                    <td className="px-4 py-3 text-end tabular-nums">{e.accepted}</td>
                    <td className="px-4 py-3 text-end tabular-nums">{pct(e.attendance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
