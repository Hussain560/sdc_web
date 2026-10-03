'use client';

import React from 'react';
import { BookOpen, Clock, Calendar } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import { useSearch } from '@/context/SearchContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  articleDate,
  articleTitle,
  authorsLabel,
  readingLabel,
  tagLabel,
  type PublicArticleCard,
} from '../../types';
import './all-articles.css';

/** The public thread list — same markup and CSS as before; the data now comes from the database. */
export default function ArticlesListView({ articles }: { articles: PublicArticleCard[] }) {
  const { searchQuery } = useSearch();
  const { lang } = useLanguage();
  const isEnglish = lang === 'en';

  const query = (searchQuery || '').toLowerCase();
  const filtered = articles.filter((a) => {
    return (
      articleTitle(a, lang).toLowerCase().includes(query) ||
      authorsLabel(a.authors, lang).toLowerCase().includes(query) ||
      a.tags.some((t) => tagLabel(t, lang).toLowerCase().includes(query))
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
          {filtered.length > 0 ? (
            <div className="sdc-all-articles-grid">
              {filtered.map((article) => (
                <div key={article.id} className="sdc-article-figma-card">
                  <div className="sdc-article-icon-circle">
                    <BookOpen size={20} />
                  </div>

                  <h3 className="sdc-card-title">{articleTitle(article, lang)}</h3>
                  <p className="sdc-card-author">
                    {isEnglish ? 'By: ' : 'بقلم: '}
                    {authorsLabel(article.authors, lang)}
                  </p>

                  <div className="sdc-card-meta">
                    <span>
                      <Calendar size={13} /> {articleDate(article.publishedAt, lang)}
                    </span>
                    <span>
                      <Clock size={13} /> {readingLabel(article.readingMinutes, lang)}
                    </span>
                  </div>

                  <div className="sdc-card-tags">
                    {article.tags.map((tag, idx) => (
                      <span key={tag.slug} className={`sdc-tag-pill ${idx === 0 ? 'tag-green' : ''}`}>
                        {tagLabel(tag, lang)}
                      </span>
                    ))}
                  </div>

                  <Link href={`/articles/${article.slug}`} className="sdc-card-read-btn">
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
