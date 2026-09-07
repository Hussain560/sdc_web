'use client';

import React, { useState,useEffect  } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, User, Globe, X, LogOut } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { COMMITTEE_EMAILS } from '../../data/committeeEmails';
import './Header.css';

export default function Header({ onSearch }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const { searchQuery, setSearchQuery } = useSearch();
  const { lang, toggleLanguage, t } = useLanguage();
  const { isLoggedIn, user, logout } = useAuth();
  /* لحذف نتائج البحث عند الانتقال الى صفحة أخرى*/
  useEffect(() => {
  if (searchQuery) {
    setSearchQuery('');
    if (onSearch) onSearch('');
  }
}, [pathname]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) onSearch(value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (onSearch) onSearch(searchQuery);
    else router.push(`?search=${encodeURIComponent(searchQuery)}`);
    setIsSearchOpen(false);
  };

  const handleLoginClick = () => {
    router.push('/login');
  };

  const handleLogoutClick = async () => {
    await logout();
    router.push('/');
  };

  const displayName = user?.user_metadata?.full_name || user?.email || '';
  const isCommittee = isLoggedIn && COMMITTEE_EMAILS.includes(user?.email);

  return (
    <>
      <header className="sdc-header">
        <div className="sdc-header-container">

          <div className="sdc-logo">
            <Link href="/">
              <img src="/assets/Full whiteLogo 1.png" alt="Logo" />
            </Link>
          </div>

          <nav className="sdc-nav">
            <ul>
              <li className={pathname === '/about' ? 'active-link' : ''}>
                <Link href="/about">{t('about')}</Link>
              </li>
              <li className={pathname === '/events' ? 'active-link' : ''}>
                <Link href="/events">{t('events')}</Link>
              </li>
              <li className={pathname === '/members' ? 'active-link' : ''}>
                <Link href="/members">{t('members')}</Link>
              </li>
              {isCommittee && (
                <li className={pathname === '/committee' ? 'active-link' : ''}>
                  <Link href="/committee">لوحة اللجنة</Link>
                </li>
              )}
            </ul>
          </nav>

          <div className="sdc-actions">

            <button className="sdc-icon-btn" onClick={() => setIsSearchOpen(true)}>
              <Search size={18} />
              <span>{t('search')}</span>
            </button>

            <button className="sdc-icon-btn" onClick={toggleLanguage}>
              <Globe size={18} />
              <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            {isLoggedIn ? (
              <>
                <span className="sdc-icon-btn" style={{ cursor: 'default' }}>
                  <User size={18} />
                  <span>{displayName}</span>
                </span>
                <button type="button" onClick={handleLogoutClick} className="sdc-btn-primary">
                  <LogOut size={18} />
                  <span>{lang === 'en' ? 'Logout' : 'تسجيل الخروج'}</span>
                </button>
              </>
            ) : (
              <button type="button" onClick={handleLoginClick} className="sdc-btn-primary">
                <User size={18} />
                <span>{t('login')}</span>
              </button>
            )}

          </div>

        </div>
      </header>

      {isSearchOpen && (
        <div className="sdc-search-overlay" onClick={() => setIsSearchOpen(false)}>
          <div className="sdc-search-modal" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSearchSubmit}>
              <Search size={20} className="sdc-modal-search-icon" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={handleInputChange}
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                  if (onSearch) onSearch('');
                }}
                className="sdc-close-btn"
              >
                <X size={20} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}