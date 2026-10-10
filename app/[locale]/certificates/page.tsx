import type { Metadata } from 'next';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = { robots: { index: false, follow: false } };

const COPY = {
  ar: {
    title: 'التحقق من شهادة',
    lede: 'اكتب رقم الشهادة المطبوع عليها أو المرسل في الرسالة.',
    label: 'رقم الشهادة',
    submit: 'تحقق',
  },
  en: {
    title: 'Verify a certificate',
    lede: 'Enter the certificate number printed on it or sent in the e-mail.',
    label: 'Certificate number',
    submit: 'Verify',
  },
} as const;

/** /certificates: a plain GET form that opens /certificates/<id> (works without JavaScript). */
export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = COPY[locale === 'en' ? 'en' : 'ar'];
  const prefix = locale === 'en' ? '/en' : '';
  return (
    <>
      <SiteHeader />
      <main
        id="main"
        className="mx-auto flex w-full max-w-(--container-tight) flex-col gap-5 px-4 py-12"
      >
        <h1 className="t-h1">{t.title}</h1>
        <p className="t-lede text-muted">{t.lede}</p>
        {/* A tiny script-free redirect: the form posts the id as a query and /certificates/verify forwards it. */}
        <form method="get" action={`${prefix}/certificates/verify`} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="t-label">{t.label}</span>
            <input
              name="id"
              required
              dir="ltr"
              pattern="[0-9a-fA-F-]{36}"
              className="min-h-12 rounded-shape-md border border-line-strong bg-field px-4 text-base text-text focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            />
          </label>
          <Button type="submit" size="lg">
            {t.submit}
          </Button>
        </form>
      </main>
      <SiteFooter />
    </>
  );
}
