'use client';

import React, { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Search, User, Globe, X, LogOut, Sun, Moon } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './Header.css';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const { searchQuery, setSearchQuery } = useSearch();
  const { lang, toggleLanguage, t } = useLanguage();
  const { isLoggedIn, user, logout, hasPosition } = useAuth();
  /* لحذف نتائج البحث عند الانتقال الى صفحة أخرى*/
  useEffect(() => {
    if (searchQuery) {
      setSearchQuery('');
      if (onSearch) onSearch('');
    }
    // Intentionally runs only on navigation: clears the page-scoped search when the route changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) onSearch(value);
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const query = searchQuery.trim();

    if (!query) return;

    if (query === 'فعاليات' || query === 'الفعاليات' || query.toLowerCase() === 'events') {
      router.push('/events');
      setIsSearchOpen(false);
      return;
    }

    if (onSearch) {
      onSearch(query);
    } else {
      router.push('/search?query=' + encodeURIComponent(query));
    }

    setIsSearchOpen(false);
  };
  const handleLoginClick = () => {
    router.push('/login');
  };

  const handleLogoutClick = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  const displayName = user?.user_metadata?.full_name || user?.email || '';

  return (
    <>
      <header className="sdc-header">
        <div className="sdc-header-container">
          <div className="sdc-logo">
            <Link href="/">
              <img
                src={isDarkMode ? '/assets/Full whiteLogo 1.png' : '/assets/navbar.png'}
                alt="Logo"
              />
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
              {hasPosition && (
                <li className={pathname.startsWith('/dashboard') ? 'active-link' : ''}>
                  <Link href="/dashboard">{lang === 'en' ? 'Dashboard' : 'لوحة التحكم'}</Link>
                </li>
              )}
            </ul>
          </nav>

          <div className="sdc-actions">
            <button className="sdc-icon-btn" onClick={toggleTheme}>
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
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
                <Link href="/account" className="sdc-icon-btn">
                  <User size={18} />
                  <span>{displayName}</span>
                </Link>
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
