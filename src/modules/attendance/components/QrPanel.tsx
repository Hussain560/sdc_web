'use client';

import { Check, Copy, Maximize2, Minimize2, Wifi, WifiOff } from 'lucide-react';
import QRCode from 'qrcode';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { getQrToken } from '../actions';
import { METHOD_LABEL, type SessionLive } from '../types';

/** The code rotates every two minutes (KFUCS); the database signs it and accepts this window and the previous one. */
const WINDOW_SECONDS = 120;

/**
 * QR panel of the attendance tab: the code with its countdown, the link to copy, a projector mode (full screen, big
 * code and live counters) and the live numbers with the latest check-ins. The numbers come from the parent's poll.
 */
export function QrPanel({
  sessionId,
  slug,
  title,
  dayLabel,
  live,
  connected,
}: {
  sessionId: string;
  slug: string;
  title: string;
  dayLabel: string;
  live: SessionLive | null;
  connected: boolean;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const toast = useToast();
  const boxRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(WINDOW_SECONDS);
  const [copied, setCopied] = useState(false);
  const [full, setFull] = useState(false);
  const expiresAt = useRef(0);

  const refresh = useCallback(async () => {
    const r = await getQrToken(sessionId, { lang });
    if (!r.ok) {
      setError(r.message);
      return;
    }
    setError('');
    const prefix = lang === 'en' ? '/en' : '';
    const url = `${window.location.origin}${prefix}/events/${slug}/check-in?s=${sessionId}&t=${r.data.token}`;
    setLink(url);
    setSvg(await QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' }));
    expiresAt.current = Date.now() + r.data.expiresIn * 1000;
    setSeconds(r.data.expiresIn);
  }, [sessionId, slug, lang]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load the first code on mount
    void refresh();
    const tick = setInterval(() => {
      if (!expiresAt.current) return;
      const left = Math.max(0, Math.ceil((expiresAt.current - Date.now()) / 1000));
      setSeconds(left);
      if (left <= 0) {
        expiresAt.current = Date.now() + WINDOW_SECONDS * 1000;
        void refresh();
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [refresh]);

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === boxRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else
      void boxRef.current
        ?.requestFullscreen()
        .catch(() => toast.error(L('تعذّر فتح وضع العرض.', 'Could not open projector mode.')));
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success(L('تم نسخ الرابط.', 'Link copied.'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(L('تعذّر نسخ الرابط.', 'Could not copy the link.'));
    }
  };

  const percent = (seconds / WINDOW_SECONDS) * 100;
  const rate = live && live.total > 0 ? Math.round((live.present / live.total) * 100) : 0;
  const time = (iso: string) =>
    new Intl.DateTimeFormat(ar ? 'ar-SA-u-nu-latn' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Riyadh',
    }).format(new Date(iso));

  return (
    <div
      ref={boxRef}
      className={
        full
          ? 'flex min-h-dvh flex-col items-center justify-center gap-6 bg-white p-8 text-center text-black'
          : 'grid gap-6 rounded-2xl border border-line bg-surface p-5 lg:grid-cols-[minmax(0,1fr)_320px]'
      }
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex w-full items-start justify-between gap-3 text-start">
          <div>
            <h3 className={full ? 'text-3xl font-extrabold' : 'text-lg font-bold'}>{title}</h3>
            <p className={full ? 'text-xl' : 'text-sm text-muted'}>{dayLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                connected ? 'border-line-accent text-accent' : 'border-danger text-danger'
              }`}
            >
              {connected ? (
                <Wifi size={13} aria-hidden="true" />
              ) : (
                <WifiOff size={13} aria-hidden="true" />
              )}
              {connected ? L('مباشر', 'Live') : L('غير متصل', 'Offline')}
            </span>
            <button
              type="button"
              onClick={toggleFull}
              aria-label={
                full
                  ? L('إنهاء وضع العرض', 'Exit projector mode')
                  : L('وضع العرض', 'Projector mode')
              }
              title={
                full
                  ? L('إنهاء وضع العرض', 'Exit projector mode')
                  : L('وضع العرض', 'Projector mode')
              }
              className="rounded-lg border border-line p-2 text-muted hover:text-text"
            >
              {full ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>

        {error ? (
          <p role="alert" className="max-w-md py-10 text-lg font-semibold">
            {error}
          </p>
        ) : svg ? (
          <div
            role="img"
            aria-label={L('رمز QR لتسجيل الحضور', 'QR code for check-in')}
            className={`rounded-2xl bg-white p-4 shadow-sm [&>svg]:size-full ${
              full ? 'aspect-square w-[min(62vmin,34rem)]' : 'aspect-square w-[min(80vw,19rem)]'
            }`}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div
            className="aspect-square w-[min(80vw,19rem)] animate-pulse rounded-2xl bg-surface-raised"
            aria-busy="true"
          />
        )}

        {!error && (
          <div className="w-full max-w-sm space-y-2">
            <p className={full ? 'text-xl' : 'text-sm text-muted'}>
              {L('يتجدد الرمز بعد ', 'The code refreshes in ')}
              <strong className="tabular-nums">{seconds}</strong>
              {L(' ث', ' s')}
            </p>
            <div
              className={`h-2 overflow-hidden rounded-full ${full ? 'bg-neutral-200' : 'bg-surface-raised'}`}
            >
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                  percent > 30 ? 'bg-accent' : percent > 10 ? 'bg-warning' : 'bg-danger'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
            {!full && link && (
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-1.5 text-xs font-semibold text-muted hover:text-text"
              >
                {copied ? (
                  <Check size={14} aria-hidden="true" />
                ) : (
                  <Copy size={14} aria-hidden="true" />
                )}
                {copied ? L('تم النسخ', 'Copied') : L('نسخ الرابط', 'Copy link')}
              </button>
            )}
            <p className={full ? 'text-lg' : 'text-xs text-muted'}>
              {L(
                'يفتح الرمز صفحة عامة: يكتب الحاضر بريده المسجّل ويرى النتيجة فورًا.',
                'The code opens a public page: attendees type their registered e-mail and see the result at once.',
              )}
            </p>
          </div>
        )}

        {full && live && (
          <p className="text-3xl font-bold tabular-nums" aria-live="polite">
            {L(
              `حضر الآن: ${live.present} / ${live.total}`,
              `Checked in: ${live.present} / ${live.total}`,
            )}
          </p>
        )}
      </div>

      {!full && (
        <aside aria-label={L('الأرقام المباشرة', 'Live numbers')} className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-line bg-canvas p-3">
              <p className="text-2xl font-extrabold tabular-nums" aria-live="polite">
                {live?.present ?? '—'}
              </p>
              <p className="text-xs text-muted">{L('حضروا', 'Checked in')}</p>
            </div>
            <div className="rounded-xl border border-line bg-canvas p-3">
              <p className="text-2xl font-extrabold tabular-nums">{live?.total ?? '—'}</p>
              <p className="text-xs text-muted">{L('المسجّلون', 'Registered')}</p>
            </div>
            <div className="rounded-xl border border-line bg-canvas p-3">
              <p className="text-2xl font-extrabold tabular-nums">{live ? `${rate}%` : '—'}</p>
              <p className="text-xs text-muted">{L('النسبة', 'Rate')}</p>
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold">{L('آخر الحاضرين', 'Latest check-ins')}</h4>
            {!live || live.recent.length === 0 ? (
              <p className="text-sm text-muted">
                {L('لم يسجّل أحد حضوره بعد.', 'Nobody has checked in yet.')}
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {live.recent.map((r, i) => (
                  <li
                    key={`${r.at}-${i}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate font-medium">{r.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted">
                      {METHOD_LABEL[r.method][lang]} · {time(r.at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
