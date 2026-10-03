'use client';

import React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { LayoutDashboard, LogIn, User, Globe, LogOut, Sun, Moon, LoaderCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './Header.css';

export default function Header() {
  const { isDarkMode, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const { lang, toggleLanguage, isSwitching, t } = useLanguage();
  const { isLoggedIn, logout } = useAuth();
  const handleJoinClick = () => {
    router.push('/join');
  };

  const handleLogoutClick = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  return (
    <>
      <header className="sdc-header">
        <div className="sdc-header-container">
          <div className="sdc-logo">
            <Link href="/">
              {isDarkMode ? (
                <Image
                  src="/assets/Full whiteLogo 1.png"
                  alt="Logo"
                  width={159}
                  height={67}
                  priority
                />
              ) : (
                <Image
                  src="/assets/navbar.png"
                  alt="Logo"
                  width={1928}
                  height={816}
                  priority
                  sizes="172px"
                />
              )}
            </Link>
          </div>

          <nav className="sdc-nav">
            <ul>
              <li className={pathname === '/' ? 'active-link' : ''}>
                <Link href="/">{t('home')}</Link>
              </li>
              <li className={pathname === '/about' ? 'active-link' : ''}>
                <Link href="/about">{t('about')}</Link>
              </li>
              <li className={pathname === '/events' ? 'active-link' : ''}>
                <Link href="/events">{t('events')}</Link>
              </li>
              <li className={pathname === '/members' ? 'active-link' : ''}>
                <Link href="/members">{t('members')}</Link>
              </li>
            </ul>
          </nav>

          <div className="sdc-actions">
            <button
              className="sdc-icon-btn"
              onClick={toggleTheme}
              aria-label={
                lang === 'en'
                  ? isDarkMode
                    ? 'Switch to light mode'
                    : 'Switch to dark mode'
                  : isDarkMode
                    ? 'التبديل إلى الوضع الفاتح'
                    : 'التبديل إلى الوضع الداكن'
              }
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="sdc-icon-btn"
              onClick={toggleLanguage}
              disabled={isSwitching}
              aria-busy={isSwitching}
              style={isSwitching ? { opacity: 0.6, cursor: 'progress' } : undefined}
            >
              {isSwitching ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Globe size={18} />
              )}
              <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="sdc-btn-primary">
                  <LayoutDashboard size={18} />
                  <span>{lang === 'en' ? 'Dashboard' : 'لوحة التحكم'}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="sdc-icon-btn"
                  aria-label={lang === 'en' ? 'Logout' : 'تسجيل الخروج'}
                  title={lang === 'en' ? 'Logout' : 'تسجيل الخروج'}
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="sdc-btn-secondary">
                  <LogIn size={18} />
                  <span>{lang === 'en' ? 'Login' : 'تسجيل الدخول'}</span>
                </Link>
                <button type="button" onClick={handleJoinClick} className="sdc-btn-primary">
                  <User size={18} />
                  <span>{lang === 'en' ? 'Join us' : 'انضم إلينا'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
