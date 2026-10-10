'use client';

import { CircleCheck, CircleX, Clock, Info, RotateCw, UserCheck } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Progress } from '@/components/ui/Progress';
import { TextLink } from '@/components/ui/TextLink';
import { useLanguage } from '@/context/LanguageContext';
import { withMinimumDuration } from '@/lib/min-duration';
import { checkIn, checkInByEmail } from '../../actions';
import { eventTitleOf, type PublicCheckInContext } from '../../types';

type View =
  | { kind: 'done'; status: 'checked_in' | 'already'; name: string }
  | { kind: 'error'; code: string; message: string };

const TONE = {
  success: 'bg-success-soft text-success',
  info: 'bg-info-soft text-info',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
} as const;

/**
 * The public check-in page (event page §6): a focused card under the site header, opened from the QR code, no
 * sign-in. The person types the e-mail they registered with; the answer shows after the same 1.5 s floor as the
 * registration so the work is visible. A signed-in accepted participant is checked in on arrival (never on a plain
 * GET, so link previews are harmless). The code on screen changes every two minutes: an old link says "scan again".
 */
export default function CheckInCard({
  ctx,
  token,
  member,
}: {
  ctx: PublicCheckInContext;
  token: string | null;
  member: { accepted: boolean; checkedInAt: string | null } | null;
}) {
  const { lang } = useLanguage();
  const L = (a: string, e: string) => (lang === 'ar' ? a : e);
  const title = eventTitleOf(ctx.event, lang);
  const { session } = ctx;
  const open = session.status === 'open';
  const dayLine = L(`اليوم ${session.day} من ${session.days}`, `Day ${session.day} of ${session.days}`);

  const [view, setView] = useState<View | null>(
    member?.checkedInAt ? { kind: 'done', status: 'already', name: '' } : null,
  );
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const lock = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  async function run(call: () => ReturnType<typeof checkIn>, floor = true) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const r = floor ? await withMinimumDuration(call()) : await call();
      setView(
        r.ok
          ? {
              kind: 'done',
              status: r.data.status,
              name: 'name' in r.data ? String((r.data as { name?: string }).name ?? '') : '',
            }
          : { kind: 'error', code: r.code, message: r.message },
      );
    } catch {
      setView({
        kind: 'error',
        code: 'INTERNAL',
        message: L('حدث خطأ غير متوقع، حاول مرة أخرى.', 'Something went wrong. Please try again.'),
      });
    }
    lock.current = false;
    setBusy(false);
  }

  // Signed in and accepted: check in as soon as the page opens.
  useEffect(() => {
    if (!member?.accepted || !open || !token || member.checkedInAt) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- starts the request once on arrival
    void run(() => checkIn({ sessionId: session.id, token }, { lang }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once with the initial props
  }, []);

  useEffect(() => {
    if (view) titleRef.current?.focus();
  }, [view]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (cooldown || busy || !token) return;
    setCooldown(true);
    setTimeout(() => setCooldown(false), 2000);
    void run(() =>
      checkInByEmail({ sessionId: session.id, token, email }, { lang }),
    );
  }

  let tone: keyof typeof TONE = 'info';
  let Icon = UserCheck;
  let heading = title;
  let text = '';
  let form = false;
  let retry = false;

  if (busy) {
    heading = L('جارٍ التحقق من تسجيلك…', 'Verifying your registration…');
  } else if (view?.kind === 'done') {
    const first = view.status === 'checked_in';
    tone = first ? 'success' : 'info';
    Icon = first ? CircleCheck : Info;
    heading = first
      ? L('تم تسجيل حضورك بنجاح', 'Check-in successful')
      : L('حضورك مسجّل مسبقًا', 'Your attendance is already recorded');
    text = `${view.name ? `${view.name} · ` : ''}${title} · ${dayLine}`;
  } else if (!open) {
    tone = 'warning';
    Icon = Clock;
    heading = L('تسجيل الحضور غير مفتوح الآن', 'Check-in is not open right now');
    text = L(
      'يفتح المنظّم تسجيل الحضور وقت الفعالية.',
      'The organizer opens check-in when the event runs.',
    );
  } else if (!token) {
    tone = 'warning';
    Icon = RotateCw;
    heading = L('امسح الرمز المعروض على الشاشة', 'Scan the code on the screen');
    text = L(
      'هذا الرابط ناقص. امسح رمز QR من شاشة العرض.',
      'This link is incomplete. Scan the QR code from the display.',
    );
  } else if (view?.kind === 'error') {
    const expired = view.code === 'TOKEN_EXPIRED';
    tone = expired ? 'warning' : view.code === 'NOT_ACCEPTED' ? 'info' : 'danger';
    Icon = expired ? RotateCw : view.code === 'NOT_ACCEPTED' ? Info : CircleX;
    heading = expired
      ? L('انتهت صلاحية الرمز', 'This code expired')
      : L('تعذّر تسجيل الحضور', 'Check-in failed');
    text = view.message;
    retry = !expired && view.code !== 'SESSION_NOT_OPEN';
  } else {
    form = true;
    text = `${dayLine} · ${L('اكتب البريد الذي سجّلت به في الفعالية.', 'enter the e-mail you registered with.')}`;
  }

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex w-full max-w-(--container-tight) flex-col items-center px-4 py-12">
        <div className="flex w-full flex-col items-center gap-5 rounded-shape-xl border border-line bg-surface p-6 text-center md:p-8">
          {form ? (
            <Image src="/assets/sdc-logo-mark.svg" alt="" width={48} height={48} className="size-12" />
          ) : (
            <span
              aria-hidden="true"
              className={`flex size-[72px] items-center justify-center rounded-full ${TONE[tone]}`}
            >
              <Icon className="size-10" />
            </span>
          )}
          <div role="status" aria-live="polite" className="flex flex-col gap-2">
            <h1 ref={titleRef} tabIndex={-1} className="t-h3 focus-visible:outline-none">
              {heading}
            </h1>
            {text && <p className="t-body text-muted">{text}</p>}
          </div>
          {busy && <Progress className="w-full" label={L('جارٍ التحقق…', 'Verifying…')} />}

          {form && (
            <form onSubmit={submit} className="flex w-full flex-col gap-4 text-start">
              <Field
                label={L('البريد الإلكتروني', 'E-mail address')}
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                disabled={busy}
                placeholder="name@example.com"
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" size="lg" fullWidth loading={busy} disabled={cooldown}>
                {busy ? L('جارٍ التحقق…', 'Verifying…') : L('تحقق وسجّل الحضور', 'Verify and check in')}
              </Button>
            </form>
          )}
          {retry && (
            <Button size="lg" fullWidth onClick={() => setView(null)}>
              {L('حاول مرة أخرى', 'Try again')}
            </Button>
          )}
          {view?.kind === 'error' && view.code === 'RATE_LIMITED' && (
            <Alert tone="warning" className="w-full text-start">
              {L('انتظر قليلاً ثم حاول مرة أخرى.', 'Please wait a moment and try again.')}
            </Alert>
          )}
          <TextLink href={`/events/${ctx.event.slug}`} variant="standalone" className="min-h-11">
            {L('العودة لصفحة الفعالية', 'Back to the event page')}
          </TextLink>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
