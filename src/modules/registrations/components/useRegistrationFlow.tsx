'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { useToast } from '@/components/ui';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import { eventTitle, type PublicEventCard } from '@/modules/events/public-types';
import { registerForEvent } from '../actions';

type Closed = { event: PublicEventCard } | null;

/**
 * The registration interaction shared by the home block, the events list and the event page:
 * login redirect → confirm dialog → server action → "registered" state. The page markup stays in each view, so the
 * existing CSS (modal classes included) is reused unchanged. Returns the dialogs as an element to render once.
 */
export function useRegistrationFlow() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const { lang, t } = useLanguage();
  const en = lang === 'en';

  const [mine, setMine] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<PublicEventCard | null>(null);
  const [closed, setClosed] = useState<Closed>(null);
  const [sending, setSending] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    let cancelled = false;
    supabase
      .from('my_registrations')
      .select('event_id, status')
      .neq('status', 'cancelled')
      .then(({ data }) => {
        if (!cancelled && data) setMine(new Set(data.map((r) => r.event_id as string)));
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, user]);

  const isRegistered = useCallback((id: string) => isLoggedIn && mine.has(id), [isLoggedIn, mine]);

  const start = useCallback(
    (event: PublicEventCard) => {
      if (event.phase !== 'registration_open') {
        setClosed({ event });
        return;
      }
      if (!isLoggedIn) {
        router.push(`/login?redirect=/events/${event.slug}`);
        return;
      }
      setSelected(event);
    },
    [isLoggedIn, router],
  );

  const confirm = async () => {
    if (!selected) return;
    setSending(true);
    const res = await registerForEvent({ eventId: selected.id }, { lang });
    setSending(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    toast.success(
      res.data.status === 'accepted'
        ? en
          ? 'You are registered.'
          : 'تم تسجيلك في الفعالية.'
        : res.data.status === 'waitlisted'
          ? en
            ? 'The event is full. You are on the waiting list.'
            : 'اكتمل العدد. أُضيفت إلى قائمة الانتظار.'
          : en
            ? 'Request received. You will be notified after review.'
            : 'استلمنا طلبك وسيصلك إشعار بعد المراجعة.',
    );
    setMine((prev) => new Set(prev).add(selected.id));
    setSelected(null);
  };

  const closedMessage = (phase: PublicEventCard['phase']) => {
    if (phase === 'announced')
      return en
        ? 'Registration for this event has not opened yet. We will announce the date soon.'
        : 'لم يُفتح التسجيل في هذه الفعالية بعد. سنعلن الموعد قريبًا.';
    if (phase === 'registration_closed')
      return en
        ? 'Registration for this event is closed. We look forward to seeing you at our upcoming events.'
        : 'أُغلق التسجيل في هذه الفعالية. نتطلع لوجودك في فعالياتنا القادمة.';
    if (phase === 'in_progress')
      return en
        ? 'This event is already under way and registration is closed.'
        : 'الفعالية جارية الآن والتسجيل مغلق.';
    if (phase === 'cancelled')
      return en ? 'This event has been cancelled.' : 'تم إلغاء هذه الفعالية.';
    return en
      ? 'We apologize, this event has ended and registration is no longer available. We look forward to seeing you at our upcoming events.'
      : 'نعتذر، هذه الفعالية انتهت ولم يعد التسجيل متاحًا. نتطلع لوجودك في فعالياتنا القادمة.';
  };

  const closedTitle = (phase: PublicEventCard['phase']) => {
    if (phase === 'announced') return en ? 'Coming soon' : 'قريبًا';
    if (phase === 'ended') return en ? 'Event Ended' : 'انتهت الفعالية';
    return en ? 'Registration Closed' : 'التسجيل مغلق';
  };

  const dialogs = (
    <>
      {selected && (
        <div className="sdc-modal-overlay" onClick={() => setSelected(null)}>
          <div className="sdc-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="sdc-modal-close" onClick={() => setSelected(null)}>
              <X size={20} />
            </button>
            <div className="sdc-modal-header">
              <CheckCircle size={40} className="sdc-modal-icon" />
              <h3>{en ? 'Confirm event registration' : 'تأكيد التسجيل في الفعالية'}</h3>
            </div>
            <div className="sdc-modal-body">
              <p className="sdc-modal-event-name">{eventTitle(selected, lang)}</p>
              <div className="sdc-modal-user-info">
                <span>
                  {en
                    ? 'You will be registered with the following information:'
                    : 'سيتم التسجيل بالبيانات التالية:'}
                </span>
                <ul>
                  <li>
                    <strong>{en ? 'Name' : 'الاسم'}:</strong>{' '}
                    {user?.user_metadata?.full_name || (en ? 'Visitor' : 'زائر')}
                  </li>
                  <li>
                    <strong>{en ? 'Email' : 'البريد'}:</strong>{' '}
                    {user?.email || (en ? 'No email provided' : 'لا يوجد بريد')}
                  </li>
                </ul>
              </div>
            </div>
            <div className="sdc-modal-footer">
              <button className="sdc-btn-confirm" onClick={confirm} disabled={sending}>
                {sending
                  ? en
                    ? 'Sending...'
                    : 'جاري الإرسال...'
                  : en
                    ? 'Confirm Registration'
                    : 'تأكيد التسجيل'}
              </button>
              <button
                className="sdc-btn-cancel"
                onClick={() => setSelected(null)}
                disabled={sending}
              >
                {en ? 'Cancel' : 'إلغاء'}
              </button>
            </div>
          </div>
        </div>
      )}

      {closed && (
        <div className="sdc-modal-overlay" onClick={() => setClosed(null)}>
          <div className="sdc-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="sdc-modal-close" onClick={() => setClosed(null)}>
              <X size={20} />
            </button>
            <div className="sdc-modal-header">
              <h3>{closedTitle(closed.event.phase)}</h3>
            </div>
            <div className="sdc-modal-body" style={{ textAlign: 'center' }}>
              <p style={{ color: '#cccccc', fontSize: '15px', lineHeight: '1.8' }}>
                {closedMessage(closed.event.phase)}
              </p>
            </div>
            <div className="sdc-modal-footer">
              <button className="sdc-btn-confirm" onClick={() => setClosed(null)}>
                {en ? 'OK' : 'حسنًا'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return {
    isRegistered,
    start,
    dialogs,
    label: (id: string) => (isRegistered(id) ? t('registered') : t('register')),
  };
}
