'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '../../../src/components/Header/Header';
import Footer from '../../../src/components/Footer/Footer';
import { useLanguage } from '../../../src/context/LanguageContext';
import { supabase } from '../../../src/lib/supabase';
import './details.css';

export default function MemberDetailsPage() {
  const params = useParams();
  const memberId = params?.id;
  const { lang } = useLanguage();
  const isEnglish = lang === 'en';

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isContactOpen, setIsContactOpen] = useState(false);
  const [formData, setFormData] = useState({ senderName: '', senderEmail: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    async function fetchMember() {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', parseInt(memberId, 10))
        .single();

      if (error || !data) {
        console.error('Error fetching member:', error);
        setMember(null);
        setLoading(false);
        return;
      }

      const fullNameAr = `${data.first_name || ''} ${data.last_name || ''}`.trim();
      const fullNameEn = `${data.first_name_en || ''} ${data.last_name_en || ''}`.trim() || fullNameAr;

      const tagsListAr = [data.major, data.sub_major, data.track].filter(Boolean);
      const tagsListEn = [data.major_en, data.sub_major_en, data.track_en].filter(Boolean);

      setMember({
        id: data.id,
        name: { ar: fullNameAr, en: fullNameEn },
        role: { ar: data.major || '', en: data.major_en || data.major || '' },
        university: { ar: data.university || '', en: data.university_en || data.university || '' },
        major: {
          ar: data.sub_major || data.major || '',
          en: data.sub_major_en || data.major_en || data.sub_major || data.major || '',
        },
        status: { ar: data.status || '', en: data.status_en || data.status || '' },
        bio: { ar: data.bio || '', en: data.bio_en || data.bio || '' },
        tags: { ar: tagsListAr, en: tagsListEn.length ? tagsListEn : tagsListAr },
        activeTag: { ar: data.track || '', en: data.track_en || data.track || '' },
        socials: {
          portfolio: data.portfolio_url || '#',
          x: data.x_url || '#',
          linkedin: data.linkedin_url || '#',
          github: data.github_url || '#',
        },
      });
      setLoading(false);
    }

    if (memberId) fetchMember();
  }, [memberId]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSending(false);
      setSentSuccess(true);
      setFormData({ senderName: '', senderEmail: '', message: '' });
      setTimeout(() => {
        setSentSuccess(false);
        setIsContactOpen(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to send contact message:', error);
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="sdc-details-page-wrapper">
        <Header />
        <main className="sdc-details-main">
          <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '60px 0' }}>
            {isEnglish ? 'Loading member...' : 'جاري تحميل بيانات العضو...'}
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="sdc-details-page-wrapper">
        <Header />
        <main className="sdc-details-main">
          <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '60px 0' }}>
            {isEnglish ? 'Member not found.' : 'العضو غير موجود.'}
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  const memberName = member.name[isEnglish ? 'en' : 'ar'];
  const memberRole = member.role[isEnglish ? 'en' : 'ar'];
  const memberUniversity = member.university[isEnglish ? 'en' : 'ar'];
  const memberMajor = member.major[isEnglish ? 'en' : 'ar'];
  const memberStatus = member.status[isEnglish ? 'en' : 'ar'];
  const memberBio = member.bio[isEnglish ? 'en' : 'ar'];
  const memberTags = member.tags[isEnglish ? 'en' : 'ar'];
  const activeTag = member.activeTag[isEnglish ? 'en' : 'ar'];

  return (
    <div className="sdc-details-page-wrapper">
      <Header />

      <main className="sdc-details-main">
        <section className="sdc-member-hero-banner">
          <div className="sdc-member-hero-container">
            <nav className="sdc-member-breadcrumb">
              <Link href="/">{isEnglish ? 'Home' : 'الرئيسية'}</Link>
              <span className="sdc-member-bc-sep">&gt;</span>
              <Link href="/members">{isEnglish ? 'Members' : 'الأعضاء'}</Link>
              <span className="sdc-member-bc-sep">&gt;</span>
              <span style={{ color: '#00E676' }}>{memberName}</span>
            </nav>

            <h1 className="sdc-member-hero-title">{memberName}</h1>
          </div>
        </section>

        <section className="sdc-details-content-section">
          <div className="sdc-details-content-container">
            <div className="sdc-details-section-header">
              <div className="sdc-header-right-info">
                <h2 className="sdc-section-main-title">{isEnglish ? 'Community Members' : 'أعضاء المجتمع'}</h2>
                <p className="sdc-section-sub-title">
                  {isEnglish
                    ? 'Meet the members of our community who share a passion for technology, collaboration, and making an impact.'
                    : 'تعرّف على أعضاء مجتمعنا الذين يجمعهم الشغف بالتقنية، والتعاون، وصناعة الأثر.'}
                </p>
              </div>

              <Link href="/members" className="sdc-view-all-btn">
                {isEnglish ? 'View All' : 'عرض الكل'}
              </Link>
            </div>

            <div className="sdc-member-detail-card">
              <div className="sdc-card-top-header">
                <div className="sdc-profile-meta-right">
                  <div className="sdc-avatar-circle">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M20 21a8 8 0 0 0-16 0" />
                    </svg>
                  </div>

                  <div className="sdc-name-role-group">
                    <h3 className="sdc-detail-name">{memberName}</h3>
                    <div className="sdc-name-underline"></div>
                    <p className="sdc-detail-role">{memberRole}</p>

                    <div className="sdc-detail-tags">
                      {memberTags.map((tag, idx) => (
                        <span key={idx} className={`sdc-tag-item ${tag === activeTag ? 'tag-active' : ''}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="sdc-academic-info-center">
                  <div className="sdc-info-block">
                    <span className="sdc-info-label-group">
                      <img src="/assets/graduation-hat-02.png" alt={isEnglish ? 'graduation cap' : 'قبعة التخرج'} className="sdc-info-icon" />
                      <strong>{isEnglish ? 'Academic Status' : 'الحالة الدراسية'}</strong>
                    </span>
                    <span className="sdc-info-sub">{memberStatus}</span>
                  </div>

                  <div className="sdc-info-block">
                    <span className="sdc-info-label-group">
                      <svg className="sdc-info-icon-svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7AAF98" strokeWidth="1.5">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                      <strong>{memberUniversity}</strong>
                    </span>
                    <span className="sdc-info-sub">{memberMajor}</span>
                  </div>
                </div>
              </div>

              <div className="sdc-bio-box">
                <div className="sdc-pattern-watermark"></div>
                <p className="sdc-bio-text">{memberBio}</p>
              </div>

              <div className="sdc-social-icons-row">
                <a href={member.socials.portfolio} target="_blank" rel="noopener noreferrer" className="sdc-social-icon-link" title={isEnglish ? 'Portfolio' : 'الموقع الشخصي'}>
                  <img src="/assets/briefcase-01.png" alt={isEnglish ? 'Portfolio' : 'حقيبة'} className="sdc-social-img-icon" />
                </a>
                <a href={member.socials.x} target="_blank" rel="noopener noreferrer" className="sdc-social-icon-link" title="X">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg>
                </a>
                <a href={member.socials.linkedin} target="_blank" rel="noopener noreferrer" className="sdc-social-icon-link" title="LinkedIn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                </a>
                <a href={member.socials.github} target="_blank" rel="noopener noreferrer" className="sdc-social-icon-link" title="GitHub">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                </a>
              </div>

             {/* <button className="sdc-contact-me-btn" onClick={() => setIsContactOpen(true)}>
                {isEnglish ? 'Contact Me' : 'تواصل معي'}
              </button> */}
            </div>
          </div>
        </section>
      </main>

      {isContactOpen && (
        <div className="sdc-modal-overlay" onClick={() => setIsContactOpen(false)}>
          <div className="sdc-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="sdc-modal-close" onClick={() => setIsContactOpen(false)}>✕</button>
            <h3>{isEnglish ? `Contact ${memberName}` : `التواصل مع ${memberName}`}</h3>
            <p>{isEnglish ? 'You can send a direct message to the member here:' : 'يمكنك إرسال رسالة مباشرة للعضو من هنا:'}</p>

            {sentSuccess ? (
              <div style={{ color: '#00E676', textAlign: 'center', padding: '20px 0', fontWeight: 'bold' }}>
                {isEnglish ? 'Your message has been sent successfully! ✓' : 'تم إرسال رسالتك بنجاح! ✓'}
              </div>
            ) : (
              <form className="sdc-contact-form" onSubmit={handleContactSubmit}>
                <input
                  type="text"
                  name="senderName"
                  placeholder={isEnglish ? 'Your name' : 'اسمك الكريم'}
                  value={formData.senderName}
                  onChange={handleInputChange}
                  required
                  className="sdc-modal-input"
                />
                <input
                  type="email"
                  name="senderEmail"
                  placeholder={isEnglish ? 'Your email' : 'بريدك الإلكتروني'}
                  value={formData.senderEmail}
                  onChange={handleInputChange}
                  required
                  className="sdc-modal-input"
                />
                <textarea
                  name="message"
                  placeholder={isEnglish ? 'Write your message here...' : 'اكتب رسالتك هنا...'}
                  rows="4"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  className="sdc-modal-input"
                ></textarea>
                <button type="submit" className="sdc-modal-submit-btn" disabled={sending}>
                  {sending ? (isEnglish ? 'Sending...' : 'جاري الإرسال...') : (isEnglish ? 'Send Message' : 'إرسال الرسالة')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}