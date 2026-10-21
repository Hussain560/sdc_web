'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Dialog,
  Field,
  RadioGroup,
  Select,
  Textarea,
  useToast,
  Checkbox,
} from '@/components/ui';
import { ResultsDialog } from '@/components/patterns/ResultsDialog';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import { formatDate } from '@/lib/format';
import {
  blockAccounts,
  decideLeaveRequests,
  endMembers,
  messageMembers,
  reinstateMembers,
  renewMembers,
  resendActivations,
  suspendMembers,
  unblockAccounts,
  type BulkResult,
} from '../lifecycle-actions';
import { memberMessage } from '../messages';
import { MEMBER_STATUS_LABEL, SUSPENSION_CATEGORIES, SUSPENSION_CATEGORY_LABEL } from '../schemas';
import type { Result } from '@/lib/result';

export type MemberActionKind =
  | 'renew'
  | 'suspend'
  | 'reinstate'
  | 'end'
  | 'block'
  | 'unblock'
  | 'leave_approve'
  | 'leave_decline'
  | 'message'
  | 'resend';

/** A person the action applies to: enough to name them and to explain what will happen. */
export type ActionTarget = {
  id: string;
  /** The id the action takes (the member, the account, or the leave request). */
  actionId: string;
  nameAr: string;
  nameEn: string | null;
  status?: string;
  noCommittee?: boolean;
  termEndsAt?: string | null;
  committeeLabel?: string | null;
  leave?: { reason: string | null; preferredLastDay: string | null; createdAt: string } | null;
};

const todayIso = () => new Date(Date.now() + 3 * 3_600_000).toISOString().slice(0, 10);
const plusYear = (iso: string) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

const TEMPLATES = {
  none: { ar: ['', ''], en: ['', ''] },
  event_reminder: {
    ar: ['تذكير بفعالية الأعضاء', 'نذكّركم بلقاء الأعضاء الشهري يوم الخميس. نسعد بحضوركم.'],
    en: [
      'Reminder: the members meeting',
      'A reminder about the monthly members meeting on Thursday. We would love to see you.',
    ],
  },
  profile: {
    ar: [
      'أكمل ملفك في الدليل',
      'نشجّعك على إكمال ملفك الشخصي ليتعرّف عليك الأعضاء والجهات المهتمة.',
    ],
    en: [
      'Complete your directory profile',
      'We encourage you to complete your profile so members and interested organisations can find you.',
    ],
  },
} as const;

/**
 * One place for every member action dialog (MEM-018, MEM-019, ACC-008): the person is named, the consequences are
 * listed, the reason is asked where the process needs it (internal, never shown to the member), and the answer is
 * per row: done, or skipped with the reason. The same dialogs serve the list (bulk) and the member page (one).
 */
export function MemberActionDialogs({
  action,
  targets,
  onClose,
  onDone,
}: {
  action: MemberActionKind | null;
  targets: ActionTarget[];
  onClose: () => void;
  onDone?: () => void;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();
  const toast = useToast();
  const [busy, start] = useTransition();
  const [results, setResults] = useState<Array<{
    id: string;
    ok: boolean;
    message?: string;
  }> | null>(null);

  const [endsAt, setEndsAt] = useState('');
  const [message, setMessage] = useState('');
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState<(typeof SUSPENSION_CATEGORIES)[number]>('conduct');
  const [until, setUntil] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [lastDay, setLastDay] = useState<'preferred' | 'today'>('preferred');
  const [template, setTemplate] = useState<keyof typeof TEMPLATES>('none');
  const [subject, setSubject] = useState('');
  const [error, setError] = useState<string | null>(null);

  const open = action !== null && action !== undefined;
  // Fresh fields each time a dialog opens.
  useEffect(() => {
    if (!open) return;
    const first = targets[0];
    /* eslint-disable react-hooks/set-state-in-effect -- reset the form when a dialog opens */
    setEndsAt(
      plusYear(first?.termEndsAt && first.termEndsAt > todayIso() ? first.termEndsAt : todayIso()),
    );
    setMessage('');
    setReason('');
    setCategory('conduct');
    setUntil('');
    setConfirmed(false);
    setLastDay(first?.leave?.preferredLastDay ? 'preferred' : 'today');
    setTemplate('none');
    setSubject('');
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, action, targets]);

  const nameOf = (t: ActionTarget) => (ar ? t.nameAr : t.nameEn || t.nameAr);
  const byAction = new Map(targets.map((t) => [t.actionId, t]));
  const resultName = (id: string) => {
    const t = byAction.get(id);
    return t ? nameOf(t) : id;
  };
  const many = targets.length > 1;
  const shown = targets
    .slice(0, 5)
    .map(nameOf)
    .join(ar ? '، ' : ', ');
  const rest = targets.length - 5;
  const who = many
    ? ar
      ? `${targets.length} أشخاص: ${shown}${rest > 0 ? ` و${rest} آخرين` : ''}.`
      : `${targets.length} people: ${shown}${rest > 0 ? ` and ${rest} more` : ''}.`
    : undefined;

  const finish = (r: Result<BulkResult>, doneText: string) => {
    if (!r.ok) {
      setError(r.message);
      return;
    }
    const list = r.data.outcomes.map((o) => ({
      id: o.id,
      ok: o.ok,
      message: o.code ? memberMessage(o.code, lang) : undefined,
    }));
    onClose();
    if (r.data.skipped === 0) toast.success(doneText);
    else setResults(list);
    onDone?.();
    router.refresh();
  };

  const ids = targets.map((t) => t.actionId);
  const run = () =>
    start(async () => {
      setError(null);
      const t0 = targets[0];
      if (action === 'renew')
        return finish(
          await renewMembers({ ids, endsAt, message: message || undefined }, { lang }),
          ar ? 'جُدّدت العضوية.' : 'Membership renewed.',
        );
      if (action === 'suspend')
        return finish(
          await suspendMembers(
            { ids, category, reason, until: until || undefined, message: message || undefined },
            { lang },
          ),
          ar ? 'أُوقفت العضوية.' : 'Membership suspended.',
        );
      if (action === 'reinstate')
        return finish(
          await reinstateMembers({ ids, note: reason || undefined }, { lang }),
          ar ? 'أُعيدت العضوية.' : 'Membership reinstated.',
        );
      if (action === 'end')
        return finish(
          await endMembers({ ids, reason, message: message || undefined }, { lang }),
          ar ? 'أُنهيت العضوية.' : 'Membership ended.',
        );
      if (action === 'block')
        return finish(
          await blockAccounts({ ids, reason }, { lang }),
          ar ? 'حُظر الحساب.' : 'Account blocked.',
        );
      if (action === 'unblock')
        return finish(
          await unblockAccounts({ ids, note: reason || undefined }, { lang }),
          ar ? 'رُفع الحظر.' : 'Block lifted.',
        );
      if (action === 'leave_approve' || action === 'leave_decline') {
        const r = await decideLeaveRequests(
          {
            ids,
            decision: action === 'leave_approve' ? 'approve' : 'decline',
            note: reason || undefined,
            effective:
              action === 'leave_approve' && lastDay === 'preferred' && t0?.leave?.preferredLastDay
                ? t0.leave.preferredLastDay
                : undefined,
          },
          { lang },
        );
        return finish(
          r,
          action === 'leave_approve'
            ? ar
              ? 'تمت الموافقة على الطلب.'
              : 'Request approved.'
            : ar
              ? 'رُفض الطلب.'
              : 'Request declined.',
        );
      }
      if (action === 'resend') {
        const r = await resendActivations({ ids }, { lang });
        if (!r.ok) return setError(r.message);
        onClose();
        toast.success(ar ? 'أُرسلت روابط التفعيل.' : 'Activation links are on their way.');
        return;
      }
      if (action === 'message') {
        const r = await messageMembers({ ids, subject, body: message }, { lang });
        if (!r.ok) return setError(r.message);
        onClose();
        toast.success(
          ar ? `سيصل البريد إلى ${r.data.queued}.` : `The e-mail goes to ${r.data.queued}.`,
        );
      }
    });

  const person = (t: ActionTarget) => (
    <li key={t.id} className="flex items-center gap-3 rounded-shape-lg bg-surface-raised p-3">
      <Avatar name={nameOf(t)} />
      <div className="min-w-0">
        <p className="truncate font-semibold">{nameOf(t)}</p>
        <p className="truncate text-xs text-muted">
          {[
            t.status
              ? (MEMBER_STATUS_LABEL[t.status as keyof typeof MEMBER_STATUS_LABEL]?.[lang] ??
                t.status)
              : null,
            t.termEndsAt
              ? ar
                ? `تنتهي ${formatDate(t.termEndsAt, lang)}`
                : `ends ${formatDate(t.termEndsAt, lang)}`
              : null,
            t.noCommittee ? (ar ? 'بلا لجنة' : 'no committee') : t.committeeLabel,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
    </li>
  );
  const who1 = (
    <ul className="flex flex-col gap-2" aria-label={ar ? 'الأشخاص' : 'People'}>
      {targets.slice(0, 3).map(person)}
      {targets.length > 3 && (
        <li className="text-sm text-muted">
          {ar ? `و${targets.length - 3} آخرين…` : `and ${targets.length - 3} more…`}
        </li>
      )}
    </ul>
  );
  const bullets = (items: string[]) => (
    <ul className="list-disc ps-5 text-sm text-muted">
      {items.map((b) => (
        <li key={b}>{b}</li>
      ))}
    </ul>
  );
  const errBox = error ? <Alert tone="danger">{error}</Alert> : null;

  const cfg: Record<
    MemberActionKind,
    { title: string; ok: boolean; primary: string; destructive?: boolean; body: React.ReactNode }
  > = {
    renew: {
      title: ar ? 'تجديد العضوية' : 'Renew membership',
      primary: ar ? 'تجديد' : 'Renew',
      ok: Boolean(endsAt),
      body: (
        <>
          {who1}
          <Field
            type="date"
            label={ar ? 'تنتهي المدة الجديدة في' : 'The new term ends on'}
            hint={
              ar
                ? 'الافتراضي: سنة بعد نهاية المدة الحالية.'
                : 'Default: one year after the current term end.'
            }
            value={endsAt}
            min={todayIso()}
            onChange={(e) => setEndsAt(e.target.value)}
            dir="ltr"
          />
          <Textarea
            label={ar ? 'رسالة للعضو (اختيارية)' : 'Message to the member (optional)'}
            value={message}
            maxLength={1000}
            rows={3}
            onChange={(e) => setMessage(e.target.value)}
          />
        </>
      ),
    },
    suspend: {
      title: ar ? 'إيقاف عضوية مؤقتاً' : 'Suspend a membership',
      primary: ar ? 'إيقاف العضوية' : 'Suspend',
      ok: reason.trim().length > 0,
      body: (
        <>
          {who1}
          <Select
            label={ar ? 'فئة السبب (يراها العضو)' : 'Reason category (the member sees it)'}
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
          >
            {SUSPENSION_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {SUSPENSION_CATEGORY_LABEL[c][lang]}
              </option>
            ))}
          </Select>
          <Textarea
            label={ar ? 'السبب التفصيلي (داخلي، مطلوب)' : 'Detailed reason (internal, required)'}
            hint={ar ? 'لا يراه العضو أبداً.' : 'The member never sees it.'}
            value={reason}
            maxLength={500}
            rows={3}
            onChange={(e) => setReason(e.target.value)}
          />
          <Field
            type="date"
            label={ar ? 'ينتهي الإيقاف في (اختياري)' : 'The suspension ends on (optional)'}
            value={until}
            min={todayIso()}
            onChange={(e) => setUntil(e.target.value)}
            dir="ltr"
          />
          {bullets(
            ar
              ? [
                  'يتوقف ظهوره في الدليل وتسجيله في فعاليات الأعضاء.',
                  'مناصبه في اللجان تنتهي.',
                  'حسابه وشهاداته تبقى متاحة.',
                ]
              : [
                  'He or she leaves the directory and member events.',
                  'Committee positions end.',
                  'The account and certificates stay available.',
                ],
          )}
        </>
      ),
    },
    reinstate: {
      title: ar ? 'إعادة العضوية' : 'Reinstate membership',
      primary: ar ? 'إعادة العضوية' : 'Reinstate',
      ok: true,
      body: (
        <>
          {who1}
          <Textarea
            label={ar ? 'ملاحظة داخلية (اختيارية)' : 'Internal note (optional)'}
            value={reason}
            maxLength={500}
            rows={2}
            onChange={(e) => setReason(e.target.value)}
          />
          {bullets(
            ar
              ? ['تعود العضوية نشطة ويصل العضو بريد بذلك.', 'المناصب التي انتهت لا تعود تلقائياً.']
              : [
                  'The membership is active again and the member is e-mailed.',
                  'Positions that ended do not come back by themselves.',
                ],
          )}
        </>
      ),
    },
    end: {
      title: ar ? 'إنهاء عضوية' : 'End a membership',
      primary: ar ? 'إنهاء العضوية' : 'End the membership',
      destructive: true,
      ok: reason.trim().length > 0 && confirmed,
      body: (
        <>
          {who1}
          <Textarea
            label={ar ? 'السبب (داخلي، مطلوب)' : 'Reason (internal, required)'}
            hint={ar ? 'يُحفظ في السجل للقيادة.' : 'Kept in the record for leadership.'}
            value={reason}
            maxLength={500}
            rows={2}
            onChange={(e) => setReason(e.target.value)}
          />
          <Textarea
            label={ar ? 'رسالة للعضو (اختيارية)' : 'Message to the member (optional)'}
            hint={ar ? 'تُضاف إلى بريد الإنهاء.' : 'Added to the e-mail.'}
            value={message}
            maxLength={1000}
            rows={2}
            onChange={(e) => setMessage(e.target.value)}
          />
          {bullets(
            ar
              ? [
                  'تنتهي مناصبه اليوم ويختفي من الدليل وتُلغى بطاقته.',
                  'يبقى حسابه لشهاداته وتسجيلاته السابقة.',
                ]
              : [
                  'Positions end today, the directory listing and the card go.',
                  'The account stays for certificates and past registrations.',
                ],
          )}
          <Checkbox
            label={
              ar ? 'فهمت أن هذا ينهي العضوية الآن' : 'I understand this ends the membership now'
            }
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
        </>
      ),
    },
    block: {
      title: ar ? 'حظر الحساب' : 'Block the account',
      primary: ar ? 'حظر الحساب' : 'Block the account',
      destructive: true,
      ok: reason.trim().length > 0,
      body: (
        <>
          {who1}
          <Textarea
            label={ar ? 'السبب (داخلي، مطلوب)' : 'Reason (internal, required)'}
            hint={ar ? 'مثلاً: انتحال صفة في فعالية.' : 'For example: impersonation at an event.'}
            value={reason}
            maxLength={500}
            rows={3}
            onChange={(e) => setReason(e.target.value)}
          />
          {bullets(
            ar
              ? [
                  'يُسجَّل خروجه من كل الأجهزة فوراً ولا يستطيع الدخول.',
                  'يرى عند المحاولة رسالة «حسابك موقوف عن الدخول» وطريقة التواصل.',
                  'إن كان عضواً: تُلغى بطاقته وتبقى حالة عضويته كما هي.',
                ]
              : [
                  'He or she is signed out everywhere at once and cannot sign in.',
                  'A sign-in attempt shows “Your account is blocked” and how to get in touch.',
                  'A member’s card is cancelled; the membership status stays as it is.',
                ],
          )}
          <p className="text-sm font-medium">
            {ar
              ? 'لا يمكنك حظر نفسك، ولا حظر مدير النظام.'
              : 'You cannot block yourself or the system administrator.'}
          </p>
        </>
      ),
    },
    unblock: {
      title: ar ? 'إلغاء حظر الحساب' : 'Unblock the account',
      primary: ar ? 'إلغاء الحظر' : 'Unblock',
      ok: true,
      body: (
        <>
          {who1}
          <p className="text-sm text-muted">
            {ar
              ? 'يعود قادراً على الدخول ويصله بريد بذلك. البطاقة الملغاة لا تعود؛ ينشئ العضو رمزاً جديداً.'
              : 'He or she can sign in again and gets an e-mail. A cancelled card does not return; the member creates a new code.'}
          </p>
          <Textarea
            label={ar ? 'ملاحظة (داخلية، اختيارية)' : 'Note (internal, optional)'}
            value={reason}
            maxLength={500}
            rows={2}
            onChange={(e) => setReason(e.target.value)}
          />
        </>
      ),
    },
    leave_approve: {
      title: ar ? 'الموافقة على طلب مغادرة' : 'Approve the leave request',
      primary: ar ? 'موافق' : 'Approve',
      ok: true,
      body: (
        <>
          {who1}
          {targets[0]?.leave?.reason && (
            <p className="rounded-shape-lg bg-surface-raised p-3 text-sm">
              «{targets[0].leave.reason}»
            </p>
          )}
          <RadioGroup
            legend={ar ? 'آخر يوم للعضوية' : 'Last day of membership'}
            value={lastDay}
            onChange={(v) => setLastDay(v as typeof lastDay)}
            options={[
              ...(targets[0]?.leave?.preferredLastDay
                ? [
                    {
                      value: 'preferred',
                      label: ar
                        ? `اليوم الذي فضّله: ${formatDate(targets[0].leave.preferredLastDay, lang)}`
                        : `The day they preferred: ${formatDate(targets[0].leave.preferredLastDay, lang)}`,
                    },
                  ]
                : []),
              { value: 'today', label: ar ? 'اليوم' : 'Today' },
            ]}
          />
          {bullets(
            ar
              ? [
                  'تنتهي مناصبه في اللجان ويختفي من الدليل في ذلك اليوم.',
                  'يصله بريد الموافقة مرة واحدة.',
                ]
              : [
                  'Positions end and the directory listing goes on that day.',
                  'The approval e-mail is sent once.',
                ],
          )}
        </>
      ),
    },
    leave_decline: {
      title: ar ? 'رفض طلب المغادرة؟' : 'Decline the leave request?',
      primary: ar ? 'رفض الطلب' : 'Decline',
      ok: true,
      body: (
        <>
          {who1}
          <p className="text-sm">
            {ar
              ? 'يبقى عضواً نشطاً. يصله بريد بسيط بلا رسالة ولا سبب. إن أردت شرح القرار، تواصل معه مباشرة.'
              : 'He or she stays an active member and gets a plain e-mail with no message or reason. To explain the decision, talk to them directly.'}
          </p>
          <Textarea
            label={ar ? 'ملاحظة داخلية (اختيارية، لا تُرسل)' : 'Internal note (optional, not sent)'}
            value={reason}
            maxLength={1000}
            rows={2}
            onChange={(e) => setReason(e.target.value)}
          />
        </>
      ),
    },
    resend: {
      title: ar
        ? `إعادة إرسال رابط التفعيل إلى ${targets.length}`
        : `Resend the activation link to ${targets.length}`,
      primary: ar ? 'إعادة الإرسال' : 'Resend',
      ok: true,
      body: (
        <>
          {who1}
          <p className="text-sm text-muted">
            {ar
              ? 'رابط جديد صالح 7 أيام، ويتوقف القديم. مهلة المقعد الأصلية لا تتغير.'
              : 'A new link valid for 7 days; the old one stops working. The original place deadline does not change.'}
          </p>
        </>
      ),
    },
    message: {
      title: ar
        ? `رسالة إلى ${targets.length} ${targets.length === 1 ? 'عضو' : 'أعضاء'}`
        : `Message to ${targets.length} ${targets.length === 1 ? 'member' : 'members'}`,
      primary: ar ? `إرسال إلى ${targets.length}` : `Send to ${targets.length}`,
      ok: subject.trim().length >= 2 && message.trim().length >= 2,
      body: (
        <>
          <Select
            label={ar ? 'القالب' : 'Template'}
            value={template}
            onChange={(e) => {
              const k = e.target.value as keyof typeof TEMPLATES;
              setTemplate(k);
              setSubject(TEMPLATES[k][lang][0]);
              setMessage(TEMPLATES[k][lang][1]);
            }}
          >
            <option value="none">{ar ? 'نص حر' : 'Free text'}</option>
            <option value="event_reminder">
              {ar ? 'تذكير بفعالية الأعضاء' : 'Reminder: members event'}
            </option>
            <option value="profile">{ar ? 'أكمل ملفك في الدليل' : 'Complete your profile'}</option>
          </Select>
          <Field
            label={ar ? 'الموضوع' : 'Subject'}
            value={subject}
            maxLength={150}
            onChange={(e) => setSubject(e.target.value)}
          />
          <Textarea
            label={ar ? 'النص' : 'Text'}
            value={message}
            maxLength={3000}
            rows={5}
            onChange={(e) => setMessage(e.target.value)}
          />
          <p className="text-xs text-muted">
            {ar
              ? 'تُرسل بلغة كل عضو المفضّلة إن وُجدت ترجمة، وإلا بالعربية. لا يرى أحد قائمة المستلمين.'
              : 'Sent in each member’s language when a translation exists, otherwise Arabic. Nobody sees the list of recipients.'}
          </p>
        </>
      ),
    },
  };

  const c = action ? cfg[action] : null;
  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        busy={busy}
        size="md"
        title={c?.title ?? ''}
        description={who}
        closeLabel={ar ? 'إغلاق' : 'Close'}
        footer={
          <>
            <Button variant="ghost" onClick={onClose} disabled={busy}>
              {ar ? 'تراجع' : 'Cancel'}
            </Button>
            <Button
              variant={c?.destructive ? 'destructive' : 'primary'}
              onClick={run}
              loading={busy}
              disabled={!c?.ok}
            >
              {c?.primary}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {errBox}
          {c?.body}
        </div>
      </Dialog>
      <ResultsDialog
        open={results !== null}
        onClose={() => setResults(null)}
        title={ar ? 'نتيجة الإجراء' : 'Result'}
        results={results ?? []}
        nameOf={resultName}
      />
    </>
  );
}
