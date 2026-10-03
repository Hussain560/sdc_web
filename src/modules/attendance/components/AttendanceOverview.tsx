'use client';

import { CheckCircle2, Lock, QrCode } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Badge, Button, Card, Dialog, StatCard, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { Link, useRouter } from '@/i18n/navigation';
import { formatDate } from '@/lib/format';
import {
  closeSession,
  finalizeEventAttendance,
  finalizeSession,
  issueCertificates,
  openSession,
  resendFailedCertificates,
} from '../actions';
import { SESSION_STATUS_LABEL, type AttendanceOverview, type OverviewDay } from '../types';

type Dlg =
  | null
  | { kind: 'open'; day: OverviewDay }
  | { kind: 'finalize'; day: OverviewDay }
  | { kind: 'event' };

/**
 * Sessions of one event (screen 16 §1): one row per scheduled day with its live count and the next allowed
 * action, then the event sign-off and the certificates panel. The database enforces every rule; the buttons
 * only offer what the current state allows.
 */
export function AttendanceOverviewView({
  overview,
  canComplete,
}: {
  overview: AttendanceOverview;
  canComplete: boolean;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const router = useRouter();
  const toast = useToast();
  const [busy, startTransition] = useTransition();
  const [dialog, setDialog] = useState<Dlg>(null);

  const { event, days } = overview;
  const finalizedCount = days.filter((d) => d.status === 'finalized').length;
  const allFinalized = days.length > 0 && finalizedCount === days.length;
  const eventFinalized = !!event.finalizedAt;
  const live = event.status === 'published';
  const remaining = days.length - finalizedCount;

  const run = (job: () => Promise<{ ok: boolean; message?: string }>, done?: string) =>
    startTransition(async () => {
      const r = await job();
      if (!r.ok) {
        toast.error(r.message ?? '');
        return;
      }
      if (done) toast.success(done);
      setDialog(null);
      router.refresh();
    });

  const open = (day: OverviewDay, confirm = false) =>
    startTransition(async () => {
      const r = await openSession(
        { eventDateId: day.eventDateId, eventId: event.id, confirm },
        { lang },
      );
      if (!r.ok) {
        if (r.code === 'NOT_SESSION_DAY') setDialog({ kind: 'open', day });
        else toast.error(r.message);
        return;
      }
      setDialog(null);
      toast.success(L('فُتحت الجلسة.', 'Session opened.'));
      router.refresh();
    });

  const dayName = (d: OverviewDay) =>
    L(`اليوم ${d.day}`, `Day ${d.day}`) + ' · ' + formatDate(d.date, lang);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={L('المقبولون', 'Accepted')} value={overview.accepted} />
        <StatCard
          label={L('الجلسات المعتمدة', 'Finalized sessions')}
          value={`${finalizedCount}/${days.length}`}
        />
        <StatCard
          label={L('متوسط الحضور', 'Average attendance')}
          value={overview.averagePercent === null ? '—' : `${overview.averagePercent}%`}
          hint={eventFinalized ? undefined : L('بعد اعتماد الحضور', 'After sign-off')}
        />
        <StatCard
          label={L('مؤهلون للشهادة', 'Eligible for a certificate')}
          value={eventFinalized ? overview.eligible : '—'}
          hint={L(`الحد ${overview.threshold}%`, `Threshold ${overview.threshold}%`)}
        />
      </div>

      <section aria-labelledby="sessions-h" className="flex flex-col gap-3">
        <h2 id="sessions-h" className="text-lg font-bold">
          {L('الجلسات', 'Sessions')}
        </h2>
        {days.length === 0 ? (
          <Card className="text-sm text-muted">
            {L('لا توجد أيام مجدولة لهذه الفعالية بعد.', 'This event has no scheduled days yet.')}
          </Card>
        ) : (
          <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {days.map((d) => {
              const st = SESSION_STATUS_LABEL[d.status];
              const detail = d.sessionId
                ? `/dashboard/events/${event.id}/attendance/${d.sessionId}`
                : null;
              return (
                <li key={d.eventDateId} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-48 flex-1">
                    <p className="font-medium">{dayName(d)}</p>
                    {d.sessionId && (
                      <p className="text-xs text-muted tabular-nums">
                        {L(
                          `حضر ${d.present} من ${overview.accepted}`,
                          `${d.present} of ${overview.accepted} present`,
                        )}
                        {d.present > 0 &&
                          ` · QR ${d.qr} · ${L('أونلاين', 'online')} ${d.online} · ${L('يدوي', 'manual')} ${d.manual}`}
                        {d.late && ` · ${L('فُتحت متأخرة', 'opened late')}`}
                      </p>
                    )}
                  </div>
                  <Badge tone={st.tone}>{ar ? st.ar : st.en}</Badge>
                  <div className="flex flex-wrap items-center gap-2">
                    {detail && (
                      <Link
                        href={detail}
                        className="inline-flex min-h-9 items-center rounded-full border border-line px-4 text-sm font-semibold text-muted hover:text-text"
                      >
                        {L('عرض', 'View')}
                      </Link>
                    )}
                    {d.status === 'open' && d.sessionId && (
                      <Link
                        href={`${detail}/qr`}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line-accent px-4 text-sm font-semibold text-accent hover:bg-surface-raised"
                      >
                        <QrCode size={15} aria-hidden="true" />
                        {L('رمز QR', 'QR code')}
                      </Link>
                    )}
                    {live && d.status === 'open' && d.sessionId && (
                      <Button
                        variant="secondary"
                        className="min-h-9 px-4"
                        disabled={busy}
                        onClick={() =>
                          run(
                            () =>
                              closeSession(
                                { sessionId: d.sessionId!, eventId: event.id },
                                { lang },
                              ),
                            L('أُغلقت الجلسة.', 'Session closed.'),
                          )
                        }
                      >
                        {L('إغلاق', 'Close')}
                      </Button>
                    )}
                    {live && d.status === 'closed' && d.sessionId && (
                      <>
                        <Button
                          variant="ghost"
                          className="min-h-9 px-4"
                          disabled={busy}
                          onClick={() => open(d, true)}
                        >
                          {L('إعادة فتح', 'Reopen')}
                        </Button>
                        <Button
                          className="min-h-9 px-4"
                          disabled={busy}
                          onClick={() => setDialog({ kind: 'finalize', day: d })}
                        >
                          {L('اعتماد', 'Finalize')}
                        </Button>
                      </>
                    )}
                    {live && d.status === 'scheduled' && (
                      <Button className="min-h-9 px-4" disabled={busy} onClick={() => open(d)}>
                        {L('فتح الجلسة', 'Open session')}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">
              {L('اعتماد حضور الفعالية', 'Event attendance sign-off')}
            </h2>
            <p className="text-sm text-muted">
              {eventFinalized
                ? L(
                    'اعتُمد الحضور — النسب نهائية ويمكن إكمال الفعالية.',
                    'Attendance is signed off — the percentages are final and the event can be completed.',
                  )
                : L(
                    'اعتمد جميع الجلسات ثم حضور الفعالية لإتاحة الإكمال والشهادات.',
                    'Finalize every session, then the event attendance, to unlock completion and certificates.',
                  )}
            </p>
          </div>
          {eventFinalized ? (
            <Badge tone="accent">
              <CheckCircle2 size={13} aria-hidden="true" className="me-1" />
              {L('مُعتمد', 'Signed off')}
            </Badge>
          ) : (
            canComplete &&
            live && (
              <Button
                disabled={!allFinalized || busy}
                disabledReason={
                  !allFinalized
                    ? L(
                        `${remaining} جلسة متبقية`,
                        `${remaining} session${remaining === 1 ? '' : 's'} left`,
                      )
                    : undefined
                }
                onClick={() => setDialog({ kind: 'event' })}
              >
                {L('اعتماد حضور الفعالية', 'Finalize event attendance')}
              </Button>
            )
          )}
        </div>
        {!canComplete && !eventFinalized && (
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Lock size={13} aria-hidden="true" />
            {L(
              'اعتماد حضور الفعالية لقائد اللجنة أو قائد المجتمع.',
              'Signing off the event is for the committee head or the community leader.',
            )}
          </p>
        )}
      </Card>

      {eventFinalized && overview.certificatesEnabled && (
        <Card className="flex flex-col gap-3" aria-labelledby="certs-h">
          <h2 id="certs-h" className="text-lg font-bold">
            {L('الشهادات', 'Certificates')}
          </h2>
          <p className="text-sm tabular-nums text-muted">
            {L(
              `صدرت ${overview.certificates.issued} · أُرسلت ${overview.certificates.sent} · فشلت ${overview.certificates.failed}`,
              `${overview.certificates.issued} issued · ${overview.certificates.sent} sent · ${overview.certificates.failed} failed`,
            )}
          </p>
          {canComplete && (
            <div className="flex flex-wrap gap-2">
              <Button
                loading={busy}
                onClick={() =>
                  startTransition(async () => {
                    const r = await issueCertificates(event.id, { lang });
                    if (!r.ok) toast.error(r.message);
                    else
                      toast.success(
                        r.data.issued > 0
                          ? L(
                              `صدرت ${r.data.issued} شهادة وجارٍ إرسالها.`,
                              `${r.data.issued} certificates issued; sending now.`,
                            )
                          : L('لا شهادات جديدة لإصدارها.', 'No new certificates to issue.'),
                      );
                    router.refresh();
                  })
                }
              >
                {L('إصدار الشهادات', 'Issue certificates')}
              </Button>
              <Button
                variant="secondary"
                disabled={busy || overview.certificates.failed === 0}
                onClick={() =>
                  startTransition(async () => {
                    const r = await resendFailedCertificates(event.id, { lang });
                    if (!r.ok) toast.error(r.message);
                    else if (r.data.failed > 0)
                      toast.warning(
                        L(
                          `أُرسلت ${r.data.sent} وتعذّرت ${r.data.failed}.`,
                          `${r.data.sent} sent, ${r.data.failed} failed again.`,
                        ),
                      );
                    else
                      toast.success(
                        L(`أُرسلت ${r.data.sent} شهادة.`, `${r.data.sent} certificates sent.`),
                      );
                    router.refresh();
                  })
                }
              >
                {L('إعادة إرسال الفاشلة', 'Resend failed')}
              </Button>
            </div>
          )}
        </Card>
      )}

      <Dialog
        open={dialog?.kind === 'open'}
        onClose={() => setDialog(null)}
        title={L('فتح الجلسة في غير موعدها', 'Open outside its day')}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            {dialog?.kind === 'open' && dayName(dialog.day)}
            <br />
            {L(
              'هذا ليس يوم الجلسة. ستُسجَّل المخالفة في السجل. هل تريد المتابعة؟',
              "This isn't the session's day. It is recorded in the audit log. Continue?",
            )}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialog(null)} disabled={busy}>
              {L('تراجع', 'Back')}
            </Button>
            <Button
              loading={busy}
              onClick={() => dialog?.kind === 'open' && open(dialog.day, true)}
            >
              {L('فتح الجلسة', 'Open the session')}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={dialog?.kind === 'finalize'}
        onClose={() => setDialog(null)}
        title={L('اعتماد الجلسة', 'Finalize the session')}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            {dialog?.kind === 'finalize' &&
              L(
                `سيُسجَّل ${Math.max(overview.accepted - dialog.day.present, 0)} شخصًا غائبين في هذا اليوم، ولن تعود الجلسة قابلة للتعديل إلا بتصحيح موثّق.`,
                `${Math.max(overview.accepted - dialog.day.present, 0)} people will be recorded absent for this day, and the session becomes read-only except for audited corrections.`,
              )}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialog(null)} disabled={busy}>
              {L('تراجع', 'Back')}
            </Button>
            <Button
              loading={busy}
              onClick={() =>
                dialog?.kind === 'finalize' &&
                run(
                  () =>
                    finalizeSession(
                      { sessionId: dialog.day.sessionId!, eventId: event.id },
                      { lang },
                    ),
                  L('اعتُمدت الجلسة.', 'Session finalized.'),
                )
              }
            >
              {L('اعتماد', 'Finalize')}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={dialog?.kind === 'event'}
        onClose={() => setDialog(null)}
        title={L('اعتماد حضور الفعالية', 'Finalize event attendance')}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            {L(
              `ستُحسب نسبة حضور كل من المقبولين (${overview.accepted}) من الجلسات المعتمدة، ويُحدَّد من حضر ومن غاب، وتصبح النسب نهائية. الحد الحالي للشهادة ${overview.threshold}%.`,
              `Each of the ${overview.accepted} accepted registrants gets an attendance percentage from the finalized sessions, attended or absent is decided and the numbers become final. The certificate threshold is ${overview.threshold}%.`,
            )}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialog(null)} disabled={busy}>
              {L('تراجع', 'Back')}
            </Button>
            <Button
              loading={busy}
              onClick={() =>
                startTransition(async () => {
                  const r = await finalizeEventAttendance(event.id, { lang });
                  if (!r.ok) {
                    toast.error(r.message);
                    return;
                  }
                  setDialog(null);
                  toast.success(
                    L(
                      `اعتُمد الحضور: ${r.data.attended} حضروا، ${r.data.absent} غابوا، ${r.data.eligible} مؤهلون للشهادة.`,
                      `Attendance signed off: ${r.data.attended} attended, ${r.data.absent} absent, ${r.data.eligible} eligible.`,
                    ),
                  );
                  router.refresh();
                })
              }
            >
              {L('اعتماد', 'Finalize')}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
