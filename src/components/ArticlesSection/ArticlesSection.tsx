'use client';

import React from 'react';
import { Link } from '@/i18n/navigation';
import { MapPin, Calendar } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRegistrationFlow } from '@/modules/registrations/components/useRegistrationFlow';
import {
  eventDate,
  eventLocation,
  eventTitle,
  statusLabel,
  statusTone,
  type PublicEventCard,
} from '@/modules/events/public-types';
import { articleTitle, type PublicArticleCard } from '@/modules/articles/types';
import './ArticlesSection.css';

export default function ArticlesSection({
  events,
  articles,
}: {
  events: PublicEventCard[];
  articles: PublicArticleCard[];
}) {
  const { searchQuery } = useSearch();
  const { lang, t } = useLanguage();
  const isEnglish = lang === 'en';
  const flow = useRegistrationFlow();

  const needle = (searchQuery || '').toLowerCase();
  const filteredEvents = events.filter(
    (e) =>
      eventTitle(e, lang).toLowerCase().includes(needle) ||
      eventLocation(e, lang).toLowerCase().includes(needle),
  );

  const filteredArticles = articles.filter((a) =>
    articleTitle(a, lang)
      .toLowerCase()
      .includes((searchQuery || '').toLowerCase()),
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
              const title = eventTitle(event, lang);
              const isRegistered = flow.isRegistered(event.id);
              return (
                <div key={event.id} className="sdc-event-card">
                  <div className="sdc-event-image-wrapper">
                    <span className={`sdc-badge-status ${statusTone(event.phase)}`}>
                      {statusLabel(event.phase, lang)}
                    </span>
                    <img src={event.cover} alt={title} className="sdc-event-image" />
                  </div>

                  <div className="sdc-event-details">
                    <div className="sdc-event-tags">
                      <span className="sdc-tag tag-competitions">
                        {isEnglish ? 'Competitions' : 'مسابقات'}
                      </span>
                      <span className="sdc-tag tag-tech">{isEnglish ? 'Technology' : 'تقنية'}</span>
                      <span className="sdc-tag tag-students">
                        {isEnglish ? 'Students' : 'طلاب'}
                      </span>
                    </div>

                    <h3 className="sdc-event-title">{title}</h3>

                    <div className="sdc-event-meta">
                      <span>
                        <MapPin size={13} className="sdc-icon-green" /> {eventLocation(event, lang)}
                      </span>
                      <span>
                        <Calendar size={13} className="sdc-icon-green" /> {eventDate(event, lang)}
                      </span>
                    </div>

                    <div className="sdc-event-actions">
                      <button
                        className={`sdc-btn-register ${isRegistered ? 'registered' : ''}`}
                        onClick={() => !isRegistered && flow.start(event)}
                        disabled={isRegistered}
                      >
                        {flow.label(event.id)}
                      </button>

                      <Link href={`/events/${event.slug}`} className="sdc-btn-more">
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
                href={`/articles/${article.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <div className="sdc-article-item">
                  <h3 className="sdc-article-title">{articleTitle(article, lang)}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {flow.dialogs}
    </section>
  );
}
