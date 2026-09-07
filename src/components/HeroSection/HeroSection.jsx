'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import './HeroSection.css';

export default function HeroSection() {
  const { lang } = useLanguage();
  const isEnglish = lang === 'en';

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
            <img 
              src="/assets/hero-logo.png" 
              alt={isEnglish ? 'Saudi Developer Community logo' : 'شعار المجتمع السعودي للمطورين'} 
              className="sdc-hero-image"
            />
          </div>
        </div>
      </div>
    </section>
  );
}