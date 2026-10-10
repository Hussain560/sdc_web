'use client';

import { CalendarDays, FileText, UserRound } from 'lucide-react';
import { SiteFooter as Footer } from '@/components/layout/SiteFooter';
import { SiteHeader as Header } from '@/components/layout/SiteHeader';
import { useLanguage } from '@/context/LanguageContext';
import { Link } from '@/i18n/navigation';
import { formatDate } from '@/lib/format';
import type { PublicCommittee } from '../../queries';
import '../../../articles/components/public/article-details.css';

/** Public committee page (CM-7): description, leadership, events and threads — banner + content cards. */
export default function CommitteeView({ committee }: { committee: PublicCommittee }) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const name = ar ? committee.nameAr : committee.nameEn || committee.nameAr;
  const description = (ar ? committee.descriptionAr : committee.descriptionEn || committee.descriptionAr) ?? '';

  const section: React.CSSProperties = { marginTop: 24 };
  const h2: React.CSSProperties = { fontSize: '1.15rem', fontWeight: 800, margin: '0 0 12px' };
  const list: React.CSSProperties = { listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 };

  return (
    <div className="sdc-article-detail-wrapper">
      <Header />
      <main id="main" className="sdc-article-detail-main">
        <section className="sdc-article-hero-banner">
          <div className="sdc-article-hero-container">
            <nav className="sdc-article-breadcrumb">
              <Link href="/">{L('الرئيسية', 'Home')}</Link>
              <span className="sdc-article-bc-sep">&gt;</span>
              <span style={{ color: '#00E676' }}>{name}</span>
            </nav>
            <h1 className="sdc-article-hero-title">{name}</h1>
          </div>
        </section>

        <div className="sdc-article-container">
          <div className="sdc-article-content-card">
            {description ? (
              <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{description}</p>
            ) : (
              <p style={{ margin: 0, opacity: 0.7 }}>
                {L('سيُضاف وصف اللجنة قريبًا.', 'The committee description is coming soon.')}
              </p>
            )}

            {committee.leaders.length > 0 && (
              <div style={section}>
                <h2 style={h2}>{L('قيادة اللجنة', 'Committee leadership')}</h2>
                <ul style={list}>
                  {committee.leaders.map((l, i) => (
                    <li key={`${l.roleKey}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <UserRound size={18} aria-hidden="true" />
                      <span style={{ fontWeight: 700 }}>{l.name[lang]}</span>
                      <span style={{ opacity: 0.7 }}>— {l.title?.[lang] ?? l.role[lang]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {committee.events.length > 0 && (
              <div style={section}>
                <h2 style={h2}>{L('فعاليات اللجنة', 'Committee events')}</h2>
                <ul style={list}>
                  {committee.events.map((e) => (
                    <li key={e.slug} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CalendarDays size={18} aria-hidden="true" />
                      <Link href={`/events/${e.slug}`} style={{ fontWeight: 700 }}>
                        {ar ? e.titleAr : e.titleEn || e.titleAr}
                      </Link>
                      {e.startDate && (
                        <span style={{ opacity: 0.7 }}>{formatDate(e.startDate, lang)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {committee.articles.length > 0 && (
              <div style={section}>
                <h2 style={h2}>{L('ثريدات اللجنة', 'Committee threads')}</h2>
                <ul style={list}>
                  {committee.articles.map((a) => (
                    <li key={a.slug} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FileText size={18} aria-hidden="true" />
                      <Link href={`/articles/${a.slug}`} style={{ fontWeight: 700 }}>
                        {ar ? a.titleAr : a.titleEn || a.titleAr}
                      </Link>
                      <span style={{ opacity: 0.7 }}>{formatDate(a.publishedAt, lang)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
