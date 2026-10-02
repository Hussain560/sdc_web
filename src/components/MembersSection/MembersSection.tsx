'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import './MembersSection.css';

const memberPlaceholdersCount = 4;

const partnersCount = Array.from({ length: 12 });

export default function MembersSection() {
  const sliderRef = useRef<HTMLDivElement>(null);
  const { lang } = useLanguage();
  const isEnglish = lang === 'en';

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'right' ? -260 : 260;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="sdc-community-frame">
      <div className="sdc-members-container">
        <h2 className="sdc-members-title">{isEnglish ? 'Community Members' : 'اعضاء المجتمع'}</h2>

        <div className="sdc-avatar-group">
          <Link href="/members" className="sdc-avatar-more" aria-label={isEnglish ? 'View more members' : 'عرض المزيد من الأعضاء'}>
            +
          </Link>
          {Array.from({ length: memberPlaceholdersCount }).map((_, index) => (
            <div
              key={index}
              className="sdc-avatar-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.08)',
                color: '#ffffff',
              }}
              aria-label={isEnglish ? 'Member' : 'عضو'}
            >
              <User size={22} strokeWidth={1.8} />
            </div>
          ))}
        </div>

        <Link href="/members" className="sdc-members-view-btn">
          {isEnglish ? 'View All' : 'عرض الكل'}
        </Link>
      </div>

      <div className="sdc-partners-container">
        <h3 className="sdc-partners-title">{isEnglish ? 'Partners' : 'قسم الشركاء'}</h3>

        <div className="sdc-partners-slider">
          <button
            className="sdc-slider-arrow"
            onClick={() => scroll('right')}
            aria-label={isEnglish ? 'Scroll right' : 'التمرير لليمين'}
          >
            <ChevronRight size={22} />
          </button>

          <div className="sdc-partner-cards-list" ref={sliderRef}>
            {partnersCount.map((_, index) => (
              <div key={index} className="sdc-partner-card">
                <img
                  src="/assets/partner-logo.png"
                  alt={isEnglish ? 'Platform logo' : 'شعار'}
                  className="sdc-partner-logo"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/28/000000/FFFFFF?text=🇸🇦';
                  }}
                />
                <span className="sdc-partner-text">{isEnglish ? 'Platform Logo' : 'شعار المنصة'}</span>
              </div>
            ))}
          </div>

          <button
            className="sdc-slider-arrow"
            onClick={() => scroll('left')}
            aria-label={isEnglish ? 'Scroll left' : 'التمرير لليسار'}
          >
            <ChevronLeft size={22} />
          </button>
        </div>
      </div>
    </section>
  );
}