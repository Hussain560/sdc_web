'use client';

import { Check, UserCheck, UserMinus, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Badge, Button, Dialog, Textarea, useToast, Avatar, IconAction } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { Link, useRouter } from '@/i18n/navigation';
import { formatRelative } from '@/lib/format';
import { membershipMessage } from '../messages';
import { claimApplication, decideApplications, type ApplicationOutcome } from '../review-actions';
import type { ReviewApplication } from '../review-queries';
import { ACADEMIC_LABEL, APPLICATION_STATUS_LABEL, type AcademicStatus } from '../types';

type Decision = 'accept' | 'reject' | 'waitlist';

/**
 * Reviewer table (screen 18): select rows, decide in bulk or one by one, claim to avoid double work.
 * The database decides each row independently (self-decision, capacity, state), and the table reports every
 * outcome, so one blocked row never hides the rest.
 */
export function ApplicationsTable({
  rows,
  userId,
  isAdmin,
}: {
  rows: ReviewApplication[];
  userId: string;
  isAdmin: boolean;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<{ ids: string[]; decision: Decision } | null>(null);
  const [note, setNote] = useState('');
  const toast = useToast();
  const [busy, startTransition] = useTransition();

  const open = (r: ReviewApplication) =>
    ['submitted', 'under_review', 'waitlisted'].includes(r.status);
  const selectable = rows.filter(open);
  const allSelected = selectable.length > 0 && selectable.every((r) => selected.has(r.id));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const summarize = (results: ApplicationOutcome[]) => {
    const okCount = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok);
    if (failed.length === 0) {
      toast.success(ar ? `تم تنفيذ القرار على ${okCount}.` : `Decision applied to ${okCount}.`);
      return;
    }
    const why = failed[0]!.code ? membershipMessage(failed[0]!.code, lang) : '';
    toast.warning(
      ar
        ? `نجح ${okCount} وتعذّر ${failed.length}. ${why}`
        : `${okCount} succeeded, ${failed.length} skipped. ${why}`,
    );
  };

  const run = () => {
    if (!pending) return;
    startTransition(async () => {
      const r = await decideApplications(
        { ids: pending.ids, decision: pending.decision, note },
        { lang },
      );
      setPending(null);
      setNote('');
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      summarize(r.data);
      setSelected(new Set());
      router.refresh();
    });
  };

  const claim = (id: string, release: boolean) => {
    startTransition(async () => {
      const r = await claimApplication({ id, release }, { lang });
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
  };

  const ask = (ids: string[], decision: Decision) => {
    setPending({ ids, decision });
  };

  const decisionTitle: Record<Decision, string> = {
    accept: ar ? 'قبول الطلبات' : 'Accept applications',
    reject: ar ? 'رفض الطلبات' : 'Reject applications',
    waitlist: ar ? 'نقل إلى قائمة الانتظار' : 'Move to the waiting list',
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
              ? 'حدّد طلبات لاتخاذ قرار جماعي'
              : 'Select applications to decide in bulk'}
        </span>
        <Button disabled={selected.size === 0 || busy} onClick={() => ask([...selected], 'accept')}>
          {ar ? 'قبول' : 'Accept'}
        </Button>
        <Button
          variant="secondary"
          disabled={selected.size === 0 || busy}
          onClick={() => ask([...selected], 'waitlist')}
        >
          {ar ? 'قائمة الانتظار' : 'Waitlist'}
        </Button>
        <Button
          variant="danger"
          disabled={selected.size === 0 || busy}
          onClick={() => ask([...selected], 'reject')}
        >
          {ar ? 'رفض' : 'Reject'}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-line bg-surface-raised text-xs text-muted">
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
                {ar ? 'المتقدم' : 'Applicant'}
              </th>
              <th scope="col" className={th}>
                {ar ? 'الدراسة / المسار' : 'Study / track'}
              </th>
              <th scope="col" className={th}>
                {ar ? 'التقديم' : 'Submitted'}
              </th>
              <th scope="col" className={th}>
                {ar ? 'الحالة' : 'Status'}
              </th>
              <th scope="col" className={th}>
                <span className="sr-only">{ar ? 'إجراءات' : 'Actions'}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const st = APPLICATION_STATUS_LABEL[r.status];
              const mine = r.reviewerId === userId;
              const claimedByOther = r.status === 'under_review' && !mine;
              const own = false;
              return (
                <tr
                  key={r.id}
                  className="border-b border-line align-middle transition-colors last:border-0 hover:bg-surface-raised"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={
                        ar ? `تحديد ${r.fullNameAr}` : `Select ${r.fullNameEn || r.fullNameAr}`
                      }
                      checked={selected.has(r.id)}
                      disabled={!open(r)}
                      onChange={() => toggle(r.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={ar ? r.fullNameAr : r.fullNameEn || r.fullNameAr} />
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/membership/applications/${r.id}`}
                          className="block truncate font-medium hover:text-accent"
                        >
                          {ar ? r.fullNameAr : r.fullNameEn || r.fullNameAr}
                        </Link>
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
                  <td className="px-4 py-3 text-muted">
                    {[
                      ACADEMIC_LABEL[r.academicStatus as AcademicStatus]?.[lang],
                      r.university,
                      r.track,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </td>
                  <td className="px-4 py-3 text-muted">{formatRelative(r.submittedAt, lang)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={st.tone}>{st.label[lang]}</Badge>
                    {claimedByOther && (
                      <p className="mt-1 text-xs text-muted">
                        {ar ? 'قيد مراجعة مراجع آخر' : 'Being reviewed by someone else'}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {r.status === 'submitted' && (
                        <IconAction
                          label={ar ? 'استلام' : 'Claim'}
                          disabled={busy}
                          onClick={() => claim(r.id, false)}
                        >
                          <UserCheck size={16} aria-hidden="true" />
                        </IconAction>
                      )}
                      {r.status === 'under_review' && (mine || isAdmin) && (
                        <IconAction
                          label={ar ? 'إفلات' : 'Release'}
                          disabled={busy}
                          onClick={() => claim(r.id, true)}
                        >
                          <UserMinus size={16} aria-hidden="true" />
                        </IconAction>
                      )}
                      {open(r) && !own && (
                        <>
                          <IconAction
                            label={ar ? 'قبول' : 'Accept'}
                            tone="accent"
                            disabled={busy || claimedByOther}
                            onClick={() => ask([r.id], 'accept')}
                          >
                            <Check size={16} aria-hidden="true" />
                          </IconAction>
                          <IconAction
                            label={ar ? 'رفض' : 'Reject'}
                            tone="danger"
                            disabled={busy || claimedByOther}
                            onClick={() => ask([r.id], 'reject')}
                          >
                            <X size={16} aria-hidden="true" />
                          </IconAction>
                        </>
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
        open={pending !== null}
        onClose={() => setPending(null)}
        title={pending ? decisionTitle[pending.decision] : ''}
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            {pending && pending.ids.length > 1
              ? ar
                ? `سيُطبَّق القرار على ${pending.ids.length} طلبًا وسيصل المتقدمين بريد إلكتروني.`
                : `The decision applies to ${pending.ids.length} applications and the applicants are e-mailed.`
              : ar
                ? 'سيصل المتقدم بريد إلكتروني بالقرار.'
                : 'The applicant is e-mailed the decision.'}
          </p>
          <Textarea
            label={
              ar
                ? 'ملاحظة داخلية (لا تظهر للمتقدم)'
                : 'Internal note (never shown to the applicant)'
            }
            value={note}
            maxLength={1000}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPending(null)} disabled={busy}>
              {ar ? 'تراجع' : 'Back'}
            </Button>
            <Button
              variant={pending?.decision === 'reject' ? 'danger' : 'primary'}
              onClick={run}
              loading={busy}
            >
              {ar ? 'تأكيد' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
