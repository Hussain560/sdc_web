'use client';

import React, { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { SiteHeader as Header } from '@/components/layout/SiteHeader';
import { SiteFooter as Footer } from '@/components/layout/SiteFooter';
import { useSearch } from '@/context/SearchContext';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import type { Localized } from '@/types/content';
import './members.css';
import './all/all-members.css';

// The leadership sections (founders, leader, advisor, committee leads) come from the database view
// `current_positions` — active assignments of public roles (docs/11-modules/committees §7, rule CM-7).
interface LeadershipCard {
  id: string;
  roleKey: string;
  name: Localized;
  role: Localized;
  bio: Localized;
  tags: Localized<string[]>;
  roleOrder: number;
  committeeOrder: number;
}

interface PositionRow {
  assignment_id: string;
  role_order: number | null;
  committee_order: number | null;
  role_key: string | null;
  role_name_ar: string | null;
  role_name_en: string | null;
  display_title_ar: string | null;
  display_title_en: string | null;
  public_bio_ar: string | null;
  public_bio_en: string | null;
  public_tags_ar: string[] | null;
  public_tags_en: string[] | null;
  committee_name_ar: string | null;
  committee_name_en: string | null;
  person_name_ar: string | null;
  person_name_en: string | null;
}

function toLeadershipCard(r: PositionRow): LeadershipCard {
  const ar = r.display_title_ar || [r.role_name_ar, r.committee_name_ar].filter(Boolean).join(' ');
  const en =
    r.display_title_en || [r.role_name_en, r.committee_name_en].filter(Boolean).join(' ') || ar;
  return {
    id: r.assignment_id,
    roleKey: r.role_key ?? '',
    roleOrder: r.role_order ?? 0,
    committeeOrder: r.committee_order ?? 0,
    name: { ar: r.person_name_ar ?? '', en: r.person_name_en ?? r.person_name_ar ?? '' },
    role: { ar, en },
    bio: { ar: r.public_bio_ar ?? '', en: r.public_bio_en ?? r.public_bio_ar ?? '' },
    tags: { ar: r.public_tags_ar ?? [], en: r.public_tags_en ?? r.public_tags_ar ?? [] },
  };
}

// عشان ما يتكرر أي شخص موجود فعليًا كعضو بالجدول ظاهر فوق بالهرم —
// حط رقم الـ legacy_id تبعه هنا فيتم استثناؤه من قائمة "الأعضاء" تلقائيًا
const MEMBER_IDS_SHOWN_ABOVE: readonly number[] = [10, 15, 3]; // مهند الحربي، ريم الشمري، جواهر

type FilterCategory = 'universities' | 'majors' | 'subMajors' | 'statuses' | 'tracks';
type SelectedFilters = Record<FilterCategory, string[]>;
type FilterOptions = Record<FilterCategory, Localized[]>;

interface DirectoryMember {
  id: string;
  name: Localized;
  role: Localized;
  subMajor: Localized;
  status: Localized;
  university: Localized;
  tags: Localized<string[]>;
  activeTag: Localized;
}

interface MemberCardProps {
  name: string;
  role?: string;
  bio?: string;
  university?: string;
  tags?: string[];
  activeTag?: string;
  href?: string;
  infoLabel?: string;
}

const EMPTY_FILTERS: SelectedFilters = {
  universities: [],
  majors: [],
  subMajors: [],
  statuses: [],
  tracks: [],
};
const EMPTY_FILTER_OPTIONS: FilterOptions = {
  universities: [],
  majors: [],
  subMajors: [],
  statuses: [],
  tracks: [],
};

// تدرّج ثابت واحد لكل الأفاتارات (بدون تمييز حسب الاسم)
const AVATAR_GRADIENT = 'linear-gradient(135deg, #00E676, #00B85C)';

function getInitial(name: string) {
  const trimmed = (name || '').trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '؟';
}

function getAvatarGradient() {
  return AVATAR_GRADIENT;
}

function MemberCardSkeleton() {
  return (
    <div className="sdc-member-card sdc-member-card-skeleton">
      <div className="sdc-skel sdc-skel-avatar" />
      <div className="sdc-skel sdc-skel-line" style={{ width: '70%' }} />
      <div className="sdc-skel sdc-skel-line" style={{ width: '45%' }} />
      <div className="sdc-skel-tags">
        <div className="sdc-skel sdc-skel-pill" />
        <div className="sdc-skel sdc-skel-pill" />
      </div>
      <div className="sdc-skel sdc-skel-btn" />
    </div>
  );
}

// ============================ الكارد الموحّد لكل المستويات ============================
function MemberCard({
  name,
  role,
  bio,
  university,
  tags,
  activeTag,
  href,
  infoLabel,
}: MemberCardProps) {
  return (
    <div className="sdc-member-card">
      <div className="sdc-member-card-top">
        <div className="sdc-member-avatar" style={{ background: getAvatarGradient() }}>
          {getInitial(name)}
        </div>
        <div className="sdc-member-heading">
          <h3 className="sdc-card-name">{name}</h3>
          {role && <p className="sdc-card-role">{role}</p>}
        </div>
      </div>

      {bio && <p className="sdc-card-bio">{bio}</p>}

      {university && (
        <div className="sdc-card-university">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M12 3 2 8l10 5 10-5-10-5Z" />
            <path d="M6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" />
          </svg>
          <span>{university}</span>
        </div>
      )}

      {tags && tags.length > 0 && (
        <div className="sdc-card-tags">
          {tags.map((tag: string, idx: number) => (
            <span
              key={idx}
              className={`sdc-tag-pill ${tag === activeTag || (!activeTag && idx === 0) ? 'tag-green' : ''}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {href && (
        <Link href={href} className="sdc-card-info-btn">
          <span>{infoLabel}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      )}
    </div>
  );
}

export default function MembersPage() {
  const { searchQuery } = useSearch();
  const { lang } = useLanguage();
  const isEnglish = lang === 'en';
  const t = <T,>(obj: Localized<T>): T => obj[isEnglish ? 'en' : 'ar'];

  const [leadership, setLeadership] = useState<LeadershipCard[] | null>(null);
  const [membersData, setMembersData] = useState<DirectoryMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>(EMPTY_FILTERS);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(EMPTY_FILTER_OPTIONS);
  const [openSections, setOpenSections] = useState<Partial<Record<FilterCategory, boolean>>>({});

  useEffect(() => {
    async function fetchLeadership() {
      const { data, error } = await supabase
        .from('current_positions')
        .select('*')
        .order('role_order')
        .order('committee_order');
      if (error) console.error('Error fetching leadership:', error);
      setLeadership((data ?? []).map((r) => toLeadershipCard(r as PositionRow)));
    }
    fetchLeadership();
  }, []);

  useEffect(() => {
    async function fetchMembers() {
      const { data, error } = await supabase.from('member_directory').select('*');

      if (error) {
        console.error('Error fetching members:', error);
        setLoading(false);
        return;
      }

      const rows = (data || []).filter((m) => !MEMBER_IDS_SHOWN_ABOVE.includes(m.legacy_id ?? -1));

      const formatted = rows.map((m) => {
        const fullNameAr = `${m.first_name || ''} ${m.last_name || ''}`.trim();
        const fullNameEn = `${m.first_name_en || ''} ${m.last_name_en || ''}`.trim() || fullNameAr;

        const tagsListAr = [m.major, m.sub_major, m.track].filter((value): value is string =>
          Boolean(value),
        );
        const tagsListEn = [m.major_en, m.sub_major_en, m.track_en].filter(
          (value): value is string => Boolean(value),
        );

        return {
          id: m.id ?? '',
          name: { ar: fullNameAr, en: fullNameEn },
          role: { ar: m.major || '', en: m.major_en || m.major || '' },
          subMajor: { ar: m.sub_major || '', en: m.sub_major_en || m.sub_major || '' },
          status: { ar: m.status || '', en: m.status_en || m.status || '' },
          university: { ar: m.university || '', en: m.university_en || m.university || '' },
          tags: { ar: tagsListAr, en: tagsListEn.length ? tagsListEn : tagsListAr },
          activeTag: { ar: m.track || '', en: m.track_en || m.track || '' },
        };
      });

      const universityMap: Record<string, string> = {};
      const majorMap: Record<string, string> = {};
      const subMajorMap: Record<string, string> = {};
      const statusMap: Record<string, string> = {};
      const trackMap: Record<string, string> = {};

      rows.forEach((m) => {
        if (m.university) universityMap[m.university] = m.university_en || m.university;
        if (m.major) majorMap[m.major] = m.major_en || m.major;
        if (m.sub_major) subMajorMap[m.sub_major] = m.sub_major_en || m.sub_major;
        if (m.status) statusMap[m.status] = m.status_en || m.status;
        if (m.track) trackMap[m.track] = m.track_en || m.track;
      });

      const toOptionsList = (map: Record<string, string>): Localized[] =>
        Object.entries(map).map(([ar, en]) => ({ ar, en }));

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

  const matchesCategory = (selectedList: string[], rawValue: string) =>
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
    ]
      .join(' ')
      .toLowerCase();

    const matchesSearch = !query || searchText.includes(query);

    const matchesFilters =
      matchesCategory(selectedFilters.universities, member.university.ar) &&
      matchesCategory(selectedFilters.majors, member.role.ar) &&
      matchesCategory(selectedFilters.subMajors, member.subMajor.ar) &&
      matchesCategory(selectedFilters.statuses, member.status.ar) &&
      matchesCategory(selectedFilters.tracks, member.activeTag.ar);

    return matchesSearch && matchesFilters;
  });

  const toggleFilterValue = (category: FilterCategory, arValue: string) => {
    setSelectedFilters((prev) => {
      const current = prev[category];
      const next = current.includes(arValue)
        ? current.filter((v) => v !== arValue)
        : [...current, arValue];
      return { ...prev, [category]: next };
    });
  };

  const toggleSection = (key: FilterCategory) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetFilters = () => setSelectedFilters(EMPTY_FILTERS);

  const activeFiltersCount = Object.values(selectedFilters).reduce(
    (acc, arr) => acc + arr.length,
    0,
  );

  const filterSections: { key: FilterCategory; label: string; list: Localized[] }[] = [
    {
      key: 'universities',
      label: isEnglish ? 'University' : 'الجامعة',
      list: filterOptions.universities,
    },
    { key: 'majors', label: isEnglish ? 'Major' : 'التخصص', list: filterOptions.majors },
    {
      key: 'subMajors',
      label: isEnglish ? 'Sub-major' : 'التخصص الدقيق',
      list: filterOptions.subMajors,
    },
    {
      key: 'statuses',
      label: isEnglish ? 'Academic Status' : 'الحالة الدراسية',
      list: filterOptions.statuses,
    },
    { key: 'tracks', label: isEnglish ? 'Track' : 'المسار', list: filterOptions.tracks },
  ];

  const showHierarchy = !searchQuery.trim() && activeFiltersCount === 0;
  const byRole = (...keys: string[]) => (leadership ?? []).filter((p) => keys.includes(p.roleKey));
  const founders = byRole('founder');
  const leaderAndAdvisor = byRole('community_leader', 'advisor');
  // A committee's head and deputy sit together, committees in their display order.
  const teamLeads = byRole('committee_head', 'committee_deputy').sort(
    (a, b) => a.committeeOrder - b.committeeOrder || a.roleOrder - b.roleOrder,
  );

  return (
    <div className="sdc-members-page-wrapper">
      <Header />

      <main id="main" className="sdc-members-main">
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
                <h1 className="sdc-members-banner-title">
                  {isEnglish
                    ? 'Saudi Developer Community Members (SDC)'
                    : 'أعضاء المجتمع السعودي للمطورين (SDC)'}
                </h1>
              </div>
            </div>
          </div>
        </section>

        <div className="sdc-all-members-container">
          {showHierarchy && (
            <>
              {leadership === null ? (
                <>
                  <div className="sdc-spotlight-grid sdc-grid-2col" style={{ marginTop: 24 }}>
                    {Array.from({ length: 2 }).map((_, idx) => (
                      <MemberCardSkeleton key={idx} />
                    ))}
                  </div>
                  <div className="sdc-all-members-grid" style={{ marginTop: 24 }}>
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <MemberCardSkeleton key={idx} />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {founders.length > 0 && (
                    <>
                      {/* مؤسِّستا المجتمع */}
                      <div className="sdc-section-heading">
                        <span className="sdc-section-heading-bar" />
                        <h2>{isEnglish ? 'Community Founders' : 'مؤسِّستا المجتمع'}</h2>
                      </div>
                      <div className="sdc-spotlight-grid sdc-grid-2col">
                        {founders.map((f) => (
                          <MemberCard key={f.id} name={t(f.name)} bio={t(f.bio)} tags={t(f.tags)} />
                        ))}
                      </div>
                    </>
                  )}

                  {leaderAndAdvisor.length > 0 && (
                    <>
                      {/* قائد المجتمع والمستشار */}
                      <div className="sdc-section-heading">
                        <span className="sdc-section-heading-bar" />
                        <h2>
                          {isEnglish ? 'Community Leader & Advisor' : 'قائد المجتمع والمستشار'}
                        </h2>
                      </div>
                      <div className="sdc-spotlight-grid sdc-grid-2col">
                        {leaderAndAdvisor.map((p) => (
                          <MemberCard
                            key={p.id}
                            name={t(p.name)}
                            role={t(p.role)}
                            bio={t(p.bio)}
                            tags={t(p.tags)}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {teamLeads.length > 0 && (
                    <>
                      {/* قادة المجتمع */}
                      <div className="sdc-section-heading">
                        <span className="sdc-section-heading-bar" />
                        <h2>{isEnglish ? 'Community Leads' : 'قادة المجتمع'}</h2>
                      </div>
                      <div className="sdc-all-members-grid">
                        {teamLeads.map((lead) => (
                          <MemberCard key={lead.id} name={t(lead.name)} role={t(lead.role)} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}

          {/* أعضاء المجتمع + زر التخصيص (الفلتر) */}
          <div
            className="sdc-members-section-header"
            style={{ marginTop: showHierarchy ? '10px' : '0' }}
          >
            <div className="sdc-filter-wrap">
              <button
                type="button"
                onClick={() => setIsFilterOpen((open) => !open)}
                className={`sdc-filter-toggle-btn ${isFilterOpen ? 'is-open' : ''}`}
              >
                ⚙ {isEnglish ? 'Filters' : 'التخصيص'}
                {activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
              </button>

              {isFilterOpen && (
                <>
                  <div className="sdc-filter-backdrop" onClick={() => setIsFilterOpen(false)} />
                  <div className="sdc-filter-panel" onClick={(e) => e.stopPropagation()}>
                    {/* رأس اللوحة */}
                    <div className="sdc-filter-header">
                      <h3 className="sdc-filter-header-title">
                        {isEnglish ? 'Filters' : 'التخصيص'}
                        {activeFiltersCount > 0 && (
                          <span className="sdc-filter-header-count">{activeFiltersCount}</span>
                        )}
                      </h3>
                      <button
                        type="button"
                        className="sdc-filter-close-icon"
                        onClick={() => setIsFilterOpen(false)}
                        aria-label={isEnglish ? 'Close' : 'إغلاق'}
                      >
                        ✕
                      </button>
                    </div>

                    {/* جسم اللوحة */}
                    <div className="sdc-filter-panel-scroll">
                      {filterSections.map((section) => {
                        const isOpen = !!openSections[section.key];
                        const pickedCount = selectedFilters[section.key].length;
                        return (
                          <div key={section.key} className="sdc-filter-section">
                            <div
                              onClick={() => toggleSection(section.key)}
                              className="sdc-filter-section-head"
                            >
                              <h4>
                                {section.label}
                                {pickedCount > 0 && (
                                  <span className="sdc-filter-section-badge">{pickedCount}</span>
                                )}
                              </h4>
                              <span className={`sdc-filter-chevron ${isOpen ? 'is-open' : ''}`}>
                                ▾
                              </span>
                            </div>

                            {isOpen && (
                              <div className="sdc-filter-options">
                                {section.list.length === 0 && (
                                  <span className="sdc-filter-empty">
                                    {isEnglish ? 'No data' : 'لا توجد بيانات'}
                                  </span>
                                )}
                                {section.list.map((opt) => {
                                  const isPicked = selectedFilters[section.key].includes(opt.ar);
                                  return (
                                    <div
                                      key={opt.ar}
                                      onClick={() => toggleFilterValue(section.key, opt.ar)}
                                      className={`sdc-filter-option-row ${isPicked ? 'is-picked' : ''}`}
                                    >
                                      <span className="sdc-filter-checkbox">
                                        <svg
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="3.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                      </span>
                                      <span className="sdc-filter-option-label">
                                        {isEnglish ? opt.en : opt.ar}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* تذييل اللوحة */}
                    <div className="sdc-filter-footer">
                      <button type="button" onClick={resetFilters} className="sdc-filter-reset">
                        {isEnglish ? 'Reset' : 'إعادة تعيين'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFilterOpen(false)}
                        className="sdc-filter-apply"
                      >
                        {isEnglish ? 'Apply' : 'تطبيق'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="sdc-header-right-info">
              <h2 className="sdc-section-main-title">
                {isEnglish ? 'Community Members' : 'أعضاء المجتمع'}
              </h2>
              <p className="sdc-section-sub-title">
                {isEnglish
                  ? 'Meet the members of our community who share a passion for technology, collaboration, and making an impact.'
                  : 'تعرّف على أعضاء مجتمعنا الذين يجمعهم الشغف بالتقنية، والتعاون، وصناعة الأثر.'}
              </p>
            </div>
          </div>

          <div className="sdc-all-members-grid">
            {loading ? (
              Array.from({ length: 8 }).map((_, idx) => <MemberCardSkeleton key={idx} />)
            ) : filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  name={t(member.name)}
                  role={t(member.role)}
                  university={t(member.university)}
                  tags={t(member.tags)}
                  activeTag={t(member.activeTag)}
                  href={`/members/${member.id}`}
                  infoLabel={isEnglish ? 'Professional Info' : 'المعلومات المهنية'}
                />
              ))
            ) : (
              <p className="sdc-no-results">
                {isEnglish
                  ? `No results matched your search: "${searchQuery}"`
                  : `لا توجد نتائج تطابق بحثك: "${searchQuery}"`}
              </p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
