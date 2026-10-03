import { notFound } from 'next/navigation';
import { Forbidden } from '@/components/layout/Forbidden';
import { can } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { getAccess } from '@/modules/access/queries';
import { SessionRoster } from '@/modules/attendance/components/SessionRoster';
import { getAttendanceOverview, getSessionRoster } from '@/modules/attendance/queries';
import { getEventDetail } from '@/modules/events/queries';

export default async function SessionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; sessionId: string }>;
}) {
  const { locale, id, sessionId } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  await requireUser(`/dashboard/events/${id}/attendance/${sessionId}`);
  const access = await getAccess();
  const [overview, roster, event] = await Promise.all([
    getAttendanceOverview(id),
    getSessionRoster(sessionId),
    getEventDetail(id),
  ]);
  if (!access || !event) notFound();
  if (!overview || !roster) return <Forbidden />;
  const day = overview.days.find((d) => d.sessionId === sessionId);
  if (!day) notFound();

  return (
    <SessionRoster
      eventId={id}
      sessionId={sessionId}
      eventDateId={day.eventDateId}
      dayLabel={`${ar ? `اليوم ${day.day}` : `Day ${day.day}`} · ${formatDate(day.date, lang)}`}
      status={day.status}
      roster={roster}
      canComplete={can(access, 'events.complete', event.committeeId)}
      live={overview.event.status === 'published'}
    />
  );
}
