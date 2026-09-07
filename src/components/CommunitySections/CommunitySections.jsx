'use client';

import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import './CommunitySections.css';

const categories = [
  { id: 1, ar: 'الذكاء الاصطناعي', en: 'Artificial Intelligence', borderClass: 'border-top-only' },
  { id: 2, ar: 'علم البيانات', en: 'Data Science', borderClass: 'border-bottom-only' },
  { id: 3, ar: 'التسويق', en: 'Marketing', borderClass: 'border-top-only' },
  { id: 4, ar: 'البودكاست والمحتوى', en: 'Podcast & Content', borderClass: 'border-bottom-only' },
  { id: 5, ar: 'إدارة المنتجات', en: 'Product Management', borderClass: 'border-top-only' },
  { id: 6, ar: 'العلاقات العامة', en: 'Public Relations', borderClass: 'border-bottom-only' },
];

export default function CommunitySections() {
  const { lang } = useLanguage();
  const isEnglish = lang === 'en';

  return (
    <section className="sdc-community-sec">
      <div className="sdc-community-container">
        <h2 className="sdc-community-title">{isEnglish ? 'Community Sections' : 'أقسام المجتمع'}</h2>

        <div className="sdc-community-grid">
          {categories.map((item) => (
            <div key={item.id} className={`sdc-category-card ${item.borderClass}`}>
              <img 
                src="/assets/Featured icon.png" 
                alt={item[isEnglish ? 'en' : 'ar']} 
                className="sdc-category-icon-img"
              />
              <h3 className="sdc-category-name">{item[isEnglish ? 'en' : 'ar']}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}