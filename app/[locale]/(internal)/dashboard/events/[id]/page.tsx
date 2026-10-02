import { Lock } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Alert, Badge, Card, Tabs } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { requireUser } from '@/lib/auth/session';
import { todayInRiyadh } from '@/lib/time';
import { formatDate, formatDateRange, formatRelative, formatTimeRange } from '@/lib/format';
import { getAccess } from '@/modules/access/queries';
import { EventActions } from '@/modules/events/components/EventActions';
import { EventPreviewCard } from '@/modules/events/components/EventPreviewCard';
import { Timeline } from '@/modules/events/components/Timeline';
import { eventPerms } from '@/modules/events/permissions';
import { getEventDetail, getEventHistory } from '@/modules/events/queries';
import { LOCATION_LABEL, PHASE_LABEL, STATUS_LABEL, TYPE_LABEL } from '@/modules/events/types';

const ACTION_LABEL: Record<string, { ar: string; en: string }> = {
  'event.created': { ar: 'أُنشئت', en: 'Created' },
  'event.updated': { ar: 'عُدّلت', en: 'Edited' },
  'event.submitted': { ar: 'أُرسلت للاعتماد', en: 'Submitted for review' },
  'event.withdrawn': { ar: 'سُحب الطلب', en: 'Request withdrawn' },
  'event.approved': { ar: 'اعتُمدت ونُشرت', en: 'Approved and published' },
  'event.changes_requested': { ar: 'طُلبت تعديلات', en: 'Changes requested' },
  'event.cancelled': { ar: 'أُلغيت', en: 'Cancelled' },
  'event.completed': { ar: 'اكتملت', en: 'Completed' },
  'event.archived': { ar: 'أُرشفت', en: 'Archived' },
};

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale, id } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  await requireUser(`/dashboard/events/${id}`);
  const [access, event] = await Promise.all([getAccess(), getEventDetail(id)]);
  if (!access || !event) notFound();

  const sp = await searchParams;
  const tab = sp.tab === 'history' ? 'history' : 'overview';
  const perms = eventPerms(access, event.committeeId);
  const f = event.form;
  const st = STATUS_LABEL[event.status];
  const lastDate =
    f.scheduleType === 'specific_dates'
      ? (f.dates.at(-1) ?? null)
      : f.endDate || f.startDate || null;
  const hasEnded = lastDate !== null && lastDate < todayInRiyadh();
  const history = tab === 'history' ? await getEventHistory(id) : [];
  const title = ar ? f.titleAr : f.titleEn || f.titleAr;
  const other = ar ? f.titleEn : f.titleAr;

  const checklist = [
    {
      ok: !!f.titleAr && !!f.titleEn,
      label: ar ? 'العنوان بالعربية والإنجليزية' : 'Title in Arabic and English',
    },
    { ok: !!f.descriptionAr, label: ar ? 'الوصف' : 'Description' },
    { ok: !!f.startDate || f.dates.length > 0, label: ar ? 'الموعد' : 'Schedule' },
    { ok: !!f.groupLink, label: ar ? 'رابط المجموعة' : 'Group link' },
    {
      ok: f.goals.some((g) => g.ar.trim()),
      label: ar ? 'هدف عربي واحد على الأقل' : 'At least one Arabic goal',
    },
    { ok: !!f.coverImagePath, label: ar ? 'صورة الغلاف' : 'Cover image' },
  ];

  const start = f.scheduleType === 'specific_dates' ? (f.dates[0] ?? null) : f.startDate || null;
  const end =
    f.scheduleType === 'specific_dates'
      ? (f.dates.at(-1) ?? null)
      : f.scheduleType === 'consecutive_range'
        ? f.endDate || null
        : null;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-extrabold">
            {title}
            <Badge tone={st.tone}>{st.label[lang]}</Badge>
            {event.phase && event.status === 'published' && (
              <Badge tone={PHASE_LABEL[event.phase].tone}>
                {PHASE_LABEL[event.phase].label[lang]}
              </Badge>
            )}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {other && <span dir={ar ? 'ltr' : 'rtl'}>{other} · </span>}
            {event.committeeName[lang]} · {TYPE_LABEL[f.type][lang]}
          </p>
        </div>
        <EventActions id={event.id} status={event.status} perms={perms} hasEnded={hasEnded} />
      </div>

      <Card className="mb-4">
        <Timeline event={event} lang={lang} />
        {event.status === 'pending_review' && event.submittedAt && (
          <p className="mt-2 text-sm text-muted">
            {ar ? 'بانتظار الاعتماد منذ ' : 'Waiting for approval since '}
            {formatRelative(event.submittedAt, lang)}
          </p>
        )}
      </Card>

      {event.status === 'changes_requested' && event.reviewNote && (
        <Alert tone="warning" className="mb-4">
          <strong>{ar ? 'ملاحظات المراجِع: ' : 'Reviewer notes: '}</strong>
          {event.reviewNote}
          {perms.edit && (
            <Link href={`/dashboard/events/${event.id}/edit`} className="ms-3 underline">
              {ar ? 'تعديل وإعادة الإرسال' : 'Edit & resubmit'}
            </Link>
          )}
        </Alert>
      )}
      {event.status === 'cancelled' && (
        <Alert tone="danger" className="mb-4">
          <strong>{ar ? 'أُلغيت الفعالية: ' : 'Event cancelled: '}</strong>
          {event.cancelReason}
        </Alert>
      )}

      <Tabs
        label={ar ? 'أقسام الفعالية' : 'Event sections'}
        active={tab}
        items={[
          { key: 'overview', label: ar ? 'نظرة عامة' : 'Overview', href: '?tab=overview' },
          { key: 'history', label: ar ? 'السجل' : 'History', href: '?tab=history' },
        ]}
      />

      {tab === 'overview' ? (
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <Card className="flex flex-col gap-3 text-sm">
              <h2 className="text-base font-bold">{ar ? 'معلومات' : 'Details'}</h2>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                <dt className="text-muted">{ar ? 'النوع' : 'Type'}</dt>
                <dd>{TYPE_LABEL[f.type][lang]}</dd>
                <dt className="text-muted">{ar ? 'الموعد' : 'Date'}</dt>
                <dd className="tabular-nums">
                  {formatDateRange(start, end, lang)}{' '}
                  {formatTimeRange(f.startTime, f.endTime) &&
                    `· ${formatTimeRange(f.startTime, f.endTime)}`}
                </dd>
                <dt className="text-muted">{ar ? 'الحضور' : 'Mode'}</dt>
                <dd>
                  {LOCATION_LABEL[f.locationMode][lang]}
                  {(ar ? f.locationAr : f.locationEn || f.locationAr) &&
                    ` · ${ar ? f.locationAr : f.locationEn || f.locationAr}`}
                </dd>
                <dt className="text-muted">{ar ? 'التسجيل' : 'Registration'}</dt>
                <dd className="tabular-nums">
                  {f.registrationStartAt
                    ? f.registrationStartAt.replace('T', ' ')
                    : ar
                      ? 'عند النشر'
                      : 'At publish'}{' '}
                  →{' '}
                  {f.registrationEndAt
                    ? f.registrationEndAt.replace('T', ' ')
                    : ar
                      ? 'نهاية اليوم الأول'
                      : 'end of day 1'}
                </dd>
                <dt className="text-muted">{ar ? 'السعة' : 'Seats'}</dt>
                <dd>
                  {f.seats || (ar ? 'غير محدود' : 'Unlimited')} ·{' '}
                  {f.requiresApproval ? (ar ? 'بموافقة' : 'approval') : ar ? 'تلقائي' : 'automatic'}
                </dd>
                <dt className="text-muted">{ar ? 'الجمهور' : 'Audience'}</dt>
                <dd>
                  {f.audience === 'public'
                    ? ar
                      ? 'عام'
                      : 'Public'
                    : ar
                      ? 'للأعضاء فقط'
                      : 'Members only'}
                </dd>
                <dt className="text-muted">{ar ? 'الرابط' : 'Slug'}</dt>
                <dd dir="ltr" style={{ textAlign: 'start' }}>
                  {f.slug}
                </dd>
              </dl>
            </Card>

            {event.canSeePrivate && (
              <Card className="flex flex-col gap-2 text-sm">
                <h2 className="flex items-center gap-2 text-base font-bold">
                  <Lock size={16} aria-hidden="true" /> {ar ? 'تفاصيل خاصة' : 'Private details'}
                </h2>
                <dl className="grid gap-2">
                  <div>
                    <dt className="text-muted">{ar ? 'رابط المجموعة' : 'Group link'}</dt>
                    <dd dir="ltr" className="break-all" style={{ textAlign: 'start' }}>
                      {f.groupLink || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">{ar ? 'رابط اللقاء' : 'Meeting link'}</dt>
                    <dd dir="ltr" className="break-all" style={{ textAlign: 'start' }}>
                      {f.meetingUrl || '—'}
                    </dd>
                  </div>
                  {f.meetingNotes && (
                    <div>
                      <dt className="text-muted">{ar ? 'ملاحظات اللقاء' : 'Meeting notes'}</dt>
                      <dd>{f.meetingNotes}</dd>
                    </div>
                  )}
                  {event.privateNotes && (
                    <div>
                      <dt className="text-muted">{ar ? 'ملاحظات المنظّمين' : 'Organizer notes'}</dt>
                      <dd>{event.privateNotes}</dd>
                    </div>
                  )}
                </dl>
              </Card>
            )}

            {(f.contactEmail || f.contactPhone) && (
              <Card className="flex flex-col gap-1 text-sm">
                <h2 className="text-base font-bold">{ar ? 'التواصل' : 'Contact'}</h2>
                {f.contactEmail && (
                  <p dir="ltr" style={{ textAlign: 'start' }}>
                    {f.contactEmail}
                  </p>
                )}
                {f.contactPhone && (
                  <p dir="ltr" style={{ textAlign: 'start' }}>
                    {f.contactPhone}
                  </p>
                )}
              </Card>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="max-w-md">
              <h2 className="mb-2 text-base font-bold">{ar ? 'معاينة البطاقة' : 'Card preview'}</h2>
              <EventPreviewCard values={f} lang={lang} coverUrl={event.coverUrl} />
            </div>
            <Card>
              <h2 className="mb-3 text-base font-bold">
                {ar ? 'اكتمال المحتوى' : 'Content completeness'}
              </h2>
              <ul className="grid gap-2 text-sm sm:grid-cols-2">
                {checklist.map((c) => (
                  <li key={c.label} className="flex items-center gap-2">
                    <span aria-hidden="true" className={c.ok ? 'text-accent' : 'text-warning'}>
                      {c.ok ? '✓' : '⚠'}
                    </span>
                    <span className="sr-only">
                      {c.ok ? (ar ? 'مكتمل: ' : 'Done: ') : ar ? 'ناقص: ' : 'Missing: '}
                    </span>
                    {c.label}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      ) : history.length === 0 ? (
        <Card className="text-center text-muted">
          {ar ? 'لا يوجد سجل بعد.' : 'No history yet.'}
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b border-line bg-surface-raised text-xs text-muted">
              <tr>
                {[
                  ar ? 'الوقت' : 'Time',
                  ar ? 'الإجراء' : 'Action',
                  ar ? 'بواسطة' : 'By',
                  ar ? 'ملاحظة' : 'Note',
                ].map((h) => (
                  <th key={h} scope="col" className="px-4 py-2.5 text-start text-xs font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr
                  key={i}
                  className="border-b border-line align-middle transition-colors last:border-0 hover:bg-surface-raised"
                >
                  <td className="px-4 py-3 tabular-nums">{formatDate(h.occurredAt, lang)}</td>
                  <td className="px-4 py-3">
                    {ACTION_LABEL[h.action]?.[lang] ?? h.action}
                    {h.from && h.to && h.from !== h.to && (
                      <div className="text-xs text-muted">
                        {STATUS_LABEL[h.from as keyof typeof STATUS_LABEL]?.label[lang] ?? h.from} →{' '}
                        {STATUS_LABEL[h.to as keyof typeof STATUS_LABEL]?.label[lang] ?? h.to}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">{h.actor ?? '—'}</td>
                  <td className="px-4 py-3">{h.note ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
