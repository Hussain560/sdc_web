import { notFound } from 'next/navigation';
import { Forbidden } from '@/components/layout/Forbidden';
import { requireUser } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { QrDisplay } from '@/modules/attendance/components/QrDisplay';
import { getAttendanceOverview } from '@/modules/attendance/queries';
import { eventTitleOf } from '@/modules/attendance/types';

export default async function QrPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; sessionId: string }>;
}) {
  const { locale, id, sessionId } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  await requireUser(`/dashboard/events/${id}/attendance/${sessionId}/qr`);
  const overview = await getAttendanceOverview(id);
  if (!overview) return <Forbidden />;
  const day = overview.days.find((d) => d.sessionId === sessionId);
  if (!day) notFound();
  if (day.status !== 'open') return <Forbidden />;

  return (
    <QrDisplay
      sessionId={sessionId}
      eventId={id}
      slug={overview.event.slug}
      title={eventTitleOf(overview.event, lang)}
      dayLabel={`${lang === 'ar' ? `اليوم ${day.day}` : `Day ${day.day}`} · ${formatDate(day.date, lang)}`}
    />
  );
}
