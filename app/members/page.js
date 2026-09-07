'use client';

import React, { useState, useEffect,useRef } from 'react';
import Link from 'next/link';
import Header from '../../src/components/Header/Header';
import Footer from '../../src/components/Footer/Footer';
import { useSearch } from '../../src/context/SearchContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { supabase } from '../../src/lib/supabase';
import './members.css';

const EMPTY_FILTERS = { universities: [], majors: [], subMajors: [], statuses: [], tracks: [] };

export default function MembersPage() {
  const { searchQuery } = useSearch();
  const { lang } = useLanguage();
  const isEnglish = lang === 'en';
  const [activeDot, setActiveDot] = useState(0);
  const [membersData, setMembersData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState(EMPTY_FILTERS);
  const [filterOptions, setFilterOptions] = useState(EMPTY_FILTERS);
  const [openSections, setOpenSections] = useState({});

  // تعديل حركة البطاقات في حال أكثر من بطاقة---------
  // 1. مرجع لحاوية التمرير (الكروت)
  const scrollContainerRef = useRef(null);
  const [totalPages, setTotalPages] = useState(1);
  //---تم رفعه من سطر 167
  
  const matchesCategory = (selectedList, rawValue) =>
    selectedList.length === 0 || selectedList.includes(rawValue);

  const filteredMembers = membersData.filter((member) => {
    const query = searchQuery ? searchQuery.toLowerCase().trim() : '';

    const searchText = [
      member.name.ar,
      member.name.en,
      member.role.ar,
      member.role.en,
      member.university.ar,
      member.university.en,
      ...member.tags.ar,
      ...member.tags.en,
    ].join(' ').toLowerCase();

    const matchesSearch = !query || searchText.includes(query);

    const matchesFilters =
      matchesCategory(selectedFilters.universities, member.university.ar) &&
      matchesCategory(selectedFilters.majors, member.role.ar) &&
      matchesCategory(selectedFilters.subMajors, member.subMajor.ar) &&
      matchesCategory(selectedFilters.statuses, member.status.ar) &&
      matchesCategory(selectedFilters.tracks, member.activeTag.ar);

    return matchesSearch && matchesFilters;
  });
  //-----
  // 2. حساب عدد الصفحات ديناميكياً حسب عرض الشاشة والعناصر الظاهرة
  useEffect(() => {
    const calculatePages = () => {
      if (!scrollContainerRef.current) return;
      const container = scrollContainerRef.current;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;

      if (clientWidth > 0 && scrollWidth > clientWidth) {
        const pages = Math.ceil(scrollWidth / clientWidth);
        setTotalPages(pages);
      } else {
        setTotalPages(1);
      }
    };

    calculatePages();
    window.addEventListener('resize', calculatePages);
    return () => window.removeEventListener('resize', calculatePages);
  }, [filteredMembers]);

  // 3. إعادة ضبط النقطة إلى الأولى عند التصفية أو البحث
  useEffect(() => {
    setActiveDot(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [searchQuery, selectedFilters]);

  // 4. دالة تحديث النقطة النشطة أثناء السحب
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, clientWidth } = scrollContainerRef.current;
    const scrollPos = Math.abs(scrollLeft);
    const pageIndex = Math.round(scrollPos / clientWidth);
    
    if (pageIndex !== activeDot && pageIndex < totalPages) {
      setActiveDot(pageIndex);
    }
  };

  // 5. دالة التمرير عند الضغط على النقطة
  const scrollToPage = (pageIndex) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const targetScroll = container.clientWidth * pageIndex;
    const isRTL = document.dir === 'rtl' || !isEnglish;

    container.scrollTo({
      left: isRTL ? -targetScroll : targetScroll,
      behavior: 'smooth',
    });
    setActiveDot(pageIndex);
  };
  //-----------

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
          subMajor: { ar: m.sub_major || '', en: m.sub_major_en || m.sub_major || '' },
          status: { ar: m.status || '', en: m.status_en || m.status || '' },
          university: { ar: m.university || '', en: m.university_en || m.university || '' },
          tags: { ar: tagsListAr, en: tagsListEn.length ? tagsListEn : tagsListAr },
          activeTag: { ar: m.track || '', en: m.track_en || m.track || '' },
        };
      });

      // نبني قوائم خيارات الفلاتر من البيانات الحقيقية (قيمة عربية + مقابلها الإنجليزي)
      const universityMap = {};
      const majorMap = {};
      const subMajorMap = {};
      const statusMap = {};
      const trackMap = {};

      (data || []).forEach((m) => {
        if (m.university) universityMap[m.university] = m.university_en || m.university;
        if (m.major) majorMap[m.major] = m.major_en || m.major;
        if (m.sub_major) subMajorMap[m.sub_major] = m.sub_major_en || m.sub_major;
        if (m.status) statusMap[m.status] = m.status_en || m.status;
        if (m.track) trackMap[m.track] = m.track_en || m.track;
      });

      const toOptionsList = (map) => Object.entries(map).map(([ar, en]) => ({ ar, en }));

      setFilterOptions({
        universities: toOptionsList(universityMap),
        majors: toOptionsList(majorMap),
        subMajors: toOptionsList(subMajorMap),
        statuses: toOptionsList(statusMap),
        tracks: toOptionsList(trackMap),
      });

      setMembersData(formatted);
      setLoading(false);
    }

    fetchMembers();
  }, []);

  const toggleFilterValue = (category, arValue) => {
    setSelectedFilters((prev) => {
      const current = prev[category];
      const next = current.includes(arValue)
        ? current.filter((v) => v !== arValue)
        : [...current, arValue];
      return { ...prev, [category]: next };
    });
  };

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetFilters = () => setSelectedFilters(EMPTY_FILTERS);

  const activeFiltersCount = Object.values(selectedFilters).reduce((acc, arr) => acc + arr.length, 0);


  const filterSections = [
    { key: 'universities', label: isEnglish ? 'University' : 'الجامعة', list: filterOptions.universities },
    { key: 'majors', label: isEnglish ? 'Major' : 'التخصص', list: filterOptions.majors },
    { key: 'subMajors', label: isEnglish ? 'Sub-major' : 'التخصص الدقيق', list: filterOptions.subMajors },
    { key: 'statuses', label: isEnglish ? 'Academic Status' : 'الحالة الدراسية', list: filterOptions.statuses },
    { key: 'tracks', label: isEnglish ? 'Track' : 'المسار', list: filterOptions.tracks },
  ];

  return (
    <div className="sdc-members-page-wrapper">
      <Header />

      <main className="sdc-members-main">
        <section className="sdc-members-hero">
          <div className="sdc-members-hero-container">
            <div className="sdc-members-banner-box">
              <img
                src="/assets/Service(1).png"
                alt={isEnglish ? 'Community members banner' : 'بنر أعضاء المجتمع'}
                className="sdc-members-banner-bg"
              />
              <div className="sdc-members-banner-overlay">
                <nav className="sdc-members-breadcrumb">
                  <Link href="/">{isEnglish ? 'Home' : 'الرئيسية'}</Link>
                  <span className="sdc-members-bc-sep">&gt;</span>
                  <span style={{ color: '#00E676' }}>{isEnglish ? 'Members' : 'الأعضاء'}</span>
                </nav>
                <h1 className="sdc-members-banner-title">{isEnglish ? 'Saudi Developer Community Members (SDC)' : 'أعضاء المجتمع السعودي للمطورين (SDC)'}</h1>
              </div>
            </div>
          </div>
        </section>

        <section className="sdc-members-slider-section">
          <div className="sdc-members-slider-container">
            <div className="sdc-members-section-header">
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                <Link href="/members/all" className="sdc-view-all-members-btn">
                  {isEnglish ? 'View All' : 'عرض الكل'}
                </Link>

                <button
                  type="button"
                  onClick={() => setIsFilterOpen((open) => !open)}
                  style={{
                    border: '1px solid #00E676',
                    color: '#00E676',
                    background: 'rgba(0,230,118,0.08)',
                    padding: '10px 18px',
                    borderRadius: '24px',
                    fontSize: '14px',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                >
                  ⚙ {isEnglish ? 'Filters' : 'التخصيص'}{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
                </button>

                {isFilterOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '52px',
                      insetInlineStart: 0,
                      width: '220px',
                      maxWidth: 'calc(100vw - 24px)',
                      maxHeight: '420px',
                      overflowY: 'auto',
                      background: '#131916',
                      border: '1px solid #2e3730',
                      borderRadius: '14px',
                      padding: '18px',
                      zIndex: 20,
                      boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
                    }}
                  >
                    {filterSections.map((section) => {
                      const isOpen = !!openSections[section.key];
                      return (
                        <div key={section.key} style={{ marginBottom: '14px' }}>
                          <div
                            onClick={() => toggleSection(section.key)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start',
                              gap: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            <h4 style={{ color: '#00E676', fontSize: '14px', margin: '0' }}>
                              {section.label}
                              {selectedFilters[section.key].length > 0 ? ` (${selectedFilters[section.key].length})` : ''}
                            </h4>
                            <span
                              style={{
                                color: '#00E676',
                                fontSize: '12px',
                                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s',
                              }}
                            >
                              ▾
                            </span>
                          </div>

                          {isOpen && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                              {section.list.length === 0 && (
                                <span style={{ color: '#6b7280', fontSize: '12px' }}>
                                  {isEnglish ? 'No data' : 'لا توجد بيانات'}
                                </span>
                              )}
                              {section.list.map((opt) => {
                                const isPicked = selectedFilters[section.key].includes(opt.ar);
                                return (
                                  <span
                                    key={opt.ar}
                                    onClick={() => toggleFilterValue(section.key, opt.ar)}
                                    style={{
                                      cursor: 'pointer',
                                      border: `1px solid ${isPicked ? '#00E676' : '#3a443c'}`,
                                      color: isPicked ? '#00E676' : '#ddd',
                                      borderRadius: '16px',
                                      padding: '5px 12px',
                                      fontSize: '12px',
                                    }}
                                  >
                                    {isEnglish ? opt.en : opt.ar}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #2e3730' }}>
                      <button
                        type="button"
                        onClick={resetFilters}
                        style={{ border: 'none', background: 'transparent', color: '#9CA3AF', fontSize: '13px', cursor: 'pointer' }}
                      >
                        {isEnglish ? 'Reset' : 'إعادة تعيين'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFilterOpen(false)}
                        style={{ border: 'none', background: 'transparent', color: '#00E676', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                      >
                        {isEnglish ? 'Close' : 'إغلاق'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="sdc-header-right-info">
                <h2 className="sdc-section-main-title">{isEnglish ? 'Community Members' : 'أعضاء المجتمع'}</h2>
                <p className="sdc-section-sub-title">
                  {isEnglish
                    ? 'Meet the members of our community who share a passion for technology, collaboration, and making an impact.'
                    : 'تعرّف على أعضاء مجتمعنا الذين يجمعهم الشغف بالتقنية، والتعاون، وصناعة الأثر.'}
                </p>
              </div>
            </div>

            <div 
              ref={scrollContainerRef} 
              onScroll={handleScroll} 
              className="sdc-members-cards-row"
            >
              {loading ? (
                <p style={{ color: '#9CA3AF', width: '100%', textAlign: 'center', padding: '20px' }}>
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
                <p style={{ color: '#9CA3AF', width: '100%', textAlign: 'center', padding: '20px' }}>
                  {isEnglish ? `No results matched your search: "${searchQuery}"` : `لا توجد نتائج تطابق بحثك: "${searchQuery}"`}
                </p>
              )}
            </div>

          {totalPages > 1 && (
  <div className="sdc-pagination-dots">
    {Array.from({ length: totalPages }).map((_, dotIndex) => (
      <span
        key={dotIndex}
        className={`sdc-dot ${activeDot === dotIndex ? 'active' : ''}`}
        onClick={() => scrollToPage(dotIndex)}
        style={{ cursor: 'pointer' }}
      />
    ))}
  </div>
)}

           {/* <div className="sdc-pagination-dots">
              {[0, 1, 2].map((dotIndex) => (
                <span
                  key={dotIndex}
                  className={`sdc-dot ${activeDot === dotIndex ? 'active' : ''}`}
                  onClick={() => setActiveDot(dotIndex)}
                />
              ))}
            </div>*/}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}