'use client';

import React from 'react';
import { User, MapPin, Calendar, Clock, Trophy, ExternalLink, Phone, Mail } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { SiteHeader as Header } from '@/components/layout/SiteHeader';
import { SiteFooter as Footer } from '@/components/layout/SiteFooter';
import { useLanguage } from '@/context/LanguageContext';
import { useRegistrationFlow } from '@/modules/registrations/components/useRegistrationFlow';
import {
  eventDate,
  eventDuration,
  eventLocation,
  eventTitle,
  type ListBlock,
  type PublicEventDetail,
} from '../../public-types';
import './event-details.css';

export default function EventDetailView({ event }: { event: PublicEventDetail }) {
  const { lang } = useLanguage();
  const isEnglish = lang === 'en';
  const flow = useRegistrationFlow();
  const registered = flow.isRegistered(event.id);

  const title = eventTitle(event, lang);
  const list = (b: ListBlock) => (isEnglish && b.en.length > 0 ? b.en : b.ar);
  const prizes = (isEnglish ? event.awardsEn : null) || event.awardsAr;

  const cards: Array<{ key: string; heading: string; items: string[] }> = [
    {
      key: 'responsibilities',
      heading: isEnglish ? 'Tasks and Responsibilities' : 'المهام والمسؤوليات:',
      items: list(event.responsibilities),
    },
    {
      key: 'requirements',
      heading: isEnglish ? 'Requirements and Criteria' : 'الشروط والمعايير',
      items: list(event.requirements),
    },
    {
      key: 'deliverables',
      heading: isEnglish ? 'Deliverables' : 'المخرجات :',
      items: list(event.deliverables),
    },
    {
      key: 'benefits',
      heading: isEnglish ? 'Opportunities and Benefits' : 'الفرص والمزايا :',
      items: list(event.benefits),
    },
  ].filter((c) => c.items.length > 0);

  return (
    <div className="sdc-event-detail-wrapper">
      <Header />

      <main id="main" className="sdc-event-detail-main">
        <section className="sdc-event-hero-banner">
          <div className="sdc-hero-overlay">
            <div className="sdc-hero-top-row">
              <nav className="sdc-breadcrumb">
                <Link href="/">{isEnglish ? 'Home' : 'الرئيسية'}</Link>
                <span className="sdc-bc-sep">&gt;</span>
                <Link href="/events">{isEnglish ? 'Events' : 'الفعاليات'}</Link>
                <span className="sdc-bc-sep">&gt;</span>
                <span style={{ color: '#00E676' }}>{title}</span>
              </nav>

              <button
                className={`sdc-hero-btn-register ${registered ? 'registered' : ''}`}
                onClick={() => !registered && flow.start(event)}
                disabled={registered}
              >
                {flow.label(event.id)}
              </button>
            </div>

            <h1 className="sdc-event-hero-title">{title}</h1>
          </div>
        </section>

        <div className="sdc-event-body-container">
          <div className="sdc-about-community-block">
            <h2 className="sdc-about-title">
              {isEnglish
                ? 'What is the Saudi Developer Community?'
                : 'ما هو المجتمع السعودي للمطورين'}
            </h2>
            <p className="sdc-about-desc">
              {isEnglish
                ? 'The Saudi community is a non-profit tech community that empowers developers and technology enthusiasts to gain practical experience, build real projects, share knowledge in AI and modern technologies, organize workshops and regular meetups, launch open-source projects, host inspiring speakers, and enrich Arabic technical content with high-quality material.'
                : 'المجتمع السعودي هو مجتمع تقني غير ربحي يهدف إلى تمكين المطورين والمهتمين بالتقنية من اكتساب الخبرات العملية وبناء مشاريع حقيقية، ونشر المعرفة في مجالات الذكاء الاصطناعي والتقنيات الحديثة، من خلال تنظيم ورش العمل واللقاءات الدورية، وإطلاق المشاريع مفتوحة المصدر، واستضافة شخصيات ملهمة، إلى جانب الإسهام في إثراء المحتوى العربي التقني بمحتوى عال الجودة.'}
            </p>
          </div>

          <div className="sdc-event-content-grid">
            <div className="sdc-event-main-cards">
              {event.show.details &&
                cards.map((c) => (
                  <div key={c.key} className="sdc-detail-card">
                    <div className="sdc-card-header">
                      <span className="sdc-card-icon">📋</span>
                      <h3>{c.heading}</h3>
                    </div>
                    <ul className="sdc-card-list">
                      {c.items.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>

            <aside className="sdc-event-sidebar">
              <div className="sdc-sidebar-card">
                {list(event.audience).length > 0 && (
                  <div className="sdc-sidebar-item">
                    <div className="sdc-sidebar-item-header">
                      <User size={18} className="sdc-sb-icon-style" />
                      <h4>{isEnglish ? 'Target Audience' : 'الفئة المستهدفة'}</h4>
                    </div>
                    <p className="sdc-sb-val">{list(event.audience).join('، ')}</p>
                  </div>
                )}

                <div className="sdc-sidebar-item">
                  <div className="sdc-sidebar-item-header">
                    <MapPin size={18} className="sdc-sb-icon-style" />
                    <h4>{isEnglish ? 'Location' : 'الموقع'}</h4>
                  </div>
                  {event.mapUrl ? (
                    <a
                      href={event.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sdc-sb-val sdc-link-val"
                    >
                      <ExternalLink size={14} className="sdc-ext-icon" />
                      <span>{eventLocation(event, lang)}</span>
                    </a>
                  ) : (
                    <p className="sdc-sb-val">{eventLocation(event, lang)}</p>
                  )}
                </div>

                <div className="sdc-sidebar-item">
                  <div className="sdc-sidebar-item-header">
                    <Calendar size={18} className="sdc-sb-icon-style" />
                    <h4>{isEnglish ? 'Event Date' : 'تاريخ الفعالية'}</h4>
                  </div>
                  <p className="sdc-sb-val">{eventDate(event, lang)}</p>
                </div>

                <div className="sdc-sidebar-item">
                  <div className="sdc-sidebar-item-header">
                    <Clock size={18} className="sdc-sb-icon-style" />
                    <h4>{isEnglish ? 'Event Duration' : 'مدة الفعالية'}</h4>
                  </div>
                  <p className="sdc-sb-val">{eventDuration(event, lang)}</p>
                </div>

                {prizes && (
                  <div className="sdc-sidebar-item">
                    <div className="sdc-sidebar-item-header">
                      <Trophy size={18} className="sdc-sb-icon-style" />
                      <h4>{isEnglish ? 'Awards' : 'الجوائز'}</h4>
                    </div>
                    <p className="sdc-sb-val">{prizes}</p>
                  </div>
                )}

                <hr className="sdc-sb-divider" />
                {event.show.faq && event.faq.length > 0 && (
                  <div className="sdc-sidebar-item">
                    <h4>{isEnglish ? 'FAQ' : 'الأسئلة الشائعة'}</h4>
                    {event.faq.map((f, index) => {
                      const q = isEnglish ? f.qEn || f.qAr : f.qAr;
                      const a = isEnglish ? f.aEn || f.aAr : f.aAr;
                      return (
                        <p key={index} className="sdc-sb-val">
                          {q && <strong>{q} </strong>}
                          {a}
                        </p>
                      );
                    })}
                  </div>
                )}

                {event.contactPhone && (
                  <div className="sdc-sidebar-item">
                    <div className="sdc-sidebar-item-header">
                      <Phone size={18} className="sdc-sb-icon-style" />
                      <h4>{isEnglish ? 'Phone' : 'الهاتف'}</h4>
                    </div>
                    <a href={`tel:${event.contactPhone}`} className="sdc-sb-link">
                      <ExternalLink size={14} className="sdc-ext-icon" />
                      <span>{event.contactPhone}</span>
                    </a>
                  </div>
                )}

                {event.contactEmail && (
                  <div className="sdc-sidebar-item">
                    <div className="sdc-sidebar-item-header">
                      <Mail size={18} className="sdc-sb-icon-style" />
                      <h4>{isEnglish ? 'Email' : 'البريد الالكتروني'}</h4>
                    </div>
                    <a href={`mailto:${event.contactEmail}`} className="sdc-sb-link">
                      <ExternalLink size={14} className="sdc-ext-icon" />
                      <span>{event.contactEmail}</span>
                    </a>
                  </div>
                )}

                <hr className="sdc-sb-divider" />
                <div className="sdc-sidebar-socials">
                  <h4>{isEnglish ? 'Social Accounts' : 'حسابات التواصل الإجتماعي'}</h4>
                  <div className="sdc-social-icons">
                    <a
                      href="https://x.com/SDC_Saudi?s=20"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sdc-soc-box"
                      title="X (Twitter)"
                    >
                      <span className="sdc-x-icon">𝕏</span>
                    </a>
                    <a
                      href="https://www.linkedin.com/company/sdc-%D8%A7%D9%84%D9%85%D8%AC%D8%AA%D9%85%D8%B9-%D8%A7%D9%84%D8%B3%D8%B9%D9%88%D8%AF%D9%8A-%D9%84%D9%84%D9%85%D8%B7%D9%88%D8%B1%D9%8A%D9%86/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sdc-soc-box"
                      title="LinkedIn"
                    >
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>in</span>
                    </a>
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sdc-soc-box"
                      aria-label="Instagram"
                      title="Instagram"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="2" y="2" width="20" height="20" rx="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {flow.dialogs}
      <Footer />
    </div>
  );
}
