'use client';

import React from 'react';
import './Footer.css';
import { useLanguage } from '../../context/LanguageContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';

export default function Footer() {
  const { lang, t } = useLanguage();
  const settings = useSiteSettings();
  const rights =
    (lang === 'ar' ? settings.footerRightsAr : settings.footerRightsEn) || t('allRightsReserved');

  return (
    <footer className="sdc-footer">
      <div className="sdc-footer-container">
        {/* الجزء العلوي: تابعنا على + الأيقونات جهة اليمين */}
        <div className="sdc-footer-top">
          <span className="sdc-footer-follow-label">{t('followUs')}</span>

          <div className="sdc-footer-socials">
            {/* إنستغرام */}
            <a
              href={settings.socialInstagram}
              target="_blank"
              rel="noreferrer"
              className="sdc-social-icon"
              aria-label="Instagram"
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
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>

            {/* لينكد إن */}
            <a
              href={settings.socialLinkedin}
              target="_blank"
              rel="noreferrer"
              className="sdc-social-icon"
              aria-label="LinkedIn"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.7a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z" />
              </svg>
            </a>

            {/* منصة X */}
            <a
              href={settings.socialX}
              target="_blank"
              rel="noreferrer"
              className="sdc-social-icon"
              aria-label="X"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>

        {/* الجزء السفلي: النصوص جهة اليمين والشعار جهة اليسار */}
        <div className="sdc-footer-bottom">
          {/* حقوق النشر والتفاصيل */}
          <div className="sdc-footer-info">
            <p className="sdc-footer-text">{rights}</p>
            <p className="sdc-footer-text">{t('developedBy')}</p>
            <p className="sdc-footer-text">
              <a href={lang === 'ar' ? '/login' : '/en/login'} className="sdc-footer-member-link">
                {lang === 'ar' ? 'دخول الأعضاء' : 'Member login'}
              </a>
            </p>
          </div>

          {/* الشعار العمودي جهة اليسار */}
          <div className="sdc-footer-logo-container">
            <img
              src="/assets/Logos.png"
              alt={lang === 'ar' ? 'المجتمع السعودي للمطورين' : 'Saudi Developer Community'}
              className="sdc-footer-logo"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://via.placeholder.com/100x95/050D09/FFFFFF?text=SDC';
              }}
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
