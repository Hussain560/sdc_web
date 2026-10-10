import { LanguageProvider } from '@/context/LanguageContext';
import { SearchProvider } from '@/context/SearchContext';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeProvider } from '@/context/ThemeContext';
import { SiteSettingsProvider } from '@/context/SiteSettingsContext';
import { getPublicSettings } from '@/lib/site-settings';
import '../globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';
import { IBM_Plex_Sans_Arabic, Rubik } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localeDirection, routing } from '@/i18n/routing';

// One stack, self-hosted, loaded once (RDS-002): Rubik for Latin, IBM Plex Sans Arabic for Arabic.
const rubik = Rubik({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-rubik',
});
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-plex-arabic',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      languages: { ar: '/', en: '/en' },
    },
  };
}

// يشتغل قبل أول رسم للصفحة عشان ما يصير "فلاش" لوضع خاطئ قبل ما تجهز React.
// الديفولت Dark دايمًا إلا إذا كان عندنا اختيار محفوظ للمستخدم يقول Light.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('sdc_theme');
    var theme = stored === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const settings = await getPublicSettings();

  return (
    <html
      lang={locale}
      dir={localeDirection(locale)}
      className={`${rubik.variable} ${plexArabic.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/* Sets data-theme before first paint. next/script avoids React's "script tag in component" warning. */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <NextIntlClientProvider>
          <ThemeProvider>
            <LanguageProvider locale={locale}>
              <AuthProvider>
                <SearchProvider>
                  <SiteSettingsProvider value={settings}>
                    <ToastProvider>{children}</ToastProvider>
                  </SiteSettingsProvider>
                </SearchProvider>
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
