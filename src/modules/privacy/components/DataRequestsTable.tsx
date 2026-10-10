'use client';

import { useState, useTransition } from 'react';
import { Badge, Button, Dialog, Textarea, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import { handleDataRequest } from '../actions';

export type DataRequestRow = {
  id: string;
  email: string;
  reason: string | null;
  note: string | null;
  status: 'pending' | 'done' | 'rejected';
  createdAt: string;
  handledAt: string | null;
};

/** Deletion requests (SEC-003). Completing one anonymizes the person everywhere and removes their account. */
export function DataRequestsTable({ rows }: { rows: DataRequestRow[] }) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const router = useRouter();
  const toast = useToast();
  const [busy, startTransition] = useTransition();
  const [target, setTarget] = useState<null | {
    row: DataRequestRow;
    decision: 'done' | 'rejected';
  }>(null);
  const [note, setNote] = useState('');

  const when = (iso: string) =>
    new Intl.DateTimeFormat(ar ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
      dateStyle: 'medium',
      timeZone: 'Asia/Riyadh',
    }).format(new Date(iso));

  const run = () => {
    if (!target) return;
    startTransition(async () => {
      const r = await handleDataRequest(
        { id: target.row.id, decision: target.decision, note },
        { lang },
      );
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      toast.success(
        target.decision === 'done'
          ? L(
              'اكتمل الطلب: أُجهّلت البيانات وحُذف الحساب.',
              'Request completed: the data was anonymized and the account removed.',
            )
          : L('رُفض الطلب.', 'Request rejected.'),
      );
      setTarget(null);
      setNote('');
      router.refresh();
    });
  };

  if (rows.length === 0)
    return (
      <p className="rounded-shape-xl border border-dashed border-line bg-surface p-8 text-center text-muted">
        {L('لا توجد طلبات.', 'No requests.')}
      </p>
    );

  return (
    <>
      <div className="overflow-x-auto rounded-shape-xl border border-line bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr>
              {[
                L('الشخص', 'Person'),
                L('السبب', 'Reason'),
                L('التاريخ', 'Date'),
                L('الحالة', 'Status'),
                '',
              ].map((h, i) => (
                <th key={i} scope="col" className="px-4 py-3 text-start font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line align-middle last:border-0">
                <td className="px-4 py-3" dir="ltr" style={{ textAlign: 'start' }}>
                  {r.email}
                </td>
                <td className="px-4 py-3 text-muted">{r.reason ?? '—'}</td>
                <td className="px-4 py-3 text-muted">{when(r.createdAt)}</td>
                <td className="px-4 py-3">
                  <Badge
                    tone={
                      r.status === 'pending'
                        ? 'warning'
                        : r.status === 'done'
                          ? 'accent'
                          : 'neutral'
                    }
                  >
                    {r.status === 'pending'
                      ? L('قيد المراجعة', 'Waiting')
                      : r.status === 'done'
                        ? L('مكتمل', 'Done')
                        : L('مرفوض', 'Rejected')}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {r.status === 'pending' && (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        className="min-h-9 px-3 text-xs"
                        onClick={() => setTarget({ row: r, decision: 'rejected' })}
                      >
                        {L('رفض', 'Reject')}
                      </Button>
                      <Button
                        variant="danger"
                        className="min-h-9 px-3 text-xs"
                        onClick={() => setTarget({ row: r, decision: 'done' })}
                      >
                        {L('تنفيذ الحذف', 'Complete deletion')}
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={target !== null}
        onClose={() => (busy ? undefined : setTarget(null))}
        title={
          target?.decision === 'done'
            ? L('تنفيذ طلب الحذف', 'Complete the deletion')
            : L('رفض الطلب', 'Reject the request')
        }
      >
        {target && (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              <strong dir="ltr">{target.row.email}</strong>
            </p>
            <p className="text-sm text-muted">
              {target.decision === 'done'
                ? L(
                    'ستُستبدل بيانات هذا الشخص التعريفية في التسجيلات والطلبات والشهادات وملف العضو، ويُحذف حسابه وملفات الشهادات. لا يمكن التراجع.',
                    "This person's identifying data is replaced in registrations, applications, certificates and the member record, and the account and certificate files are removed. This cannot be undone.",
                  )
                : L('سيُغلق الطلب دون حذف.', 'The request is closed without deleting anything.')}
            </p>
            <Textarea
              label={L('ملاحظة (اختياري)', 'Note (optional)')}
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setTarget(null)} disabled={busy}>
                {L('تراجع', 'Back')}
              </Button>
              <Button
                variant={target.decision === 'done' ? 'danger' : 'primary'}
                onClick={run}
                loading={busy}
              >
                {target.decision === 'done'
                  ? L('تنفيذ الحذف', 'Complete deletion')
                  : L('رفض الطلب', 'Reject')}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
