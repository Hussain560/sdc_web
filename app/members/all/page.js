'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../../src/components/Header/Header';
import Footer from '../../../src/components/Footer/Footer';
import { useSearch } from '../../../src/context/SearchContext';
import { useLanguage } from '../../../src/context/LanguageContext';
import { supabase } from '../../../src/lib/supabase';
import './all-members.css';

export default function AllMembersPage() {
  const { searchQuery } = useSearch();
  const { lang } = useLanguage();
  const isEnglish = lang === 'en';
  const [allMembersData, setAllMembersData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMembers() {
      const { data, error } = await supabase.from('members').select('*');

      if (error) {
        console.error('Error fetching members:', error);
        setLoading(false);
        return;
      }

      const formatted = (data || []).map((m) => {
        const fullNameAr = `${m.first_name || ''} ${m.last_name || ''}`.trim();
        const fullNameEn = `${m.first_name_en || ''} ${m.last_name_en || ''}`.trim() || fullNameAr;

        const tagsListAr = [m.major, m.sub_major, m.track].filter(Boolean);
        const tagsListEn = [m.major_en, m.sub_major_en, m.track_en].filter(Boolean);

        return {
          id: m.id,
          name: { ar: fullNameAr, en: fullNameEn },
          role: { ar: m.major || '', en: m.major_en || m.major || '' },
          university: { ar: m.university || '', en: m.university_en || m.university || '' },
          tags: { ar: tagsListAr, en: tagsListEn.length ? tagsListEn : tagsListAr },
          activeTag: { ar: m.track || '', en: m.track_en || m.track || '' },
        };
      });

      setAllMembersData(formatted);
      setLoading(false);
    }

    fetchMembers();
  }, []);

  const filteredMembers = allMembersData.filter((member) => {
    const query = searchQuery ? searchQuery.toLowerCase().trim() : '';
    if (!query) return true;

    const text = [
      member.name.ar,
      member.name.en,
      member.role.ar,
      member.role.en,
      member.university.ar,
      member.university.en,
      ...member.tags.ar,
      ...member.tags.en,
    ].join(' ').toLowerCase();

    return text.includes(query);
  });

  return (
    <div className="sdc-all-members-wrapper">
      <Header />

      <main className="sdc-all-members-main">
        <section className="sdc-members-hero-banner">
          <div className="sdc-members-hero-container">
            <nav className="sdc-members-breadcrumb">
              <Link href="/">{isEnglish ? 'Home' : 'الرئيسية'}</Link>
              <span className="sdc-members-bc-sep">&gt;</span>
              <Link href="/members">{isEnglish ? 'Members' : 'الأعضاء'}</Link>
              <span className="sdc-members-bc-sep">&gt;</span>
              <span style={{ color: '#00E676' }}>{isEnglish ? 'All Members' : 'جميع الأعضاء'}</span>
            </nav>

            <h1 className="sdc-members-hero-title">{isEnglish ? 'All Community Members' : 'جميع أعضاء المجتمع'}</h1>
          </div>
        </section>

        <div className="sdc-all-members-container">
          <div className="sdc-all-members-grid">
            {loading ? (
              <p style={{ color: '#9CA3AF', gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
                {isEnglish ? 'Loading members...' : 'جاري تحميل الأعضاء...'}
              </p>
            ) : filteredMembers.length > 0 ? (
              filteredMembers.map((member) => {
                const displayName = member.name[isEnglish ? 'en' : 'ar'];
                const displayRole = member.role[isEnglish ? 'en' : 'ar'];
                const displayTags = member.tags[isEnglish ? 'en' : 'ar'];
                const displayActiveTag = member.activeTag[isEnglish ? 'en' : 'ar'];

                return (
                  <div key={member.id} className="sdc-member-figma-card">
                    <div className="sdc-member-icon-circle">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M20 21a8 8 0 0 0-16 0" />
                      </svg>
                    </div>

                    <h3 className="sdc-card-name">{displayName}</h3>
                    <p className="sdc-card-role">{displayRole}</p>

                    <div className="sdc-card-tags">
                      {displayTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className={`sdc-tag-pill ${tag === displayActiveTag ? 'tag-green' : ''}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <Link href={`/members/${member.id}`} className="sdc-card-info-btn">
                      {isEnglish ? 'Professional Info' : 'المعلومات المهنية'}
                    </Link>
                  </div>
                );
              })
            ) : (
              <p style={{ color: '#9CA3AF', gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
                {isEnglish ? 'No results matched your search.' : 'لا توجد نتائج تطابق بحثك.'}
              </p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}