'use client';

import { Check, CheckCircle2, ListChecks, Lock, QrCode, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Dialog,
  IconAction,
  StatCard,
  Textarea,
  useToast,
} from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { Link, useRouter } from '@/i18n/navigation';
import { formatDate } from '@/lib/format';
import {
  closeSession,
  correctAttendance,
  finalizeEventAttendance,
  finalizeSession,
  getSessionLive,
  openSession,
  recordAttendance,
} from '../actions';
import {
  METHOD_LABEL,
  SESSION_STATUS_LABEL,
  type AttendanceOverview,
  type OverviewDay,
  type RosterRow,
  type SessionLive,
} from '../types';
import { QrPanel } from './QrPanel';

type Filter = 'all' | 'present' | 'absent';
type Dlg = null | 'finalize' | 'event' | 'open-late';

/**
 * The Attendance tab of an event (KFUCS parity): a day selector, the live numbers of the selected day, then either
 * the attendance list (manual marking by the committee or the presenter) or the QR screen. While a session is open
 * the numbers and the list follow the check-ins live. The database enforces every rule; the buttons only offer
 * what the current state allows.
 */
export function AttendanceTab({
  eventId,
  slug,
  title,
  overview,
  day,
  roster,
  view,
  canComplete,
}: {
  eventId: string;
  slug: string;
  title: string;
  overview: AttendanceOverview;
  /** The selected day (always one of overview.days). */
  day: OverviewDay;
  roster: RosterRow[] | null;
  view: 'list' | 'qr';
  canComplete: boolean;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const router = useRouter();
  const toast = useToast();
  const [busy, startTransition] = useTransition();
  const [dialog, setDialog] = useState<Dlg>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [fix, setFix] = useState<null | { row: RosterRow; present: boolean }>(null);
  const [reason, setReason] = useState('');
  const [live, setLive] = useState<SessionLive | null>(null);
  const [connected, setConnected] = useState(true);

  const { days, event } = overview;
  const publishedEvent = event.status === 'published';
  const status = day.status;
  const sessionId = day.sessionId;
  const open = status === 'open' && !!sessionId;
  const editable = publishedEvent && status !== 'finalized' && !!sessionId;
  const finalizedCount = days.filter((d) => d.status === 'finalized').length;
  const allFinalized = days.length > 0 && finalizedCount === days.length;
  const eventFinalized = !!event.finalizedAt;
  const remaining = days.length - finalizedCount;
  const list = roster ?? [];
  const presentInList = list.filter((r) => r.present).length;
  const dayName = (d: OverviewDay) =>
    L(`اليوم ${d.day}`, `Day ${d.day}`) + ' · ' + formatDate(d.date, lang);
  const base = `/dashboard/events/${eventId}?tab=attendance`;

  // Live numbers while the session is open: poll every 4 s; when the list is behind, refresh it.
  const lastPresent = useRef(presentInList);
  useEffect(() => {
    lastPresent.current = presentInList;
  }, [presentInList]);
  useEffect(() => {
    if (!open || !sessionId) return;
    let alive = true;
    const poll = async () => {
      const r = await getSessionLive(sessionId);
      if (!alive) return;
      setConnected(!!r);
      if (!r) return;
      setLive(r);
      if (r.present !== lastPresent.current) {
        lastPresent.current = r.present;
        router.refresh();
      }
    };
    void poll();
    const t = setInterval(poll, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [open, sessionId, router]);

  const numbers = open && live ? live : null;
  const present = numbers?.present ?? day.present;
  const total = numbers?.total ?? overview.accepted;
  const methods = numbers
    ? { qr: numbers.qr, online: numbers.online, manual: numbers.manual }
    : { qr: day.qr, online: day.online, manual: day.manual };
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  const rows = useMemo(
    () =>
      list.filter(
        (r) =>
          (filter === 'all' || (filter === 'present' ? r.present : !r.present)) &&
          `${r.fullName} ${r.email}`.toLowerCase().includes(q.trim().toLowerCase()),
      ),
    [list, filter, q],
  );
  const markable = rows.filter((r) => !r.present);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

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

  const openDay = (confirm = false) =>
    startTransition(async () => {
      const r = await openSession({ eventDateId: day.eventDateId, eventId, confirm }, { lang });
      if (!r.ok) {
        if (r.code === 'NOT_SESSION_DAY') setDialog('open-late');
        else toast.error(r.message);
        return;
      }
      setDialog(null);
      toast.success(L('فُتحت الجلسة.', 'Session opened.'));
      router.refresh();
    });

  const mark = (ids: string[], presentFlag = true) =>
    startTransition(async () => {
      if (!sessionId) return;
      const r = await recordAttendance(
        { sessionId, eventId, registrationIds: ids, present: presentFlag },
        { lang },
      );
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      setSelected(new Set());
      toast.success(
        presentFlag
          ? L(`سُجّل حضور ${r.data.changed}.`, `${r.data.changed} marked present.`)
          : L('أُلغي التسجيل اليدوي.', 'Manual mark removed.'),
      );
      router.refresh();
    });

  const st = SESSION_STATUS_LABEL[status];
  const viewLink = (v: 'list' | 'qr') => `${base}&day=${day.eventDateId}&view=${v}`;

  return (
    <div className="flex flex-col gap-5">
      {/* Day selector */}
      <nav aria-label={L('أيام الفعالية', 'Event days')} className="flex flex-wrap gap-2">
        {days.map((d) => {
          const s = SESSION_STATUS_LABEL[d.status];
          const active = d.eventDateId === day.eventDateId;
          return (
            <Link
              key={d.eventDateId}
              href={`${base}&day=${d.eventDateId}`}
              aria-current={active ? 'true' : undefined}
              className={`flex min-w-32 flex-col rounded-xl border px-4 py-2 text-sm transition-colors ${
                active
                  ? 'border-line-accent bg-surface-raised'
                  : 'border-line hover:border-line-accent'
              }`}
            >
              <span className="font-semibold">{dayName(d)}</span>
              <span className="text-xs text-muted">{ar ? s.ar : s.en}</span>
            </Link>
          );
        })}
      </nav>

      {/* Session bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-bold">{dayName(day)}</h2>
          <Badge tone={st.tone}>{ar ? st.ar : st.en}</Badge>
          {day.late && <Badge tone="warning">{L('فُتحت متأخرة', 'Opened late')}</Badge>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {publishedEvent && status === 'scheduled' && (
            <Button loading={busy} onClick={() => openDay()}>
              {L('فتح الجلسة', 'Open session')}
            </Button>
          )}
          {publishedEvent && status === 'open' && sessionId && (
            <Button
              variant="secondary"
              loading={busy}
              onClick={() =>
                run(
                  () => closeSession({ sessionId, eventId }, { lang }),
                  L('أُغلقت الجلسة.', 'Session closed.'),
                )
              }
            >
              {L('إغلاق الجلسة', 'Close session')}
            </Button>
          )}
          {publishedEvent && status === 'closed' && sessionId && (
            <>
              <Button variant="ghost" loading={busy} onClick={() => openDay(true)}>
                {L('إعادة فتح', 'Reopen')}
              </Button>
              <Button loading={busy} onClick={() => setDialog('finalize')}>
                {L('اعتماد الجلسة', 'Finalize session')}
              </Button>
            </>
          )}
        </div>
      </div>

      {!sessionId ? (
        <Card className="text-sm text-muted">
          {L(
            'لم تُفتح جلسة هذا اليوم بعد. افتحها ليظهر رمز QR وقائمة الحضور.',
            'No session has been opened for this day yet. Open it to get the QR code and the attendance list.',
          )}
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={L('حضروا', 'Checked in')} value={present} />
            <StatCard
              label={L('لم يحضروا بعد', 'Remaining')}
              value={Math.max(total - present, 0)}
              hint={L(`المسجّلون: ${total}`, `Registered: ${total}`)}
            />
            <StatCard label={L('نسبة اليوم', 'Daily rate')} value={`${rate}%`} />
            <StatCard
              label={L('نسبة الفعالية', 'Event overall')}
              value={overview.averagePercent === null ? '—' : `${overview.averagePercent}%`}
              hint={eventFinalized ? undefined : L('بعد اعتماد الحضور', 'After sign-off')}
            />
          </div>

          {present > 0 && (
            <div className="rounded-xl border border-line bg-surface p-4">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted">
                {L('طرق التسجيل', 'Check-in methods')}
                {open && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-line-accent px-2 py-0.5 text-[10px] text-accent">
                    <span className="size-1.5 animate-pulse rounded-full bg-accent" />
                    {L('مباشر', 'Live')}
                  </span>
                )}
              </p>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-raised">
                {(['qr', 'manual', 'online'] as const).map((m) =>
                  methods[m] > 0 ? (
                    <div
                      key={m}
                      className={
                        m === 'qr' ? 'bg-accent' : m === 'manual' ? 'bg-warning' : 'bg-muted'
                      }
                      style={{ width: `${(methods[m] / present) * 100}%` }}
                      title={`${METHOD_LABEL[m][lang]}: ${methods[m]}`}
                    />
                  ) : null,
                )}
              </div>
              <p className="mt-2 flex flex-wrap gap-4 text-xs tabular-nums text-muted">
                <span>QR {methods.qr}</span>
                <span>
                  {L('يدوي', 'Manual')} {methods.manual}
                </span>
                <span>
                  {L('أونلاين', 'Online')} {methods.online}
                </span>
              </p>
            </div>
          )}

          <div
            className="flex gap-2"
            role="tablist"
            aria-label={L('عرض الحضور', 'Attendance view')}
          >
            <Link
              href={viewLink('list')}
              role="tab"
              aria-selected={view === 'list' || !open}
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold ${
                view === 'list' || !open
                  ? 'border-line-accent bg-surface-raised text-accent'
                  : 'border-line text-muted hover:text-text'
              }`}
            >
              <ListChecks size={15} aria-hidden="true" />
              {L('قائمة الحضور', 'Attendance list')}
            </Link>
            {open && (
              <Link
                href={viewLink('qr')}
                role="tab"
                aria-selected={view === 'qr'}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold ${
                  view === 'qr'
                    ? 'border-line-accent bg-surface-raised text-accent'
                    : 'border-line text-muted hover:text-text'
                }`}
              >
                <QrCode size={15} aria-hidden="true" />
                {L('عرض QR', 'QR display')}
              </Link>
            )}
          </div>

          {open && view === 'qr' ? (
            <QrPanel
              sessionId={sessionId}
              slug={slug}
              title={title}
              dayLabel={dayName(day)}
              live={live}
              connected={connected}
            />
          ) : (
            <section
              className="flex flex-col gap-3"
              aria-label={L('قائمة الحضور', 'Attendance list')}
            >
              {status === 'finalized' && (
                <p
                  className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted"
                  role="note"
                >
                  <Lock size={15} aria-hidden="true" />
                  {L(
                    'الجلسة مُعتمدة — التصحيح يتطلب صلاحية إكمال الفعالية ويُسجَّل مع السبب.',
                    'The session is finalized — corrections need the complete-event permission and are logged with a reason.',
                  )}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={L('ابحث بالاسم أو البريد…', 'Search by name or e-mail…')}
                  aria-label={L('بحث', 'Search')}
                  className="h-9 w-60 rounded-lg border border-line bg-surface px-3 text-sm text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent"
                />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as Filter)}
                  aria-label={L('تصفية الحالة', 'Filter by state')}
                  className="h-9 rounded-lg border border-line bg-surface px-3 text-sm text-text focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <option value="all">{L('الكل', 'All')}</option>
                  <option value="present">{L('الحاضرون', 'Present')}</option>
                  <option value="absent">{L('لم يحضروا', 'Not present')}</option>
                </select>
                {editable && (
                  <Button
                    className="ms-auto min-h-9 px-4"
                    disabled={selected.size === 0 || busy}
                    onClick={() => mark([...selected])}
                  >
                    {L('تحديد المحدد كحاضر', 'Mark selected present')}
                  </Button>
                )}
              </div>

              {list.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line bg-surface p-8 text-center text-muted">
                  {L(
                    'لا يوجد مقبولون في هذه الفعالية.',
                    'There are no accepted registrants for this event.',
                  )}
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-line bg-surface">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead className="border-b border-line bg-surface-raised text-xs text-muted">
                      <tr>
                        {editable && (
                          <th scope="col" className="w-10 px-4 py-2.5">
                            <input
                              type="checkbox"
                              aria-label={L('تحديد الكل', 'Select all')}
                              checked={
                                markable.length > 0 &&
                                markable.every((r) => selected.has(r.registrationId))
                              }
                              onChange={() =>
                                setSelected(
                                  markable.every((r) => selected.has(r.registrationId))
                                    ? new Set()
                                    : new Set(markable.map((r) => r.registrationId)),
                                )
                              }
                            />
                          </th>
                        )}
                        {[
                          L('المسجّل', 'Registrant'),
                          L('الحالة', 'State'),
                          L('الطريقة', 'Method'),
                          L('الوقت', 'Time'),
                          '',
                        ].map((h, i) => (
                          <th
                            key={i}
                            scope="col"
                            className="px-4 py-2.5 text-start text-xs font-medium"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr
                          key={r.registrationId}
                          className="border-b border-line align-middle transition-colors last:border-0 hover:bg-surface-raised"
                        >
                          {editable && (
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                aria-label={L(`تحديد ${r.fullName}`, `Select ${r.fullName}`)}
                                checked={selected.has(r.registrationId)}
                                disabled={r.present}
                                onChange={() => toggle(r.registrationId)}
                              />
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={r.fullName} />
                              <div className="min-w-0">
                                <p className="truncate font-medium">{r.fullName}</p>
                                <p
                                  className="truncate text-xs text-muted"
                                  dir="ltr"
                                  style={{ textAlign: 'start' }}
                                >
                                  {r.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {r.present ? (
                              <Badge tone="accent">{L('حاضر', 'Present')}</Badge>
                            ) : (
                              <Badge>{L('لم يحضر', 'Not present')}</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted">
                            {r.method ? METHOD_LABEL[r.method][lang] : '—'}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-muted">
                            {r.checkedInAt
                              ? new Intl.DateTimeFormat(ar ? 'ar-SA-u-nu-latn' : 'en-GB', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  timeZone: 'Asia/Riyadh',
                                }).format(new Date(r.checkedInAt))
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-end">
                            <div className="flex justify-end gap-1">
                              {editable && !r.present && (
                                <IconAction
                                  label={L('تسجيل حضور', 'Mark present')}
                                  tone="accent"
                                  disabled={busy}
                                  onClick={() => mark([r.registrationId])}
                                >
                                  <Check size={16} aria-hidden="true" />
                                </IconAction>
                              )}
                              {editable && r.present && r.method === 'manual' && (
                                <IconAction
                                  label={L('إلغاء التسجيل اليدوي', 'Remove manual mark')}
                                  disabled={busy}
                                  onClick={() => mark([r.registrationId], false)}
                                >
                                  <Undo2 size={16} aria-hidden="true" />
                                </IconAction>
                              )}
                              {status === 'finalized' && canComplete && publishedEvent && (
                                <Button
                                  variant="ghost"
                                  className="min-h-8 px-3 text-xs"
                                  onClick={() => {
                                    setFix({ row: r, present: !r.present });
                                    setReason('');
                                  }}
                                >
                                  {r.present
                                    ? L('تصحيح: غائب', 'Correct: absent')
                                    : L('تصحيح: حاضر', 'Correct: present')}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* Event sign-off */}
      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">
              {L('اعتماد حضور الفعالية', 'Event attendance sign-off')}
            </h2>
            <p className="text-sm text-muted">
              {eventFinalized
                ? L(
                    'اعتُمد الحضور — النسب نهائية، وتبويب الشهادات متاح.',
                    'Attendance is signed off — the percentages are final and the Certificates tab is available.',
                  )
                : L(
                    `اعتمد جميع الجلسات (${finalizedCount}/${days.length}) ثم حضور الفعالية لإتاحة الإكمال والشهادات.`,
                    `Finalize every session (${finalizedCount}/${days.length}), then the event attendance, to unlock completion and certificates.`,
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
            publishedEvent && (
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
                onClick={() => setDialog('event')}
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

      <Dialog
        open={dialog === 'open-late'}
        onClose={() => setDialog(null)}
        title={L('فتح الجلسة في غير موعدها', 'Open outside its day')}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            {dayName(day)}
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
            <Button loading={busy} onClick={() => openDay(true)}>
              {L('فتح الجلسة', 'Open the session')}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={dialog === 'finalize'}
        onClose={() => setDialog(null)}
        title={L('اعتماد الجلسة', 'Finalize the session')}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            {L(
              `سيُسجَّل ${Math.max(total - present, 0)} شخصًا غائبين في هذا اليوم. لن تعود الجلسة قابلة للتعديل إلا بتصحيح موثّق.`,
              `${Math.max(total - present, 0)} people will be recorded absent for this day. The session becomes read-only except for audited corrections.`,
            )}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialog(null)} disabled={busy}>
              {L('تراجع', 'Back')}
            </Button>
            <Button
              loading={busy}
              onClick={() =>
                sessionId &&
                run(
                  () => finalizeSession({ sessionId, eventId }, { lang }),
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
        open={dialog === 'event'}
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
                  const r = await finalizeEventAttendance(eventId, { lang });
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

      <Dialog
        open={fix !== null}
        onClose={() => setFix(null)}
        title={
          fix
            ? fix.present
              ? L('تصحيح: حاضر', 'Correct: present')
              : L('تصحيح: غائب', 'Correct: absent')
            : ''
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">{fix?.row.fullName}</p>
          <Textarea
            label={L('السبب *', 'Reason *')}
            value={reason}
            maxLength={300}
            onChange={(e) => setReason(e.target.value)}
            hint={L('يُسجَّل في سجل التدقيق.', 'Recorded in the audit log.')}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setFix(null)} disabled={busy}>
              {L('تراجع', 'Back')}
            </Button>
            <Button
              loading={busy}
              onClick={() => {
                if (!fix || !sessionId) return;
                startTransition(async () => {
                  const r = await correctAttendance(
                    {
                      sessionId,
                      eventId,
                      registrationId: fix.row.registrationId,
                      present: fix.present,
                      reason,
                    },
                    { lang },
                  );
                  if (!r.ok) {
                    toast.error(r.message);
                    return;
                  }
                  setFix(null);
                  toast.success(L('سُجّل التصحيح.', 'Correction recorded.'));
                  router.refresh();
                });
              }}
            >
              {L('حفظ التصحيح', 'Save correction')}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
