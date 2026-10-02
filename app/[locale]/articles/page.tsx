'use client';

import React from 'react';
import { Link } from '@/i18n/navigation';
import { BookOpen, Clock, Calendar } from 'lucide-react';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import { useSearch } from '@/context/SearchContext';
import { useLanguage } from '@/context/LanguageContext';
import './all-articles.css';

const articles = [
  {
    id: 1,
    title: { ar: 'هندسة الأوامر (Prompt Engineering)', en: 'Prompt Engineering' },
    author: { ar: 'لجنة الذكاء الاصطناعي', en: 'AI Committee' },
    date: { ar: '15 أغسطس 2024', en: 'August 15, 2024' },
    readTime: { ar: '3 دقائق', en: '3 min' },
    tags: {
      ar: ['ذكاء اصطناعي', 'هندسة الأوامر', 'Prompt Engineering'],
      en: ['AI', 'Prompt Engineering', 'LLM'],
    },
  },
  {
    id: 2,
    title: { ar: 'تقنية Voice2Face', en: 'Voice2Face Technology' },
    author: {
      ar: 'الين الزهراني – مريم النعيم – غلا العتيبي',
      en: 'Alin Al-Zahrani – Maryam Al-Neaim – Ghala Alotibi',
    },
    date: { ar: '25 نوفمبر 2024', en: 'November 25, 2024' },
    readTime: { ar: '3 دقائق', en: '3 min' },
    tags: { ar: ['ذكاء اصطناعي', 'Python', 'تعلم'], en: ['AI', 'Python', 'Learning'] },
  },
  {
    id: 3,
    title: { ar: 'أنظمة التوصية (Recommendation Systems)', en: 'Recommendation Systems' },
    author: { ar: 'لجنة الذكاء الاصطناعي', en: 'AI Committee' },
    date: { ar: '12 سبتمبر 2025', en: 'September 12, 2025' },
    readTime: { ar: '3 دقائق', en: '3 min' },
    tags: { ar: ['انظمة', 'تعلم', 'ذكاء اصطناعي'], en: ['Systems', 'Learning', 'AI'] },
  },
  {
    id: 4,
    title: { ar: 'التطبيقات الصينية والإنجليزية', en: 'Chinese and English Applications' },
    author: { ar: 'لجنة الذكاء الاصطناعي', en: 'AI Committee' },
    date: { ar: '11 يونيو 2023', en: 'June 11, 2023' },
    readTime: { ar: '4 دقائق', en: '4 min' },
    tags: { ar: ['تقنية', 'Language', 'تعلم'], en: ['Technology', 'Language', 'Learning'] },
  },
  {
    id: 5,
    title: {
      ar: 'الذكاء الاصطناعي في الألعاب والتعلّم المعزّز',
      en: 'AI in Games and Reinforcement Learning',
    },
    author: { ar: 'لجنة الذكاء الاصطناعي', en: 'AI Committee' },
    date: { ar: '17 اكتوبر 2025', en: 'October 17, 2025' },
    readTime: { ar: '3 دقائق', en: '3 min' },
    tags: { ar: ['ذكاء اصطناعي', 'NLP', 'لغة طبيعية'], en: ['AI', 'NLP', 'Natural Language'] },
  },
  {
    id: 6,
    title: {
      ar: 'تطبيقات الذكاء الاصطناعي في تحليل المشاعر',
      en: 'AI Applications in Sentiment Analysis',
    },
    author: { ar: 'لجنة الذكاء الاصطناعي', en: 'AI Committee' },
    date: { ar: '26 سبتمبر 2025', en: 'September 26, 2025' },
    readTime: { ar: '4 دقائق', en: '4 min' },
    tags: { ar: ['ذكاء اصطناعي', 'أخلاقيات', 'AI '], en: ['AI', 'Ethics', 'AI'] },
  },
];

export default function AllArticlesPage() {
  const { searchQuery } = useSearch();
  const { lang } = useLanguage();
  const isEnglish = lang === 'en';

  const filteredArticles = articles.filter((article) => {
    const query = (searchQuery || '').toLowerCase();
    const title = article.title[isEnglish ? 'en' : 'ar'];
    const author = article.author[isEnglish ? 'en' : 'ar'];
    const tags = article.tags[isEnglish ? 'en' : 'ar'];
    return (
      title.toLowerCase().includes(query) ||
      author.toLowerCase().includes(query) ||
      tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  return (
    <div className="sdc-all-articles-wrapper">
      <Header />

      <main className="sdc-all-articles-main">
        <section className="sdc-articles-hero-banner">
          <div className="sdc-articles-hero-container">
            <nav className="sdc-articles-breadcrumb">
              <Link href="/">{isEnglish ? 'Home' : 'الرئيسية'}</Link>
              <span className="sdc-articles-bc-sep">&gt;</span>
              <span style={{ color: '#00E676' }}>{isEnglish ? 'Threads' : 'الثريدات'}</span>
            </nav>

            <h1 className="sdc-articles-hero-title">
              {isEnglish ? 'Community Space | Threads' : 'مساحة المجتمع | ثريدات'}
            </h1>
          </div>
        </section>

        <div className="sdc-all-articles-container">
          {filteredArticles.length > 0 ? (
            <div className="sdc-all-articles-grid">
              {filteredArticles.map((article) => (
                <div key={article.id} className="sdc-article-figma-card">
                  <div className="sdc-article-icon-circle">
                    <BookOpen size={20} />
                  </div>

                  <h3 className="sdc-card-title">{article.title[isEnglish ? 'en' : 'ar']}</h3>
                  <p className="sdc-card-author">
                    {isEnglish ? 'By: ' : 'بقلم: '}
                    {article.author[isEnglish ? 'en' : 'ar']}
                  </p>

                  <div className="sdc-card-meta">
                    <span>
                      <Calendar size={13} /> {article.date[isEnglish ? 'en' : 'ar']}
                    </span>
                    <span>
                      <Clock size={13} /> {article.readTime[isEnglish ? 'en' : 'ar']}
                    </span>
                  </div>

                  <div className="sdc-card-tags">
                    {article.tags[isEnglish ? 'en' : 'ar'].map((tag, idx) => (
                      <span key={idx} className={`sdc-tag-pill ${idx === 0 ? 'tag-green' : ''}`}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <Link href={`/articles/${article.id}`} className="sdc-card-read-btn">
                    {isEnglish ? 'Read Thread' : 'قراءة الثريد'}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="sdc-no-results">
              {isEnglish ? 'No threads matched your search.' : 'لا توجد ثريدات تطابق البحث حالياً.'}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
