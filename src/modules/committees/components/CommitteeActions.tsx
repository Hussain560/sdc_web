'use client';

import { useState, useTransition } from 'react';
import { Button, Dialog, Textarea, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import { deleteCommittee, setCommitteeStatus } from '../actions';

/** Deactivate (with a reason; open positions end), reactivate and delete (only when it owns nothing). */
export function CommitteeActions({
  id,
  name,
  status,
  openPositions,
}: {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  openPositions: number;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const router = useRouter();
  const toast = useToast();
  const [dialog, setDialog] = useState<null | 'deactivate' | 'delete'>(null);
  const [reason, setReason] = useState('');
  const [busy, startTransition] = useTransition();

  const reactivate = () =>
    startTransition(async () => {
      const r = await setCommitteeStatus({ id, active: true }, { lang });
      if (!r.ok) toast.error(r.message);
      else {
        toast.success(L('أُعيد تفعيل اللجنة.', 'Committee reactivated.'));
        router.refresh();
      }
    });

  return (
    <>
      {status === 'active' ? (
        <Button variant="ghost" onClick={() => setDialog('deactivate')} disabled={busy}>
          {L('تعطيل', 'Deactivate')}
        </Button>
      ) : (
        <Button variant="secondary" onClick={reactivate} loading={busy}>
          {L('إعادة التفعيل', 'Reactivate')}
        </Button>
      )}
      <Button variant="ghost" onClick={() => setDialog('delete')} disabled={busy}>
        {L('حذف', 'Delete')}
      </Button>

      <Dialog
        open={dialog === 'deactivate'}
        onClose={() => setDialog(null)}
        title={L('تعطيل اللجنة', 'Deactivate the committee')}
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            {L(
              `ستُنهى ${openPositions} مناصب مفتوحة في «${name}». تبقى فعالياتها ومقالاتها منشورة، ولا يمكن إنشاء جديد لها.`,
              `${openPositions} open positions in “${name}” will end. Its events and threads stay published, and nothing new can be created for it.`,
            )}
          </p>
          <Textarea
            label={L('السبب *', 'Reason *')}
            value={reason}
            maxLength={300}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialog(null)} disabled={busy}>
              {L('تراجع', 'Back')}
            </Button>
            <Button
              variant="danger"
              loading={busy}
              onClick={() =>
                startTransition(async () => {
                  const r = await setCommitteeStatus({ id, active: false, reason }, { lang });
                  if (!r.ok) {
                    toast.error(r.message);
                    return;
                  }
                  setDialog(null);
                  setReason('');
                  toast.success(
                    L(
                      `عُطّلت اللجنة وانتهت ${r.data.positionsEnded} مناصب.`,
                      `Committee deactivated; ${r.data.positionsEnded} positions ended.`,
                    ),
                  );
                  router.refresh();
                })
              }
            >
              {L('تعطيل', 'Deactivate')}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={dialog === 'delete'}
        onClose={() => setDialog(null)}
        title={L('حذف اللجنة', 'Delete the committee')}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            {L(
              'يُحذف فقط ما لا يملك فعاليات أو مقالات أو مناصب. غير ذلك: عطّله.',
              'Only a committee that owns no events, threads or positions can be deleted. Otherwise deactivate it.',
            )}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialog(null)} disabled={busy}>
              {L('تراجع', 'Back')}
            </Button>
            <Button
              variant="danger"
              loading={busy}
              onClick={() =>
                startTransition(async () => {
                  const r = await deleteCommittee(id, { lang });
                  if (!r.ok) {
                    toast.error(r.message);
                    setDialog(null);
                    return;
                  }
                  toast.success(L('حُذفت اللجنة.', 'Committee deleted.'));
                  router.replace('/dashboard/committees');
                })
              }
            >
              {L('حذف', 'Delete')}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
