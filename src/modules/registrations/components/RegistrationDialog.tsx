'use client';

import {
  CalendarX,
  CircleCheck,
  CircleX,
  Clock,
  Info,
  ListOrdered,
  Timer,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button, LinkButton, buttonClasses } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Dialog } from '@/components/ui/Dialog';
import { ErrorSummary } from '@/components/ui/ErrorSummary';
import { Field } from '@/components/ui/Field';
import { Progress } from '@/components/ui/Progress';
import { ResultDialog } from '@/components/ui/ResultDialog';
import { TextLink } from '@/components/ui/TextLink';
import { useLanguage } from '@/context/LanguageContext';
import { withMinimumDuration } from '@/lib/min-duration';
import { registerForEvent, registerGuest, type RegistrationStatus } from '../actions';
import { outcomeForCode, outcomeForStatus, resultFor, type ResultOutcome } from '../result';

const ICONS: Record<string, LucideIcon> = {
  CircleCheck,
  Clock,
  ListOrdered,
  Info,
  Users,
  CalendarX,
  Timer,
  UserRound,
  CircleX,
};

/** Remembered on this device so the button reads "Registered"; the server still refuses a second registration. */
export const guestKey = (eventId: string) => `sdc_guest_reg_${eventId}`;

const COOLDOWN_MS = 2500;
const RATE_LIMIT_MS = 30_000;

const TEXT = {
  ar: {
    title: (t: string) => `التسجيل في ${t}`,
    confirmTitle: (t: string) => `تأكيد التسجيل في ${t}`,
    name: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    emailHint: 'سنرسل التأكيد إلى هذا البريد.',
    phone: 'رقم الجوال',
    university: 'الجامعة',
    required: 'مطلوب',
    optional: 'اختياري',
    consent: 'أوافق على',
    privacy: 'سياسة الخصوصية',
    newTab: '(يفتح في نافذة جديدة)',
    submit: 'سجّل',
    submitWaitlist: 'انضم لقائمة الانتظار',
    cancel: 'إلغاء',
    sending: 'جارٍ التسجيل…',
    sendingStatus: 'جارٍ تسجيلك…',
    busyHint: 'سيُغلق بعد اكتمال الإرسال',
    close: 'إغلاق',
    summary: 'راجع الحقول التالية',
    errName: 'اكتب اسمك الكامل (3 أحرف على الأقل).',
    errEmail: 'اكتب بريداً إلكترونياً صحيحاً.',
    errPhone: 'اكتب رقم جوال من 8 إلى 15 رقماً.',
    errConsent: 'يجب الموافقة على سياسة الخصوصية.',
    calendar: 'أضف إلى التقويم',
    done: 'تم',
    ok: 'حسناً',
    browse: 'تصفّح الفعاليات',
    apply: 'قدّم طلب العضوية',
    retry: 'حاول مرة أخرى',
    waitIn: (n: number) => `يمكنك المحاولة بعد ${n} ثانية`,
    yourName: 'الاسم',
  },
  en: {
    title: (t: string) => `Register for ${t}`,
    confirmTitle: (t: string) => `Confirm registration for ${t}`,
    name: 'Full name',
    email: 'E-mail',
    emailHint: "We'll send the confirmation here.",
    phone: 'Mobile',
    university: 'University',
    required: 'required',
    optional: 'optional',
    consent: 'I agree to the',
    privacy: 'privacy notice',
    newTab: '(opens in a new tab)',
    submit: 'Register',
    submitWaitlist: 'Join the waiting list',
    cancel: 'Cancel',
    sending: 'Registering…',
    sendingStatus: 'Registering you…',
    busyHint: 'This closes once sending finishes',
    close: 'Close',
    summary: 'Check the following fields',
    errName: 'Enter your full name (at least 3 characters).',
    errEmail: 'Enter a valid e-mail address.',
    errPhone: 'Enter a mobile number of 8 to 15 digits.',
    errConsent: 'You must accept the privacy notice.',
    calendar: 'Add to calendar',
    done: 'Done',
    ok: 'OK',
    browse: 'Browse events',
    apply: 'Apply for membership',
    retry: 'Try again',
    waitIn: (n: number) => `You can try again in ${n} s`,
    yourName: 'Name',
  },
} as const;

type Phase = 'form' | 'sending' | 'result';
type Errors = Partial<Record<'name' | 'email' | 'phone' | 'consent', string>>;

export type RegistrationTarget = { id: string; slug: string; title: string; meta?: string };

/**
 * The single registration dialog (event page §5): a form (a bottom sheet on phones), then, on a valid submit,
 * an immediate locked "sending" state, then a result dialog at `max(server answer, 1.5 s)` for every outcome.
 * Signed-in members get a short confirm with their name and e-mail. Layers kept from the old dialog: a hidden
 * honeypot, the fill time, a ref that blocks a double submit, the client cooldown after a refusal, and the
 * database throttles (authoritative).
 */
export function RegistrationDialog({
  open,
  onClose,
  event,
  waitlist,
  member,
  onRegistered,
}: {
  open: boolean;
  onClose: () => void;
  event: RegistrationTarget;
  waitlist?: boolean;
  /** Present for a signed-in member: shown read-only, no guest form. */
  member?: { name: string; email: string };
  onRegistered?: (status: RegistrationStatus) => void;
}) {
  const { lang } = useLanguage();
  const t = TEXT[lang];
  const [phase, setPhase] = useState<Phase>('form');
  const [outcome, setOutcome] = useState<ResultOutcome | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [wait, setWait] = useState(0);
  const lock = useRef(false);
  const openedAt = useRef(0);
  const waitTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (open) openedAt.current = Date.now(); // the minimum fill time counts from when the form opened
  }, [open]);

  const typedEmail = member?.email ?? email.trim();
  const sending = phase === 'sending';

  const startCooldown = (ms: number) => {
    if (waitTimer.current) clearInterval(waitTimer.current);
    let left = Math.ceil(ms / 1000);
    setWait(left);
    waitTimer.current = setInterval(() => {
      left -= 1;
      setWait(left);
      if (left <= 0 && waitTimer.current) clearInterval(waitTimer.current);
    }, 1000);
  };

  const validate = (): Errors => {
    if (member) return consent ? {} : { consent: t.errConsent };
    const e: Errors = {};
    if (name.trim().length < 3) e.name = t.errName;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) e.email = t.errEmail;
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15 || !/^[+0-9 ()-]+$/.test(phone.trim()))
      e.phone = t.errPhone;
    if (!consent) e.consent = t.errConsent;
    return e;
  };

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (lock.current || sending || wait > 0) return;
    const found = validate();
    setErrors(found);
    setSubmitted(true);
    // Validation never waits and never sends a request.
    if (Object.keys(found).length > 0) return;

    lock.current = true;
    setPhase('sending'); // immediately: the form is inert, close and Esc are disabled
    let result: ResultOutcome;
    try {
      const call = member
        ? registerForEvent({ eventId: event.id }, { lang })
        : registerGuest(
            {
              eventId: event.id,
              name,
              email,
              phone,
              university: university.trim() || undefined,
              honeypot,
              consent,
              elapsedMs: Date.now() - openedAt.current,
            },
            { lang },
          );
      const r = await withMinimumDuration(call);
      if (r.ok) {
        result = outcomeForStatus(r.data.status);
        if (!member) {
          try {
            localStorage.setItem(guestKey(event.id), email.trim().toLowerCase());
          } catch {
            /* private mode: the server still refuses a second registration */
          }
        }
        onRegistered?.(r.data.status);
      } else {
        result = outcomeForCode(r.code);
        if (result === 'VALIDATION_FAILED' || result === 'CONSENT_REQUIRED') {
          if (r.fieldErrors) setErrors(r.fieldErrors as Errors);
        }
        if (result === 'RATE_LIMITED' || result === 'TOO_FAST') startCooldown(RATE_LIMIT_MS);
        else startCooldown(COOLDOWN_MS);
      }
    } catch (e) {
      result = e instanceof Error && e.name === 'TimeoutError' ? 'TIMEOUT' : 'INTERNAL';
      startCooldown(COOLDOWN_MS);
    }
    lock.current = false;
    if (result === 'VALIDATION_FAILED' || result === 'CONSENT_REQUIRED') {
      setPhase('form');
      return;
    }
    setOutcome(result);
    setPhase('result');
  }

  function handleClose() {
    if (sending) return;
    setPhase('form');
    setOutcome(null);
    onClose();
  }

  const r = outcome ? resultFor(outcome, lang, typedEmail) : null;

  const resultActions = r && (
    <>
      {r.action === 'calendar' && (
        <>
          <a
            href={`/events/${event.slug}/calendar.ics`}
            download
            className={buttonClasses({ size: 'lg' })}
          >
            {t.calendar}
          </a>
          <Button variant="ghost" onClick={handleClose}>
            {t.done}
          </Button>
        </>
      )}
      {r.action === 'done' && (
        <Button size="lg" onClick={handleClose}>
          {t.done}
        </Button>
      )}
      {r.action === 'browse' && (
        <LinkButton href="/events" size="lg">
          {t.browse}
        </LinkButton>
      )}
      {r.action === 'apply' && (
        <LinkButton href="/join" size="lg">
          {t.apply}
        </LinkButton>
      )}
      {r.action === 'ok' && (
        <>
          <Button
            size="lg"
            onClick={() => {
              setPhase('form');
              setOutcome(null);
            }}
          >
            {t.ok}
          </Button>
          {wait > 0 && (
            <p role="timer" className="t-body-sm text-muted">
              {t.waitIn(wait)}
            </p>
          )}
        </>
      )}
      {r.action === 'retry' && (
        <Button
          size="lg"
          onClick={() => {
            setPhase('form');
            setOutcome(null);
          }}
        >
          {t.retry}
        </Button>
      )}
    </>
  );

  const errorItems = submitted
    ? (
        [
          ['g-name', errors.name],
          ['g-email', errors.email],
          ['g-phone', errors.phone],
          ['g-consent', errors.consent],
        ] as const
      ).flatMap(([fieldId, message]) => (message ? [{ fieldId, message }] : []))
    : [];

  return (
    <>
      <Dialog
        open={open && phase !== 'result'}
        onClose={handleClose}
        title={member ? t.confirmTitle(event.title) : t.title(event.title)}
        description={event.meta}
        closeLabel={t.close}
        busy={sending}
        busyHint={t.busyHint}
        presentation="sheet"
        size="md"
      >
        <form
          id="registration-form"
          noValidate
          onSubmit={(e) => void submit(e)}
          className="flex flex-col gap-5"
        >
          {sending && <Progress label={t.sendingStatus} />}
          <ErrorSummary title={t.summary} errors={errorItems} />

          {/* Honeypot: invisible to people, tempting to bots. */}
          <div aria-hidden="true" className="absolute -start-[9999px] h-0 overflow-hidden">
            <label>
              Website
              <input
                type="text"
                name="company_website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </label>
          </div>

          {member ? (
            <dl className="t-body flex flex-col gap-2 rounded-shape-md bg-surface-raised p-4">
              <div>
                <dt className="t-caption text-muted">{t.yourName}</dt>
                <dd>{member.name}</dd>
              </div>
              <div>
                <dt className="t-caption text-muted">{t.email}</dt>
                <dd dir="ltr" className="text-start">
                  {member.email}
                </dd>
              </div>
            </dl>
          ) : (
            <>
              <Field
                id="g-name"
                label={t.name}
                requiredLabel={t.required}
                autoComplete="name"
                readOnly={sending}
                value={name}
                error={submitted ? errors.name : undefined}
                onChange={(e) => setName(e.target.value)}
              />
              <Field
                id="g-email"
                label={t.email}
                requiredLabel={t.required}
                type="email"
                autoComplete="email"
                hint={t.emailHint}
                readOnly={sending}
                value={email}
                error={submitted ? errors.email : undefined}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Field
                id="g-phone"
                label={t.phone}
                requiredLabel={t.required}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                readOnly={sending}
                value={phone}
                error={submitted ? errors.phone : undefined}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Field
                id="g-university"
                label={t.university}
                optionalLabel={t.optional}
                readOnly={sending}
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
              />
            </>
          )}

          <Checkbox
            id="g-consent"
            checked={consent}
            disabled={sending}
            error={submitted ? errors.consent : undefined}
            onChange={(e) => setConsent(e.target.checked)}
            label={
              <>
                {t.consent}{' '}
                <TextLink href="/privacy" external externalLabel={t.newTab} variant="inline">
                  {t.privacy}
                </TextLink>
              </>
            }
          />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" disabled={sending} onClick={handleClose}>
              {t.cancel}
            </Button>
            <Button
              type="submit"
              size="lg"
              loading={sending}
              disabled={wait > 0}
              className="max-sm:w-full"
            >
              {sending ? t.sending : waitlist ? t.submitWaitlist : t.submit}
            </Button>
          </div>
        </form>
      </Dialog>

      <ResultDialog
        open={open && phase === 'result' && !!r}
        onClose={handleClose}
        tone={r?.tone === 'neutral' ? 'info' : (r?.tone ?? 'info')}
        icon={r ? ICONS[r.icon] : undefined}
        title={r?.titleText ?? ''}
        description={r?.bodyText}
        actions={resultActions}
      />
    </>
  );
}
