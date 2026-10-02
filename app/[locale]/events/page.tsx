'use client';

import React, { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { MapPin, Calendar, CheckCircle, X } from 'lucide-react';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import { useSearch } from '@/context/SearchContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import type { LegacyEventSummary } from '@/types/content';
import './all-events.css';

const allEventsData: LegacyEventSummary[] = [
  {
    id: 1,
    title: {
      ar: 'لقاء تقني: بيئات العمل التقنية وأساسيات Github',
      en: 'Technical Meetup: Tech Work Environments and GitHub Basics',
    },
    location: { ar: 'أونلاين', en: 'Online' },
    date: { ar: 'قريبًا سيعلن عنه', en: 'To be announced soon' },
    status: { ar: 'قريبًا', en: 'Coming Soon' },
    image: '/assets/event-card.png',
  },
  {
    id: 2,
    title: { ar: 'ورشة Google AI Studio', en: 'Google AI Studio Workshop' },
    location: { ar: 'أونلاين', en: 'Online' },
    date: { ar: '5/8/2026', en: '5/8/2026' },
    status: { ar: 'منتهي', en: 'Ended' },
    image: '/assets/Picture1.png',
  },
  {
    id: 3,
    title: {
      ar: 'ورشة تحليل البيانات باستخدام Excel & Power BI',
      en: 'Data Analysis Workshop using Excel & Power BI',
    },
    location: { ar: 'أونلاين', en: 'Online' },
    date: { ar: '20/9/2025', en: '20/9/2025' },
    status: { ar: 'منتهي', en: 'Ended' },
    image: '/assets/power bi.png',
  },
  {
    id: 4,
    title: { ar: 'معسكر أساسيات الأمن السيبراني', en: 'Cybersecurity Fundamentals Camp' },
    location: { ar: 'أونلاين', en: 'Online' },
    date: { ar: '15–19 سبتمبر 2024', en: 'September 15–19, 2024' },
    status: { ar: 'منتهي', en: 'Ended' },
    image: '/assets/Cyber.png',
  },
  {
    id: 5,
    title: { ar: 'معسكر أساسيات حل التقاط العلم (CTF)', en: 'CTF Fundamentals Camp' },
    location: { ar: 'أونلاين', en: 'Online' },
    date: { ar: '27/10/2024 to 1/11/2024', en: '10/27/2024 to 11/1/2024' },
    status: { ar: 'منتهي', en: 'Ended' },
    image: '/assets/CTF.png',
  },
  {
    id: 6,
    title: {
      ar: 'معسكر نادي هواوي في ريادة الأعمال وصنع التطبيقات – StartApps',
      en: 'Huawei StartApps Entrepreneurship and App Development Camp',
    },
    location: { ar: 'أونلاين', en: 'Online' },
    date: { ar: '02/03/2023', en: '02/03/2023' },
    status: { ar: 'منتهي', en: 'Ended' },
    image: '/assets/Huwawi.png',
  },
];

export default function AllEventsPage() {
  const router = useRouter();
  const { searchQuery } = useSearch();
  const { user, isLoggedIn } = useAuth();
  const { lang, t } = useLanguage();
  const isEnglish = lang === 'en';

  const [selectedEvent, setSelectedEvent] = useState<LegacyEventSummary | null>(null);
  const [endedEvent, setEndedEvent] = useState<LegacyEventSummary | null>(null);
  const [registeredEvents, setRegisteredEvents] = useState<number[]>([]);
  const [sending, setSending] = useState(false);
  const [registerError, setRegisterError] = useState('');

  useEffect(() => {
    async function loadRegistrations() {
      if (!isLoggedIn || !user) {
        setRegisteredEvents([]);
        return;
      }
      const { data, error } = await supabase
        .from('event_registrations')
        .select('event_id')
        .eq('user_id', user.id);
      if (!error && data) {
        setRegisteredEvents(data.map((r) => r.event_id));
      }
    }
    loadRegistrations();
  }, [isLoggedIn, user]);

  const isEventEnded = (event: LegacyEventSummary) => {
    const status = event.status[isEnglish ? 'en' : 'ar'];
    return status === 'Ended' || status === 'منتهي';
  };

  const handleRegisterClick = (event: LegacyEventSummary) => {
    if (isEventEnded(event)) {
      setEndedEvent(event);
      return;
    }
    if (!isLoggedIn) {
      router.push(`/login?redirect=/events/${event.id}`);
    } else {
      setRegisterError('');
      setSelectedEvent(event);
    }
  };

  const confirmRegistration = async () => {
    if (!selectedEvent || !user) return;
    setSending(true);
    setRegisterError('');
    const { error } = await supabase.from('event_registrations').insert({
      user_id: user.id,
      event_id: selectedEvent.id,
      full_name: user.user_metadata?.full_name || '',
      email: user.email || '',
    });
    setSending(false);
    if (error) {
      setRegisterError(
        isEnglish
          ? 'Something went wrong. Please try again.'
          : 'حدث خطأ أثناء التسجيل. حاولي مرة أخرى.',
      );
      return;
    }
    setRegisteredEvents((prev) => [...prev, selectedEvent.id]);
    setSelectedEvent(null);

    // إرسال إيميل "استلمنا تسجيلك" بدون ما نوقف الواجهة بانتظاره
    supabase.functions
      .invoke('send-registration-email', {
        body: {
          to: user.email,
          fullName: user.user_metadata?.full_name || '',
          eventTitle: selectedEvent.title.ar,
        },
      })
      .catch((err) => console.error('email error:', err));
  };

  const filteredEvents = allEventsData.filter((e) => {
    const title = e.title[isEnglish ? 'en' : 'ar'];
    const location = e.location[isEnglish ? 'en' : 'ar'];
    return (
      title.toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      location.toLowerCase().includes((searchQuery || '').toLowerCase())
    );
  });

  return (
    <div className="sdc-all-events-wrapper">
      <Header />
      <main className="sdc-all-events-main">
        <section className="sdc-events-hero-banner">
          <div className="sdc-events-hero-container">
            <nav className="sdc-events-breadcrumb">
              <Link href="/">{isEnglish ? 'Home' : 'الرئيسية'}</Link>
              <span className="sdc-events-bc-sep">&gt;</span>
              <span style={{ color: '#00E676' }}>{isEnglish ? 'Events' : 'الفعاليات'}</span>
            </nav>
            <h1 className="sdc-events-hero-title">
              {isEnglish ? 'Community Events' : 'فعاليات المجتمع'}
            </h1>
            <p className="sdc-events-hero-subtitle">
              {isEnglish
                ? 'Discover upcoming community events and participate in workshops, hackathons, and technology meetups.'
                : 'اكتشف فعاليات المجتمع القادمة، وشارك في ورش العمل، الهاكاثونات، والملتقيات التقنية.'}
            </p>
          </div>
        </section>

        <div className="sdc-all-events-container">
          {filteredEvents.length > 0 ? (
            <div className="sdc-all-events-grid">
              {filteredEvents.map((event) => {
                const isRegistered = registeredEvents.includes(event.id);
                const eventTitle = event.title[isEnglish ? 'en' : 'ar'];
                const eventLocation = event.location[isEnglish ? 'en' : 'ar'];
                const eventDate = event.date[isEnglish ? 'en' : 'ar'];
                const eventStatus = event.status[isEnglish ? 'en' : 'ar'];
                return (
                  <div key={event.id} className="sdc-event-full-card">
                    <div className="sdc-card-img-wrapper">
                      <span
                        className={`sdc-card-status-badge ${eventStatus === 'Coming Soon' || eventStatus === 'قريبًا' ? 'coming-soon' : 'available'}`}
                      >
                        {eventStatus}
                      </span>
                      <img src={event.image} alt={eventTitle} className="sdc-card-img" />
                    </div>
                    <div className="sdc-card-content">
                      <h3 className="sdc-card-event-title">{eventTitle}</h3>
                      <div className="sdc-card-event-meta">
                        <span>
                          <MapPin size={14} style={{ color: '#00E676' }} /> {eventLocation}
                        </span>
                        <span>
                          <Calendar size={14} style={{ color: '#00E676' }} /> {eventDate}
                        </span>
                      </div>
                      <div className="sdc-card-actions">
                        <button
                          className={`sdc-card-btn-register ${isRegistered ? 'registered' : ''}`}
                          onClick={() => !isRegistered && handleRegisterClick(event)}
                          disabled={isRegistered}
                        >
                          {isRegistered ? t('registered') : t('register')}
                        </button>
                        <Link href={`/events/${event.id}`} className="sdc-card-btn-more">
                          {isEnglish ? 'Read More' : 'قراءة المزيد'}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="sdc-no-results">
              {isEnglish ? 'No results matched your search.' : 'لا توجد نتائج تطابق بحثك حالياً.'}
            </div>
          )}
        </div>
      </main>

      {selectedEvent && (
        <div className="sdc-modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="sdc-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="sdc-modal-close" onClick={() => setSelectedEvent(null)}>
              <X size={20} />
            </button>
            <div className="sdc-modal-header">
              <CheckCircle size={40} className="sdc-modal-icon" />
              <h3>{isEnglish ? 'Confirm event registration' : 'تأكيد التسجيل في الفعالية'}</h3>
            </div>
            <div className="sdc-modal-body">
              <p className="sdc-modal-event-name">{selectedEvent.title[isEnglish ? 'en' : 'ar']}</p>
              <div className="sdc-modal-user-info">
                <span>
                  {isEnglish
                    ? 'You will be registered with the following information:'
                    : 'سيتم التسجيل بالبيانات التالية:'}
                </span>
                <ul>
                  <li>
                    <strong>{isEnglish ? 'Name' : 'الاسم'}:</strong>{' '}
                    {user?.user_metadata?.full_name || (isEnglish ? 'Visitor' : 'زائر')}
                  </li>
                  <li>
                    <strong>{isEnglish ? 'Email' : 'البريد'}:</strong>{' '}
                    {user?.email || (isEnglish ? 'No email provided' : 'لا يوجد بريد')}
                  </li>
                </ul>
              </div>
              {registerError && (
                <div
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '14px',
                    marginTop: '12px',
                    textAlign: 'center',
                  }}
                >
                  {registerError}
                </div>
              )}
            </div>
            <div className="sdc-modal-footer">
              <button className="sdc-btn-confirm" onClick={confirmRegistration} disabled={sending}>
                {sending
                  ? isEnglish
                    ? 'Sending...'
                    : 'جاري الإرسال...'
                  : isEnglish
                    ? 'Confirm Registration'
                    : 'تأكيد التسجيل'}
              </button>
              <button
                className="sdc-btn-cancel"
                onClick={() => setSelectedEvent(null)}
                disabled={sending}
              >
                {isEnglish ? 'Cancel' : 'إلغاء'}
              </button>
            </div>
          </div>
        </div>
      )}

      {endedEvent && (
        <div className="sdc-modal-overlay" onClick={() => setEndedEvent(null)}>
          <div className="sdc-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="sdc-modal-close" onClick={() => setEndedEvent(null)}>
              <X size={20} />
            </button>
            <div className="sdc-modal-header">
              <h3>{isEnglish ? 'Event Ended' : 'انتهت الفعالية'}</h3>
            </div>
            <div className="sdc-modal-body" style={{ textAlign: 'center' }}>
              <p style={{ color: '#cccccc', fontSize: '15px', lineHeight: '1.8' }}>
                {isEnglish
                  ? 'We apologize, this event has ended and registration is no longer available. We look forward to seeing you in our upcoming events.'
                  : 'نعتذر، هذه الفعالية انتهت ولم يعد التسجيل متاحًا. نتطلع لوجودك في فعالياتنا القادمة.'}
              </p>
            </div>
            <div className="sdc-modal-footer">
              <button className="sdc-btn-confirm" onClick={() => setEndedEvent(null)}>
                {isEnglish ? 'OK' : 'حسنًا'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
