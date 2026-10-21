'use client';

import { Send, Undo2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Alert, Button, Dialog, Field, Textarea, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import {
  requestActivationLink,
  resubmitApplication,
  withdrawApplicationByToken,
} from '../track-actions';
import type { CycleQuestion } from '../types';

const FIELD_LABEL: Record<string, { ar: string; en: string }> = {
  github_url: { ar: 'رابط عمل (GitHub أو غيره)', en: 'A link to your work (GitHub or other)' },
  portfolio_url: { ar: 'موقعك الشخصي / أعمالك', en: 'Portfolio / website' },
  linkedin_url: { ar: 'LinkedIn', en: 'LinkedIn' },
  x_url: { ar: 'X', en: 'X' },
  bio_ar: { ar: 'النبذة بالعربية', en: 'Bio in Arabic' },
  bio_en: { ar: 'النبذة بالإنجليزية', en: 'Bio in English' },
};

/**
 * "Fix what was asked": only the parts the reviewer chose are shown, each with its current value, and only those can
 * change. Everything else of the application is untouched (the database refuses any other field).
 */
export function EditRequestedForm({
  token,
  values,
  questions,
}: {
  token: string;
  values: Record<string, unknown>;
  questions: CycleQuestion[];
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();
  const toast = useToast();
  const keys = Object.keys(values);
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      keys.map((k) => [
        k,
        Array.isArray(values[k]) ? (values[k] as string[]).join('، ') : String(values[k] ?? ''),
      ]),
    ),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const qOf = (k: string) => questions.find((q) => q.key === k.slice(2));

  const submit = () =>
    start(async () => {
      setError(null);
      const r = await resubmitApplication({ token, patch: draft }, { lang });
      if (!r.ok) {
        setError(r.message);
        return;
      }
      toast.success(ar ? 'أُعيد إرسال طلبك.' : 'Your application was resubmitted.');
      router.refresh();
    });

  return (
    <section
      className="rounded-shape-xl border border-line bg-surface p-5 md:p-6"
      aria-labelledby="edit-title"
    >
      <h2 id="edit-title" className="font-bold">
        {ar ? 'عدّل ما طُلب' : 'Edit what was asked'}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {ar
          ? 'باقي طلبك محفوظ كما هو، ولا يمكن تغييره الآن.'
          : 'The rest of your application is saved as it is and cannot be changed now.'}
      </p>
      <div className="mt-5 flex flex-col gap-5">
        {error && <Alert tone="danger">{error}</Alert>}
        {keys.map((k) => {
          const q = k.startsWith('q:') ? qOf(k) : undefined;
          const label = q
            ? ar
              ? q.label_ar
              : q.label_en || q.label_ar
            : (FIELD_LABEL[k]?.[lang] ?? k);
          const long = k.startsWith('bio_') || q?.type === 'long_text';
          return long ? (
            <Textarea
              key={k}
              label={label}
              value={draft[k] ?? ''}
              maxLength={2000}
              rows={4}
              counter
              onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
            />
          ) : (
            <Field
              key={k}
              label={label}
              value={draft[k] ?? ''}
              maxLength={500}
              dir={/_url$/.test(k) ? 'ltr' : undefined}
              inputMode={/_url$/.test(k) ? 'url' : undefined}
              onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
            />
          );
        })}
        <div>
          <Button
            onClick={submit}
            loading={pending}
            size="lg"
            iconEnd={<Send size={16} aria-hidden="true" className="rtl:-scale-x-100" />}
          >
            {ar ? 'أعد إرسال طلبي' : 'Resubmit my application'}
          </Button>
        </div>
      </div>
    </section>
  );
}

/** Withdraw the application, after a confirmation that says what it means. */
export function WithdrawButton({ token }: { token: string }) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-danger hover:bg-danger-soft focus-visible:outline-2 focus-visible:outline-focus-ring"
      >
        <Undo2 size={15} aria-hidden="true" />
        {ar ? 'سحب الطلب' : 'Withdraw the application'}
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        busy={pending}
        title={ar ? 'سحب طلبك؟' : 'Withdraw your application?'}
        description={
          ar
            ? 'لن نراجع هذا الطلب بعد ذلك. يمكنك التقديم من جديد ما دام التسجيل مفتوحاً.'
            : 'We will not review it after that. You can apply again while applications are open.'
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              {ar ? 'تراجع' : 'Back'}
            </Button>
            <Button
              variant="destructive"
              loading={pending}
              onClick={() =>
                start(async () => {
                  const r = await withdrawApplicationByToken(token, { lang });
                  setOpen(false);
                  if (!r.ok) {
                    toast.error(r.message);
                    return;
                  }
                  toast.success(ar ? 'سُحب طلبك.' : 'Your application was withdrawn.');
                  router.refresh();
                })
              }
            >
              {ar ? 'سحب الطلب' : 'Withdraw'}
            </Button>
          </>
        }
      >
        <span className="sr-only">{ar ? 'تأكيد' : 'Confirm'}</span>
      </Dialog>
    </>
  );
}

/** "The link did not arrive": a new activation link, to the address of the accepted application. */
export function ResendActivation({ token }: { token: string }) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const toast = useToast();
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();
  if (sent)
    return (
      <p role="status" className="text-sm text-muted">
        {ar ? 'أرسلنا رابطاً جديداً إلى بريدك.' : 'We sent a new link to your e-mail.'}
      </p>
    );
  return (
    <Button
      variant="secondary"
      loading={pending}
      onClick={() =>
        start(async () => {
          const r = await requestActivationLink(token, { lang });
          if (!r.ok) {
            toast.error(r.message);
            return;
          }
          setSent(true);
        })
      }
    >
      {ar ? 'لم يصلك الرابط؟ أرسل رابطاً جديداً' : 'Did not get the link? Send a new one'}
    </Button>
  );
}
