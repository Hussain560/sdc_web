'use client';

import React from 'react';
import { MapPin, Calendar } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { SiteHeader as Header } from '@/components/layout/SiteHeader';
import { SiteFooter as Footer } from '@/components/layout/SiteFooter';
import { useSearch } from '@/context/SearchContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRegistrationFlow } from '@/modules/registrations/components/useRegistrationFlow';
import {
  eventDate,
  eventLocation,
  eventTitle,
  statusLabel,
  statusTone,
  type PublicEventCard,
} from '../../public-types';
import './all-events.css';

export default function EventsListView({ events }: { events: PublicEventCard[] }) {
  const { searchQuery } = useSearch();
  const { lang } = useLanguage();
  const isEnglish = lang === 'en';
  const flow = useRegistrationFlow();

  const needle = (searchQuery || '').toLowerCase();
  const filtered = events.filter(
    (e) =>
      eventTitle(e, lang).toLowerCase().includes(needle) ||
      eventLocation(e, lang).toLowerCase().includes(needle),
  );

  return (
    <div className="sdc-all-events-wrapper">
      <Header />
      <main id="main" className="sdc-all-events-main">
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
          {filtered.length > 0 ? (
            <div className="sdc-all-events-grid">
              {filtered.map((event) => {
                const title = eventTitle(event, lang);
                const registered = flow.isRegistered(event.id);
                return (
                  <div key={event.id} className="sdc-event-full-card">
                    <div className="sdc-card-img-wrapper">
                      <span className={`sdc-card-status-badge ${statusTone(event.phase)}`}>
                        {statusLabel(event.phase, lang)}
                      </span>
                      <img
                        src={event.cover}
                        alt={title}
                        className="sdc-card-img"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="sdc-card-content">
                      <h3 className="sdc-card-event-title">{title}</h3>
                      <div className="sdc-card-event-meta">
                        <span>
                          <MapPin size={14} style={{ color: '#00E676' }} /> {eventLocation(event, lang)}
                        </span>
                        <span>
                          <Calendar size={14} style={{ color: '#00E676' }} /> {eventDate(event, lang)}
                        </span>
                      </div>
                      <div className="sdc-card-actions">
                        <button
                          className={`sdc-card-btn-register ${registered ? 'registered' : ''}`}
                          onClick={() => !registered && flow.start(event)}
                          disabled={registered}
                        >
                          {flow.label(event.id)}
                        </button>
                        <Link href={`/events/${event.slug}`} className="sdc-card-btn-more">
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

      {flow.dialogs}
      <Footer />
    </div>
  );
}
