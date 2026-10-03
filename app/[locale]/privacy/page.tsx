import type { Metadata } from 'next';
import Footer from '@/components/Footer/Footer';
import Header from '@/components/Header/Header';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';
import { Link } from '@/i18n/navigation';
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

// SEC-003 (PUBLIC 12 §4): the privacy notice, linked from the footer and from every form that collects personal data.
export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  const settings = await getPublicSettings();
  const contact = settings.contactEmail
    ? ar
      ? `راسلنا على: ${settings.contactEmail}`
      : `Write to us at: ${settings.contactEmail}`
    : ar
      ? 'سيُعلن بريد التواصل قريبًا.'
      : 'The contact e-mail will be announced soon.';
  const source = PRIVACY_TEXT[lang]
    .replace('{{contact}}', contact)
    .replace('{{version}}', PRIVACY_VERSION);

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-text">
      <Header />
      <main className="flex-1">
        <section className="border-b border-line bg-surface-raised">
          <div className="mx-auto max-w-5xl px-4 py-10">
            <nav
              className="mb-4 flex items-center gap-2 text-sm text-muted"
              aria-label="breadcrumb"
            >
              <Link href="/" className="hover:text-text">
                {ar ? 'الرئيسية' : 'Home'}
              </Link>
              <span aria-hidden="true">&gt;</span>
              <span className="text-accent">{ar ? 'سياسة الخصوصية' : 'Privacy notice'}</span>
            </nav>
            <h1 className="text-3xl font-extrabold">{ar ? 'سياسة الخصوصية' : 'Privacy notice'}</h1>
          </div>
        </section>
        <div className="mx-auto max-w-[720px] px-4 py-10">
          <article className="rounded-2xl border border-line border-t-2 border-t-accent bg-surface p-6 sm:p-8">
            <MarkdownRenderer source={source} />
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
