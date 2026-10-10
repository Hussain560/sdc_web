import type { PublicSettings } from '@/lib/site-settings-defaults';

/** Strings of the public chrome in both languages (design: PUBLIC-SCREENS-V2/00-chrome.md). */
export const CHROME = {
  ar: {
    skip: 'تخطَّ إلى المحتوى',
    logoHome: 'المجتمع السعودي للمطورين — الرئيسية',
    logoAlt: 'المجتمع السعودي للمطورين',
    mainNav: 'التنقل الرئيسي',
    home: 'الرئيسية',
    events: 'الفعاليات',
    articles: 'المقالات',
    members: 'الأعضاء',
    committees: 'اللجان',
    about: 'من نحن',
    join: 'انضم إلينا',
    memberSignIn: 'دخول الأعضاء',
    menu: 'القائمة',
    closeMenu: 'إغلاق القائمة',
    langSwitch: 'English',
    toLight: 'التبديل إلى الوضع الفاتح',
    toDark: 'التبديل إلى الوضع الداكن',
    lightMode: 'الوضع الفاتح',
    account: 'حسابي',
    accountMenu: 'قائمة الحساب',
    dashboard: 'لوحة التحكم',
    signOut: 'تسجيل الخروج',
    tagline: 'مجتمع سعودي يجمع المطورين ويبني المهارات.',
    colCommunity: 'المجتمع',
    colEvents: 'الفعاليات',
    colContact: 'تواصل',
    upcoming: 'الفعاليات القادمة',
    past: 'الفعاليات السابقة',
    verifyCertificate: 'التحقق من شهادة',
    privacy: 'سياسة الخصوصية',
    rights: 'جميع الحقوق محفوظة للمجتمع السعودي للمطورين',
    social: 'حسابات التواصل',
    newTab: '(يفتح في نافذة جديدة)',
  },
  en: {
    skip: 'Skip to content',
    logoHome: 'Saudi Developer Community — home',
    logoAlt: 'Saudi Developer Community',
    mainNav: 'Main',
    home: 'Home',
    events: 'Events',
    articles: 'Articles',
    members: 'Members',
    committees: 'Committees',
    about: 'About',
    join: 'Join us',
    memberSignIn: 'Member sign-in',
    menu: 'Menu',
    closeMenu: 'Close menu',
    langSwitch: 'العربية',
    toLight: 'Switch to light mode',
    toDark: 'Switch to dark mode',
    lightMode: 'Light mode',
    account: 'My account',
    accountMenu: 'Account menu',
    dashboard: 'Dashboard',
    signOut: 'Sign out',
    tagline: 'A Saudi community that brings developers together and builds skills.',
    colCommunity: 'Community',
    colEvents: 'Events',
    colContact: 'Contact',
    upcoming: 'Upcoming events',
    past: 'Past events',
    verifyCertificate: 'Verify a certificate',
    privacy: 'Privacy notice',
    rights: 'All rights reserved to the Saudi Developer Community',
    social: 'Social accounts',
    newTab: '(opens in a new tab)',
  },
} as const;

export type ChromeStrings = (typeof CHROME)[keyof typeof CHROME];

/** The main navigation (routes live under the locale prefix through @/i18n/navigation). */
export const NAV_ITEMS = [
  { key: 'home', href: '/' },
  { key: 'events', href: '/events' },
  { key: 'articles', href: '/articles' },
  { key: 'members', href: '/members' },
  { key: 'committees', href: '/committees' },
  { key: 'about', href: '/about' },
] as const satisfies ReadonlyArray<{ key: keyof ChromeStrings; href: string }>;

/**
 * A social link counts only when it is a real URL. The seed value `https://instagram.com` is a placeholder and is
 * treated as missing, as is an empty string (Q-H7 in the open questions).
 */
export function realSocialUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    if (u.pathname === '/' && !u.search && !u.hash) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export type SocialLink = { key: 'x' | 'linkedin' | 'instagram'; label: string; href: string };

export function socialLinks(settings: PublicSettings): SocialLink[] {
  const all: Array<{ key: SocialLink['key']; label: string; href: string | null }> = [
    { key: 'x', label: 'X', href: realSocialUrl(settings.socialX) },
    { key: 'linkedin', label: 'LinkedIn', href: realSocialUrl(settings.socialLinkedin) },
    { key: 'instagram', label: 'Instagram', href: realSocialUrl(settings.socialInstagram) },
  ];
  return all.flatMap((l) => (l.href ? [{ ...l, href: l.href }] : []));
}

/** Active state for a nav item: exact for the home page, prefix for the rest. */
export function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
