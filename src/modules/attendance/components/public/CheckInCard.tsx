'use client';

import {
  CircleCheck,
  CircleX,
  Clock,
  Info,
  RefreshCw,
  Timer,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { CHROME } from '@/components/layout/chrome-strings';
import { LocaleSwitch } from '@/components/layout/LocaleSwitch';
import { Logo } from '@/components/layout/Logo';
import { ThemeSwitch } from '@/components/layout/ThemeSwitch';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Progress } from '@/components/ui/Progress';
import { TextLink } from '@/components/ui/TextLink';
import { useLanguage } from '@/context/LanguageContext';
import { withMinimumDuration } from '@/lib/min-duration';
import { checkIn, checkInByEmail } from '../../actions';
import type { CheckInTokenStatus } from '../../queries';
import { eventTitleOf, type PublicCheckInContext } from '../../types';

/** Every outcome of the page (event page canvas, "حالات البطاقة"). */
type Outcome =
  | { kind: 'success'; at: string }
  | { kind: 'already'; at: string | null }
  | { kind: 'closed' }
  | { kind: 'expired' }
  | { kind: 'limited' }
  | { kind: 'not-found' }
  | { kind: 'cancelled' }
  | { kind: 'failed'; message: string };

const TONE = {
  success: 'bg-success-soft text-success',
  info: 'bg-info-soft text-info',
  neutral: 'bg-surface-raised text-muted',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
} as const;

/** The answer is held back 3 to 4 seconds so the work is visible; the length varies a little on purpose. */
const feedbackMs = () => 3000 + Math.round(Math.random() * 1000);
/** After "too many attempts" the retry button waits this long. */
const RETRY_WAIT_S = 20;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

/**
 * The public check-in page (event page §6): a focused card opened from the QR code, no sign-in. The person types the
 * e-mail they registered with and the answer shows after 3 to 4 seconds. A signed-in accepted participant is checked
 * in on arrival (never on a plain GET, so link previews are harmless). The code on screen is valid for 120 seconds;
 * the server says so when an old link is opened, before anyone types, and again when one is submitted.
 */
export default function CheckInCard({
  ctx,
  token,
  tokenStatus,
  member,
}: {
  ctx: PublicCheckInContext;
  token: string | null;
  tokenStatus: CheckInTokenStatus;
  member: { accepted: boolean; checkedInAt: string | null } | null;
}) {
  const { lang } = useLanguage();
  const L = (a: string, e: string) => (lang === 'ar' ? a : e);
  const title = eventTitleOf(ctx.event, lang);
  const { session } = ctx;
  const open = session.status === 'open' && tokenStatus !== 'closed';
  const dayLine = L(`اليوم ${session.day} من ${session.days}`, `Day ${session.day} of ${session.days}`);
  const locale = lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB';
  const clock = (iso: string) =>
    new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Riyadh',
    }).format(new Date(iso));
  const dayMonth = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', timeZone: 'Asia/Riyadh' }).format(
      new Date(iso),
    );

  const [outcome, setOutcome] = useState<Outcome | null>(
    member?.checkedInAt ? { kind: 'already', at: member.checkedInAt } : null,
  );
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [wait, setWait] = useState(0);
  const lock = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  async function run(call: () => Promise<Outcome | { field: string }>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const r = await withMinimumDuration(call(), { minMs: feedbackMs() });
      if ('field' in r) setEmailError(r.field);
      else {
        setOutcome(r);
        if (r.kind === 'limited') setWait(RETRY_WAIT_S);
      }
    } catch {
      setOutcome({
        kind: 'failed',
        message: L('حدث خطأ غير متوقع، حاول مرة أخرى.', 'Something went wrong. Please try again.'),
      });
    }
    lock.current = false;
    setBusy(false);
  }

  // Signed in and accepted: check in as soon as the page opens.
  useEffect(() => {
    if (!member?.accepted || !open || !token || tokenStatus !== 'valid' || member.checkedInAt) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one automatic check-in on arrival; sets the busy flag
    void run(async () => {
      const r = await checkIn({ sessionId: session.id, token }, { lang });
      return r.ok
        ? r.data.status === 'checked_in'
          ? { kind: 'success', at: new Date().toISOString() }
          : { kind: 'already', at: null }
        : outcomeOf(r.code, r.message);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once with the initial props
  }, []);

  useEffect(() => {
    if (outcome) titleRef.current?.focus();
  }, [outcome]);

  // The retry button's countdown after "too many attempts".
  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  function outcomeOf(code: string, message: string): Outcome {
    switch (code) {
      case 'TOKEN_EXPIRED':
        return { kind: 'expired' };
      case 'SESSION_NOT_OPEN':
        return { kind: 'closed' };
      case 'RATE_LIMITED':
        return { kind: 'limited' };
      case 'NOT_REGISTERED':
      case 'NOT_ACCEPTED':
        return { kind: 'not-found' };
      case 'REGISTRATION_CANCELLED':
        return { kind: 'cancelled' };
      default:
        return { kind: 'failed', message };
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (cooldown || busy || !token) return;
    if (!EMAIL.test(email.trim())) {
      setEmailError(L('اكتب بريدًا إلكترونيًا صحيحًا.', 'Enter a valid e-mail address.'));
      return;
    }
    setEmailError('');
    setCooldown(true);
    setTimeout(() => setCooldown(false), 2000);
    void run(async () => {
      const r = await checkInByEmail({ sessionId: session.id, token, email }, { lang });
      if (r.ok) {
        return r.data.status === 'checked_in'
          ? { kind: 'success', at: r.data.checkedInAt ?? new Date().toISOString() }
          : { kind: 'already', at: r.data.checkedInAt };
      }
      if (r.code === 'VALIDATION_FAILED') return { field: r.message };
      return outcomeOf(r.code, r.message);
    });
  }

  // What the card shows, in the order the situations are decided.
  let tone: keyof typeof TONE = 'info';
  let Icon: LucideIcon = UserCheck;
  let heading = title;
  let text = '';
  let form = false;
  let retry = false;

  const state: Outcome | { kind: 'start' } | null = busy
    ? null
    : (outcome ??
      (!open
        ? { kind: 'closed' }
        : tokenStatus === 'expired'
          ? { kind: 'expired' }
          : !token || tokenStatus === 'missing'
            ? { kind: 'scan' as never }
            : { kind: 'start' }));

  if (busy) {
    heading = L('جارٍ التحقق من تسجيلك…', 'Verifying your registration…');
  } else if (state) {
    switch (state.kind) {
      case 'success':
        tone = 'success';
        Icon = CircleCheck;
        heading = L('تم تسجيل حضورك', "You're checked in");
        text = `${dayMonth(state.at)} • ${clock(state.at)}`;
        break;
      case 'already':
        tone = 'info';
        Icon = Info;
        heading = L('حضورك مسجّل مسبقاً', "You're already checked in");
        text = state.at
          ? L(
              `سُجّل حضورك في هذه الجلسة الساعة ${clock(state.at)}.`,
              `Your attendance for this session was recorded at ${clock(state.at)}.`,
            )
          : L('سُجّل حضورك في هذه الجلسة.', 'Your attendance for this session is recorded.');
        break;
      case 'closed':
        tone = 'neutral';
        Icon = Clock;
        heading = L('الجلسة غير مفتوحة الآن', "This session isn't open");
        text = L(
          'يفتح المنظّم تسجيل الحضور وقت الفعالية.',
          'The organizer opens check-in when the event runs.',
        );
        break;
      case 'expired':
        tone = 'warning';
        Icon = RefreshCw;
        heading = L('انتهت صلاحية الرمز', 'This code expired');
        text = L('امسح الرمز المعروض الآن.', 'Scan the code on screen again.');
        break;
      case 'limited':
        tone = 'warning';
        Icon = Timer;
        heading = L('محاولات كثيرة', 'Too many attempts');
        text = L('انتظر قليلاً ثم حاول مرة أخرى.', 'Please wait a moment and try again.');
        retry = true;
        break;
      case 'not-found':
        tone = 'neutral';
        Icon = Info;
        heading = L('لم نجد تسجيلاً مقبولاً بهذا البريد', 'No accepted registration matches this e-mail');
        text = L(
          'تأكّد من البريد الذي سجّلت به، أو تواصل مع المنظّم في القاعة.',
          'Check the e-mail you registered with, or ask the organizer at the venue.',
        );
        retry = true;
        break;
      case 'cancelled':
        tone = 'neutral';
        Icon = Info;
        heading = L('أُلغي تسجيلك في هذه الفعالية', 'Your registration was cancelled');
        text = L(
          'تواصل مع المنظّم في القاعة إن كان هذا خطأً.',
          'Ask the organizer at the venue if this is a mistake.',
        );
        break;
      case 'failed':
        tone = 'danger';
        Icon = CircleX;
        heading = L('تعذّر تسجيل الحضور', 'Check-in failed');
        text = state.message;
        retry = true;
        break;
      case 'start':
        form = true;
        text = `${dayLine} · ${L('اكتب البريد الذي سجّلت به في الفعالية.', 'enter the e-mail you registered with.')}`;
        break;
      default:
        // A link without its code.
        tone = 'warning';
        Icon = RefreshCw;
        heading = L('امسح الرمز المعروض على الشاشة', 'Scan the code on the screen');
        text = L(
          'هذا الرابط ناقص. امسح رمز QR من شاشة العرض.',
          'This link is incomplete. Scan the QR code from the display.',
        );
    }
  }

  const chrome = CHROME[lang];
  return (
    <div className="flex min-h-dvh flex-col">
      {/* No site header or footer: just the way home and the language and theme switches. */}
      <header className="mx-auto flex h-16 w-full max-w-(--container) items-center justify-between px-4 md:px-8">
        <Logo label={chrome.logoHome} alt={chrome.logoAlt} priority />
        <div className="flex items-center gap-1">
          <LocaleSwitch />
          <ThemeSwitch />
        </div>
      </header>
      <main
        id="main"
        className="mx-auto flex w-full max-w-[36rem] flex-1 flex-col items-center justify-center gap-6 px-4 py-8 md:py-12"
      >
        <div className="flex w-full flex-col items-center gap-7 rounded-shape-2xl border border-line bg-surface px-6 py-10 text-center md:px-10 md:py-14">
          {form ? (
            <Image
              src="/assets/brand/sdc-mark.svg"
              alt=""
              width={72}
              height={72}
              className="size-[72px] object-contain"
            />
          ) : (
            <span
              aria-hidden="true"
              className={`flex size-28 items-center justify-center rounded-full ${TONE[tone]}`}
            >
              <Icon className="size-14" />
            </span>
          )}
          <div role="status" aria-live="polite" className="flex flex-col gap-3">
            <h1
              ref={titleRef}
              tabIndex={-1}
              className="t-h3 focus-visible:outline-none md:text-[2rem]"
            >
              {heading}
            </h1>
            {text && <p className="t-lede text-muted">{text}</p>}
          </div>
          {busy && (
            <Progress className="w-full" label={L('جارٍ التحقق…', 'Verifying…')} />
          )}

          {(form || busy) && (
            <form onSubmit={submit} noValidate className="flex w-full flex-col gap-5 text-start">
              <Field
                label={L('البريد الإلكتروني', 'E-mail address')}
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                disabled={busy}
                error={emailError || undefined}
                placeholder="name@example.com"
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" size="lg" fullWidth loading={busy} disabled={cooldown}>
                {busy
                  ? L('جارٍ التحقق…', 'Verifying…')
                  : L('تحقق وسجّل الحضور', 'Verify and check in')}
              </Button>
            </form>
          )}
          {retry && (
            <Button
              size="lg"
              fullWidth
              disabled={wait > 0}
              onClick={() => {
                setOutcome(null);
                setEmailError('');
              }}
            >
              {wait > 0
                ? L(`حاول مرة أخرى بعد ${wait} ث`, `Try again in ${wait} s`)
                : L('حاول مرة أخرى', 'Try again')}
            </Button>
          )}
        </div>
        <nav
          aria-label={L('روابط التنقل', 'Navigation')}
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          <TextLink href="/" variant="standalone" className="min-h-11">
            {L('العودة إلى الرئيسية', 'Back to home')}
          </TextLink>
          <TextLink href={`/events/${ctx.event.slug}`} variant="standalone" className="min-h-11">
            {L('صفحة الفعالية', 'Event page')}
          </TextLink>
        </nav>
      </main>
    </div>
  );
}
