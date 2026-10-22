'use client';

import { Check, ChevronLeft, ClockAlert, Hourglass, TriangleAlert, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Avatar, Badge, Button, Dialog, Textarea, cn, useToast } from '@/components/ui';
import { BulkBar } from '@/components/patterns/BulkBar';
import { ResultsDialog } from '@/components/patterns/ResultsDialog';
import { useLanguage } from '@/context/LanguageContext';
import { Link, useRouter } from '@/i18n/navigation';
import { formatDate } from '@/lib/format';
import { membershipMessage } from '../messages';
import { decideApplications } from '../review-actions';
import type { ReviewApplication } from '../review-queries';
import { ACADEMIC_LABEL, APPLICATION_STATUS_LABEL, type AcademicStatus } from '../types';

type Decision = 'accept' | 'reject' | 'waitlist';

export const applicantName = (
  r: Pick<ReviewApplication, 'fullNameAr' | 'fullNameEn'>,
  ar: boolean,
) => (ar ? r.fullNameAr : r.fullNameEn || r.fullNameAr);

/** The weighted score as a short bar and the number, with how many reviewers it comes from. */
export function ScoreMeter({ value, reviewers }: { value: number | null; reviewers: number }) {
  if (value === null) return <span className="text-muted">—</span>;
  return (
    <span className="inline-flex items-center gap-2 tabular-nums">
      <span
        aria-hidden="true"
        className="relative h-1.5 w-14 overflow-hidden rounded-full bg-surface-raised"
      >
        <span
          className="absolute inset-y-0 start-0 rounded-full bg-accent"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </span>
      <span className="font-bold">{value.toFixed(1)}</span>
      <span className="text-xs text-muted">({reviewers})</span>
    </span>
  );
}

/**
 * The reviewer queue (MBR-010): select rows, decide in bulk with a confirmation that names the people, then read
 * the per-row result. The database decides each row on its own (self-decision, capacity, claim, state), so one
 * blocked row never hides the rest. On a phone the rows are cards and the bar floats at the bottom.
 */
export function ApplicationsTable({
  rows,
  userId,
  hasRubric,
  seatsLeft = null,
}: {
  rows: ReviewApplication[];
  userId: string;
  hasRubric: boolean;
  /** Places still free in the cycle (null: no capacity set). */
  seatsLeft?: number | null;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Decision | null>(null);
  const [note, setNote] = useState('');
  const [results, setResults] = useState<Array<{
    id: string;
    ok: boolean;
    message?: string;
  }> | null>(null);
  const [busy, startTransition] = useTransition();
  const [resultTitle, setResultTitle] = useState('');
  // Rows that were just decided pulse once, so the change is seen where it happened.
  const [flash, setFlash] = useState<Set<string>>(new Set());

  const open = (r: ReviewApplication) =>
    ['submitted', 'under_review', 'waitlisted'].includes(r.status);
  const selectable = rows.filter(open);
  const allSelected = selectable.length > 0 && selectable.every((r) => selected.has(r.id));
  const some = selected.size > 0 && !allSelected;
  const byId = new Map(rows.map((r) => [r.id, r]));
  const nameOf = (id: string) => (byId.get(id) ? applicantName(byId.get(id)!, ar) : id);
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const run = () => {
    if (!pending) return;
    const decision = pending;
    const ids = [...selected];
    startTransition(async () => {
      const r = await decideApplications({ ids, decision, note }, { lang });
      setPending(null);
      setNote('');
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      const list = r.data.outcomes.map((o) => ({
        id: o.id,
        ok: o.ok,
        message: o.code ? membershipMessage(o.code, lang) : undefined,
      }));
      const failed = list.filter((x) => !x.ok);
      const word = {
        accept: ['قُبل', 'accepted'],
        reject: ['رُفض', 'rejected'],
        waitlist: ['نُقل', 'moved'],
      }[decision];
      setResultTitle(
        ar
          ? `النتيجة: ${word[0]} ${list.length - failed.length}${failed.length ? `، وتُخطّي ${failed.length}` : ''}`
          : `Result: ${list.length - failed.length} ${word[1]}${failed.length ? `, ${failed.length} skipped` : ''}`,
      );
      setFlash(new Set(list.filter((x) => x.ok).map((x) => x.id)));
      setTimeout(() => setFlash(new Set()), 1800);
      if (failed.length === 0) {
        toast.success(
          ar ? `تم تنفيذ القرار على ${list.length}.` : `Decision applied to ${list.length}.`,
        );
      } else {
        setResults(list);
      }
      setSelected(new Set());
      router.refresh();
    });
  };

  const title: Record<Decision, string> = {
    accept: ar ? 'قبول الطلبات المحدّدة' : 'Accept the selected applications',
    reject: ar ? 'رفض الطلبات المحدّدة' : 'Reject the selected applications',
    waitlist: ar ? 'نقل المحدّدين إلى الانتظار' : 'Move the selected to the waiting list',
  };
  const chosen = [...selected].map(nameOf);
  const shown = chosen.slice(0, 5).join(ar ? '، ' : ', ');
  const rest = chosen.length - 5;

  const statusBadge = (r: ReviewApplication) => {
    const st = APPLICATION_STATUS_LABEL[r.status];
    return <Badge tone={st.tone}>{st.label[lang]}</Badge>;
  };
  const study = (r: ReviewApplication) =>
    [ACADEMIC_LABEL[r.academicStatus as AcademicStatus]?.[lang], r.university]
      .filter(Boolean)
      .join(' · ');
  const reviewer = (r: ReviewApplication) =>
    r.reviewerId === userId
      ? ar
        ? 'أنت'
        : 'You'
      : (r.reviewerName ?? (ar ? 'غير مسند' : 'Unassigned'));
  const th = 'px-4 py-3.5 text-start text-sm font-medium';
  const href = (id: string) => `/dashboard/membership/applications/${id}`;
  // The whole row opens the application; the check box, links and buttons keep their own meaning.
  const openRow = (id: string) => (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a,button,input,label,select,textarea')) return;
    router.push(href(id));
  };
  const reviewLabel = (r: ReviewApplication) =>
    open(r) ? (ar ? 'مراجعة' : 'Review') : ar ? 'عرض' : 'View';
  const reviewBtn =
    'inline-flex min-h-10 items-center gap-1.5 rounded-full border-[1.5px] border-line-strong px-4 text-sm font-semibold transition-colors hover:border-accent hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-focus-ring';
  const pill =
    'inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-on-brand transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-focus-ring disabled:opacity-50';
  const shortDate = (iso: string) =>
    new Intl.DateTimeFormat(ar ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      timeZone: 'Asia/Riyadh',
    }).format(new Date(iso));

  return (
    <div className="flex flex-col gap-3">
      <BulkBar
        floating
        count={selected.size}
        onClear={() => setSelected(new Set())}
        actions={
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => setPending('reject')}
              className={pill}
            >
              <X size={15} aria-hidden="true" />
              {ar ? 'عدم قبول' : 'Reject'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setPending('waitlist')}
              className={pill}
            >
              <Hourglass size={15} aria-hidden="true" />
              {ar ? 'قائمة الانتظار' : 'Waitlist'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setPending('accept')}
              className={cn(pill, 'bg-accent text-on-accent hover:bg-accent-hover')}
            >
              <Check size={15} aria-hidden="true" />
              {ar ? 'قبول' : 'Accept'}
            </button>
          </>
        }
      />

      {/* Wide screens: the table */}
      <div className="hidden overflow-x-auto rounded-shape-2xl border border-line bg-surface md:block">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="border-b border-line bg-surface-raised text-muted">
            <tr>
              <th scope="col" className="w-12 ps-4">
                <input
                  type="checkbox"
                  aria-label={ar ? 'تحديد الكل' : 'Select all'}
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = some;
                  }}
                  onChange={() =>
                    setSelected(allSelected ? new Set() : new Set(selectable.map((r) => r.id)))
                  }
                  className="size-4 accent-[var(--accent)]"
                />
              </th>
              <th scope="col" className={th}>
                {ar ? 'المتقدّم' : 'Applicant'}
              </th>
              <th scope="col" className={th}>
                {ar ? 'الدراسة' : 'Study'}
              </th>
              <th scope="col" className={th}>
                {ar ? 'الحالة' : 'Status'}
              </th>
              <th scope="col" className={th}>
                {hasRubric ? (ar ? 'الدرجة' : 'Score') : ''}
              </th>
              <th scope="col" className={th}>
                {ar ? 'المراجع' : 'Reviewer'}
              </th>
              <th scope="col" className={th}>
                {ar ? 'قُدّم' : 'Submitted'}
              </th>
              <th scope="col" className={th}>
                <span className="sr-only">{ar ? 'إجراء' : 'Action'}</span>
              </th>
            </tr>
          </thead>
          <tbody className="m-stagger">
            {rows.map((r, i) => (
              <tr
                key={r.id}
                onClick={openRow(r.id)}
                data-selected={selected.has(r.id) || undefined}
                style={{ ['--i' as string]: Math.min(i, 9) }}
                className={cn(
                  'cursor-pointer border-b border-line align-middle transition-colors last:border-0 hover:bg-surface-raised data-[selected]:bg-accent-soft/40',
                  flash.has(r.id) && 'm-pop bg-accent-soft',
                )}
              >
                <td className="ps-4">
                  <input
                    type="checkbox"
                    aria-label={
                      ar ? `تحديد ${applicantName(r, ar)}` : `Select ${applicantName(r, ar)}`
                    }
                    checked={selected.has(r.id)}
                    disabled={!open(r)}
                    onChange={() => toggle(r.id)}
                    className="size-4 accent-[var(--accent)]"
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={applicantName(r, ar)} />
                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/membership/applications/${r.id}`}
                        className="block max-w-[18rem] truncate text-base font-bold hover:text-accent-text"
                      >
                        {applicantName(r, ar)}
                      </Link>
                      <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                        <span dir="ltr" className="font-mono">
                          {r.reference}
                        </span>
                        {r.earlierCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-warning">
                            <TriangleAlert size={12} aria-hidden="true" />
                            {ar ? 'قدّم سابقاً' : 'Applied before'}
                          </span>
                        )}
                        {r.resubmittedAt && r.status === 'submitted' && (
                          <span className="inline-flex items-center gap-1 text-info">
                            <ClockAlert size={12} aria-hidden="true" />
                            {ar ? 'أعاد الإرسال' : 'Resubmitted'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-muted">
                  <span className="block max-w-[14rem] truncate">{study(r)}</span>
                  <span className="block max-w-[14rem] truncate text-xs">{r.track ?? ''}</span>
                </td>
                <td className="px-4 py-4">{statusBadge(r)}</td>
                <td className="px-4 py-4">
                  {hasRubric ? (
                    <ScoreMeter value={r.scoreAverage} reviewers={r.scoreReviewers} />
                  ) : null}
                </td>
                <td className={cn('px-4 py-4', !r.reviewerId && 'text-muted')}>{reviewer(r)}</td>
                <td className="px-4 py-4 text-muted tabular-nums">{shortDate(r.submittedAt)}</td>
                <td className="px-4 py-4">
                  <Link href={href(r.id)} className={reviewBtn}>
                    {reviewLabel(r)}
                    <ChevronLeft size={15} aria-hidden="true" className="ltr:rotate-180" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phones: cards. Tap the name to open; the check box selects. */}
      <ul className="flex flex-col gap-3 pb-24 md:hidden">
        {rows.map((r) => (
          <li
            key={r.id}
            onClick={openRow(r.id)}
            data-selected={selected.has(r.id) || undefined}
            className="cursor-pointer rounded-shape-xl border border-line bg-surface p-3 data-[selected]:border-accent data-[selected]:bg-accent-soft/40"
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                aria-label={ar ? `تحديد ${applicantName(r, ar)}` : `Select ${applicantName(r, ar)}`}
                checked={selected.has(r.id)}
                disabled={!open(r)}
                onChange={() => toggle(r.id)}
                className="mt-1 size-5 shrink-0 accent-[var(--accent)]"
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/membership/applications/${r.id}`}
                  className="block font-semibold hover:text-accent-text"
                >
                  {applicantName(r, ar)}
                </Link>
                <p
                  dir="ltr"
                  className="font-mono text-xs text-muted"
                  style={{ textAlign: 'start' }}
                >
                  {r.reference}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {[study(r), r.track].filter(Boolean).join(' · ')}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {statusBadge(r)}
                  {r.earlierCount > 0 && (
                    <Badge tone="warning" icon={<TriangleAlert size={12} />}>
                      {ar ? 'قدّم سابقاً' : 'Applied before'}
                    </Badge>
                  )}
                </div>
              </div>
              {hasRubric && r.scoreAverage !== null && (
                <p className="text-lg font-bold tabular-nums">{r.scoreAverage.toFixed(1)}</p>
              )}
            </div>
            <Link href={href(r.id)} className={cn(reviewBtn, 'mt-3 w-full justify-center')}>
              {reviewLabel(r)}
            </Link>
          </li>
        ))}
      </ul>

      <Dialog
        open={pending !== null}
        onClose={() => setPending(null)}
        busy={busy}
        title={pending ? title[pending] : ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPending(null)} disabled={busy}>
              {ar ? 'تراجع' : 'Back'}
            </Button>
            <Button
              variant={pending === 'reject' ? 'destructive' : 'primary'}
              onClick={run}
              loading={busy}
            >
              {ar ? 'تأكيد' : 'Confirm'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto">
            {[...selected].slice(0, 8).map((id) => (
              <li
                key={id}
                className="flex items-center justify-between gap-3 rounded-shape-lg bg-surface-raised px-4 py-3"
              >
                <span className="font-semibold">{nameOf(id)}</span>
                <span dir="ltr" className="font-mono text-xs text-muted">
                  {byId.get(id)?.reference}
                </span>
              </li>
            ))}
            {selected.size > 8 && (
              <li className="px-1 text-sm text-muted">
                {ar ? `و${selected.size - 8} آخرين` : `and ${selected.size - 8} more`}
              </li>
            )}
          </ul>
          {pending === 'accept' && seatsLeft !== null && selected.size > seatsLeft && (
            <div
              role="alert"
              className="flex gap-3 rounded-shape-lg bg-warning-soft p-4 text-warning"
            >
              <TriangleAlert size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">
                  {ar
                    ? seatsLeft === 0
                      ? 'لا مقاعد متبقية'
                      : `بقي ${seatsLeft} ${seatsLeft === 2 ? 'مقعدان' : 'مقاعد'} فقط`
                    : seatsLeft === 0
                      ? 'No places left'
                      : `Only ${seatsLeft} place${seatsLeft === 1 ? '' : 's'} left`}
                </p>
                <p className="text-sm">
                  {ar
                    ? 'يُقبل الأوائل بالترتيب المعروض، ويُتخطّى الباقون مع السبب. يصل كل مقبول بريد تفعيل واحد.'
                    : 'The first ones in the listed order are accepted and the rest are skipped with the reason. Each accepted person gets one activation e-mail.'}
                </p>
              </div>
            </div>
          )}
          <p className="text-sm text-muted">
            {pending === 'reject'
              ? ar
                ? 'يصل المتقدّم بريد بسيط بلا ملاحظة ولا سبب، وتُرسل الرسالة بعد لحظات يمكنك التراجع خلالها من صفحة المراجعة.'
                : 'The applicant gets a plain e-mail with no note and no reason, sent after a few seconds.'
              : ar
                ? 'يصل المتقدّم بريد إلكتروني بالقرار.'
                : 'The applicant is e-mailed the decision.'}
          </p>
          <Textarea
            label={
              ar
                ? 'ملاحظة داخلية (لا تظهر للمتقدّم أبداً)'
                : 'Internal note (never shown to the applicant)'
            }
            value={note}
            maxLength={1000}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
        </div>
      </Dialog>

      <ResultsDialog
        open={results !== null}
        onClose={() => setResults(null)}
        title={resultTitle || (ar ? 'نتيجة القرار الجماعي' : 'Bulk decision result')}
        results={results ?? []}
        nameOf={nameOf}
      />
    </div>
  );
}
