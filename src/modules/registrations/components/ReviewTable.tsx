'use client';

import { Check, Clock, Send, X } from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import { Badge, Button, Dialog, Textarea, useToast, Avatar, IconAction } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import { formatRelative } from '@/lib/format';
import { registrationMessage } from '../messages';
import {
  cancelRegistrationByOrganizer,
  decideRegistrations,
  resendRegistrationMail,
  type DecisionOutcome,
} from '../actions';
import { NOTIFY_LABEL, REGISTRATION_STATUS_LABEL } from '../labels';
import type { ReviewRow } from '../queries';

type Decision = 'accept' | 'reject' | 'waitlist';

const DECISION_TEXT: Record<
  Decision,
  {
    title: { ar: string; en: string };
    confirm: { ar: string; en: string };
    body: { ar: string; en: string };
  }
> = {
  accept: {
    title: { ar: 'تأكيد القبول', en: 'Confirm acceptance' },
    confirm: { ar: 'نعم، اقبل', en: 'Yes, accept' },
    body: {
      ar: 'سيُقبل التسجيل ويصل المسجّل بريد التأكيد مع رابط المجموعة. تُحتسب المقاعد تلقائيًا.',
      en: 'The registration is accepted and the person gets the confirmation e-mail with the group link. Seats are counted automatically.',
    },
  },
  waitlist: {
    title: { ar: 'نقل إلى قائمة الانتظار', en: 'Move to the waitlist' },
    confirm: { ar: 'نعم، انقل', en: 'Yes, move' },
    body: {
      ar: 'يبقى المسجّل في قائمة الانتظار حتى تتوفر مقاعد.',
      en: 'The person stays on the waitlist until seats are available.',
    },
  },
  reject: {
    title: { ar: 'تأكيد الرفض', en: 'Confirm rejection' },
    confirm: { ar: 'نعم، ارفض', en: 'Yes, reject' },
    body: {
      ar: 'سيُرفض التسجيل ويُبلَّغ المسجّل بالبريد الإلكتروني.',
      en: 'The registration is rejected and the person is told by e-mail.',
    },
  },
};

const fullDate = (iso: string | null, lang: 'ar' | 'en') =>
  iso
    ? new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Riyadh',
      }).format(new Date(iso))
    : '—';

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="break-words text-sm font-medium">{children}</dd>
    </div>
  );
}

/**
 * Reviewer table: select rows, decide in bulk or one by one — always after a confirmation dialog that names who is
 * affected. The database decides every row independently (capacity, state, scope) and the table reports each
 * outcome, so one full event never blocks the others. A row opens a details dialog (contact, attendance %, e-mail
 * state, cancel).
 */
export function ReviewTable({
  rows,
  showEvent = true,
}: {
  rows: ReviewRow[];
  /** The global queue shows the event of each row; the event tab does not. */
  showEvent?: boolean;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, startTransition] = useTransition();
  const toast = useToast();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [pending, setPending] = useState<null | { ids: string[]; decision: Decision }>(null);
  const [note, setNote] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const selectable = useMemo(() => rows.filter((r) => r.status !== 'cancelled'), [rows]);
  const allSelected = selectable.length > 0 && selectable.every((r) => selected.has(r.id));
  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);
  const open = openId ? (byId.get(openId) ?? null) : null;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const summarize = (results: DecisionOutcome[], decision: Decision) => {
    const okCount = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok);
    const verb =
      decision === 'accept'
        ? L('قُبل', 'accepted')
        : decision === 'reject'
          ? L('رُفض', 'rejected')
          : L('نُقل إلى قائمة الانتظار', 'moved to the waitlist');
    if (failed.length === 0) {
      toast.success(
        ar
          ? `${verb} ${okCount} ${okCount === 1 ? 'تسجيل' : 'تسجيلات'}.`
          : `${okCount} ${okCount === 1 ? 'registration' : 'registrations'} ${verb}.`,
      );
      return;
    }
    const first = failed[0]!;
    const why = first.code ? registrationMessage(first.code, lang) : '';
    toast.warning(
      ar
        ? `نجح ${okCount} وتعذّر ${failed.length}. ${why}`
        : `${okCount} succeeded, ${failed.length} could not be changed. ${why}`,
    );
  };

  const runDecision = () => {
    if (!pending) return;
    const { ids, decision } = pending;
    startTransition(async () => {
      const r = await decideRegistrations(
        { ids, decision, note: decision === 'reject' && note.trim() ? note.trim() : undefined },
        { lang },
      );
      setPending(null);
      setNote('');
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      summarize(r.data, decision);
      setSelected(new Set());
      setOpenId(null);
      router.refresh();
    });
  };

  const ask = (ids: string[], decision: Decision) => {
    setNote('');
    setPending({ ids, decision });
  };

  const resend = (id: string) => {
    startTransition(async () => {
      const r = await resendRegistrationMail(id, { lang });
      if (r.ok) toast.success(L('تمت جدولة إعادة الإرسال.', 'Resend scheduled.'));
      else toast.error(r.message);
      router.refresh();
    });
  };

  const confirmCancel = () => {
    if (!cancelId) return;
    setCancelError('');
    startTransition(async () => {
      const r = await cancelRegistrationByOrganizer({ id: cancelId, reason }, { lang });
      if (!r.ok) {
        setCancelError(r.message);
        return;
      }
      setCancelId(null);
      setOpenId(null);
      setReason('');
      toast.success(
        L('أُلغي التسجيل وأُبلغ المسجّل.', 'Registration cancelled and the person notified.'),
      );
      router.refresh();
    });
  };

  const th = 'px-4 py-2.5 text-start text-xs font-medium';
  const names = (ids: string[]) =>
    ids.map((id) => byId.get(id)?.fullName).filter(Boolean) as string[];
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const canAccept = (s: ReviewRow['status']) =>
    s === 'pending' || s === 'waitlisted' || s === 'rejected';
  const canReject = (s: ReviewRow['status']) =>
    s === 'pending' || s === 'waitlisted' || s === 'accepted';
  const canCancel = (s: ReviewRow['status']) =>
    s === 'pending' || s === 'accepted' || s === 'waitlisted';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2" aria-live="polite">
        <span className="text-sm text-muted">
          {selected.size > 0
            ? L(`${selected.size} محدد`, `${selected.size} selected`)
            : L('حدّد صفوفًا لاتخاذ قرار جماعي', 'Select rows to decide in bulk')}
        </span>
        <Button disabled={selected.size === 0 || busy} onClick={() => ask([...selected], 'accept')}>
          {L('قبول', 'Accept')}
        </Button>
        <Button
          variant="secondary"
          disabled={selected.size === 0 || busy}
          onClick={() => ask([...selected], 'waitlist')}
        >
          {L('قائمة الانتظار', 'Waitlist')}
        </Button>
        <Button
          variant="danger"
          disabled={selected.size === 0 || busy}
          onClick={() => ask([...selected], 'reject')}
        >
          {L('رفض', 'Reject')}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="border-b border-line bg-surface-raised text-muted">
            <tr>
              <th scope="col" className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label={L('تحديد الكل', 'Select all')}
                  checked={allSelected}
                  onChange={() =>
                    setSelected(allSelected ? new Set() : new Set(selectable.map((r) => r.id)))
                  }
                />
              </th>
              <th scope="col" className={th}>
                {L('المسجّل', 'Registrant')}
              </th>
              {showEvent && (
                <th scope="col" className={th}>
                  {L('الفعالية', 'Event')}
                </th>
              )}
              <th scope="col" className={th}>
                {L('التسجيل', 'Registered')}
              </th>
              <th scope="col" className={th}>
                {L('الحالة', 'Status')}
              </th>
              <th scope="col" className={th}>
                {L('الحضور', 'Attendance')}
              </th>
              <th scope="col" className={th}>
                {L('البريد', 'E-mail')}
              </th>
              <th scope="col" className={th}>
                <span className="sr-only">{L('إجراءات', 'Actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const st = REGISTRATION_STATUS_LABEL[r.status];
              const cancelled = r.status === 'cancelled';
              return (
                <tr
                  key={r.id}
                  onClick={() => setOpenId(r.id)}
                  className="cursor-pointer border-b border-line align-middle transition-colors last:border-0 hover:bg-surface-raised"
                >
                  <td className="px-4 py-3" onClick={stop}>
                    <input
                      type="checkbox"
                      aria-label={ar ? `تحديد ${r.fullName}` : `Select ${r.fullName}`}
                      checked={selected.has(r.id)}
                      disabled={cancelled}
                      onChange={() => toggle(r.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.fullName} />
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            stop(e);
                            setOpenId(r.id);
                          }}
                          className="block max-w-full truncate text-start font-medium hover:underline focus-visible:outline-2 focus-visible:outline-accent"
                        >
                          {r.fullName}
                        </button>
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
                  {showEvent && (
                    <td className="px-4 py-3">
                      {ar ? r.eventTitleAr : r.eventTitleEn || r.eventTitleAr}
                      {r.seats !== null && (
                        <p className="text-xs text-muted">
                          {ar ? `${r.seats} مقعد` : `${r.seats} seats`}
                        </p>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3 text-muted">{formatRelative(r.createdAt, lang)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={st.tone}>{st.label[lang]}</Badge>
                    {r.decisionNote && <p className="mt-1 text-xs text-muted">{r.decisionNote}</p>}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {r.attendancePercent === null ? (
                      <span className="text-muted">—</span>
                    ) : (
                      `${r.attendancePercent}%`
                    )}
                  </td>
                  <td className="px-4 py-3" onClick={stop}>
                    <span className={r.notifyStatus === 'failed' ? 'text-danger' : 'text-muted'}>
                      {NOTIFY_LABEL[r.notifyStatus]?.[lang]}
                    </span>
                    {(r.notifyStatus === 'failed' || r.notifyStatus === 'not_sent') && (
                      <button
                        type="button"
                        className="ms-2 text-xs text-accent underline disabled:opacity-50"
                        disabled={busy}
                        onClick={() => resend(r.id)}
                      >
                        <Send size={11} aria-hidden="true" className="me-1 inline" />
                        {L('إعادة الإرسال', 'Resend')}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3" onClick={stop}>
                    <div className="flex items-center justify-end gap-1">
                      {canAccept(r.status) && (
                        <IconAction
                          label={L('قبول', 'Accept')}
                          tone="accent"
                          disabled={busy}
                          onClick={() => ask([r.id], 'accept')}
                        >
                          <Check size={16} aria-hidden="true" />
                        </IconAction>
                      )}
                      {r.status === 'pending' && (
                        <IconAction
                          label={L('قائمة الانتظار', 'Waitlist')}
                          disabled={busy}
                          onClick={() => ask([r.id], 'waitlist')}
                        >
                          <Clock size={16} aria-hidden="true" />
                        </IconAction>
                      )}
                      {canReject(r.status) && (
                        <IconAction
                          label={L('رفض', 'Reject')}
                          tone="danger"
                          disabled={busy}
                          onClick={() => ask([r.id], 'reject')}
                        >
                          <X size={16} aria-hidden="true" />
                        </IconAction>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Confirmation before any decision */}
      <Dialog
        open={pending !== null}
        onClose={() => (busy ? undefined : setPending(null))}
        title={pending ? DECISION_TEXT[pending.decision].title[lang] : ''}
      >
        {pending && (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              {pending.ids.length === 1
                ? L('التسجيل: ', 'Registration: ')
                : L(`${pending.ids.length} تسجيلات:`, `${pending.ids.length} registrations:`)}{' '}
              <strong>
                {names(pending.ids)
                  .slice(0, 4)
                  .join(ar ? '، ' : ', ')}
              </strong>
              {pending.ids.length > 4 &&
                L(` و${pending.ids.length - 4} آخرين`, ` and ${pending.ids.length - 4} more`)}
            </p>
            <p className="text-sm text-muted">{DECISION_TEXT[pending.decision].body[lang]}</p>
            {pending.decision === 'reject' && (
              <Textarea
                label={L('ملاحظة للمسجّل (اختياري)', 'Note for the person (optional)')}
                value={note}
                maxLength={500}
                onChange={(e) => setNote(e.target.value)}
              />
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPending(null)} disabled={busy}>
                {L('تراجع', 'Back')}
              </Button>
              <Button
                variant={pending.decision === 'reject' ? 'danger' : 'primary'}
                onClick={runDecision}
                loading={busy}
              >
                {DECISION_TEXT[pending.decision].confirm[lang]}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Registrant details */}
      <Dialog
        open={open !== null && pending === null && cancelId === null}
        onClose={() => setOpenId(null)}
        title={open?.fullName ?? ''}
        className="w-[min(36rem,calc(100vw-2rem))]"
      >
        {open && (
          <div className="flex flex-col gap-4">
            <p className="-mt-3 text-sm text-muted" dir="ltr" style={{ textAlign: 'start' }}>
              {open.email}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={REGISTRATION_STATUS_LABEL[open.status].tone}>
                {REGISTRATION_STATUS_LABEL[open.status].label[lang]}
              </Badge>
              <Badge tone={open.notifyStatus === 'failed' ? 'danger' : 'neutral'}>
                {L('البريد: ', 'E-mail: ')}
                {NOTIFY_LABEL[open.notifyStatus]?.[lang]}
              </Badge>
              {open.wasMember && <Badge tone="accent">{L('عضو', 'Member')}</Badge>}
              {open.guest && <Badge>{L('بدون حساب', 'Guest')}</Badge>}
            </div>
            <dl className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-canvas p-4">
              <Info label={L('الفعالية', 'Event')}>
                {ar ? open.eventTitleAr : open.eventTitleEn || open.eventTitleAr}
              </Info>
              {open.phone && (
                <Info label={L('الجوال', 'Phone')}>
                  <span dir="ltr">{open.phone}</span>
                </Info>
              )}
              {open.university && (
                <Info label={L('الجامعة / الجهة', 'University / workplace')}>
                  {open.university}
                </Info>
              )}
              <Info label={L('تاريخ التسجيل', 'Registered at')}>
                {fullDate(open.createdAt, lang)}
              </Info>
              <Info label={L('تاريخ القرار', 'Decided at')}>{fullDate(open.decidedAt, lang)}</Info>
              <Info label={L('نسبة الحضور', 'Attendance')}>
                {open.attendancePercent === null
                  ? L('بعد اعتماد الحضور', 'After attendance sign-off')
                  : `${open.attendancePercent}%`}
              </Info>
              {open.decisionNote && (
                <div className="col-span-2">
                  <Info label={L('ملاحظة القرار', 'Decision note')}>{open.decisionNote}</Info>
                </div>
              )}
            </dl>
            <div className="flex flex-wrap justify-end gap-2">
              {(open.notifyStatus === 'failed' || open.notifyStatus === 'not_sent') && (
                <Button variant="ghost" onClick={() => resend(open.id)} disabled={busy}>
                  {L('إعادة إرسال البريد', 'Resend e-mail')}
                </Button>
              )}
              {canCancel(open.status) && (
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    setCancelId(open.id);
                    setCancelError('');
                  }}
                >
                  {L('إلغاء التسجيل', 'Cancel registration')}
                </Button>
              )}
              {canReject(open.status) && (
                <Button variant="danger" disabled={busy} onClick={() => ask([open.id], 'reject')}>
                  {L('رفض', 'Reject')}
                </Button>
              )}
              {canAccept(open.status) && (
                <Button disabled={busy} onClick={() => ask([open.id], 'accept')}>
                  {L('قبول', 'Accept')}
                </Button>
              )}
              <Button variant="secondary" onClick={() => setOpenId(null)}>
                {L('إغلاق', 'Close')}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        open={cancelId !== null}
        onClose={() => setCancelId(null)}
        title={L('إلغاء التسجيل', 'Cancel registration')}
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            {L(
              'سيُبلَّغ المسجّل بالسبب عبر البريد الإلكتروني.',
              'The person will be told the reason by e-mail.',
            )}
          </p>
          <Textarea
            label={L('السبب', 'Reason')}
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
            error={cancelError || undefined}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCancelId(null)} disabled={busy}>
              {L('تراجع', 'Back')}
            </Button>
            <Button variant="danger" onClick={confirmCancel} loading={busy}>
              {L('تأكيد الإلغاء', 'Confirm cancellation')}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
