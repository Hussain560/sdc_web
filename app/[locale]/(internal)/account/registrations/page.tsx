import { Badge, Card, EmptyState } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { requireUser } from '@/lib/auth/session';
import { formatDateRange, formatTimeRange } from '@/lib/format';
import { CancelMyRegistration } from '@/modules/registrations/components/CancelMyRegistration';
import { REGISTRATION_STATUS_LABEL } from '@/modules/registrations/labels';
import { getMyRegistrations } from '@/modules/registrations/queries';
import { CalendarCheck } from 'lucide-react';

// REG-003: everything the person registered for, with the group link once accepted. Ownership rule — no permission key.
export default async function MyRegistrationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  await requireUser('/account/registrations');
  const rows = await getMyRegistrations();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">{ar ? 'تسجيلاتي' : 'My registrations'}</h1>
      {rows.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck size={36} aria-hidden="true" />}
          title={ar ? 'لم تسجّل في أي فعالية بعد' : 'You have not registered for any event yet'}
          action={
            <Link
              href="/events"
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-on-accent"
            >
              {ar ? 'تصفّح الفعاليات' : 'Browse events'}
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => {
            const st = REGISTRATION_STATUS_LABEL[r.status];
            const title = ar ? r.titleAr : r.titleEn || r.titleAr;
            const canCancel =
              ['pending', 'accepted', 'waitlisted'].includes(r.status) &&
              r.eventStatus === 'published';
            return (
              <li key={r.id}>
                <Card className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/events/${r.slug}`}
                        className="text-lg font-bold hover:text-accent"
                      >
                        {title}
                      </Link>
                      <p className="mt-1 text-sm text-muted tabular-nums">
                        {r.startDate
                          ? formatDateRange(r.startDate, r.endDate, lang)
                          : ar
                            ? 'يُعلن لاحقًا'
                            : 'To be announced'}
                        {r.startTime ? ` · ${formatTimeRange(r.startTime, null)}` : ''}
                      </p>
                    </div>
                    <Badge tone={st.tone}>{st.label[lang]}</Badge>
                  </div>
                  {r.status === 'accepted' && (r.groupLink || r.meetingUrl) && (
                    <div className="flex flex-wrap gap-3 text-sm">
                      {r.groupLink && (
                        <a
                          href={r.groupLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent underline"
                        >
                          {ar ? 'مجموعة الفعالية' : 'Event group'}
                        </a>
                      )}
                      {r.meetingUrl && (
                        <a
                          href={r.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent underline"
                        >
                          {ar ? 'رابط الحضور' : 'Meeting link'}
                        </a>
                      )}
                    </div>
                  )}
                  {r.status === 'pending' && (
                    <p className="text-sm text-muted">
                      {ar
                        ? 'طلبك قيد المراجعة، وسيصلك بريد عند اتخاذ القرار.'
                        : 'Your request is under review. You will get an e-mail with the decision.'}
                    </p>
                  )}
                  {r.status === 'waitlisted' && (
                    <p className="text-sm text-muted">
                      {ar
                        ? 'أنت على قائمة الانتظار وسنخبرك عند توفّر مقعد.'
                        : 'You are on the waiting list; we will tell you when a seat opens.'}
                    </p>
                  )}
                  {r.attendancePercent !== null && (
                    <p className="text-sm tabular-nums text-muted">
                      {ar
                        ? `نسبة حضورك: ${r.attendancePercent}%`
                        : `Your attendance: ${r.attendancePercent}%`}
                    </p>
                  )}
                  {r.certificateId && (
                    <div className="flex flex-wrap gap-3 text-sm">
                      <Link
                        href={`/certificates/${r.certificateId}`}
                        className="text-accent underline"
                      >
                        {ar ? 'عرض الشهادة والتحقق منها' : 'View and verify the certificate'}
                      </Link>
                      <a
                        href={`/api/certificates/${r.certificateId}/pdf`}
                        className="text-accent underline"
                      >
                        {ar ? 'تنزيل PDF' : 'Download PDF'}
                      </a>
                    </div>
                  )}
                  {canCancel && (
                    <div>
                      <CancelMyRegistration id={r.id} title={title} />
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
