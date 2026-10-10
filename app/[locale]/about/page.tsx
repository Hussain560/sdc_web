import { AboutView } from '@/modules/about/AboutView';
import { getAboutData } from '@/modules/about/data';

export const revalidate = 60;

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <AboutView lang={locale === 'en' ? 'en' : 'ar'} data={await getAboutData()} />;
}
