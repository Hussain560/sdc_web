'use client';

import { CircleCheck, Flag, Hand, Keyboard, Star } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { Alert, Avatar, Button, Checkbox, Dialog, Textarea, cn, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import { scheduleRelease } from './ApplicationsTable';
import { membershipMessage } from '../messages';
import {
  claimApplication,
  decideApplications,
  requestApplicationInfo,
  saveScore,
  undoDecision,
} from '../review-actions';
import type { ReviewScore } from '../review-queries';
import type { RubricCriterion } from '../types';

type Decision = 'accept' | 'waitlist' | 'reject';

export type ReviewPanelProps = {
  id: string;
  status: string;
  reviewerId: string | null;
  reviewerName: string | null;
  userId: string;
  isAdmin: boolean;
  /** The applicant is the signed-in reviewer: read-only, nothing to decide. */
  isOwn: boolean;
  rubric: RubricCriterion[];
  scores: ReviewScore[];
  capacity: { accepted: number; capacity: number } | null;
  nextId: string | null;
  prevId: string | null;
  /** What the reviewer may ask the applicant to fix: links, bio and each cycle question. */
  fixable: Array<{ key: string; label: string }>;
};

const OPEN = ['submitted', 'under_review', 'waitlisted'];

/** The weighted mean of one reviewer's scores. */
export const weightedMean = (scores: Record<string, number>, rubric: RubricCriterion[]) => {
  let sum = 0;
  let w = 0;
  for (const r of rubric) {
    const v = scores[r.key];
    if (v) {
      sum += v * r.weight;
      w += r.weight;
    }
  }
  return w === 0 ? null : sum / w;
};

/**
 * The reviewer's side of the review page (MBR-011, MBR-012): a score per criterion, the decision, an internal note,
 * keyboard shortcuts (A accept, W waitlist, I ask for a correction, R reject, J / K previous and next) and a
 * five-second undo before the decision e-mail is released. On a phone the decision becomes a bar at the bottom.
 */
export function ReviewPanel(p: ReviewPanelProps) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();
  const toast = useToast();
  const [busy, startTransition] = useTransition();
  const mine = p.scores.find((s) => s.mine);
  const [scores, setScores] = useState<Record<string, number>>(mine?.scores ?? {});
  const [comment, setComment] = useState(mine?.comment ?? '');
  const [note, setNote] = useState('');
  const [openNext, setOpenNext] = useState(true);
  const [confirm, setConfirm] = useState<Decision | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoText, setInfoText] = useState('');
  const [infoFields, setInfoFields] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const decidable = OPEN.includes(p.status) && !p.isOwn;
  const claimedByOther = p.status === 'under_review' && p.reviewerId !== p.userId && !p.isAdmin;
  const mean = useMemo(() => weightedMean(scores, p.rubric), [scores, p.rubric]);
  const scoreComplete = p.rubric.length > 0 && p.rubric.every((r) => scores[r.key]);
  const others = p.scores.filter((s) => !s.mine);
  const full = p.capacity ? p.capacity.accepted >= p.capacity.capacity : false;

  const go = useCallback(
    (id: string | null) => {
      if (id) router.push(`/dashboard/membership/applications/${id}`);
    },
    [router],
  );

  const claim = (release: boolean) =>
    startTransition(async () => {
      const r = await claimApplication({ id: p.id, release }, { lang });
      if (!r.ok) toast.error(r.message);
      else
        toast.success(
          release
            ? ar
              ? 'أُفلت الطلب.'
              : 'Application released.'
            : ar
              ? 'استلمت الطلب للمراجعة.'
              : 'Application claimed.',
        );
      router.refresh();
    });

  const decide = useCallback(
    (decision: Decision) =>
      startTransition(async () => {
        setError(null);
        const r = await decideApplications(
          { ids: [p.id], decision, note: note.trim() || undefined },
          { lang },
        );
        setConfirm(null);
        if (!r.ok) {
          setError(r.message);
          return;
        }
        scheduleRelease(r.data.undoSeconds);
        const out = r.data.outcomes[0];
        if (!out?.ok) {
          setError(membershipMessage(out?.code ?? 'INTERNAL', lang));
          return;
        }
        const label =
          decision === 'accept'
            ? ar
              ? 'تم قبول الطلب'
              : 'Accepted'
            : decision === 'reject'
              ? ar
                ? 'رُفض الطلب'
                : 'Rejected'
              : ar
                ? 'نُقل إلى الانتظار'
                : 'Moved to the waiting list';
        toast.success(label, {
          label: ar ? 'تراجع' : 'Undo',
          onClick: () => {
            void undoDecision(p.id, { lang }).then((u) => {
              if (!u.ok) toast.error(u.message);
              else {
                toast.info(ar ? 'تم التراجع، لم يُرسل أي بريد.' : 'Undone. No e-mail was sent.');
                router.push(`/dashboard/membership/applications/${p.id}`);
                router.refresh();
              }
            });
          },
        });
        if (openNext && p.nextId) go(p.nextId);
        else router.refresh();
      }),
    [p.id, p.nextId, note, lang, ar, openNext, go, router, toast],
  );

  const ask = (d: Decision) => {
    if (!decidable || claimedByOther) return;
    if (d === 'reject') setConfirm('reject');
    else decide(d);
  };

  // Keyboard shortcuts: never while typing, never over a dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.tagName === 'SELECT' ||
          t.isContentEditable)
      )
        return;
      if (document.querySelector('dialog[open]')) return;
      const k = e.key.toLowerCase();
      if (k === 'a') ask('accept');
      else if (k === 'w') ask('waitlist');
      else if (k === 'r') ask('reject');
      else if (k === 'i' && decidable && !claimedByOther) setInfoOpen(true);
      else if (k === 'j') go(p.prevId);
      else if (k === 'k') go(p.nextId);
      else return;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decidable, claimedByOther, p.prevId, p.nextId, decide]);

  const saveMyScore = () =>
    startTransition(async () => {
      const r = await saveScore({ id: p.id, scores, comment }, { lang });
      if (!r.ok) toast.error(r.message);
      else {
        toast.success(ar ? 'حُفظ تقييمك.' : 'Your score is saved.');
        setSavedAt(
          new Intl.DateTimeFormat(ar ? 'ar-SA-u-nu-latn' : 'en-GB', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: 'Asia/Riyadh',
          }).format(new Date()),
        );
      }
      router.refresh();
    });

  const sendInfo = () => {
    if (!infoText.trim()) return;
    startTransition(async () => {
      const r = await requestApplicationInfo(
        { id: p.id, message: infoText, fields: infoFields },
        { lang },
      );
      if (!r.ok) {
        setError(r.message);
        return;
      }
      setInfoOpen(false);
      setInfoText('');
      setInfoFields([]);
      toast.success(
        ar ? 'أُرسل طلب التعديل إلى المتقدّم.' : 'The request was sent to the applicant.',
      );
      if (openNext && p.nextId) go(p.nextId);
      else router.refresh();
    });
  };

  const kbd =
    'inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-line-strong px-1 font-mono text-[11px] text-muted';
  const decisionBtn =
    'flex min-h-12 items-center justify-between gap-2 rounded-full border-[1.5px] px-4 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50';
  const btnPrimary = 'border-transparent bg-accent text-on-accent hover:bg-accent-hover';
  const btnQuiet = 'border-line-strong hover:border-accent hover:bg-accent-soft';
  const btnDanger = 'border-line-strong text-danger hover:border-danger hover:bg-danger-soft';

  const decisionCard = (
    <section
      className="flex flex-col gap-3 rounded-shape-xl border border-line bg-surface p-5"
      aria-labelledby="rv-decision"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="rv-decision" className="flex items-center gap-2 font-bold">
          <Flag size={16} aria-hidden="true" />
          {ar ? 'القرار' : 'Decision'}
        </h2>
        {p.capacity && (
          <span className={cn('text-sm tabular-nums', full ? 'text-warning' : 'text-muted')}>
            {p.capacity.capacity} / {p.capacity.accepted} {ar ? 'المقاعد' : 'places'}
          </span>
        )}
      </div>

      {p.isOwn ? (
        <Alert tone="info">
          {ar
            ? 'هذا طلب قدّمته أنت. يظهر لك للقراءة فقط، ولا تظهر عليه أدوات التقييم أو القرار.'
            : 'This is your own application. You can read it, but the scoring and decision tools are hidden.'}
        </Alert>
      ) : !decidable ? (
        <p className="text-sm text-muted">
          {ar
            ? 'اتُّخذ قرار في هذا الطلب، أو هو بانتظار المتقدّم.'
            : 'This application was decided, or is waiting for the applicant.'}
        </p>
      ) : (
        <>
          <p
            className={cn(
              'flex flex-wrap items-center gap-2 rounded-shape-lg px-3 py-2 text-sm',
              p.status === 'under_review' ? 'bg-accent-soft' : 'bg-surface-raised text-muted',
            )}
          >
            {p.status === 'under_review' ? (
              <>
                <Hand size={15} aria-hidden="true" className="text-accent-text" />
                {p.reviewerId === p.userId
                  ? ar
                    ? 'أنت تراجع هذا الطلب'
                    : 'You are reviewing this'
                  : ar
                    ? `يراجعه ${p.reviewerName ?? 'مراجع آخر'}`
                    : `Being reviewed by ${p.reviewerName ?? 'another reviewer'}`}
                {(p.reviewerId === p.userId || p.isAdmin) && (
                  <button
                    type="button"
                    onClick={() => claim(true)}
                    className="text-accent-text underline underline-offset-4"
                    disabled={busy}
                  >
                    {ar ? 'إفلات' : 'Release'}
                  </button>
                )}
              </>
            ) : p.status === 'submitted' ? (
              <button
                type="button"
                onClick={() => claim(false)}
                className="text-accent-text underline underline-offset-4"
                disabled={busy}
              >
                {ar ? 'استلم هذا الطلب للمراجعة' : 'Claim this application'}
              </button>
            ) : null}
          </p>
          {error && <Alert tone="danger">{error}</Alert>}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={cn(decisionBtn, btnPrimary)}
              disabled={busy || claimedByOther || full}
              title={
                full
                  ? ar
                    ? 'اكتمل العدد المحدد للقبول'
                    : 'The acceptance limit is reached'
                  : undefined
              }
              onClick={() => ask('accept')}
            >
              <span>{ar ? 'قبول' : 'Accept'}</span>
              <span className={kbd}>A</span>
            </button>
            <button
              type="button"
              className={cn(decisionBtn, btnQuiet)}
              disabled={busy || claimedByOther}
              onClick={() => ask('waitlist')}
            >
              <span>{ar ? 'انتظار' : 'Waitlist'}</span>
              <span className={kbd}>W</span>
            </button>
            <button
              type="button"
              className={cn(decisionBtn, btnDanger)}
              disabled={busy || claimedByOther}
              onClick={() => ask('reject')}
            >
              <span>{ar ? 'عدم قبول' : 'Reject'}</span>
              <span className={kbd}>R</span>
            </button>
            <button
              type="button"
              className={cn(decisionBtn, btnQuiet)}
              disabled={busy || claimedByOther}
              onClick={() => setInfoOpen(true)}
            >
              <span>{ar ? 'طلب تعديل' : 'Ask to edit'}</span>
              <span className={kbd}>I</span>
            </button>
          </div>
          <Textarea
            label={ar ? 'ملاحظة داخلية' : 'Internal note'}
            hint={ar ? 'لا يراها المتقدّم أبداً.' : 'The applicant never sees it.'}
            value={note}
            maxLength={1000}
            rows={3}
            onChange={(e) => setNote(e.target.value)}
          />
          <Checkbox
            label={
              ar ? 'افتح الطلب التالي بعد القرار' : 'Open the next application after the decision'
            }
            checked={openNext}
            onChange={(e) => setOpenNext(e.target.checked)}
          />
          <p className="hidden items-center gap-1.5 text-xs text-muted lg:flex">
            <Keyboard size={13} aria-hidden="true" />
            {ar ? 'J السابق · K التالي' : 'J previous · K next'}
          </p>
        </>
      )}
    </section>
  );

  const scoreCard =
    p.rubric.length > 0 && !p.isOwn ? (
      <section
        className="flex flex-col gap-4 rounded-shape-xl border border-line bg-surface p-5"
        aria-labelledby="rv-score"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id="rv-score" className="flex items-center gap-2 font-bold">
            <Star size={16} aria-hidden="true" />
            {ar ? 'تقييم' : 'Score'}
          </h2>
          <p className="text-sm text-muted tabular-nums">
            <span className="text-3xl font-extrabold text-accent-text">
              {mean === null ? '—' : mean.toFixed(1)}
            </span>{' '}
            / 5
          </p>
        </div>
        {p.rubric.map((r) => (
          <fieldset key={r.key} className="flex flex-col gap-2" disabled={!OPEN.includes(p.status)}>
            <legend className="flex w-full items-center justify-between gap-2 text-sm font-semibold">
              <span>{ar ? r.label_ar : r.label_en || r.label_ar}</span>
              <span className="text-xs font-normal text-muted">
                {ar ? `الوزن ×${r.weight}` : `Weight ×${r.weight}`}
              </span>
            </legend>
            <div
              role="radiogroup"
              aria-label={ar ? r.label_ar : r.label_en || r.label_ar}
              className="grid grid-cols-5 gap-1.5"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={scores[r.key] === n}
                  onClick={() => setScores((s) => ({ ...s, [r.key]: n }))}
                  className={cn(
                    'min-h-11 rounded-shape-md text-sm font-bold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-focus-ring',
                    scores[r.key] === n
                      ? 'bg-accent text-on-accent'
                      : 'bg-surface-raised text-muted hover:text-text',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </fieldset>
        ))}
        {OPEN.includes(p.status) && (
          <>
            <Textarea
              label={ar ? 'تعليق قصير يراه المراجعون فقط' : 'A short comment only reviewers see'}
              value={comment}
              maxLength={500}
              rows={2}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button variant="secondary" disabled={!scoreComplete || busy} onClick={saveMyScore}>
              {ar ? 'حفظ التقييم' : 'Save my score'}
            </Button>
            {savedAt && (
              <p
                role="status"
                className="m-pop flex items-center gap-1.5 text-sm font-medium text-success"
              >
                <CircleCheck size={15} aria-hidden="true" />
                {ar ? `حُفظ تقييمك ${savedAt}` : `Your score was saved at ${savedAt}`}
              </p>
            )}
          </>
        )}
        {others.length > 0 && (
          <ul className="flex flex-col gap-3 border-t border-line pt-3">
            {others.map((s) => (
              <li key={s.reviewerId} className="text-sm">
                <p className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-medium">
                    <Avatar name={s.reviewerName ?? '?'} size={24} />
                    {s.reviewerName}
                  </span>
                  <span className="font-bold tabular-nums">
                    {weightedMean(s.scores, p.rubric)?.toFixed(1) ?? '—'}
                  </span>
                </p>
                {s.comment && <p className="text-muted">«{s.comment}»</p>}
              </li>
            ))}
          </ul>
        )}
        <p className="rounded-shape-md bg-surface-raised p-3 text-xs text-muted">
          {ar
            ? 'الدرجة تُعين ولا تقرّر، ولا يراها المتقدّم أبداً.'
            : 'The score informs, it never decides, and the applicant never sees it.'}
        </p>
      </section>
    ) : null;

  return (
    <>
      <div className="flex flex-col gap-4 lg:sticky lg:top-20">
        {scoreCard}
        <div className="max-md:hidden">{decisionCard}</div>
      </div>

      {/* Phone: the decision stays in reach at the bottom. */}
      {decidable && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface-overlay p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-elev-2 md:hidden">
          <div className="mb-2 flex items-center justify-between text-xs text-muted tabular-nums">
            <span>
              {p.rubric.length > 0 && mean !== null
                ? ar
                  ? `متوسطك ${mean.toFixed(1)}`
                  : `Your mean ${mean.toFixed(1)}`
                : ''}
            </span>
            {p.capacity && (
              <span>
                {p.capacity.capacity} / {p.capacity.accepted}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={busy || claimedByOther || full}
              onClick={() => ask('accept')}
            >
              {ar ? 'قبول' : 'Accept'}
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              disabled={busy || claimedByOther}
              onClick={() => ask('waitlist')}
            >
              {ar ? 'انتظار' : 'Waitlist'}
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              disabled={busy || claimedByOther}
              onClick={() => setInfoOpen(true)}
            >
              {ar ? 'تعديل' : 'Edit'}
            </Button>
            <Button
              variant="destructive"
              aria-label={ar ? 'عدم قبول' : 'Reject'}
              disabled={busy || claimedByOther}
              onClick={() => ask('reject')}
            >
              {ar ? 'رفض' : 'Reject'}
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={confirm === 'reject'}
        onClose={() => setConfirm(null)}
        busy={busy}
        title={ar ? 'عدم قبول هذا الطلب؟' : 'Reject this application?'}
        description={
          ar
            ? 'يصل المتقدّم بريد بسيط بلا ملاحظة ولا سبب. يمكنك التراجع خلال لحظات قبل إرساله.'
            : 'The applicant gets a plain e-mail with no note and no reason. You can undo for a few seconds before it is sent.'
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)} disabled={busy}>
              {ar ? 'تراجع' : 'Back'}
            </Button>
            <Button variant="destructive" onClick={() => decide('reject')} loading={busy}>
              {ar ? 'عدم قبول' : 'Reject'}
            </Button>
          </>
        }
      >
        <span className="sr-only">{ar ? 'تأكيد' : 'Confirm'}</span>
      </Dialog>

      <Dialog
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        busy={busy}
        title={ar ? 'طلب تعديل من المتقدّم' : 'Ask the applicant to edit'}
        description={
          ar
            ? 'يعدّل المتقدّم الأجزاء التي تحدّدها فقط ثم يعيد الإرسال.'
            : 'The applicant edits only the parts you choose, then resubmits.'
        }
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setInfoOpen(false)} disabled={busy}>
              {ar ? 'تراجع' : 'Back'}
            </Button>
            <Button onClick={sendInfo} loading={busy} disabled={!infoText.trim()}>
              {ar ? 'أرسل الطلب' : 'Send the request'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <Textarea
            label={ar ? 'رسالتك إلى المتقدّم' : 'Your message to the applicant'}
            hint={
              ar
                ? 'تظهر له في صفحة المتابعة وفي البريد.'
                : 'Shown on the tracking page and in the e-mail.'
            }
            value={infoText}
            maxLength={1000}
            counter
            rows={4}
            onChange={(e) => setInfoText(e.target.value)}
          />
          <fieldset className="flex flex-col">
            <legend className="mb-1 text-sm font-semibold">
              {ar ? 'الأجزاء التي يمكنه تعديلها' : 'Parts they may edit'}
            </legend>
            {p.fixable.map((f) => (
              <Checkbox
                key={f.key}
                label={f.label}
                checked={infoFields.includes(f.key)}
                onChange={(e) =>
                  setInfoFields((cur) =>
                    e.target.checked ? [...cur, f.key] : cur.filter((x) => x !== f.key),
                  )
                }
              />
            ))}
          </fieldset>
        </div>
      </Dialog>
    </>
  );
}
