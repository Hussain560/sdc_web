'use client';

import { CircleCheck, CircleX, Clock, Info, RotateCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import { useLanguage } from '@/context/LanguageContext';
import { Link } from '@/i18n/navigation';
import { checkIn } from '../../actions';
import { eventTitleOf, type CheckInContext } from '../../types';
import '../../../../../app/[locale]/login/login.css';

type View =
  | { kind: 'working' }
  | { kind: 'done'; status: 'checked_in' | 'already' }
  | { kind: 'error'; code: string; message: string };

/** The participant check-in card (public screens 12 §2): same centered card as the auth pages. */
export default function CheckInCard({ ctx, token }: { ctx: CheckInContext; token: string | null }) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const title = eventTitleOf(ctx.event, lang);
  const session = ctx.session;
  const open = session?.status === 'open';
  const online = ctx.event.mode !== 'in_person';
  const alreadyIn = !!ctx.checkedInAt;

  const [view, setView] = useState<View | null>(null);
  const started = useRef(false);

  const run = async (withToken: string | null) => {
    if (!session) return;
    setView({ kind: 'working' });
    const r = await checkIn({ sessionId: session.id, token: withToken ?? undefined }, { lang });
    setView(
      r.ok
        ? { kind: 'done', status: r.data.status }
        : { kind: 'error', code: r.code, message: r.message },
    );
  };

  // A scanned code checks the person in as soon as the page opens (never on a plain GET, so link previews are harmless).
  useEffect(() => {
    if (started.current) return;
    if (ctx.accepted && open && token && !alreadyIn) {
      started.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time action on arrival
      void run(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once with the initial props
  }, []);

  const dayLine = session
    ? L(`اليوم ${session.day} من ${session.days}`, `Day ${session.day} of ${session.days}`)
    : '';

  let icon = <Info size={48} color="#00E676" aria-hidden="true" />;
  let heading = '';
  let text = '';
  let action: React.ReactNode = null;

  if (!ctx.accepted) {
    heading = L(
      'التسجيل في الحضور متاح للمقبولين فقط',
      'Check-in is for accepted participants only',
    );
    text = L(
      'سجّل في الفعالية وانتظر قبولك، ثم عد إلى هنا.',
      'Register for the event and wait for your acceptance, then come back.',
    );
  } else if (view?.kind === 'working') {
    icon = <RotateCw size={48} color="#00E676" aria-hidden="true" className="animate-spin" />;
    heading = L('جارٍ تسجيل حضورك…', 'Checking you in…');
  } else if (view?.kind === 'done' || alreadyIn) {
    const first = view?.kind === 'done' && view.status === 'checked_in';
    icon = <CircleCheck size={48} color={first ? '#00E676' : '#9ca3af'} aria-hidden="true" />;
    heading = first
      ? L('تم تسجيل حضورك', 'You are checked in')
      : L('حضورك مسجّل مسبقًا', 'Your attendance is already recorded');
    text = `${title}${dayLine ? ` — ${dayLine}` : ''}`;
  } else if (view?.kind === 'error') {
    icon =
      view.code === 'TOKEN_EXPIRED' ? (
        <RotateCw size={48} color="#f59e0b" aria-hidden="true" />
      ) : view.code === 'SESSION_NOT_OPEN' ? (
        <Clock size={48} color="#f59e0b" aria-hidden="true" />
      ) : (
        <CircleX size={48} color="#ef4444" aria-hidden="true" />
      );
    heading = view.message;
  } else if (!session || !open) {
    icon = <Clock size={48} color="#f59e0b" aria-hidden="true" />;
    heading = L('الجلسة غير مفتوحة الآن', 'The session is not open right now');
    text = L(
      'يفتح المنظم تسجيل الحضور في وقت الفعالية.',
      'The organizer opens check-in during the event.',
    );
  } else if (online && !token) {
    heading = title;
    text = `${dayLine} — ${L('اضغط لتسجيل حضورك.', 'press the button to check in.')}`;
    action = (
      <button type="button" className="sdc-login-btn" onClick={() => run(null)}>
        {L('تسجيل حضوري', 'Check me in')}
      </button>
    );
  } else {
    icon = <RotateCw size={48} color="#f59e0b" aria-hidden="true" />;
    heading = L('امسح الرمز المعروض الآن', 'Scan the code on screen now');
    text = L('يتجدد الرمز كل 30 ثانية.', 'The code refreshes every 30 seconds.');
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
            {action}
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
