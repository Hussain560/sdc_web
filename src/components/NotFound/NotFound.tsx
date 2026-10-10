'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { LinkButton } from '@/components/ui/Button';
import { TextLink } from '@/components/ui/TextLink';
import { useLanguage } from '@/context/LanguageContext';

const COPY = {
  ar: {
    title: 'لم نجد هذه الصفحة',
    lede: 'ربما نُقلت أو لم تعد متاحة.',
    home: 'العودة إلى الرئيسية',
    events: 'تصفّح الفعاليات',
  },
  en: {
    title: "We couldn't find this page",
    lede: 'It may have moved or is no longer available.',
    home: 'Back to home',
    events: 'Browse events',
  },
} as const;

/**
 * The 404 (11-privacy-and-not-found §2): the same page for unknown, unpublished and hidden things, so it never
 * reveals what exists. The motif is CSS and a numeral, no image files.
 */
export default function NotFound() {
  const { lang } = useLanguage();
  const t = COPY[lang];
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;
  return (
    <>
      <SiteHeader />
      <main
        id="main"
        className="mx-auto flex min-h-[60vh] w-full max-w-(--container-narrow) flex-col items-center justify-center gap-5 px-4 py-16 text-center"
      >
        <p
          aria-hidden="true"
          className="sdc-404-number t-display motif-dots rounded-shape-2xl px-10 py-6 text-signal tabular-nums"
        >
          404
        </p>
        <h1 className="t-h1">{t.title}</h1>
        <p className="t-lede text-muted">{t.lede}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <LinkButton href="/" size="lg">
            {t.home}
          </LinkButton>
          <TextLink href="/events" variant="standalone" className="min-h-11">
            {t.events}
            <Arrow aria-hidden="true" className="size-4" />
          </TextLink>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
