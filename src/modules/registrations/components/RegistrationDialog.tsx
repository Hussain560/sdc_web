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
import { AppleIcon, GoogleIcon } from '@/components/ui/BrandIcons';
import { Dialog } from '@/components/ui/Dialog';
import { ErrorSummary } from '@/components/ui/ErrorSummary';
import { Field } from '@/components/ui/Field';
import { PhoneField } from '@/components/ui/PhoneField';
import { Progress } from '@/components/ui/Progress';
import { ResultDialog } from '@/components/ui/ResultDialog';
import { TextLink } from '@/components/ui/TextLink';
import { useLanguage } from '@/context/LanguageContext';
import { withMinimumDuration } from '@/lib/min-duration';
import { isArabicName, isEnglishName, keepArabic, keepEnglish } from '@/lib/names';
import { DEFAULT_PHONE_COUNTRY, toE164, type PhoneCountry } from '@/lib/phone';
import { googleCalendarUrl, icsUrl, type CalendarEventInfo } from '@/modules/events/calendar-links';
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
    firstAr: 'الاسم الأول (بالعربية)',
    lastAr: 'اسم العائلة (بالعربية)',
    firstEn: 'الاسم الأول (بالإنجليزية)',
    lastEn: 'اسم العائلة (بالإنجليزية)',
    arabicOnly: 'حروف عربية فقط.',
    englishOnly: 'حروف إنجليزية فقط.',
    countryLabel: 'مفتاح الدولة',
    email: 'البريد الإلكتروني',
    emailHint: 'سنرسل التأكيد إلى هذا البريد.',
    phone: 'رقم الجوال',
    university: 'الجامعة',
    employer: 'جهة العمل',
    occupationLabel: 'أنت',
    student: 'طالب جامعي',
    employee: 'موظف',
    other: 'أخرى',
    otherField: 'حدّد',
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
    errFirstAr: 'اكتب الاسم الأول بحروف عربية (حرفان على الأقل).',
    errLastAr: 'اكتب اسم العائلة بحروف عربية (حرفان على الأقل).',
    errFirstEn: 'اكتب الاسم الأول بحروف إنجليزية (حرفان على الأقل).',
    errLastEn: 'اكتب اسم العائلة بحروف إنجليزية (حرفان على الأقل).',
    errEmail: 'اكتب بريداً إلكترونياً صحيحاً.',
    errPhone: 'اكتب رقم جوال صحيحاً للدولة المختارة.',
    errConsent: 'يجب الموافقة على سياسة الخصوصية.',
    calendar: 'أضف إلى التقويم',
    google: 'تقويم Google',
    apple: 'تقويم Apple',
    icsFile: 'تنزيل ملف التقويم (.ics)',
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
    firstAr: 'First name (Arabic)',
    lastAr: 'Last name (Arabic)',
    firstEn: 'First name (English)',
    lastEn: 'Last name (English)',
    arabicOnly: 'Arabic letters only.',
    englishOnly: 'English letters only.',
    countryLabel: 'Country calling code',
    email: 'E-mail',
    emailHint: "We'll send the confirmation here.",
    phone: 'Mobile',
    university: 'University',
    employer: 'Employer',
    occupationLabel: 'You are',
    student: 'University student',
    employee: 'Employee',
    other: 'Other',
    otherField: 'Please specify',
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
    errFirstAr: 'Enter your first name in Arabic letters (at least 2).',
    errLastAr: 'Enter your last name in Arabic letters (at least 2).',
    errFirstEn: 'Enter your first name in English letters (at least 2).',
    errLastEn: 'Enter your last name in English letters (at least 2).',
    errEmail: 'Enter a valid e-mail address.',
    errPhone: 'Enter a valid mobile number for the selected country.',
    errConsent: 'You must accept the privacy notice.',
    calendar: 'Add to calendar',
    google: 'Google Calendar',
    apple: 'Apple Calendar',
    icsFile: 'Download the calendar file (.ics)',
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
type Errors = Partial<
  Record<'firstAr' | 'lastAr' | 'firstEn' | 'lastEn' | 'email' | 'phone' | 'consent', string>
>;

export type RegistrationTarget = {
  id: string;
  slug: string;
  title: string;
  meta?: string;
  /** What the "add to calendar" choices need; the event page link is relative and gets the site origin here. */
  calendar?: CalendarEventInfo | null;
};

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
  const [firstAr, setFirstAr] = useState('');
  const [lastAr, setLastAr] = useState('');
  const [firstEn, setFirstEn] = useState('');
  const [lastEn, setLastEn] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState<PhoneCountry>(DEFAULT_PHONE_COUNTRY);
  const [phone, setPhone] = useState('');
  const [occupation, setOccupation] = useState<'student' | 'employee' | 'other' | null>(null);
  const [university, setUniversity] = useState('');
  const [employer, setEmployer] = useState('');
  const [occupationOther, setOccupationOther] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  // A field's message shows once it was filled and left (blur), or after a submit attempt.
  const [touched, setTouched] = useState<Partial<Record<keyof Errors, boolean>>>({});
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
    if (!isArabicName(firstAr)) e.firstAr = t.errFirstAr;
    if (!isArabicName(lastAr)) e.lastAr = t.errLastAr;
    if (!isEnglishName(firstEn)) e.firstEn = t.errFirstEn;
    if (!isEnglishName(lastEn)) e.lastEn = t.errLastEn;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) e.email = t.errEmail;
    if (!toE164(country, phone)) e.phone = t.errPhone;
    if (!consent) e.consent = t.errConsent;
    return e;
  };

  const liveErrors = validate();
  const touch = (field: keyof Errors) => () =>
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }));
  /** The message for one field, or nothing while it is untouched. */
  const show = (field: keyof Errors) =>
    submitted || touched[field] ? (liveErrors[field] ?? errors[field]) : undefined;

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
              firstAr: firstAr.trim(),
              lastAr: lastAr.trim(),
              firstEn: firstEn.trim(),
              lastEn: lastEn.trim(),
              email,
              phone: toE164(country, phone) ?? '',
              phoneCountry: country,
              occupation: occupation ?? undefined,
              university: occupation === 'student' ? university.trim() || undefined : undefined,
              employer: occupation === 'employee' ? employer.trim() || undefined : undefined,
              occupationOther:
                occupation === 'other' ? occupationOther.trim() || undefined : undefined,
              honeypot,
              consent,
              elapsedMs: Date.now() - openedAt.current,
            },
            { lang },
          );
      // Held back 4 to 5 seconds: a visible wait that makes quick repeated submissions pointless.
      const r = await withMinimumDuration(call, { minMs: 4000 + Math.round(Math.random() * 1000) });
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
  // The event page link is relative in the server-built target; calendars need it absolute.
  const calendar: CalendarEventInfo | null = event.calendar
    ? {
        ...event.calendar,
        url: event.calendar.url.startsWith('http')
          ? event.calendar.url
          : `${typeof window === 'undefined' ? '' : window.location.origin}${event.calendar.url}`,
      }
    : null;

  const resultActions = r && (
    <>
      {r.action === 'calendar' && (
        <>
          {calendar && (
            <div className="flex w-full flex-col gap-2">
              <p className="t-label text-center text-muted">{t.calendar}</p>
              <a
                href={googleCalendarUrl(calendar)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses({ variant: 'secondary', size: 'lg', fullWidth: true })}
              >
                <GoogleIcon />
                {t.google}
              </a>
              <a
                href={icsUrl(event.slug, lang)}
                className={buttonClasses({ variant: 'secondary', size: 'lg', fullWidth: true })}
              >
                <AppleIcon />
                {t.apple}
              </a>
              <a
                href={icsUrl(event.slug, lang)}
                download
                className="t-body-sm min-h-11 self-center py-2 text-accent-text underline underline-offset-[3px]"
              >
                {t.icsFile}
              </a>
            </div>
          )}
          <Button size="lg" onClick={handleClose}>
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
          ['g-first-ar', errors.firstAr],
          ['g-last-ar', errors.lastAr],
          ['g-first-en', errors.firstEn],
          ['g-last-en', errors.lastEn],
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
        // Swapping to the result closes this dialog programmatically; that must not count as the user closing it.
        onClose={() => phase !== 'result' && handleClose()}
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
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  id="g-first-ar"
                  label={t.firstAr}
                  requiredLabel={t.required}
                  autoComplete="given-name"
                  dir="rtl"
                  lang="ar"
                  maxLength={40}
                  readOnly={sending}
                  value={firstAr}
                  error={show('firstAr')}
                  onBlur={touch('firstAr')}
                  onChange={(e) => setFirstAr(keepArabic(e.target.value))}
                />
                <Field
                  id="g-last-ar"
                  label={t.lastAr}
                  requiredLabel={t.required}
                  autoComplete="family-name"
                  dir="rtl"
                  lang="ar"
                  maxLength={40}
                  readOnly={sending}
                  value={lastAr}
                  error={show('lastAr')}
                  onBlur={touch('lastAr')}
                  onChange={(e) => setLastAr(keepArabic(e.target.value))}
                />
                <Field
                  id="g-first-en"
                  label={t.firstEn}
                  requiredLabel={t.required}
                  autoComplete="off"
                  dir="ltr"
                  lang="en"
                  maxLength={40}
                  readOnly={sending}
                  value={firstEn}
                  error={show('firstEn')}
                  onBlur={touch('firstEn')}
                  onChange={(e) => setFirstEn(keepEnglish(e.target.value))}
                />
                <Field
                  id="g-last-en"
                  label={t.lastEn}
                  requiredLabel={t.required}
                  autoComplete="off"
                  dir="ltr"
                  lang="en"
                  maxLength={40}
                  readOnly={sending}
                  value={lastEn}
                  error={show('lastEn')}
                  onBlur={touch('lastEn')}
                  onChange={(e) => setLastEn(keepEnglish(e.target.value))}
                />
              </div>
              <Field
                id="g-email"
                label={t.email}
                requiredLabel={t.required}
                type="email"
                autoComplete="email"
                readOnly={sending}
                value={email}
                error={show('email')}
                onBlur={touch('email')}
                onChange={(e) => setEmail(e.target.value)}
              />
              <PhoneField
                id="g-phone"
                label={t.phone}
                requiredLabel={t.required}
                lang={lang}
                countryLabel={t.countryLabel}
                country={country}
                onCountryChange={(c) => {
                  setCountry(c);
                  setPhone('');
                }}
                value={phone}
                onChange={setPhone}
                readOnly={sending}
                error={show('phone')}
                onBlur={touch('phone')}
              />
              <fieldset className="flex flex-col gap-3" disabled={sending}>
                <legend className="t-label mb-2 text-text">
                  {t.occupationLabel} <span className="font-normal text-muted">({t.optional})</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {(['student', 'employee', 'other'] as const).map((o) => (
                    <button
                      key={o}
                      type="button"
                      aria-pressed={occupation === o}
                      onClick={() => setOccupation(occupation === o ? null : o)}
                      className={buttonClasses({
                        variant: occupation === o ? 'primary' : 'secondary',
                        size: 'md',
                      })}
                    >
                      {o === 'student' ? t.student : o === 'employee' ? t.employee : t.other}
                    </button>
                  ))}
                </div>
                {occupation === 'student' && (
                  <Field
                    id="g-university"
                    label={t.university}
                    optionalLabel={t.optional}
                    readOnly={sending}
                    maxLength={120}
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                  />
                )}
                {occupation === 'other' && (
                  <Field
                    id="g-occupation-other"
                    label={t.otherField}
                    optionalLabel={t.optional}
                    readOnly={sending}
                    maxLength={120}
                    value={occupationOther}
                    onChange={(e) => setOccupationOther(e.target.value)}
                  />
                )}
                {occupation === 'employee' && (
                  <Field
                    id="g-employer"
                    label={t.employer}
                    optionalLabel={t.optional}
                    readOnly={sending}
                    maxLength={120}
                    value={employer}
                    onChange={(e) => setEmployer(e.target.value)}
                  />
                )}
              </fieldset>
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
