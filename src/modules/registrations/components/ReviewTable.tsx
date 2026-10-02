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

/**
 * Reviewer table: select rows, decide in bulk or one by one. The database decides every row independently
 * (capacity, state, scope) and the table reports each outcome, so one full event never blocks the others.
 */
export function ReviewTable({ rows }: { rows: ReviewRow[] }) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, startTransition] = useTransition();
  const toast = useToast();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [cancelError, setCancelError] = useState('');

  const selectable = useMemo(() => rows.filter((r) => r.status !== 'cancelled'), [rows]);
  const allSelected = selectable.length > 0 && selectable.every((r) => selected.has(r.id));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const summarize = (results: DecisionOutcome[]) => {
    const okCount = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok);
    if (failed.length === 0) {
      toast.success(ar ? `تم تنفيذ القرار على ${okCount}.` : `Decision applied to ${okCount}.`);
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

  const decide = (ids: string[], decision: Decision) => {
    startTransition(async () => {
      const r = await decideRegistrations({ ids, decision }, { lang });
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      summarize(r.data);
      setSelected(new Set());
      router.refresh();
    });
  };

  const resend = (id: string) => {
    startTransition(async () => {
      const r = await resendRegistrationMail(id, { lang });
      if (r.ok) toast.success(ar ? 'تمت جدولة إعادة الإرسال.' : 'Resend scheduled.');
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
      setReason('');
      toast.success(
        ar ? 'أُلغي التسجيل وأُبلغ المسجّل.' : 'Registration cancelled and the person notified.',
      );
      router.refresh();
    });
  };

  const th = 'px-4 py-2.5 text-start text-xs font-medium';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2" aria-live="polite">
        <span className="text-sm text-muted">
          {selected.size > 0
            ? ar
              ? `${selected.size} محدد`
              : `${selected.size} selected`
            : ar
              ? 'حدّد صفوفًا لاتخاذ قرار جماعي'
              : 'Select rows to decide in bulk'}
        </span>
        <Button
          disabled={selected.size === 0 || busy}
          onClick={() => decide([...selected], 'accept')}
        >
          {ar ? 'قبول' : 'Accept'}
        </Button>
        <Button
          variant="secondary"
          disabled={selected.size === 0 || busy}
          onClick={() => decide([...selected], 'waitlist')}
        >
          {ar ? 'قائمة الانتظار' : 'Waitlist'}
        </Button>
        <Button
          variant="danger"
          disabled={selected.size === 0 || busy}
          onClick={() => decide([...selected], 'reject')}
        >
          {ar ? 'رفض' : 'Reject'}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="border-b border-line bg-surface-raised text-muted">
            <tr>
              <th scope="col" className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label={ar ? 'تحديد الكل' : 'Select all'}
                  checked={allSelected}
                  onChange={() =>
                    setSelected(allSelected ? new Set() : new Set(selectable.map((r) => r.id)))
                  }
                />
              </th>
              <th scope="col" className={th}>
                {ar ? 'المسجّل' : 'Registrant'}
              </th>
              <th scope="col" className={th}>
                {ar ? 'الفعالية' : 'Event'}
              </th>
              <th scope="col" className={th}>
                {ar ? 'التسجيل' : 'Registered'}
              </th>
              <th scope="col" className={th}>
                {ar ? 'الحالة' : 'Status'}
              </th>
              <th scope="col" className={th}>
                {ar ? 'البريد' : 'E-mail'}
              </th>
              <th scope="col" className={th}>
                <span className="sr-only">{ar ? 'إجراءات' : 'Actions'}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const st = REGISTRATION_STATUS_LABEL[r.status];
              const cancelled = r.status === 'cancelled';
              const canCancel =
                r.status === 'pending' || r.status === 'accepted' || r.status === 'waitlisted';
              return (
                <tr
                  key={r.id}
                  className="border-b border-line align-middle transition-colors last:border-0 hover:bg-surface-raised"
                >
                  <td className="px-4 py-3">
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
                    {ar ? r.eventTitleAr : r.eventTitleEn || r.eventTitleAr}
                    {r.seats !== null && (
                      <p className="text-xs text-muted">
                        {ar ? `${r.seats} مقعد` : `${r.seats} seats`}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{formatRelative(r.createdAt, lang)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={st.tone}>{st.label[lang]}</Badge>
                    {r.decisionNote && <p className="mt-1 text-xs text-muted">{r.decisionNote}</p>}
                  </td>
                  <td className="px-4 py-3">
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
                        {ar ? 'إعادة الإرسال' : 'Resend'}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {(r.status === 'pending' ||
                        r.status === 'waitlisted' ||
                        r.status === 'rejected') && (
                        <IconAction
                          label={ar ? 'قبول' : 'Accept'}
                          tone="accent"
                          disabled={busy}
                          onClick={() => decide([r.id], 'accept')}
                        >
                          <Check size={16} aria-hidden="true" />
                        </IconAction>
                      )}
                      {r.status === 'pending' && (
                        <IconAction
                          label={ar ? 'قائمة الانتظار' : 'Waitlist'}
                          disabled={busy}
                          onClick={() => decide([r.id], 'waitlist')}
                        >
                          <Clock size={16} aria-hidden="true" />
                        </IconAction>
                      )}
                      {(r.status === 'pending' ||
                        r.status === 'waitlisted' ||
                        r.status === 'accepted') && (
                        <IconAction
                          label={ar ? 'رفض' : 'Reject'}
                          tone="danger"
                          disabled={busy}
                          onClick={() => decide([r.id], 'reject')}
                        >
                          <X size={16} aria-hidden="true" />
                        </IconAction>
                      )}
                      {canCancel && (
                        <button
                          type="button"
                          className="ms-1 rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-canvas hover:text-text disabled:opacity-50"
                          disabled={busy}
                          onClick={() => {
                            setCancelId(r.id);
                            setCancelError('');
                          }}
                        >
                          {ar ? 'إلغاء التسجيل' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog
        open={cancelId !== null}
        onClose={() => setCancelId(null)}
        title={ar ? 'إلغاء التسجيل' : 'Cancel registration'}
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            {ar
              ? 'سيُبلَّغ المسجّل بالسبب عبر البريد الإلكتروني.'
              : 'The person will be told the reason by e-mail.'}
          </p>
          <Textarea
            label={ar ? 'السبب' : 'Reason'}
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
            error={cancelError || undefined}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCancelId(null)} disabled={busy}>
              {ar ? 'تراجع' : 'Back'}
            </Button>
            <Button variant="danger" onClick={confirmCancel} loading={busy}>
              {ar ? 'تأكيد الإلغاء' : 'Confirm cancellation'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
