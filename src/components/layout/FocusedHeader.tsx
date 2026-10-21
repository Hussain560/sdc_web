'use client';

import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { LocaleSwitch } from './LocaleSwitch';
import { LogoWordmark } from './Logo';
import { ThemeSwitch } from './ThemeSwitch';

/**
 * The slim bar of a focused public screen (tracking, activation, notices, verification): the wordmark, the screen's
 * name, and the language and theme switches. No site navigation, so nothing pulls the person away from the task.
 */
export function FocusedHeader({ title, trailing }: { title?: string; trailing?: ReactNode }) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  return (
    <header className="border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3 md:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" aria-label={ar ? 'الصفحة الرئيسية' : 'Home page'} className="shrink-0">
            <LogoWordmark alt={ar ? 'المجتمع السعودي للمطورين' : 'Saudi Developer Community'} />
          </Link>
          {title && <p className="hidden min-w-0 truncate font-bold sm:block">{title}</p>}
        </div>
        <div className="flex items-center gap-1">
          {trailing}
          <LocaleSwitch />
          <ThemeSwitch />
        </div>
      </div>
    </header>
  );
}
