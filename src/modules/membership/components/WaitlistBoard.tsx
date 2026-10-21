'use client';

import { nowMs } from '@/lib/now';
import { Hourglass, KeyRound, ListOrdered, RotateCcw, Send } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Avatar, Badge, Button, EmptyState, cn, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import { formatDate } from '@/lib/format';
import { membershipMessage } from '../messages';
import {
  decideApplications,
  resendApplicationActivation,
  restoreApplication,
} from '../review-actions';
import type { ActivationRow, WaitlistRow } from '../review-queries';

const DAY = 86_400_000;

function leftLabel(days: number, ar: boolean) {
  if (days <= 0) return ar ? 'ينتهي الليلة' : 'Ends tonight';
  if (days === 1) return ar ? 'بعد يوم' : 'In 1 day';
  if (days === 2) return ar ? 'بعد يومين' : 'In 2 days';
  return ar ? `بعد ${days} أيام` : `In ${days} days`;
}

/**
 * The waiting list and the activation follow-up (MBR-013, ACC-009): who still has to activate (with the reminders
 * sent), who lapsed (restorable while a place remains), and the waiting list in order (the best score first when the
 * cycle has a rubric). "Offer now" is the normal acceptance: capacity, e-mail and audit all apply.
 */
export function WaitlistBoard({
  activation,
  waitlist,
  freeSeats,
  capacity,
  ranked,
}: {
  activation: ActivationRow[];
  waitlist: WaitlistRow[];
  freeSeats: number | null;
  capacity: number | null;
  ranked: boolean;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, start] = useTransition();
  const waiting = activation.filter((r) => r.status === 'accepted');
  const lapsed = activation.filter((r) => r.status === 'lapsed');
  const seatFree = freeSeats === null || freeSeats > 0;

  const run = (
    id: string,
    work: () => Promise<{ ok: boolean; message?: string }>,
    done: string,
  ) => {
    setBusyId(id);
    start(async () => {
      const r = await work();
      setBusyId(null);
      if (!r.ok) toast.error(r.message ?? '');
      else toast.success(done);
      router.refresh();
    });
  };

  const name = (n: { ar: string; en: string | null }) => (ar ? n.ar : n.en || n.ar);
  const card = 'rounded-shape-xl border border-line bg-surface p-5';
  const h2 = 'flex items-center gap-2 font-bold';
  const count = (n: number, tone: 'neutral' | 'danger' | 'warning' = 'neutral') => (
    <Badge tone={tone}>{n}</Badge>
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Waiting to activate */}
      <section className={card} aria-labelledby="wl-activate">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="wl-activate" className={h2}>
            <KeyRound size={17} aria-hidden="true" />
            {ar ? 'بانتظار التفعيل' : 'Waiting to activate'} {count(waiting.length)}
          </h2>
        </div>
        {waiting.length === 0 ? (
          <p className="text-sm text-muted">
            {ar ? 'لا أحد ينتظر التفعيل الآن.' : 'Nobody is waiting to activate right now.'}
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {waiting.map((r, i) => {
              const elapsed = Math.floor((nowMs() - Date.parse(r.acceptedAt)) / DAY);
              const left = r.deadlineDays - elapsed;
              const urgent = left <= 1;
              return (
                <li
                  key={r.id}
                  className="m-reveal flex flex-wrap items-center gap-x-4 gap-y-3 py-3"
                  style={{ '--i': Math.min(i, 6) } as React.CSSProperties}
                >
                  <Avatar name={name(r.name)} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{name(r.name)}</p>
                    <p className="text-sm text-muted">
                      {ar
                        ? `قُبل ${formatDate(r.acceptedAt, lang)}`
                        : `Accepted ${formatDate(r.acceptedAt, lang)}`}
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-1 sm:w-48">
                    <div className="flex gap-1" aria-hidden="true">
                      {Array.from({ length: Math.min(r.deadlineDays, 7) }, (_, k) => (
                        <span
                          key={k}
                          className={cn(
                            'h-1.5 flex-1 rounded-full',
                            k < Math.min(elapsed + 1, r.deadlineDays)
                              ? urgent
                                ? 'bg-warning'
                                : 'bg-accent'
                              : 'bg-surface-raised',
                          )}
                        />
                      ))}
                    </div>
                    <span
                      className={cn('text-xs font-medium', urgent ? 'text-warning' : 'text-muted')}
                    >
                      {leftLabel(left, ar)}
                    </span>
                    <span className="text-xs text-muted">
                      {r.reminders.length === 0
                        ? ar
                          ? 'لم يُرسل تذكير بعد'
                          : 'No reminder sent yet'
                        : ar
                          ? `تذكيرات أُرسلت: ${r.reminders.length}`
                          : `Reminders sent: ${r.reminders.length}`}
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={busyId === r.id}
                    onClick={() =>
                      run(
                        r.id,
                        () => resendApplicationActivation(r.id, { lang }),
                        ar ? 'أُرسل الرابط الجديد.' : 'A new link was sent.',
                      )
                    }
                    iconStart={<Send size={14} aria-hidden="true" />}
                  >
                    {ar ? 'أعد إرسال الرابط' : 'Resend the link'}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Lapsed */}
      <section className={card} aria-labelledby="wl-lapsed">
        <h2 id="wl-lapsed" className={`${h2} mb-1`}>
          <Hourglass size={17} aria-hidden="true" />
          {ar ? 'سقط التفعيل' : 'Lapsed'}{' '}
          {count(lapsed.length, lapsed.length ? 'danger' : 'neutral')}
        </h2>
        <p className="mb-3 text-sm text-muted">
          {ar
            ? 'يمكن استعادة الشخص ما دام هناك مقعد. المقعد يُحجز 24 ساعة قبل أن يُعرض على التالي في الانتظار.'
            : 'A person can be restored while a place remains. The place is held 24 hours before it is offered on.'}
        </p>
        {lapsed.length === 0 ? (
          <p className="text-sm text-muted">{ar ? 'لم يسقط تفعيل أحد.' : 'Nobody lapsed.'}</p>
        ) : (
          <ul className="divide-y divide-line">
            {lapsed.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <Avatar name={name(r.name)} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{name(r.name)}</p>
                  <p className="text-sm text-muted">
                    {r.lapsedAt
                      ? ar
                        ? `سقط ${formatDate(r.lapsedAt, lang)}`
                        : `Lapsed ${formatDate(r.lapsedAt, lang)}`
                      : ''}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={busyId === r.id}
                  disabledReason={
                    seatFree ? undefined : ar ? 'اكتملت المقاعد' : 'The places are full'
                  }
                  onClick={() =>
                    run(
                      r.id,
                      () => restoreApplication(r.id, { lang }),
                      ar
                        ? 'استُعيد الشخص وأُرسل له رابط جديد.'
                        : 'Restored, and a new link was sent.',
                    )
                  }
                  iconStart={<RotateCcw size={14} aria-hidden="true" />}
                >
                  {ar ? 'استعادة' : 'Restore'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Waiting list */}
      <section className={card} aria-labelledby="wl-list">
        <h2 id="wl-list" className={`${h2} mb-1`}>
          <ListOrdered size={17} aria-hidden="true" />
          {ar ? 'قائمة الانتظار' : 'Waiting list'}{' '}
          {count(waitlist.length, waitlist.length ? 'warning' : 'neutral')}
        </h2>
        <p className="mb-3 text-sm text-muted">
          {ranked
            ? ar
              ? 'مرتّبة بالدرجة المرجّحة، ثم بترتيب التقديم عند التساوي.'
              : 'Ordered by the weighted score, then by order of submission on a tie.'
            : ar
              ? 'مرتّبة بترتيب التقديم.'
              : 'Ordered by order of submission.'}{' '}
          {capacity !== null && freeSeats !== null
            ? ar
              ? `المتاح الآن: ${freeSeats} من ${capacity} مقعداً.`
              : `Free now: ${freeSeats} of ${capacity} places.`
            : ''}
        </p>
        {waitlist.length === 0 ? (
          <EmptyState
            title={ar ? 'قائمة الانتظار فارغة' : 'The waiting list is empty'}
            variant="no-data"
            className="py-6"
          />
        ) : (
          <ol className="divide-y divide-line">
            {waitlist.map((w, i) => (
              <li
                key={w.id}
                className="m-reveal flex flex-wrap items-center gap-x-4 gap-y-2 py-3"
                style={{ '--i': Math.min(i, 6) } as React.CSSProperties}
              >
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums',
                    i === 0 ? 'bg-accent text-on-accent' : 'bg-surface-raised text-muted',
                  )}
                >
                  {w.position}
                </span>
                <Avatar name={name({ ar: w.nameAr, en: w.nameEn })} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{name({ ar: w.nameAr, en: w.nameEn })}</p>
                  <p className="text-sm text-muted">
                    {ar
                      ? `ينتظر منذ ${formatDate(w.submittedAt, lang)}`
                      : `Waiting since ${formatDate(w.submittedAt, lang)}`}
                  </p>
                </div>
                {w.score !== null && (
                  <span className="font-bold tabular-nums">{w.score.toFixed(1)}</span>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  loading={busyId === w.id}
                  disabledReason={
                    seatFree ? undefined : ar ? 'اكتملت المقاعد' : 'The places are full'
                  }
                  onClick={() =>
                    run(
                      w.id,
                      async () => {
                        const r = await decideApplications(
                          { ids: [w.id], decision: 'accept' },
                          { lang },
                        );
                        if (!r.ok) return { ok: false, message: r.message };
                        const o = r.data.outcomes[0];
                        return o?.ok
                          ? { ok: true }
                          : { ok: false, message: membershipMessage(o?.code ?? 'INTERNAL', lang) };
                      },
                      ar
                        ? 'عُرض المقعد وأُرسل بريد القبول.'
                        : 'The place was offered and the acceptance e-mail sent.',
                    )
                  }
                >
                  {ar ? 'اعرض المقعد الآن' : 'Offer the place now'}
                </Button>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
