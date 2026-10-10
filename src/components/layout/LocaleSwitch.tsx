'use client';

import { Globe, LoaderCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/components/ui/cn';
import { CHROME } from './chrome-strings';

/** Text button (not a flag) that opens the same page in the other language (components §4.4). */
export function LocaleSwitch({ className }: { className?: string }) {
  const { lang, toggleLanguage, isSwitching } = useLanguage();
  const other = lang === 'ar' ? 'en' : 'ar';
  return (
    <button
      type="button"
      onClick={toggleLanguage}
      disabled={isSwitching}
      aria-busy={isSwitching || undefined}
      lang={other}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-full px-3 t-label text-muted',
        'transition-colors duration-(--duration-fast) hover:bg-surface-raised hover:text-text',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
        'disabled:cursor-progress disabled:opacity-60',
        className,
      )}
    >
      {isSwitching ? (
        <LoaderCircle
          aria-hidden="true"
          className="size-5 animate-spin motion-reduce:animate-none"
        />
      ) : (
        <Globe aria-hidden="true" className="size-5" />
      )}
      {CHROME[lang].langSwitch}
    </button>
  );
}
