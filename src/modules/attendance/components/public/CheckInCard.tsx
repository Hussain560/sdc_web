'use client';

import { CircleCheck, CircleX, Clock, LoaderCircle, RotateCw, UserCheck } from 'lucide-react';
import { useEffect, useRef, useState, useTransition } from 'react';
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import { useLanguage } from '@/context/LanguageContext';
import { Link } from '@/i18n/navigation';
import { checkIn, checkInByEmail } from '../../actions';
import { eventTitleOf, type PublicCheckInContext } from '../../types';
import '../../../../../app/[locale]/login/login.css';

type View =
  | { kind: 'done'; status: 'checked_in' | 'already'; name: string }
  | { kind: 'error'; code: string; message: string };

/**
 * The public check-in card (KFUCS parity): opened from the QR code, no sign-in. The person types the e-mail they
 * registered with and gets an immediate answer. A signed-in participant with an accepted registration is checked in
 * on arrival. The code on screen changes every two minutes; an old link answers "scan again".
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
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const title = eventTitleOf(ctx.event, lang);
  const { session } = ctx;
  const open = session.status === 'open';
  const dayLine = L(
    `اليوم ${session.day} من ${session.days}`,
    `Day ${session.day} of ${session.days}`,
  );

  const [view, setView] = useState<View | null>(
    member?.checkedInAt ? { kind: 'done', status: 'already', name: '' } : null,
  );
  const [email, setEmail] = useState('');
  const [busy, startTransition] = useTransition();
  const [cooldown, setCooldown] = useState(false);
  const started = useRef(false);

  // Signed-in and accepted: check in as soon as the page opens (never on a plain GET, so link previews are harmless).
  useEffect(() => {
    if (started.current || !member?.accepted || !open || !token || member.checkedInAt) return;
    started.current = true;
    startTransition(async () => {
      const r = await checkIn({ sessionId: session.id, token }, { lang });
      setView(
        r.ok
          ? { kind: 'done', status: r.data.status, name: '' }
          : { kind: 'error', code: r.code, message: r.message },
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once with the initial props
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown || busy || !token) return;
    setCooldown(true);
    setTimeout(() => setCooldown(false), 2000);
    startTransition(async () => {
      const r = await checkInByEmail({ sessionId: session.id, token, email }, { lang });
      setView(
        r.ok
          ? { kind: 'done', status: r.data.status, name: r.data.name }
          : { kind: 'error', code: r.code, message: r.message },
      );
    });
  };

  let icon = <UserCheck size={48} color="#00E676" aria-hidden="true" />;
  let heading = '';
  let text = '';
  let form = false;
  let retry = false;

  if (busy && !view) {
    icon = <LoaderCircle size={48} color="#00E676" aria-hidden="true" className="animate-spin" />;
    heading = L('جارٍ التحقق من تسجيلك…', 'Verifying your registration…');
  } else if (view?.kind === 'done') {
    const first = view.status === 'checked_in';
    icon = <CircleCheck size={48} color={first ? '#00E676' : '#9ca3af'} aria-hidden="true" />;
    heading = first
      ? L('تم تسجيل حضورك بنجاح', 'Check-in successful')
      : L('حضورك مسجّل مسبقًا', 'Your attendance is already recorded');
    text = `${view.name ? `${view.name} — ` : ''}${title} — ${dayLine}`;
  } else if (!open) {
    icon = <Clock size={48} color="#f59e0b" aria-hidden="true" />;
    heading = L('تسجيل الحضور غير مفتوح الآن', 'Check-in is not open right now');
    text = L(
      'أغلق المنظم هذه الجلسة أو لم يفتحها بعد.',
      'The organizer has closed this session or has not opened it yet.',
    );
  } else if (!token) {
    icon = <RotateCw size={48} color="#f59e0b" aria-hidden="true" />;
    heading = L('امسح الرمز المعروض على الشاشة', 'Scan the code on the screen');
    text = L(
      'هذا الرابط ناقص. امسح رمز QR من شاشة العرض.',
      'This link is incomplete. Scan the QR code from the display.',
    );
  } else if (view?.kind === 'error') {
    icon =
      view.code === 'TOKEN_EXPIRED' ? (
        <RotateCw size={48} color="#f59e0b" aria-hidden="true" />
      ) : (
        <CircleX size={48} color="#ef4444" aria-hidden="true" />
      );
    heading = L('تعذّر تسجيل الحضور', 'Check-in failed');
    text = view.message;
    retry = view.code !== 'TOKEN_EXPIRED' && view.code !== 'SESSION_NOT_OPEN';
  } else {
    heading = title;
    text = `${dayLine} — ${L('اكتب البريد الذي سجّلت به في الفعالية.', 'enter the e-mail you registered with.')}`;
    form = true;
  }

  return (
    <div className="sdc-login-page-wrapper">
      <Header />
      <main className="sdc-login-main">
        <div className="sdc-login-card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>{icon}</div>
          <div aria-live="polite">
            <h1 className="sdc-login-title">{heading}</h1>
            {text && <p className="sdc-login-subtitle">{text}</p>}
          </div>
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {form && (
              <form onSubmit={submit} className="sdc-login-form">
                <div className="sdc-form-group">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={busy}
                  placeholder="name@example.com"
                  aria-label={L('البريد الإلكتروني', 'E-mail address')}
                  />
                </div>
                <button type="submit" className="sdc-login-submit-btn" disabled={busy || cooldown}>
                  {busy
                    ? L('جارٍ التحقق…', 'Verifying…')
                    : L('تحقق وسجّل الحضور', 'Verify and check in')}
                </button>
              </form>
            )}
            {retry && (
              <button type="button" className="sdc-login-submit-btn" onClick={() => setView(null)}>
                {L('حاول مرة أخرى', 'Try again')}
              </button>
            )}
            <Link href={`/events/${ctx.event.slug}`} className="sdc-login-link">
              {L('العودة لصفحة الفعالية', 'Back to the event page')}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
