'use client';

import { useState, useTransition } from 'react';
import { Button, Dialog, Field, Textarea, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import { sendClaimInvite, setMemberStatus } from '../actions';
import type { MemberStatus } from '../schemas';

type Pending = null | 'suspended' | 'active' | 'inactive' | 'invite';

/** Leadership actions for one member (screen 19): suspend, reinstate, deactivate, claim invite. */
export function MemberActions({
  id,
  status,
  linked,
  claimEmail,
  canManage,
}: {
  id: string;
  status: MemberStatus;
  linked: boolean;
  claimEmail: string | null;
  canManage: boolean;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();
  const [dialog, setDialog] = useState<Pending>(null);
  const [reason, setReason] = useState('');
  const [email, setEmail] = useState(claimEmail ?? '');
  const toast = useToast();
  const [busy, startTransition] = useTransition();

  if (!canManage) return null;

  const close = () => {
    setDialog(null);
    setReason('');
  };

  const submit = () => {
    startTransition(async () => {
      if (dialog === 'invite') {
        const r = await sendClaimInvite({ memberId: id, email }, { lang });
        if (!r.ok) {
          toast.error(r.message);
          return;
        }
        toast.success(ar ? 'أُرسلت الدعوة.' : 'Invite sent.');
      } else if (dialog) {
        const r = await setMemberStatus({ id, status: dialog as MemberStatus, reason }, { lang });
        if (!r.ok) {
          toast.error(r.message);
          return;
        }
        toast.success(
          dialog === 'suspended'
            ? ar
              ? 'أُوقفت العضوية.'
              : 'Membership suspended.'
            : dialog === 'active'
              ? ar
                ? 'أُعيد تفعيل العضو.'
                : 'Member reinstated.'
              : ar
                ? 'أُلغي تفعيل العضو.'
                : 'Member deactivated.',
        );
      }
      close();
      router.refresh();
    });
  };

  const small = 'min-h-9 px-3 text-xs';
  const titles: Record<Exclude<Pending, null>, string> = {
    suspended: ar ? 'إيقاف العضوية' : 'Suspend membership',
    active: ar ? 'إعادة التفعيل' : 'Reinstate',
    inactive: ar ? 'إلغاء التفعيل' : 'Deactivate',
    invite: ar ? 'إرسال رابط المطالبة' : 'Send claim link',
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === 'active' && (
        <>
          <Button variant="ghost" className={small} onClick={() => setDialog('suspended')}>
            {ar ? 'إيقاف' : 'Suspend'}
          </Button>
          <Button variant="ghost" className={small} onClick={() => setDialog('inactive')}>
            {ar ? 'إلغاء التفعيل' : 'Deactivate'}
          </Button>
        </>
      )}
      {status !== 'active' && (
        <Button variant="secondary" className={small} onClick={() => setDialog('active')}>
          {ar ? 'إعادة التفعيل' : 'Reinstate'}
        </Button>
      )}
      {!linked && (
        <Button variant="secondary" className={small} onClick={() => setDialog('invite')}>
          {ar ? 'دعوة للمطالبة' : 'Claim invite'}
        </Button>
      )}

      <Dialog open={dialog !== null} onClose={close} title={dialog ? titles[dialog] : ''}>
        <div className="flex flex-col gap-3">
          {dialog === 'invite' ? (
            <>
              <p className="text-sm text-muted">
                {ar
                  ? 'سيصل العضو رابط صالح 7 أيام يُستخدم مرة واحدة. يجب أن يسجّل بنفس البريد.'
                  : 'The member receives a link valid for 7 days that works once. They must sign in with the same e-mail.'}
              </p>
              <Field
                type="email"
                label={ar ? 'البريد الإلكتروني' : 'E-mail'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
              />
            </>
          ) : (
            <Textarea
              label={
                dialog === 'inactive'
                  ? ar
                    ? 'السبب (اختياري)'
                    : 'Reason (optional)'
                  : ar
                    ? 'السبب *'
                    : 'Reason *'
              }
              value={reason}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          )}
          {dialog === 'suspended' && (
            <p className="text-xs text-muted">
              {ar
                ? 'ستنتهي أدوار اللجان للعضو ويُخفى من الدليل.'
                : "The member's committee roles end and they are hidden from the directory."}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close} disabled={busy}>
              {ar ? 'تراجع' : 'Back'}
            </Button>
            <Button
              variant={dialog === 'suspended' ? 'danger' : 'primary'}
              onClick={submit}
              loading={busy}
            >
              {ar ? 'تأكيد' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
