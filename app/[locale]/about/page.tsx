'use client';

import React from 'react';
import { Link } from '@/i18n/navigation';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import { useLanguage } from '@/context/LanguageContext';
import './about.css';

export default function AboutPage() {
  const { lang } = useLanguage();
  const isEnglish = lang === 'en';

  return (
    <div className="sdc-about-wrapper">
      <Header />

      <main className="sdc-about-main-content">
        <section className="sdc-about-hero-banner">
          <div className="sdc-about-hero-overlay">
            <nav className="sdc-about-breadcrumb">
              <Link href="/">{isEnglish ? 'Home' : 'الرئيسية'}</Link>
              <span className="sdc-about-bc-sep">&gt;</span>
              <span style={{ color: '#00E676' }}>
                {isEnglish ? 'About the Community' : 'عن المجتمع'}
              </span>
            </nav>
            <h1 className="sdc-about-main-title">
              {isEnglish
                ? 'About the Saudi Developer Community (SDC)'
                : 'عن المجتمع السعودي للمطورين (SDC)'}
            </h1>
          </div>
        </section>

        <section className="sdc-about-container">
          <div className="sdc-about-intro-box">
            <h2 className="sdc-intro-title">
              {isEnglish
                ? 'What is the Saudi Developer Community?'
                : 'ما هو المجتمع السعودي للمطورين'}
            </h2>
            <p className="sdc-intro-text">
              {isEnglish
                ? 'The Saudi community is a non-profit tech community that empowers developers and technology enthusiasts to gain practical experience, build real projects, share knowledge in AI and modern technologies, organize workshops and regular meetups, launch open-source projects, host inspiring speakers, and contribute to enriching Arabic technical content with high-quality material.'
                : 'المجتمع السعودي هو مجتمع تقني غير ربحي يهدف إلى تمكين المطورين والمهتمين بالتقنية من اكتساب الخبرات العملية وبناء مشاريع حقيقية، ونشر المعرفة في مجالات الذكاء الاصطناعي والتقنيات الحديثة، من خلال تنظيم ورش العمل واللقاءات دورية، وإطلاق المشاريع مفتوحة المصدر، واستضافة شخصيات ملهمة، إلى جانب الإسهام في إثراء المحتوى العربي التقني بمحتوى عالي الجودة.'}
            </p>
          </div>

          <div className="sdc-vision-mission-grid">
            <div className="sdc-vm-column">
              <h3 className="sdc-vm-outside-title">{isEnglish ? 'Our Vision' : 'رؤيتنا'}</h3>
              <div className="sdc-vm-card-box">
                <div className="sdc-vm-icon-right">
                  <img src="/assets/Featured icon.png" alt="SDC Icon" className="sdc-vm-icon-img" />
                </div>
                <p className="sdc-vm-text">
                  {isEnglish
                    ? 'To be the leading hub for Saudi developers and exceptional minds in the field of artificial intelligence.'
                    : 'أن نكون الحاضنة الأكبر للمطورين السعوديين وأصحاب العقول المتميزة في مجال الذكاء الاصطناعي.'}
                </p>
              </div>
            </div>

            <div className="sdc-vm-column">
              <h3 className="sdc-vm-outside-title">{isEnglish ? 'Our Mission' : 'رسالتنا'}</h3>
              <div className="sdc-vm-card-box">
                <div className="sdc-vm-icon-right">
                  <img src="/assets/Featured icon.png" alt="SDC Icon" className="sdc-vm-icon-img" />
                </div>
                <p className="sdc-vm-text">
                  {isEnglish
                    ? 'Empowering Saudi developers through education, collaboration, and building technical projects that contribute to digital growth.'
                    : 'تمكين المطورين السعوديين من خلال التعليم، والتعاون، وبناء مشاريع تقنية تسهم في النهضة الرقمية.'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
