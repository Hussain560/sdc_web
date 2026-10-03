'use client';

import { Check, Lock, QrCode, Undo2 } from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import { Avatar, Badge, Button, Dialog, IconAction, Textarea, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { Link, useRouter } from '@/i18n/navigation';
import {
  closeSession,
  correctAttendance,
  finalizeSession,
  openSession,
  recordAttendance,
} from '../actions';
import { METHOD_LABEL, SESSION_STATUS_LABEL, type RosterRow, type SessionStatus } from '../types';

type Filter = 'all' | 'present' | 'absent';

/**
 * One session (screen 16 §2): the accepted registrants with their mark. Marking present is a single action
 * (absence is whatever is not checked in at finalization); a finalized session is read-only for the attendance
 * team and corrected only by people holding events.complete, with a reason.
 */
export function SessionRoster({
  eventId,
  sessionId,
  eventDateId,
  dayLabel,
  status,
  roster,
  canComplete,
  live,
}: {
  eventId: string;
  sessionId: string;
  eventDateId: string;
  dayLabel: string;
  status: SessionStatus;
  roster: RosterRow[];
  canComplete: boolean;
  /** The event is still published (sessions of completed events are read-only). */
  live: boolean;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const router = useRouter();
  const toast = useToast();
  const [busy, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState<null | 'finalize'>(null);
  const [fix, setFix] = useState<null | { row: RosterRow; present: boolean }>(null);
  const [reason, setReason] = useState('');

  const present = roster.filter((r) => r.present).length;
  const byMethod = (m: string) => roster.filter((r) => r.method === m).length;
  const st = SESSION_STATUS_LABEL[status];
  const editable = live && status !== 'finalized';

  const rows = useMemo(
    () =>
      roster.filter(
        (r) =>
          (filter === 'all' || (filter === 'present' ? r.present : !r.present)) &&
          r.fullName.toLowerCase().includes(q.trim().toLowerCase()),
      ),
    [roster, filter, q],
  );
  const markable = rows.filter((r) => !r.present);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const mark = (ids: string[], presentFlag = true) =>
    startTransition(async () => {
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

  const act = (job: () => Promise<{ ok: boolean; message?: string }>, done: string) =>
    startTransition(async () => {
      const r = await job();
      if (!r.ok) {
        toast.error(r.message ?? '');
        return;
      }
      setConfirm(null);
      toast.success(done);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/events/${eventId}/attendance`}
            className="text-sm text-muted hover:text-text"
          >
            ‹ {L('الجلسات', 'Sessions')}
          </Link>
          <h2 className="text-lg font-bold">{dayLabel}</h2>
          <Badge tone={st.tone}>{ar ? st.ar : st.en}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {live && status === 'open' && (
            <>
              <Link
                href={`/dashboard/events/${eventId}/attendance/${sessionId}/qr`}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line-accent px-4 text-sm font-semibold text-accent hover:bg-surface-raised"
              >
                <QrCode size={15} aria-hidden="true" />
                {L('رمز QR', 'QR code')}
              </Link>
              <Button
                variant="secondary"
                loading={busy}
                onClick={() =>
                  act(
                    () => closeSession({ sessionId, eventId }, { lang }),
                    L('أُغلقت الجلسة.', 'Session closed.'),
                  )
                }
              >
                {L('إغلاق الجلسة', 'Close session')}
              </Button>
            </>
          )}
          {live && status === 'closed' && (
            <>
              <Button
                variant="ghost"
                loading={busy}
                onClick={() =>
                  act(
                    () => openSession({ eventDateId, eventId, confirm: true }, { lang }),
                    L('أُعيد فتح الجلسة.', 'Session reopened.'),
                  )
                }
              >
                {L('إعادة فتح', 'Reopen')}
              </Button>
              <Button loading={busy} onClick={() => setConfirm('finalize')}>
                {L('اعتماد الجلسة', 'Finalize session')}
              </Button>
            </>
          )}
        </div>
      </div>

      <p className="text-sm tabular-nums text-muted">
        {L(
          `حضر ${present} · لم يحضر بعد ${roster.length - present}`,
          `${present} present · ${roster.length - present} not yet`,
        )}
        {present > 0 &&
          ` · QR ${byMethod('qr')} · ${L('أونلاين', 'online')} ${byMethod('online')} · ${L('يدوي', 'manual')} ${byMethod('manual')}`}
      </p>
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
          placeholder={L('ابحث بالاسم…', 'Search by name…')}
          aria-label={L('بحث بالاسم', 'Search by name')}
          className="h-9 w-56 rounded-lg border border-line bg-surface px-3 text-sm text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent"
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

      {roster.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-surface p-8 text-center text-muted">
          {L(
            'لا يوجد مقبولون في هذه الفعالية.',
            'There are no accepted registrants for this event.',
          )}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line bg-surface-raised text-xs text-muted">
              <tr>
                {editable && (
                  <th scope="col" className="w-10 px-4 py-2.5">
                    <input
                      type="checkbox"
                      aria-label={L('تحديد الكل', 'Select all')}
                      checked={
                        markable.length > 0 && markable.every((r) => selected.has(r.registrationId))
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
                  L('الاسم', 'Name'),
                  L('الحالة', 'State'),
                  L('الطريقة', 'Method'),
                  L('الوقت', 'Time'),
                  '',
                ].map((h, i) => (
                  <th key={i} scope="col" className="px-4 py-2.5 text-start text-xs font-medium">
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
                        <p className="text-xs text-muted">
                          {r.wasMember ? L('عضو', 'Member') : L('غير عضو', 'Not a member')}
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
                      {status === 'finalized' && canComplete && live && (
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

      <Dialog
        open={confirm === 'finalize'}
        onClose={() => setConfirm(null)}
        title={L('اعتماد الجلسة', 'Finalize the session')}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            {L(
              `سيُسجَّل ${roster.length - present} شخصًا غائبين في هذا اليوم. لن تعود الجلسة قابلة للتعديل إلا بتصحيح موثّق.`,
              `${roster.length - present} people will be recorded absent for this day. The session becomes read-only except for audited corrections.`,
            )}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(null)} disabled={busy}>
              {L('تراجع', 'Back')}
            </Button>
            <Button
              loading={busy}
              onClick={() =>
                act(
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
                if (!fix) return;
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
