'use client';

import { CircleCheck, Copy, Mail } from 'lucide-react';
import { useEffect, useState, useTransition, type ReactNode } from 'react';
import { Button, Field, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { Link } from '@/i18n/navigation';
import { requestActivationByEmail, requestTrackingLink } from '../track-actions';

const trackedKey = (cycleId: string) => `sdc-join-token:${cycleId}`;

/** The days, hours and minutes until a moment, as three calm cells (the scheduled cycle). */
export function Countdown({ target }: { target: string }) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- the clock exists only in the browser */
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);
  const left = now === null ? null : Math.max(0, Date.parse(target) - now);
  const cells: Array<[number | null, string, string]> = [
    [left === null ? null : Math.floor(left / 86_400_000), ar ? 'يوماً' : 'days', 'd'],
    [
      left === null ? null : Math.floor((left % 86_400_000) / 3_600_000),
      ar ? 'ساعة' : 'hours',
      'h',
    ],
    [left === null ? null : Math.floor((left % 3_600_000) / 60_000), ar ? 'دقيقة' : 'minutes', 'm'],
  ];
  return (
    <div
      className="flex gap-3"
      role="timer"
      aria-label={ar ? 'الوقت المتبقي لفتح التسجيل' : 'Time until applications open'}
    >
      {cells.map(([v, label, k]) => (
        <div
          key={k}
          className="min-w-20 rounded-shape-lg border border-line bg-surface px-4 py-3 text-center"
        >
          <p className="text-3xl font-extrabold tabular-nums text-accent-text">
            {v === null ? '--' : String(v).padStart(2, '0')}
          </p>
          <p className="text-sm text-muted">{label}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * The main button of the open cycle. When this browser sent an application to this cycle, it says so instead and
 * leads to the tracking page (the token never leaves the person's device and is never sent to anyone).
 */
export function ApplyCta({
  cycleId,
  children,
  secondary,
}: {
  cycleId: string;
  children: ReactNode;
  secondary?: ReactNode;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [tracked, setTracked] = useState<{ token: string; reference: string | null } | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(trackedKey(cycleId));
      if (raw) {
        const d = JSON.parse(raw) as { token?: string; reference?: string | null };
        // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only state
        if (d.token) setTracked({ token: d.token, reference: d.reference ?? null });
      }
    } catch {
      /* private mode */
    }
  }, [cycleId]);
  if (tracked)
    return (
      <div className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 rounded-shape-lg bg-surface p-4">
          <CircleCheck size={18} aria-hidden="true" className="text-success" />
          <span>
            {ar ? 'قدّمت في هذه الدورة' : 'You applied in this cycle'}
            {tracked.reference && (
              <bdi dir="ltr" className="ms-2 font-mono font-semibold">
                {tracked.reference}
              </bdi>
            )}
          </span>
        </div>
        <Link
          href={`/join/status/${tracked.token}`}
          className="inline-flex min-h-13 w-fit items-center rounded-full bg-accent px-7 font-semibold text-on-accent hover:bg-accent-hover"
        >
          {ar ? 'تابع طلبك' : 'Follow your application'}
        </Link>
      </div>
    );
  return (
    <div className="flex flex-wrap gap-3">
      {children}
      {secondary}
    </div>
  );
}

/** "I did not get the e-mail": a new tracking link goes to the address, and the answer is always the same. */
export function RequestLinkForm({ kind = 'tracking' }: { kind?: 'tracking' | 'activation' }) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (sent)
    return (
      <p role="status" className="flex items-start gap-2 text-sm">
        <Mail size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-accent-text" />
        {ar
          ? kind === 'activation'
            ? 'إن كان لهذا البريد طلب مقبول لم يُفعَّل بعد، فقد أرسلنا إليه رابط تفعيل جديداً صالحاً أياماً. انظر في الرسائل غير المرغوبة أيضاً.'
            : 'إن كان لهذا البريد طلب لدينا، فقد أرسلنا إليه رابطاً جديداً. انظر في الرسائل غير المرغوبة أيضاً.'
          : kind === 'activation'
            ? 'If this address has an accepted application that is not activated yet, we sent it a new activation link, valid for several days. Check your spam folder too.'
            : 'If this address has an application with us, we sent it a new link. Check your spam folder too.'}
      </p>
    );
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const r =
            kind === 'activation'
              ? await requestActivationByEmail(email, { lang })
              : await requestTrackingLink(email, { lang });
          if (!r.ok) {
            setError(r.message);
            if (r.code === 'RATE_LIMITED') toast.warning(r.message);
            return;
          }
          setSent(true);
        });
      }}
    >
      <Field
        label={ar ? 'بريدك الإلكتروني' : 'Your e-mail'}
        type="email"
        dir="ltr"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error ?? undefined}
        autoComplete="email"
      />
      <Button type="submit" loading={pending} disabled={!email.includes('@')} variant="secondary">
        {ar ? 'أرسل لي رابطاً جديداً' : 'Send me a new link'}
      </Button>
    </form>
  );
}

export function CopyLinkButton({ label, copied }: { label: string; copied: string }) {
  const toast = useToast();
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(
            `${window.location.origin}${window.location.pathname.replace(/\/(en)?\/?$/, '')}`,
          );
          toast.info(copied);
        } catch {
          /* ignore */
        }
      }}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-line-strong px-5 text-sm font-semibold hover:border-accent"
    >
      <Copy size={15} aria-hidden="true" />
      {label}
    </button>
  );
}
