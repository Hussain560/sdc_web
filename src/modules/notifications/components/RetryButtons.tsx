'use client';

import { RotateCw } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Button, Dialog, IconAction, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import { retryAllFailedEmails, retryEmail } from '../actions';

/** Retry one failed e-mail. */
export function RetryEmailButton({ id }: { id: string }) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const toast = useToast();
  const router = useRouter();
  const [busy, startTransition] = useTransition();

  return (
    <IconAction
      label={ar ? 'إعادة المحاولة' : 'Retry'}
      disabled={busy}
      onClick={() =>
        startTransition(async () => {
          const r = await retryEmail(id, { lang });
          if (r.ok) toast.success(ar ? 'أُرسلت الرسالة.' : 'The e-mail was sent.');
          else toast.error(r.message);
          router.refresh();
        })
      }
    >
      <RotateCw size={16} aria-hidden="true" className={busy ? 'animate-spin' : undefined} />
    </IconAction>
  );
}

/** "Retry all failed", with the count confirmed first (it respects the provider's daily quota). */
export function RetryAllButton({ count }: { count: number }) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, startTransition] = useTransition();

  return (
    <>
      <Button variant="secondary" disabled={count === 0} onClick={() => setOpen(true)}>
        {ar ? 'إعادة محاولة الفاشلة' : 'Retry all failed'}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={ar ? 'إعادة محاولة الرسائل الفاشلة' : 'Retry failed e-mails'}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            {ar
              ? `ستُعاد محاولة ${count} رسالة (حتى 50 في كل مرة، وبحسب الحد اليومي للمزوّد).`
              : `${count} failed e-mails will be retried (up to 50 at a time, within the provider's daily quota).`}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              {ar ? 'تراجع' : 'Back'}
            </Button>
            <Button
              loading={busy}
              onClick={() =>
                startTransition(async () => {
                  const r = await retryAllFailedEmails({ lang });
                  setOpen(false);
                  if (!r.ok) toast.error(r.message);
                  else if (r.data.failed > 0)
                    toast.warning(
                      ar
                        ? `أُرسلت ${r.data.sent} وتعذّرت ${r.data.failed}.`
                        : `${r.data.sent} sent, ${r.data.failed} failed again.`,
                    );
                  else
                    toast.success(
                      ar ? `أُرسلت ${r.data.sent} رسالة.` : `${r.data.sent} e-mails sent.`,
                    );
                  router.refresh();
                })
              }
            >
              {ar ? 'إعادة المحاولة' : 'Retry'}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
