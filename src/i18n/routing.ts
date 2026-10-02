import { defineRouting } from 'next-intl/routing';

/**
 * ADR-010: the locale lives in the URL. Arabic (default) keeps its existing unprefixed URLs
 * (/events); English lives under /en (/en/events). No browser-language auto-redirect —
 * Arabic stays the default until the visitor switches (the choice is remembered in a cookie).
 */
export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  localePrefix: 'as-needed',
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

export const localeDirection = (locale: string): 'rtl' | 'ltr' => (locale === 'ar' ? 'rtl' : 'ltr');
