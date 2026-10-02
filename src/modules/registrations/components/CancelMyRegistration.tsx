'use client';

import { useState, useTransition } from 'react';
import { Alert, Button, Dialog } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import { cancelMyRegistration } from '../actions';

/** "Cancel my registration" with a confirmation step; the database refuses it after the event has started. */
export function CancelMyRegistration({ id, title }: { id: string; title: string }) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, startTransition] = useTransition();

  const confirm = () => {
    setError('');
    startTransition(async () => {
      const r = await cancelMyRegistration(id, { lang });
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
      <Button variant="ghost" className="min-h-9 px-4 text-sm" onClick={() => setOpen(true)}>
        {ar ? 'إلغاء التسجيل' : 'Cancel registration'}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={ar ? 'إلغاء التسجيل' : 'Cancel registration'}
      >
        <div className="flex flex-col gap-3">
          <p>
            {ar
              ? `هل تريد إلغاء تسجيلك في «${title}»؟ ستتمكن من التسجيل مجددًا ما دام التسجيل مفتوحًا.`
              : `Cancel your registration for “${title}”? You can register again while registration is open.`}
          </p>
          {error && <Alert tone="danger">{error}</Alert>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              {ar ? 'تراجع' : 'Back'}
            </Button>
            <Button variant="danger" onClick={confirm} loading={busy}>
              {ar ? 'تأكيد الإلغاء' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
