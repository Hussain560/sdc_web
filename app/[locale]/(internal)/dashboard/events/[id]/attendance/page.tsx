import { notFound } from 'next/navigation';
import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs } from '@/components/ui';
import { can } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { getAccess } from '@/modules/access/queries';
import { AttendanceOverviewView } from '@/modules/attendance/components/AttendanceOverview';
import { getAttendanceOverview } from '@/modules/attendance/queries';
import { eventTitleOf } from '@/modules/attendance/types';
import { getEventDetail } from '@/modules/events/queries';

// REG-006 (screen 16): sessions of one event, sign-off and certificates. Permission: registrations.attendance in scope.
export default async function AttendancePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  await requireUser(`/dashboard/events/${id}/attendance`);
  const access = await getAccess();
  const [overview, event] = await Promise.all([getAttendanceOverview(id), getEventDetail(id)]);
  if (!access || !event) notFound();
  if (!overview) return <Forbidden />;
  if (!['published', 'completed'].includes(event.status)) return <Forbidden />;

  return (
    <>
      <PageHeader
        title={eventTitleOf(overview.event, lang)}
        description={
          ar
            ? 'جلسات الحضور لكل يوم، واعتماد الحضور، والشهادات.'
            : 'Attendance sessions per day, sign-off and certificates.'
        }
      />
      <Tabs
        label={ar ? 'أقسام الفعالية' : 'Event sections'}
        active="attendance"
        items={[
          {
            key: 'overview',
            label: ar ? 'نظرة عامة' : 'Overview',
            href: `/dashboard/events/${id}`,
          },
          {
            key: 'attendance',
            label: ar ? 'الحضور' : 'Attendance',
            href: `/dashboard/events/${id}/attendance`,
          },
        ]}
      />
      <AttendanceOverviewView
        overview={overview}
        canComplete={can(access, 'events.complete', event.committeeId)}
      />
    </>
  );
}
