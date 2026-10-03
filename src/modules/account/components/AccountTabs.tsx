'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/components/ui';

const tabs = [
  { href: '/account', ar: 'نظرة عامة', en: 'Overview' },
  { href: '/account/profile', ar: 'ملفي الشخصي', en: 'My profile' },
  { href: '/account/roles', ar: 'مناصبي', en: 'My positions' },
  { href: '/account/security', ar: 'الأمان', en: 'Security' },
  { href: '/account/privacy', ar: 'بياناتي', en: 'My data' },
] as const;

export function AccountTabs() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  return (
    <nav aria-label={lang === 'ar' ? 'قائمة الحساب' : 'Account menu'} className="mb-8 flex gap-2">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              active
                ? 'border-line-accent bg-surface-raised text-accent'
                : 'border-line text-muted hover:text-text',
            )}
          >
            {lang === 'ar' ? tab.ar : tab.en}
          </Link>
        );
      })}
    </nav>
  );
}
