'use client';

import { useState, useTransition } from 'react';
import { Alert, Button, Dialog } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import { withdrawApplication } from '../actions';

/** Withdraw while the application is `submitted` and the window is open (MB-5); the database re-checks. */
export function WithdrawApplication({ id }: { id: string }) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, startTransition] = useTransition();

  const confirm = () => {
    setError('');
    startTransition(async () => {
      const r = await withdrawApplication(id, { lang });
      if (!r.ok) {
        setError(r.message);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        {ar ? 'سحب الطلب' : 'Withdraw'}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={ar ? 'سحب الطلب' : 'Withdraw application'}
      >
        <div className="flex flex-col gap-3">
          <p>
            {ar
              ? 'سيُسحب طلبك من هذه الدورة. يمكنك التقديم مجددًا ما دام باب التقديم مفتوحًا.'
              : 'Your application will be withdrawn from this cycle. You can apply again while the window is open.'}
          </p>
          {error && <Alert tone="danger">{error}</Alert>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              {ar ? 'تراجع' : 'Back'}
            </Button>
            <Button variant="danger" onClick={confirm} loading={busy}>
              {ar ? 'تأكيد السحب' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
