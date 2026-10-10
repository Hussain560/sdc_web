'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, LinkButton, type ButtonSize } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { StatusPill } from '@/components/ui/StatusPill';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatDate } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { cancelMyRegistration } from '@/modules/registrations/actions';
import {
  RegistrationDialog,
  guestKey,
} from '@/modules/registrations/components/RegistrationDialog';
import { EVENT_COPY } from '../../page-copy';
import {
  eventViewState,
  type EventViewInput,
  type EventViewState,
  type ViewerRegistration,
} from '../../view-state';

type Ctx = {
  view: EventViewState;
  input: EventViewInput;
  now: number;
  registrationEmail: string | null;
  open: () => void;
  cancelRegistration: () => void;
  canCancel: boolean;
};
const EventCtx = createContext<Ctx | null>(null);
const useEventCtx = () => {
  const c = useContext(EventCtx);
  if (!c) throw new Error('Event actions must be inside <EventActionsProvider>');
  return c;
};
export const useEventView = () => useEventCtx();

/** Reads a guest registration remembered on this device (`email` or `email|status`). */
function readGuest(eventId: string): { email: string; status: ViewerRegistration } | null {
  try {
    const raw = localStorage.getItem(guestKey(eventId));
    if (!raw) return null;
    const [email, status] = raw.split('|');
    const s = status === 'pending' || status === 'waitlisted' ? status : 'accepted';
    return email ? { email, status: s } : null;
  } catch {
    return null;
  }
}

/**
 * Owns the viewer-dependent half of the event page: who is looking (guest, member, registered), which of the
 * states S1-S13 applies, and the registration dialog. The server renders the static content; this wraps it.
 */
export function EventActionsProvider({
  event,
  input,
  checkinOpen,
  now,
  children,
}: {
  event: { id: string; slug: string; title: string; meta: string };
  input: EventViewInput;
  checkinOpen: boolean;
  now: number;
  children: ReactNode;
}) {
  const { user, isLoggedIn } = useAuth();
  const { lang } = useLanguage();
  const t = EVENT_COPY[lang];
  const toast = useToast();
  const [dialog, setDialog] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [mine, setMine] = useState<{
    id: string | null;
    status: ViewerRegistration;
    email: string | null;
  } | null>(null);

  // The viewer's own registration: a member from the database, a guest from this device.
  useEffect(() => {
    let cancelled = false;
    if (isLoggedIn && user) {
      supabase
        .from('my_registrations')
        .select('id, status')
        .eq('event_id', event.id)
        .neq('status', 'cancelled')
        .maybeSingle()
        .then(({ data }) => {
          if (cancelled) return;
          const s = data?.status;
          setMine(
            data && (s === 'accepted' || s === 'pending' || s === 'waitlisted')
              ? { id: data.id as string, status: s, email: user.email ?? null }
              : null,
          );
        });
    } else {
      const g = readGuest(event.id);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read the device memory once after mount
      setMine(g ? { id: null, status: g.status, email: g.email } : null);
    }
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, user, event.id]);

  const view = useMemo(
    () =>
      eventViewState(
        input,
        { isMember: isLoggedIn, registration: mine?.status ?? null },
        checkinOpen ? { open: true } : null,
        now,
      ),
    [input, isLoggedIn, mine, checkinOpen, now],
  );

  const doCancel = useCallback(async () => {
    if (!mine?.id) return;
    const r = await cancelMyRegistration(mine.id, { lang });
    setConfirmCancel(false);
    if (r.ok) {
      setMine(null);
      toast.success(t.cancelled);
    } else toast.error(r.message);
  }, [mine, lang, toast, t.cancelled]);

  const ctx: Ctx = {
    view,
    input,
    now,
    registrationEmail: mine?.email ?? null,
    open: () => setDialog(true),
    cancelRegistration: () => setConfirmCancel(true),
    canCancel: !!mine?.id && input.phase !== 'in_progress',
  };

  return (
    <EventCtx.Provider value={ctx}>
      {children}
      <RegistrationDialog
        open={dialog}
        onClose={() => setDialog(false)}
        event={{ id: event.id, slug: event.slug, title: event.title, meta: event.meta }}
        waitlist={view.id === 'S4'}
        member={
          isLoggedIn && user
            ? {
                name: String(user.user_metadata?.full_name ?? user.email ?? ''),
                email: user.email ?? '',
              }
            : undefined
        }
        onRegistered={(status) => {
          setMine({ id: null, status, email: user?.email ?? null });
          if (!isLoggedIn) {
            try {
              const email = localStorage.getItem(guestKey(event.id));
              if (email)
                localStorage.setItem(guestKey(event.id), `${email.split('|')[0]}|${status}`);
            } catch {
              /* storage unavailable */
            }
          }
        }}
      />
      <Dialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title={t.cancelReg}
        closeLabel={t.close}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmCancel(false)}>
              {t.keep}
            </Button>
            <Button variant="destructive" onClick={doCancel}>
              {t.cancelYes}
            </Button>
          </>
        }
      >
        <p className="t-body text-muted">{t.cancelConfirm}</p>
      </Dialog>
    </EventCtx.Provider>
  );
}

/** The state's one primary action (hero, side panel and phone bar all render this). */
export function PrimaryAction({
  size = 'lg',
  fullWidth,
  eventSlug,
}: {
  size?: ButtonSize;
  fullWidth?: boolean;
  eventSlug: string;
}) {
  const { view, input, open } = useEventCtx();
  const { lang } = useLanguage();
  const t = EVENT_COPY[lang];
  const a = view.action;
  if (a.kind === 'register')
    return (
      <Button size={size} fullWidth={fullWidth} onClick={open}>
        {t.register}
      </Button>
    );
  if (a.kind === 'waitlist')
    return (
      <Button size={size} fullWidth={fullWidth} onClick={open}>
        {t.waitlist}
      </Button>
    );
  if (a.kind === 'apply')
    return (
      <LinkButton href="/join" variant="secondary" size={size} fullWidth={fullWidth}>
        {t.apply}
      </LinkButton>
    );
  if (a.kind === 'check-in')
    return (
      <LinkButton href={`/events/${eventSlug}/check-in`} size={size} fullWidth={fullWidth}>
        {t.checkIn}
      </LinkButton>
    );
  if (a.kind === 'calendar')
    return (
      <a
        href={`/events/${eventSlug}/calendar.ics`}
        download
        className="inline-flex min-h-13 w-full items-center justify-center rounded-full border-[1.5px] border-line-strong px-7 text-base font-semibold text-text hover:border-accent hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        {t.calendar}
      </a>
    );
  if (a.kind === 'disabled') {
    const label =
      a.reason === 'opens' && input.registrationStartAt
        ? t.opensOn(formatDate(input.registrationStartAt, lang))
        : a.reason === 'full'
          ? t.full
          : t.closed;
    return (
      <Button size={size} fullWidth={fullWidth} disabled>
        {label}
      </Button>
    );
  }
  return null;
}

/** The viewer's confirmation (S8): their status, the e-mail it went to, and cancelling before the event. */
export function ConfirmationPanel() {
  const { view, registrationEmail, cancelRegistration, canCancel } = useEventCtx();
  const { lang } = useLanguage();
  const t = EVENT_COPY[lang];
  if (!view.confirmation) return null;
  const title =
    view.confirmation === 'accepted'
      ? t.registeredTitle
      : view.confirmation === 'pending'
        ? t.reviewTitle
        : t.waitlistedTitle;
  return (
    <div
      role="status"
      className="flex flex-col gap-2 rounded-shape-md bg-accent-soft p-4 text-on-accent-soft"
    >
      <p className="t-label">{title}</p>
      {registrationEmail && <p className="t-body-sm">{t.sentTo(registrationEmail)}</p>}
      {canCancel && (
        <Button variant="ghost" size="sm" className="w-fit" onClick={cancelRegistration}>
          {t.cancelReg}
        </Button>
      )}
    </div>
  );
}

/** The state's extra line under the action (closes in…, seats left, waiting-list promise, date to be announced). */
export function EventNote() {
  const { view, input, now } = useEventCtx();
  const { lang } = useLanguage();
  const t = EVENT_COPY[lang];
  if (!view.note) return null;
  let text = '';
  if (view.note === 'closes-in' && input.registrationEndAt) {
    const hours = Math.max(1, Math.round((Date.parse(input.registrationEndAt) - now) / 3_600_000));
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
    text = t.closesIn(
      hours >= 24 ? rtf.format(Math.round(hours / 24), 'day') : rtf.format(hours, 'hour'),
    );
  } else if (view.note === 'seats-left' && input.seatsLeft !== null)
    text = t.seatsLeft(input.seatsLeft);
  else if (view.note === 'waitlist-promise') text = t.waitlistPromise;
  else if (view.note === 'date-tbd') text = t.dateTbd;
  return text ? <p className="t-body-sm text-muted">{text}</p> : null;
}

/** The pill of the current state (it changes when the viewer registers). */
export function StatePill({ labels }: { labels: Record<string, string> }) {
  const { view } = useEventCtx();
  const key = view.pill;
  return <StatusPill status={key} label={labels[key] ?? key} />;
}
