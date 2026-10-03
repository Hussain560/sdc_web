'use client';

import Image from 'next/image';
import React from 'react';
import { Link } from '@/i18n/navigation';

import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

import './HeroSection.css';

export default function HeroSection() {
  const { lang } = useLanguage();
  const isEnglish = lang === 'en';

  const { isDarkMode } = useTheme();

  return (
    <section className="sdc-hero-section">
      <div className="sdc-hero-wrapper">
        <div className="sdc-hero-content-free">
          <div className="sdc-hero-text-content">
            <h1 className="sdc-hero-title">
              {isEnglish ? 'Saudi Developer' : 'المجتمع السعودي'} <br />
              {isEnglish ? 'Community' : 'للمطورين'}
            </h1>

            <p className="sdc-hero-description">
              {isEnglish
                ? 'We build a Saudi community that leads the future with AI and modern technologies.'
                : 'نبني مجتمعاً سعودياً يقود المستقبل بالذكاء الاصطناعي والتقنيات الحديثة.'}
            </p>

            <Link href="/about" className="sdc-btn-primary-hero">
              {isEnglish ? 'Community Vision' : 'رؤية المجتمع'}
            </Link>
          </div>

          <div className="sdc-hero-image-wrapper">
            <Image
              src={isDarkMode ? '/assets/hero-logo.png' : '/assets/light-mode.png'}
              alt={isEnglish ? 'Saudi Developer Community logo' : 'شعار المجتمع السعودي للمطورين'}
              className="sdc-hero-image"
              width={isDarkMode ? 546 : 1504}
              height={isDarkMode ? 380 : 1046}
              sizes="(max-width: 768px) 90vw, 560px"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
