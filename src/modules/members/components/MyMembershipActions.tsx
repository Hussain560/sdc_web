'use client';

import { nowMs } from '@/lib/now';
import { Download, LogOut, Maximize2, Printer, RefreshCw, Send, Undo2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Alert, Button, Dialog, Field, Textarea, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { Link, useRouter } from '@/i18n/navigation';
import {
  requestRenewal,
  requestToLeave,
  rotateCardToken,
  withdrawLeaveRequest,
} from '../lifecycle-actions';

const today = () => new Date(nowMs() + 3 * 3_600_000).toISOString().slice(0, 10);

/** The card's buttons: full screen, save to the home screen, print, change the verification code. */
export function CardActions({ canRotate }: { canRotate: boolean }) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const router = useRouter();
  const toast = useToast();
  const [home, setHome] = useState(false);
  const [rotate, setRotate] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Link
          href="/card"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 font-semibold text-on-accent hover:bg-accent-hover"
        >
          <Maximize2 size={16} aria-hidden="true" />
          {L('عرض بملء الشاشة', 'Show full screen')}
        </Link>
        <Button
          variant="secondary"
          iconStart={<Download size={16} aria-hidden="true" />}
          onClick={() => setHome(true)}
        >
          {L('أضف إلى الشاشة الرئيسية', 'Add to the home screen')}
        </Button>
        <a
          href={`${ar ? '' : '/en'}/card/print`}
          target="_blank"
          rel="noopener"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-line-strong px-5 font-semibold hover:border-accent"
        >
          <Printer size={16} aria-hidden="true" />
          {L('طباعة', 'Print')}
        </a>
      </div>
      {canRotate && (
        <button
          type="button"
          onClick={() => setRotate(true)}
          className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold text-accent-text underline-offset-4 hover:underline"
        >
          <RefreshCw size={15} aria-hidden="true" />
          {L('تغيير رمز التحقق', 'Change the verification code')}
        </button>
      )}

      <Dialog
        open={home}
        onClose={() => setHome(false)}
        title={L('أضف البطاقة إلى شاشتك الرئيسية', 'Add the card to your home screen')}
        presentation="sheet"
        closeLabel={L('إغلاق', 'Close')}
        footer={<Button onClick={() => setHome(false)}>{L('تم', 'Done')}</Button>}
      >
        <ol className="list-decimal space-y-2 ps-5 text-sm">
          <li>{L('افتح «عرض بملء الشاشة».', 'Open “Show full screen”.')}</li>
          <li>
            {L(
              'في آيفون: اضغط مشاركة ثم «إضافة إلى الشاشة الرئيسية».',
              'On iPhone: tap Share, then “Add to Home Screen”.',
            )}
          </li>
          <li>
            {L(
              'في أندرويد: قائمة المتصفح ثم «إضافة إلى الشاشة الرئيسية».',
              'On Android: the browser menu, then “Add to Home screen”.',
            )}
          </li>
        </ol>
        <p className="mt-3 text-sm text-muted">
          {L('البطاقة تعمل دون اتصال بعد حفظها.', 'The card works offline once saved.')}
        </p>
      </Dialog>

      <Dialog
        open={rotate}
        onClose={() => setRotate(false)}
        busy={pending}
        title={L('تغيير رمز التحقق؟', 'Change the verification code?')}
        description={L(
          'ننشئ رمزاً جديداً ونلغي القديم فوراً. المطبوعات القديمة تتوقف عن العمل.',
          'We create a new code and cancel the old one at once. Old printouts stop working.',
        )}
        presentation="sheet"
        closeLabel={L('إغلاق', 'Close')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRotate(false)} disabled={pending}>
              {L('تراجع', 'Cancel')}
            </Button>
            <Button
              loading={pending}
              onClick={() =>
                start(async () => {
                  const r = await rotateCardToken({ lang });
                  setRotate(false);
                  if (!r.ok) return void toast.error(r.message);
                  toast.success(L('أُنشئ رمز جديد.', 'A new code was created.'));
                  router.refresh();
                })
              }
            >
              {L('أنشئ رمزاً جديداً', 'Create a new code')}
            </Button>
          </>
        }
      >
        <span className="sr-only">{L('تأكيد', 'Confirm')}</span>
      </Dialog>
    </div>
  );
}

/** Request a renewal: leadership is told; the button says so once it is sent. */
export function RenewalButton({
  requestedAt,
  label,
}: {
  requestedAt: string | null;
  label: string;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const recent = requestedAt && nowMs() - Date.parse(requestedAt) < 7 * 86_400_000;
  if (recent)
    return (
      <p role="status" className="text-sm font-medium">
        {ar
          ? 'أرسلت طلب التجديد، وستردّ القيادة قريباً.'
          : 'Your renewal request was sent; leadership will reply soon.'}
      </p>
    );
  return (
    <Button
      loading={pending}
      iconStart={<Send size={15} aria-hidden="true" className="rtl:-scale-x-100" />}
      onClick={() =>
        start(async () => {
          const r = await requestRenewal({ lang });
          if (!r.ok) return void toast.error(r.message);
          toast.success(
            ar ? 'أُرسل طلب التجديد إلى القيادة.' : 'The renewal request was sent to leadership.',
          );
          router.refresh();
        })
      }
    >
      {label}
    </Button>
  );
}

/** Leaving the community: a request, never a direct action. The member stays active until leadership decides. */
export function LeaveSection({
  pending: request,
}: {
  pending: { createdAt: string; preferredLastDay: string | null } | null;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [lastDay, setLastDay] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const date = (iso: string) =>
    new Intl.DateTimeFormat(ar ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      timeZone: 'Asia/Riyadh',
    }).format(new Date(iso));

  if (request)
    return (
      <section className="rounded-shape-xl bg-info-soft p-5" aria-labelledby="leave-title">
        <h2 id="leave-title" className="flex items-center gap-2 font-bold">
          <LogOut size={17} aria-hidden="true" />
          {L('طلب المغادرة بانتظار القيادة', 'Leave request waiting for leadership')}
        </h2>
        <p className="mt-1 text-sm">
          {L(
            `أرسلته في ${date(request.createdAt)}. ما زلت عضواً نشطاً.`,
            `You sent it on ${date(request.createdAt)}. You are still an active member.`,
          )}
        </p>
        <Button
          variant="secondary"
          className="mt-3"
          iconStart={<Undo2 size={15} aria-hidden="true" />}
          loading={busy}
          onClick={() =>
            start(async () => {
              const r = await withdrawLeaveRequest({ lang });
              if (!r.ok) return void toast.error(r.message);
              toast.success(L('سُحب الطلب.', 'The request was withdrawn.'));
              router.refresh();
            })
          }
        >
          {L('سحب الطلب', 'Withdraw the request')}
        </Button>
      </section>
    );

  return (
    <section
      className="rounded-shape-2xl border border-dashed border-line p-6"
      aria-labelledby="leave-title"
    >
      <h2 id="leave-title" className="text-xl font-extrabold">
        {L('مغادرة المجتمع', 'Leaving the community')}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {L(
          'ترسل طلباً، وتبقى عضواً كاملاً حتى تقرّر القيادة. يمكنك سحبه قبل القرار.',
          'You send a request and stay a full member until leadership decides. You can withdraw it before a decision.',
        )}
      </p>
      <Button
        variant="secondary"
        className="mt-3"
        iconStart={<LogOut size={15} aria-hidden="true" />}
        onClick={() => setOpen(true)}
      >
        {L('اطلب المغادرة', 'Request to leave')}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        busy={busy}
        presentation="sheet"
        closeLabel={L('إغلاق', 'Close')}
        title={L('طلب مغادرة المجتمع', 'Request to leave the community')}
        description={L(
          'إن وافقت القيادة، ينتهي منصبك في اللجنة ويختفي ملفك من الدليل، ويبقى حسابك لشهاداتك.',
          'If leadership approves, your committee position ends and your profile leaves the directory. Your account stays for your certificates.',
        )}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              {L('تراجع', 'Cancel')}
            </Button>
            <Button
              loading={busy}
              onClick={() =>
                start(async () => {
                  setError(null);
                  const r = await requestToLeave(
                    { reason: reason || undefined, lastDay: lastDay || undefined },
                    { lang },
                  );
                  if (!r.ok) return void setError(r.message);
                  setOpen(false);
                  setReason('');
                  setLastDay('');
                  toast.success(
                    L('أُرسل طلبك إلى القيادة.', 'Your request was sent to leadership.'),
                  );
                  router.refresh();
                })
              }
            >
              {L('أرسل الطلب', 'Send the request')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <Textarea
            label={L('سبب المغادرة (اختياري)', 'Reason (optional)')}
            value={reason}
            maxLength={1000}
            rows={3}
            onChange={(e) => setReason(e.target.value)}
          />
          <Field
            type="date"
            label={L('آخر يوم تفضّله (اختياري)', 'Preferred last day (optional)')}
            value={lastDay}
            min={today()}
            dir="ltr"
            onChange={(e) => setLastDay(e.target.value)}
          />
          <p className="text-sm text-muted">
            {L(
              'لا يتغير شيء الآن. تصلك رسالة تأكيد، وتبقى عضويتك نشطة.',
              'Nothing changes now. You get a confirmation and your membership stays active.',
            )}
          </p>
        </div>
      </Dialog>
    </section>
  );
}
