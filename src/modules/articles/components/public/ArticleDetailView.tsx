'use client';

import React from 'react';
import { Link } from '@/i18n/navigation';
import { Calendar, Clock, User } from 'lucide-react';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';
import { useLanguage } from '@/context/LanguageContext';
import {
  articleDate,
  articleTitle,
  authorsLabel,
  readingLabel,
  tagLabel,
  type PublicArticle,
} from '../../types';
import './article-details.css';

/** The public thread page — same markup and CSS as before; the body is now rendered Markdown. */
export default function ArticleDetailView({ article }: { article: PublicArticle }) {
  const { lang } = useLanguage();
  const isEnglish = lang === 'en';
  // English readers get the Arabic body when no English one exists (edge case 3), marked as such.
  const arabicOnly = isEnglish && !article.bodyEn?.trim();
  const body = isEnglish && !arabicOnly ? article.bodyEn! : article.bodyAr;

  return (
    <div className="sdc-article-detail-wrapper">
      <Header />

      <main className="sdc-article-detail-main">
        <section className="sdc-article-hero-banner">
          <div className="sdc-article-hero-container">
            <nav className="sdc-article-breadcrumb">
              <Link href="/">{isEnglish ? 'Home' : 'الرئيسية'}</Link>
              <span className="sdc-article-bc-sep">&gt;</span>
              <Link href="/articles">{isEnglish ? 'Articles' : 'المقالات'}</Link>
              <span className="sdc-article-bc-sep">&gt;</span>
              <span style={{ color: '#00E676' }}>{articleTitle(article, lang)}</span>
            </nav>

            <h1 className="sdc-article-hero-title">{articleTitle(article, lang)}</h1>
          </div>
        </section>

        <div className="sdc-article-container">
          <header className="sdc-article-header">
            <div className="sdc-article-meta-row">
              <span>
                <User size={14} /> {authorsLabel(article.authors, lang)}
              </span>
              <span>
                <Calendar size={14} /> {articleDate(article.publishedAt, lang)}
              </span>
              <span>
                <Clock size={14} /> {readingLabel(article.readingMinutes, lang)}
              </span>
            </div>

            <div className="sdc-article-tags-row">
              {article.tags.map((tag) => (
                <span key={tag.slug} className="sdc-article-tag-pill">
                  {tagLabel(tag, lang)}
                </span>
              ))}
            </div>
          </header>

          <div className="sdc-article-content-card">
            {arabicOnly && (
              <p className="sdc-article-lang-note" role="note">
                متوفر بالعربية فقط / Available in Arabic only
              </p>
            )}
            <div {...(arabicOnly ? { lang: 'ar', dir: 'rtl' } : {})}>
              <MarkdownRenderer source={body} className="sdc-article-text" />
            </div>

            {article.resourceUrl && (
              <a
                href={article.resourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sdc-article-source-link"
              >
                {(isEnglish ? article.resourceLabelEn : null) ||
                  article.resourceLabelAr ||
                  article.resourceUrl}
              </a>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
