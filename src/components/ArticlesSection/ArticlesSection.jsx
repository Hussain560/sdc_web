'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, CheckCircle, X } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabase';
import { allEventsData } from '../../data/allEvents';
import './ArticlesSection.css';

const articles = [
  { id: 1, ar: 'هندسة الأوامر (Prompt Engineering)', en: 'Prompt Engineering' },
  { id: 2, ar: 'تقنية Voice2Face', en: 'Voice2Face Technology' },
  { id: 3, ar: 'أنظمة التوصية (Recommendation Systems)', en: 'Recommendation Systems' },
  { id: 4, ar: 'التطبيقات الصينية والإنجليزية', en: 'Chinese and English Applications' },
  { id: 5, ar: 'الذكاء الاصطناعي في الألعاب والتعلّم المعزّز', en: 'AI in Gaming and Reinforcement Learning' },
  { id: 6, ar: 'تطبيقات الذكاء الاصطناعي في تحليل المشاعر', en: 'AI Applications in Sentiment Analysis' }
];

// بس أول 3 فعاليات من نفس المصدر المشترك، عشان ما نكرر البيانات
const events = allEventsData.slice(0, 3);

export default function ArticlesSection() {
  const router = useRouter();
  const { searchQuery } = useSearch();
  const { user, isLoggedIn } = useAuth();
  const { lang, t } = useLanguage();
  const isEnglish = lang === 'en';

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [endedEvent, setEndedEvent] = useState(null);
  const [registeredEvents, setRegisteredEvents] = useState([]);
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

  const isEventEnded = (event) => {
    const status = event.status?.[isEnglish ? 'en' : 'ar'];
    return status === 'Ended' || status === 'منتهي';
  };

  const handleRegisterClick = (event) => {
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
          : 'حدث خطأ أثناء التسجيل. حاولي مرة أخرى.'
      );
      return;
    }

    setRegisteredEvents((prev) => [...prev, selectedEvent.id]);
    setSelectedEvent(null);

    // إرسال إيميل "استلمنا تسجيلك" بدون ما نوقف الواجهة بانتظاره
    supabase.functions.invoke('send-registration-email', {
      body: {
        to: user.email,
        fullName: user.user_metadata?.full_name || '',
        eventTitle: selectedEvent.title.ar,
      },
    }).catch((err) => console.error('email error:', err));
  };

  const filteredEvents = events.filter((e) => {
    const title = e.title[isEnglish ? 'en' : 'ar'];
    const location = e.location[isEnglish ? 'en' : 'ar'];
    return title.toLowerCase().includes((searchQuery || '').toLowerCase()) || location.toLowerCase().includes((searchQuery || '').toLowerCase());
  });

  const filteredArticles = articles.filter((a) =>
    (a[isEnglish ? 'en' : 'ar']).toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  return (
    <section className="sdc-events-articles-sec">
      <div className="sdc-ea-container">
        <div className="sdc-events-column">
          <div className="sdc-section-header">
            <h2 className="sdc-section-title">{isEnglish ? 'Latest Events' : 'أحدث الفعاليات'}</h2>
          </div>

          <div className="sdc-events-list">
            {filteredEvents.map((event) => {
              const eventTitle = event.title[isEnglish ? 'en' : 'ar'];
              const eventLocation = event.location[isEnglish ? 'en' : 'ar'];
              const eventDate = event.date[isEnglish ? 'en' : 'ar'];
              const eventStatus = event.status[isEnglish ? 'en' : 'ar'];
              const isRegistered = registeredEvents.includes(event.id);
              return (
                <div key={event.id} className="sdc-event-card">
                  <div className="sdc-event-image-wrapper">
                    <span className={`sdc-badge-status ${eventStatus === 'Coming Soon' || eventStatus === 'قريبًا' ? 'coming-soon' : 'available'}`}>
                      {eventStatus}
                    </span>
                    <img src={event.image} alt={eventTitle} className="sdc-event-image" />
                  </div>

                  <div className="sdc-event-details">
                    <div className="sdc-event-tags">
                      <span className="sdc-tag tag-competitions">{isEnglish ? 'Competitions' : 'مسابقات'}</span>
                      <span className="sdc-tag tag-tech">{isEnglish ? 'Technology' : 'تقنية'}</span>
                      <span className="sdc-tag tag-students">{isEnglish ? 'Students' : 'طلاب'}</span>
                    </div>

                    <h3 className="sdc-event-title">{eventTitle}</h3>

                    <div className="sdc-event-meta">
                      <span><MapPin size={13} className="sdc-icon-green" /> {eventLocation}</span>
                      <span><Calendar size={13} className="sdc-icon-green" /> {eventDate}</span>
                    </div>

                    <div className="sdc-event-actions">
                      <button
                        className={`sdc-btn-register ${isRegistered ? 'registered' : ''}`}
                        onClick={() => !isRegistered && handleRegisterClick(event)}
                        disabled={isRegistered}
                      >
                        {isRegistered ? t('registered') : t('register')}
                      </button>

                      <Link href={`/events/${event.id}`} className="sdc-btn-more">
                        {isEnglish ? 'Read More' : 'قراءة المزيد'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="sdc-articles-column">
          <div className="sdc-section-header">
            <h2 className="sdc-section-title">{isEnglish ? 'Latest Threads' : 'أحدث الثريدات'}</h2>
            <Link href="/articles" className="sdc-view-all-btn">
              {t('viewAll')}
            </Link>
          </div>

          <div className="sdc-articles-list">
            {filteredArticles.map((article) => (
              <Link
                key={article.id}
                href={`/articles/${article.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div className="sdc-article-item">
                  <h3 className="sdc-article-title">{article[isEnglish ? 'en' : 'ar']}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

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
                <span>{isEnglish ? 'You will be registered with the following information:' : 'سيتم التسجيل بالبيانات التالية:'}</span>
                <ul>
                  <li><strong>{isEnglish ? 'Name' : 'الاسم'}:</strong> {user?.user_metadata?.full_name || (isEnglish ? 'Visitor' : 'زائر')}</li>
                  <li><strong>{isEnglish ? 'Email' : 'البريد'}:</strong> {user?.email || (isEnglish ? 'No email provided' : 'لا يوجد بريد')}</li>
                </ul>
              </div>

              {registerError && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '14px',
                  marginTop: '12px',
                  textAlign: 'center',
                }}>
                  {registerError}
                </div>
              )}
            </div>

            <div className="sdc-modal-footer">
              <button className="sdc-btn-confirm" onClick={confirmRegistration} disabled={sending}>
                {sending
                  ? (isEnglish ? 'Sending...' : 'جاري الإرسال...')
                  : (isEnglish ? 'Confirm Registration' : 'تأكيد التسجيل')}
              </button>
              <button className="sdc-btn-cancel" onClick={() => setSelectedEvent(null)} disabled={sending}>
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
              <h3>{isEnglish ? 'Registration Closed' : 'انتهى التسجيل'}</h3>
            </div>

            <div className="sdc-modal-body">
              <p style={{ textAlign: 'center', lineHeight: '1.8' }}>
                {isEnglish
                  ? 'We apologize, this event has ended and registration is no longer available. We look forward to seeing you at our upcoming events.'
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
    </section>
  );
}