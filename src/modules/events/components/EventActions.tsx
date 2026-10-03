'use client';

import { useState, useTransition } from 'react';
import { Button, Dialog, Textarea, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { Link, useRouter } from '@/i18n/navigation';
import { deleteEventDraft, transitionEvent, type TransitionAction } from '../actions';
import type { EventStatus } from '../types';

export type EventPerms = {
  edit: boolean;
  submit: boolean;
  approve: boolean;
  cancel: boolean;
  complete: boolean;
  delete: boolean;
};

const DONE: Record<TransitionAction, { ar: string; en: string }> = {
  submit: { ar: 'أُرسلت الفعالية للمراجعة.', en: 'Event sent for review.' },
  withdraw: { ar: 'تم سحب الطلب.', en: 'Request withdrawn.' },
  approve: { ar: 'تم اعتماد الفعالية ونشرها.', en: 'Event approved and published.' },
  request_changes: { ar: 'أُرسلت طلبات التعديل.', en: 'Change request sent.' },
  cancel: { ar: 'أُلغيت الفعالية.', en: 'Event cancelled.' },
  complete: { ar: 'أُغلقت الفعالية كمكتملة.', en: 'Event marked as completed.' },
  archive: { ar: 'أُرشفت الفعالية.', en: 'Event archived.' },
};

type Pending = null | 'request_changes' | 'cancel' | 'delete';

/**
 * Lifecycle actions for one event (docs/10-design-system/INTERNAL-SCREENS/14-event-detail-review.md §2).
 * Actions the user can never perform are omitted; actions blocked by state are disabled with a reason.
 * Every transition is re-checked by `transition_event()` in the database.
 */
export function EventActions({
  id,
  status,
  perms,
  hasEnded,
  attendancePending = false,
}: {
  id: string;
  status: EventStatus;
  perms: EventPerms;
  hasEnded: boolean;
  /** Sessions exist but the event's attendance is not signed off yet. */
  attendancePending?: boolean;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();
  const [dialog, setDialog] = useState<Pending>(null);
  const [note, setNote] = useState('');
  const toast = useToast();
  const [busy, startTransition] = useTransition();

  const run = (action: TransitionAction, withNote?: string) => {
    startTransition(async () => {
      const r = await transitionEvent({ id, action, note: withNote }, { lang });
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      toast.success(DONE[action][lang]);
      setDialog(null);
      setNote('');
      router.refresh();
    });
  };

  const remove = () => {
    startTransition(async () => {
      const r = await deleteEventDraft(id, { lang });
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      toast.success(ar ? 'حُذفت المسودة.' : 'Draft deleted.');
      router.replace('/dashboard/events');
    });
  };

  const editLink = (
    <Link
      href={`/dashboard/events/${id}/edit`}
      className="inline-flex min-h-10 items-center rounded-full border border-line-accent px-5 text-sm font-semibold text-accent hover:bg-surface-raised"
    >
      {ar ? 'تعديل' : 'Edit'}
    </Link>
  );

  const buttons: React.ReactNode[] = [];
  const push = (n: React.ReactNode) => buttons.push(n);

  if (status === 'draft' || status === 'changes_requested') {
    if (perms.edit) push(<span key="edit">{editLink}</span>);
    if (perms.approve && status === 'draft') {
      push(
        <Button key="approve" loading={busy} onClick={() => run('approve')}>
          {ar ? 'اعتماد ونشر مباشرة' : 'Approve & publish'}
        </Button>,
      );
    } else if (perms.submit) {
      push(
        <Button key="submit" loading={busy} onClick={() => run('submit')}>
          {status === 'changes_requested'
            ? ar
              ? 'إعادة الإرسال'
              : 'Resubmit'
            : ar
              ? 'إرسال للاعتماد'
              : 'Submit for review'}
        </Button>,
      );
    }
    if (perms.delete) {
      push(
        <Button key="delete" variant="ghost" onClick={() => setDialog('delete')}>
          {ar ? 'حذف' : 'Delete'}
        </Button>,
      );
    }
  }
  if (status === 'pending_review') {
    if (perms.approve) {
      push(
        <Button key="request" variant="secondary" onClick={() => setDialog('request_changes')}>
          {ar ? 'طلب تعديلات' : 'Request changes'}
        </Button>,
      );
      push(
        <Button key="approve" loading={busy} onClick={() => run('approve')}>
          {ar ? 'اعتماد ونشر' : 'Approve & publish'}
        </Button>,
      );
    }
    if (perms.submit) {
      push(
        <Button key="withdraw" variant="ghost" loading={busy} onClick={() => run('withdraw')}>
          {ar ? 'سحب الطلب' : 'Withdraw'}
        </Button>,
      );
    }
  }
  if (status === 'published') {
    if (perms.edit && perms.cancel) push(<span key="edit">{editLink}</span>);
    if (perms.complete) {
      push(
        <Button
          key="complete"
          variant="secondary"
          loading={busy}
          disabledReason={
            !hasEnded
              ? ar
                ? 'متاح بعد انتهاء الفعالية'
                : 'Available after the event ends'
              : attendancePending
                ? ar
                  ? 'اعتمد حضور الفعالية أولًا (تبويب الحضور)'
                  : 'Finalize the attendance first (Attendance tab)'
                : undefined
          }
          onClick={() => run('complete')}
        >
          {ar ? 'إكمال' : 'Complete'}
        </Button>,
      );
    }
    if (perms.cancel) {
      push(
        <Button key="cancel" variant="danger" onClick={() => setDialog('cancel')}>
          {ar ? 'إلغاء الفعالية' : 'Cancel event'}
        </Button>,
      );
    }
  }
  if ((status === 'completed' || status === 'cancelled') && perms.complete) {
    push(
      <Button key="archive" variant="secondary" loading={busy} onClick={() => run('archive')}>
        {ar ? 'أرشفة' : 'Archive'}
      </Button>,
    );
  }

  const title =
    dialog === 'request_changes'
      ? ar
        ? 'طلب تعديلات على الفعالية'
        : 'Request changes'
      : dialog === 'cancel'
        ? ar
          ? 'إلغاء الفعالية'
          : 'Cancel event'
        : ar
          ? 'حذف المسودة'
          : 'Delete draft';

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">{buttons}</div>

      <Dialog
        open={dialog !== null}
        onClose={() => {
          setDialog(null);
          setNote('');
        }}
        title={title}
      >
        {dialog === 'delete' ? (
          <div className="flex flex-col gap-4">
            <p className="text-muted">
              {ar ? 'سيُحذف هذا المسودة نهائيًا.' : 'This draft will be deleted permanently.'}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDialog(null)}>
                {ar ? 'تراجع' : 'Back'}
              </Button>
              <Button variant="danger" loading={busy} onClick={remove}>
                {ar ? 'حذف' : 'Delete'}
              </Button>
            </div>
          </div>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              run(dialog === 'cancel' ? 'cancel' : 'request_changes', note);
            }}
          >
            <p className="text-muted">
              {dialog === 'cancel'
                ? ar
                  ? 'يظهر السبب في الصفحة العامة وفي رسالة الإشعار.'
                  : 'The reason is shown on the public page and in the notification.'
                : ar
                  ? 'ستعود الفعالية إلى اللجنة للتعديل وإعادة الإرسال. 10 أحرف على الأقل.'
                  : 'The event returns to the committee to edit and resubmit. At least 10 characters.'}
            </p>
            <Textarea
              label={
                dialog === 'cancel'
                  ? ar
                    ? 'سبب الإلغاء *'
                    : 'Reason *'
                  : ar
                    ? 'الملاحظات *'
                    : 'Notes *'
              }
              value={note}
              required
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setDialog(null)}>
                {ar ? 'تراجع' : 'Back'}
              </Button>
              <Button
                type="submit"
                variant={dialog === 'cancel' ? 'danger' : 'primary'}
                loading={busy}
              >
                {dialog === 'cancel'
                  ? ar
                    ? 'إلغاء الفعالية'
                    : 'Cancel event'
                  : ar
                    ? 'إرسال الملاحظات'
                    : 'Send notes'}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </>
  );
}
