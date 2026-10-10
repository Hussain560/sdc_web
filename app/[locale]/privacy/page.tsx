import type { Metadata } from 'next';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';
import { Alert } from '@/components/ui/Alert';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { getPublicSettings } from '@/lib/site-settings';
import { PRIVACY_TEXT, PRIVACY_VERSION } from '@/modules/privacy/content';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === 'en' ? 'Privacy notice' : 'سياسة الخصوصية' };
}

const COPY = {
  ar: {
    home: 'الرئيسية',
    title: 'سياسة الخصوصية',
    breadcrumb: 'مسار التنقل',
    version: `النسخة ${PRIVACY_VERSION}`,
    review: 'هذه النسخة بانتظار المراجعة القانونية.',
    soon: 'سيُعلن بريد التواصل قريباً.',
    write: 'راسلنا على:',
  },
  en: {
    home: 'Home',
    title: 'Privacy notice',
    breadcrumb: 'Breadcrumb',
    version: `Version ${PRIVACY_VERSION}`,
    review: 'This version is awaiting legal review.',
    soon: 'The contact e-mail will be announced soon.',
    write: 'Write to us at:',
  },
} as const;

// SEC-003 (PUBLIC 12 §4): the privacy notice, linked from the footer and from every form that collects personal data.
// The legal wording is the owner's (hard rule 10); the review banner stays while Q-031 is open.
export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const t = COPY[lang];
  const settings = await getPublicSettings();
  const contact = settings.contactEmail ? `${t.write} ${settings.contactEmail}` : t.soon;
  const source = PRIVACY_TEXT[lang]
    .replace('{{contact}}', contact)
    .replace('{{version}}', PRIVACY_VERSION);

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-(--container-reading) px-4 pb-8">
        <div className="pt-6">
          <Breadcrumb
            label={t.breadcrumb}
            items={[{ label: t.home, href: '/' }, { label: t.title }]}
          />
        </div>
        <header className="mt-6 flex flex-col gap-2">
          <h1 className="t-h1">{t.title}</h1>
          <p className="t-caption text-muted">{t.version}</p>
        </header>
        <Alert tone="info" className="mt-6">
          {t.review}
        </Alert>
        <article className="mt-8">
          <MarkdownRenderer source={source} className="t-body" />
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
