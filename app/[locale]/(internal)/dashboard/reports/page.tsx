import { BarChart3 } from 'lucide-react';
import { Card, EmptyState } from '@/components/ui';
import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { Link, redirect } from '@/i18n/navigation';
import { can, committeesWith } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { formatDateRange } from '@/lib/format';
import { getAccess } from '@/modules/access/queries';
import { listCommitteeCards } from '@/modules/committees/queries';
import { ACADEMIC_LABEL, type AcademicStatus } from '@/modules/membership/types';
import { BarList, MonthlyColumns } from '@/modules/reports/components/Charts';
import { PeriodPicker } from '@/modules/reports/components/PeriodPicker';
import { MetricTile } from '@/modules/reports/components/Tiles';
import { monthLabel, pct, small, trend } from '@/modules/reports/format';
import { parsePeriod } from '@/modules/reports/period';
import { getCommunityStats } from '@/modules/reports/queries';

// RPT-001 (screen 22): the community dashboard. Numbers come from SECURITY DEFINER functions that re-check
// reports.view_community, mask groups under five people and never expose individuals.
export default async function ReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  await requireUser('/dashboard/reports');
  const access = await getAccess();
  if (!access) return <Forbidden />;

  // A committee head sees their committee's report, not the community one (RPT-002).
  if (!can(access, 'reports.view_community')) {
    const scoped = committeesWith(access, 'reports.view_committee');
    if (scoped === 'all' || scoped.length === 0) return <Forbidden />;
    if (scoped.length === 1)
      redirect({ href: `/dashboard/reports/committees/${scoped[0]}`, locale });
    const cards = (await listCommitteeCards()).filter((c) => scoped.includes(c.id));
    return (
      <>
        <PageHeader title={ar ? 'تقارير اللجان' : 'Committee reports'} />
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((c) => (
            <Link key={c.id} href={`/dashboard/reports/committees/${c.id}`}>
              <Card className="font-bold transition-colors hover:border-line-accent">
                {c.name[lang]}
              </Card>
            </Link>
          ))}
        </div>
      </>
    );
  }

  const period = parsePeriod(await searchParams);
  const stats = await getCommunityStats(period);
  const vs = ar ? 'عن الفترة السابقة' : 'vs previous period';

  const header = (
    <PageHeader
      title={ar ? 'تقارير المجتمع' : 'Community reports'}
      description={`${ar ? 'الفترة' : 'Period'}: ${formatDateRange(period.from, period.to, lang)}`}
    />
  );

  if (!stats)
    return (
      <>
        {header}
        <PeriodPicker base="/dashboard/reports" period={period} ar={ar} />
        <EmptyState
          icon={<BarChart3 size={36} aria-hidden="true" />}
          title={ar ? 'تعذّر تحميل التقرير' : 'The report could not be loaded'}
          description={
            ar
              ? 'تحقق من الفترة المختارة ثم أعد المحاولة.'
              : 'Check the selected period and try again.'
          }
        />
      </>
    );

  const c = stats.current;
  const p = stats.previous;
  const f = stats.funnel;
  const empty = ar ? 'لا توجد بيانات في هذه الفترة.' : 'No data in this period.';
  const tableLabel = ar ? 'عرض كجدول' : 'View as table';

  return (
    <>
      {header}
      <PeriodPicker base="/dashboard/reports" period={period} ar={ar} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label={ar ? 'الأعضاء النشطون' : 'Active members'}
          value={small(c.activeMembers)}
          trend={trend(c.activeMembers, p.activeMembers)}
          vsLabel={vs}
        />
        <MetricTile
          label={ar ? 'أعضاء جدد' : 'New members'}
          value={small(c.newMembers)}
          trend={trend(c.newMembers, p.newMembers)}
          vsLabel={vs}
        />
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
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <MonthlyColumns
          title={ar ? 'التسجيلات شهريًا' : 'Registrations per month'}
          data={stats.monthly.map((m) => ({
            label: monthLabel(m.month, lang),
            registrations: m.registrations,
            attendance: m.attendance,
          }))}
          tableLabel={tableLabel}
          columnLabels={
            ar ? ['الشهر', 'التسجيلات', 'الحضور'] : ['Month', 'Registrations', 'Attendance']
          }
          empty={empty}
        />
        <BarList
          title={ar ? 'مسار طلبات العضوية' : 'Membership application funnel'}
          data={[
            { label: ar ? 'مُقدَّمة' : 'Submitted', value: f.submitted },
            { label: ar ? 'قيد المراجعة' : 'In review', value: f.inReview },
            { label: ar ? 'مقبولة' : 'Accepted', value: f.accepted },
            { label: ar ? 'مرفوضة' : 'Rejected', value: f.rejected },
            { label: ar ? 'قائمة انتظار' : 'Waitlisted', value: f.waitlisted },
            { label: ar ? 'مسحوبة' : 'Withdrawn', value: f.withdrawn },
          ]}
          tableLabel={tableLabel}
          columnLabels={ar ? ['المرحلة', 'العدد'] : ['Stage', 'Count']}
          empty={empty}
        />
        <BarList
          title={ar ? 'الأعضاء حسب الحالة' : 'Members by status'}
          data={stats.academicStatus.map((b) => ({
            label: ACADEMIC_LABEL[b.key as AcademicStatus]?.[lang] ?? b.key,
            value: b.count,
          }))}
          tableLabel={tableLabel}
          columnLabels={ar ? ['الحالة', 'العدد'] : ['Status', 'Count']}
          empty={empty}
        />
        <BarList
          title={ar ? 'أكثر الجامعات تمثيلًا' : 'Top universities'}
          data={stats.universities.map((b) => ({
            label: b.label?.[lang] ?? b.key,
            value: b.count,
          }))}
          tableLabel={tableLabel}
          columnLabels={ar ? ['الجامعة', 'الأعضاء'] : ['University', 'Members']}
          empty={empty}
        />
      </div>

      <section aria-labelledby="by-committee" className="mt-6">
        <h2 id="by-committee" className="mb-3 text-lg font-bold">
          {ar ? 'حسب اللجنة' : 'By committee'}
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                {(ar
                  ? ['اللجنة', 'فعاليات', 'تسجيلات', 'قبول', 'حضور', 'مقالات']
                  : ['Committee', 'Events', 'Registrations', 'Acceptance', 'Attendance', 'Articles']
                ).map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={`px-4 py-3 font-medium ${i === 0 ? 'text-start' : 'text-end'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.committees.map((cm) => (
                <tr key={cm.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-semibold">
                    <Link
                      href={`/dashboard/reports/committees/${cm.id}?period=${period.kind}${
                        period.kind === 'custom' ? `&from=${period.from}&to=${period.to}` : ''
                      }`}
                      className="text-accent hover:underline"
                    >
                      {ar ? cm.nameAr : (cm.nameEn ?? cm.nameAr)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-end tabular-nums">{cm.metrics.eventsHeld}</td>
                  <td className="px-4 py-3 text-end tabular-nums">{cm.metrics.registrations}</td>
                  <td className="px-4 py-3 text-end tabular-nums">
                    {pct(cm.metrics.acceptanceRate)}
                  </td>
                  <td className="px-4 py-3 text-end tabular-nums">
                    {pct(cm.metrics.attendanceRate)}
                  </td>
                  <td className="px-4 py-3 text-end tabular-nums">
                    {cm.metrics.articlesPublished}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          {ar
            ? 'المجموعات الأقل من 5 أشخاص تظهر «<5» لحماية الخصوصية. النسب غير المحسوبة تظهر «—».'
            : 'Groups under 5 people show "<5" to protect privacy. Rates that cannot be computed show "—".'}
        </p>
      </section>
    </>
  );
}
