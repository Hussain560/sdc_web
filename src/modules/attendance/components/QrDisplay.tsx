'use client';

import QRCode from 'qrcode';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Link } from '@/i18n/navigation';
import { getLiveCount, getQrToken } from '../actions';

/**
 * Full-screen QR for the room (screen 16 §4): the token rotates every 30 seconds (the database signs it), the
 * counter refreshes every 10 seconds. High contrast on a light panel even in the dark theme, so projectors scan.
 */
export function QrDisplay({
  sessionId,
  eventId,
  slug,
  title,
  dayLabel,
}: {
  sessionId: string;
  eventId: string;
  slug: string;
  title: string;
  dayLabel: string;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [count, setCount] = useState<{ present: number; total: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    const origin = window.location.origin;
    const prefix = lang === 'en' ? '/en' : '';

    const refresh = async () => {
      const r = await getQrToken(sessionId, { lang });
      if (!alive) return;
      if (!r.ok) {
        setError(r.message);
        return;
      }
      setError('');
      const url = `${origin}${prefix}/events/${slug}/check-in?s=${sessionId}&t=${r.data.token}`;
      setSvg(await QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' }));
      // Refresh a little before the window ends so the code on screen is never stale.
      timer.current = setTimeout(refresh, Math.max(3, r.data.expiresIn - 3) * 1000);
    };
    void refresh();

    const poll = async () => {
      const c = await getLiveCount(sessionId);
      if (alive && c) setCount(c);
    };
    void poll();
    const interval = setInterval(poll, 10_000);
    return () => {
      alive = false;
      clearTimeout(timer.current);
      clearInterval(interval);
    };
  }, [sessionId, slug, lang]);

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-6 rounded-2xl bg-white p-8 text-center text-black">
      <div>
        <h1 className="text-2xl font-extrabold">{title}</h1>
        <p className="mt-1 text-lg">{dayLabel}</p>
      </div>
      {error ? (
        <p role="alert" className="max-w-md text-lg font-semibold">
          {error}
        </p>
      ) : svg ? (
        <div
          role="img"
          aria-label={ar ? 'رمز QR لتسجيل الحضور' : 'QR code for check-in'}
          className="aspect-square w-[min(70vmin,28rem)] [&>svg]:size-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div
          className="aspect-square w-[min(70vmin,28rem)] animate-pulse rounded-xl bg-neutral-200"
          aria-busy="true"
        />
      )}
      <p className="text-lg">
        {ar
          ? 'امسح الرمز لتسجيل حضورك · يتجدد كل 30 ثانية'
          : 'Scan to check in · refreshes every 30 seconds'}
      </p>
      <p className="text-2xl font-bold tabular-nums" aria-live="polite">
        {count
          ? ar
            ? `حضر الآن: ${count.present} / ${count.total}`
            : `Checked in: ${count.present} / ${count.total}`
          : '—'}
      </p>
      <Link
        href={`/dashboard/events/${eventId}/attendance/${sessionId}`}
        className="rounded-full border border-black px-6 py-2 text-sm font-semibold hover:bg-neutral-100"
      >
        {ar ? 'إنهاء العرض' : 'End the display'}
      </Link>
    </div>
  );
}
