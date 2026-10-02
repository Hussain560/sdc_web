'use client';

import { useState, useTransition } from 'react';
import { Alert, Button, Dialog, Field } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { Link, useRouter } from '@/i18n/navigation';
import { transitionCycle, type CycleAction } from '../actions';
import type { CyclePhase } from '../types';

type Pending = null | 'extend' | 'close_early' | 'complete' | 'delete' | 'unpublish' | 'open_now';

/** Contextual actions of one cycle (screen 17 §2). Allowed-but-not-now actions are disabled with a reason. */
export function CycleActions({
  id,
  status,
  phase,
  undecided,
}: {
  id: string;
  status: 'draft' | 'published' | 'completed';
  phase: CyclePhase;
  /** Applications still in submitted / under review. */
  undecided: number;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();
  const [dialog, setDialog] = useState<Pending>(null);
  const [closesAt, setClosesAt] = useState('');
  const [error, setError] = useState('');
  const [busy, startTransition] = useTransition();

  const run = (action: CycleAction, extra?: { closesAt?: string }) => {
    setError('');
    startTransition(async () => {
      const r = await transitionCycle({ id, action, ...extra }, { lang });
      if (!r.ok) {
        setError(r.message);
        return;
      }
      setDialog(null);
      router.refresh();
    });
  };

  const small = 'min-h-9 px-4 text-sm';
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== 'completed' && (
        <Link
          href={`/dashboard/membership/cycles/${id}/edit`}
          className="inline-flex min-h-9 items-center rounded-full border border-line-accent px-4 text-sm font-semibold text-accent hover:bg-surface-raised"
        >
          {ar ? 'تعديل' : 'Edit'}
        </Link>
      )}
      {status === 'draft' && (
        <>
          <Button className={small} disabled={busy} onClick={() => run('publish')}>
            {ar ? 'نشر الجدول' : 'Publish'}
          </Button>
          <Button
            variant="secondary"
            className={small}
            disabled={busy}
            onClick={() => setDialog('open_now')}
          >
            {ar ? 'فتح الآن' : 'Open now'}
          </Button>
          <Button
            variant="ghost"
            className={small}
            disabled={busy}
            onClick={() => setDialog('delete')}
          >
            {ar ? 'حذف' : 'Delete'}
          </Button>
        </>
      )}
      {phase === 'scheduled' && (
        <>
          <Button
            variant="secondary"
            className={small}
            disabled={busy}
            onClick={() => setDialog('open_now')}
          >
            {ar ? 'فتح الآن' : 'Open now'}
          </Button>
          <Button
            variant="ghost"
            className={small}
            disabled={busy}
            onClick={() => setDialog('unpublish')}
          >
            {ar ? 'إلغاء النشر' : 'Unpublish'}
          </Button>
        </>
      )}
      {(phase === 'open' || phase === 'closed') && (
        <Button
          variant="secondary"
          className={small}
          disabled={busy}
          onClick={() => setDialog('extend')}
        >
          {ar ? 'تمديد' : 'Extend'}
        </Button>
      )}
      {phase === 'open' && (
        <Button
          variant="ghost"
          className={small}
          disabled={busy}
          onClick={() => setDialog('close_early')}
        >
          {ar ? 'إغلاق مبكر' : 'Close early'}
        </Button>
      )}
      {phase === 'closed' && (
        <Button
          className={small}
          disabled={busy}
          disabledReason={
            undecided > 0
              ? ar
                ? `يوجد ${undecided} طلبًا دون قرار`
                : `${undecided} application(s) without a decision`
              : undefined
          }
          onClick={() => setDialog('complete')}
        >
          {ar ? 'إكمال الدورة' : 'Complete cycle'}
        </Button>
      )}

      <Dialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        title={dialogTitle(dialog, ar)}
      >
        <div className="flex flex-col gap-3">
          {dialog === 'extend' && (
            <>
              <p className="text-sm text-muted">
                {ar
                  ? 'إذا كانت الدورة مغلقة فستُفتح صفحة الانضمام فورًا.'
                  : 'If the cycle is closed, /join reopens immediately.'}
              </p>
              <Field
                type="datetime-local"
                label={ar ? 'يغلق في (بتوقيت السعودية)' : 'New closing time (Saudi time)'}
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                dir="ltr"
              />
            </>
          )}
          {dialog === 'close_early' && (
            <p>
              {ar
                ? 'سيُغلق باب التقديم الآن ولن يُقبل أي طلب جديد.'
                : 'Applications close now and no new ones are accepted.'}
            </p>
          )}
          {dialog === 'open_now' && (
            <p>
              {ar
                ? 'سيُضبط وقت الفتح على الآن وتُنشر الدورة.'
                : 'The opening time moves to now and the cycle is published.'}
            </p>
          )}
          {dialog === 'unpublish' && (
            <p>{ar ? 'ستعود الدورة إلى مسودة.' : 'The cycle goes back to a draft.'}</p>
          )}
          {dialog === 'complete' && (
            <p>
              {ar
                ? 'ستُرفض الطلبات المتبقية في قائمة الانتظار وتُكتمل الدورة.'
                : 'Remaining waitlisted applications will be rejected and the cycle completed.'}
            </p>
          )}
          {dialog === 'delete' && (
            <p>{ar ? 'ستُحذف المسودة نهائيًا.' : 'The draft is deleted permanently.'}</p>
          )}
          {error && <Alert tone="danger">{error}</Alert>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialog(null)} disabled={busy}>
              {ar ? 'تراجع' : 'Back'}
            </Button>
            <Button
              variant={dialog === 'delete' ? 'danger' : 'primary'}
              loading={busy}
              disabled={dialog === 'extend' && !closesAt}
              onClick={() =>
                dialog && run(dialog as CycleAction, dialog === 'extend' ? { closesAt } : undefined)
              }
            >
              {ar ? 'تأكيد' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function dialogTitle(d: Pending, ar: boolean) {
  const t: Record<Exclude<Pending, null>, [string, string]> = {
    extend: ['تمديد الدورة', 'Extend the cycle'],
    close_early: ['إغلاق مبكر', 'Close early'],
    complete: ['إكمال الدورة', 'Complete the cycle'],
    delete: ['حذف المسودة', 'Delete the draft'],
    unpublish: ['إلغاء النشر', 'Unpublish'],
    open_now: ['فتح الآن', 'Open now'],
  };
  return d ? t[d][ar ? 0 : 1] : '';
}
