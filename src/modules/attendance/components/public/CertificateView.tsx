'use client';

import { CircleCheck, Download } from 'lucide-react';
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import { useLanguage } from '@/context/LanguageContext';
import { Link } from '@/i18n/navigation';
import { formatDateRange } from '@/lib/format';
import type { CertificateFacts } from '../../queries';
import '../../../articles/components/public/article-details.css';

/** Certificate verification (public screens 12 §3): banner + one detail card, in the existing public language. */
export default function CertificateView({
  id,
  facts,
  canDownload,
}: {
  id: string;
  facts: CertificateFacts;
  canDownload: boolean;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const rows: Array<[string, string]> = [
    [L('الاسم', 'Name'), facts.recipientName],
    [L('الفعالية', 'Event'), (ar ? facts.titleAr : facts.titleEn || facts.titleAr) ?? ''],
    [L('التاريخ', 'Dates'), formatDateRange(facts.startDate, facts.endDate, lang)],
    [L('نسبة الحضور', 'Attendance'), `${facts.percent}%`],
  ];

  return (
    <div className="sdc-article-detail-wrapper">
      <Header />
      <main className="sdc-article-detail-main">
        <section className="sdc-article-hero-banner">
          <div className="sdc-article-hero-container">
            <nav className="sdc-article-breadcrumb">
              <Link href="/">{L('الرئيسية', 'Home')}</Link>
              <span className="sdc-article-bc-sep">&gt;</span>
              <span style={{ color: '#00E676' }}>
                {L('التحقق من شهادة', 'Certificate verification')}
              </span>
            </nav>
            <h1 className="sdc-article-hero-title">
              <CircleCheck
                size={28}
                aria-hidden="true"
                style={{ verticalAlign: 'middle', marginInlineEnd: 10 }}
              />
              {L('شهادة حضور صالحة', 'Valid certificate of attendance')}
            </h1>
          </div>
        </section>

        <div className="sdc-article-container">
          <div className="sdc-article-content-card">
            <dl
              style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px 24px', margin: 0 }}
            >
              {rows.map(([k, v]) => (
                <div key={k} style={{ display: 'contents' }}>
                  <dt style={{ opacity: 0.7 }}>{k}</dt>
                  <dd style={{ margin: 0, fontWeight: 600 }}>{v}</dd>
                </div>
              ))}
              <dt style={{ opacity: 0.7 }}>{L('رقم الشهادة', 'Certificate number')}</dt>
              <dd
                dir="ltr"
                style={{
                  margin: 0,
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 13,
                  textAlign: 'start',
                }}
              >
                {id}
              </dd>
            </dl>
            {canDownload && (
              <a href={`/api/certificates/${id}/pdf`} className="sdc-article-source-link">
                <Download size={16} aria-hidden="true" style={{ marginInlineEnd: 8 }} />
                {L('تنزيل الشهادة PDF', 'Download the PDF')}
              </a>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
