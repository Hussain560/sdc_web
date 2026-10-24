'use client';

import { Ban, KeyRound, LogOut, Pause, Play, RefreshCw, ShieldCheck, UserPlus } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Button, Dialog, Field, useToast } from '@/components/ui';
import { ActionMenu, type MenuItem } from '@/components/patterns/ActionMenu';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import { sendClaimInvite } from '../actions';
import type { MemberStatus } from '../schemas';
import {
  MemberActionDialogs,
  type ActionTarget,
  type MemberActionKind,
} from './MemberActionDialogs';

export type MemberActionSubject = {
  id: string;
  /** The account id (for blocking), when the member has one. */
  userId?: string | null;
  nameAr: string;
  nameEn: string | null;
  status: MemberStatus;
  termEndsAt?: string | null;
  blocked?: boolean;
  activated?: boolean;
  leave?: {
    id: string;
    reason: string | null;
    preferredLastDay: string | null;
    createdAt: string;
  } | null;
};

/**
 * Leadership actions for one member (screens 19 and the member record): the lifecycle buttons (renew, suspend,
 * reinstate, end), the account (block, unblock, resend the activation) and the claim invite for a record with no
 * account. Each opens the shared dialog that names the person, asks for the reason and explains the consequences.
 */
export function MemberActions({
  subject,
  linked,
  claimEmail,
  canManage,
  canBlock = false,
  compact = false,
}: {
  subject: MemberActionSubject;
  linked: boolean;
  claimEmail: string | null;
  canManage: boolean;
  canBlock?: boolean;
  /** Only the claim invite (used in the list for a record with no account). */
  compact?: boolean;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();
  const toast = useToast();
  const [action, setAction] = useState<MemberActionKind | null>(null);
  const [targets, setTargets] = useState<ActionTarget[]>([]);
  const [invite, setInvite] = useState(false);
  const [email, setEmail] = useState(claimEmail ?? '');
  const [busy, start] = useTransition();

  if (!canManage && !canBlock) return null;
  const s = subject;
  const base: ActionTarget = {
    id: s.id,
    actionId: s.id,
    nameAr: s.nameAr,
    nameEn: s.nameEn,
    status: s.status,
    termEndsAt: s.termEndsAt ?? null,
    leave: s.leave
      ? {
          reason: s.leave.reason,
          preferredLastDay: s.leave.preferredLastDay,
          createdAt: s.leave.createdAt,
        }
      : null,
  };
  const go = (kind: MemberActionKind, over: Partial<ActionTarget> = {}) => {
    setTargets([{ ...base, ...over }]);
    setAction(kind);
  };

  const sendInvite = () =>
    start(async () => {
      const r = await sendClaimInvite({ memberId: s.id, email }, { lang });
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      toast.success(ar ? 'أُرسلت الدعوة.' : 'Invite sent.');
      setInvite(false);
      router.refresh();
    });

  const items: MenuItem[] = [];
  if (canManage && s.leave) {
    items.push({
      key: 'la',
      label: ar ? 'الموافقة على طلب المغادرة' : 'Approve the leave request',
      onSelect: () => go('leave_approve', { actionId: s.leave!.id }),
    });
    items.push({
      key: 'ld',
      label: ar ? 'رفض طلب المغادرة' : 'Decline the leave request',
      onSelect: () => go('leave_decline', { actionId: s.leave!.id }),
    });
  }
  if (canManage && linked && s.status !== 'ended' && s.activated === false)
    items.push({
      key: 'resend',
      label: ar ? 'إعادة إرسال رابط التفعيل' : 'Resend the activation link',
      icon: <KeyRound size={15} aria-hidden="true" />,
      onSelect: () => go('resend'),
    });
  if (canBlock && s.userId) {
    items.push(
      s.blocked
        ? {
            key: 'unblock',
            label: ar ? 'إلغاء حظر الحساب' : 'Unblock the account',
            icon: <ShieldCheck size={15} aria-hidden="true" />,
            onSelect: () => go('unblock', { actionId: s.userId! }),
          }
        : {
            key: 'block',
            label: ar ? 'حظر الحساب' : 'Block the account',
            icon: <Ban size={15} aria-hidden="true" />,
            tone: 'danger',
            onSelect: () => go('block', { actionId: s.userId! }),
          },
    );
  }
  if (canManage && !linked)
    items.push({
      key: 'invite',
      label: ar ? 'دعوة للمطالبة' : 'Claim invite',
      icon: <UserPlus size={15} aria-hidden="true" />,
      onSelect: () => setInvite(true),
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!compact && canManage && (
        <>
          {(s.status === 'active' || s.status === 'expired') && (
            <Button
              iconStart={<RefreshCw size={15} aria-hidden="true" />}
              onClick={() => go('renew')}
            >
              {ar ? 'تجديد' : 'Renew'}
            </Button>
          )}
          {s.status === 'active' && (
            <Button
              variant="secondary"
              iconStart={<Pause size={15} aria-hidden="true" />}
              onClick={() => go('suspend')}
            >
              {ar ? 'إيقاف' : 'Suspend'}
            </Button>
          )}
          {s.status === 'suspended' && (
            <Button
              iconStart={<Play size={15} aria-hidden="true" />}
              onClick={() => go('reinstate')}
            >
              {ar ? 'إعادة العضوية' : 'Reinstate'}
            </Button>
          )}
          {s.status !== 'ended' && (
            <Button
              variant="secondary"
              className="text-danger"
              iconStart={<LogOut size={15} aria-hidden="true" />}
              onClick={() => go('end')}
            >
              {ar ? 'إنهاء العضوية' : 'End membership'}
            </Button>
          )}
        </>
      )}
      {compact && canManage && !linked && (
        <Button variant="secondary" size="sm" onClick={() => setInvite(true)}>
          {ar ? 'دعوة للمطالبة' : 'Claim invite'}
        </Button>
      )}
      {!compact && items.length > 0 && (
        <ActionMenu label={ar ? 'المزيد من الإجراءات' : 'More actions'} items={items} />
      )}

      <MemberActionDialogs action={action} targets={targets} onClose={() => setAction(null)} />

      <Dialog
        open={invite}
        onClose={() => setInvite(false)}
        busy={busy}
        title={ar ? 'إرسال رابط المطالبة' : 'Send claim link'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setInvite(false)} disabled={busy}>
              {ar ? 'تراجع' : 'Back'}
            </Button>
            <Button onClick={sendInvite} loading={busy}>
              {ar ? 'إرسال' : 'Send'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
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
        </div>
      </Dialog>
    </div>
  );
}
