'use client';

import { Download, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Badge, Button, Card, Dialog, Textarea, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { exportMyData, requestAccountDeletion } from '../actions';

/** "My data" (SEC-003): download everything the platform holds about the person, or ask for the account to be deleted. */
export function MyDataPanel({ pending }: { pending: boolean }) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const toast = useToast();
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  const download = () =>
    startTransition(async () => {
      const r = await exportMyData({ lang });
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      const url = URL.createObjectURL(new Blob([r.data.json], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-sdc-data.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(L('تم تنزيل بياناتك.', 'Your data was downloaded.'));
    });

  const requestDeletion = () =>
    startTransition(async () => {
      const r = await requestAccountDeletion(reason, { lang });
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      setOpen(false);
      setReason('');
      toast.success(
        L(
          'أُرسل طلب الحذف إلى قيادة المجتمع.',
          'Your deletion request was sent to the leadership.',
        ),
      );
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{L('تنزيل بياناتي', 'Download my data')}</h2>
        <p className="text-sm text-muted">
          {L(
            'ملف JSON فيه ملفك الشخصي وسجل العضوية والطلبات والتسجيلات والشهادات والمناصب.',
            'A JSON file with your profile, member record, applications, registrations, certificates and positions.',
          )}
        </p>
        <div>
          <Button variant="secondary" onClick={download} loading={busy}>
            <Download size={16} aria-hidden="true" />
            {L('تنزيل', 'Download')}
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{L('حذف حسابي', 'Delete my account')}</h2>
        <p className="text-sm text-muted">
          {L(
            'تُستبدل بياناتك التعريفية بعبارة «مجهول» ويُحذف حسابك ومناصبك. تبقى الأعداد والإحصاءات المجمّعة. يعالج الطلب أحد مسؤولي المنصة.',
            'Your identifying data is replaced with placeholders and your account and positions are removed. Counts and aggregate statistics stay. A platform administrator handles the request.',
          )}
        </p>
        {pending ? (
          <Badge tone="warning">{L('طلب حذف قيد المراجعة', 'A deletion request is waiting')}</Badge>
        ) : (
          <div>
            <Button variant="danger" onClick={() => setOpen(true)} disabled={busy}>
              <Trash2 size={16} aria-hidden="true" />
              {L('طلب حذف الحساب', 'Request account deletion')}
            </Button>
          </div>
        )}
      </Card>

      <p className="text-xs text-muted">
        <Link href="/privacy" className="underline">
          {L('سياسة الخصوصية', 'Privacy notice')}
        </Link>
      </p>

      <Dialog
        open={open}
        onClose={() => (busy ? undefined : setOpen(false))}
        title={L('طلب حذف الحساب', 'Request account deletion')}
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            {L(
              'لا يمكن التراجع بعد أن يعالج المسؤول الطلب.',
              'This cannot be undone once an administrator handles it.',
            )}
          </p>
          <Textarea
            label={L('السبب (اختياري)', 'Reason (optional)')}
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              {L('تراجع', 'Back')}
            </Button>
            <Button variant="danger" onClick={requestDeletion} loading={busy}>
              {L('إرسال الطلب', 'Send request')}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
