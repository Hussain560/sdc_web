import { notFound, permanentRedirect } from 'next/navigation';
import ArticleDetailView from '@/modules/articles/components/public/ArticleDetailView';
import { getPublicArticle, slugForLegacyArticleId } from '@/modules/articles/public';

export const revalidate = 60;

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  // Old numeric URLs (/articles/3) answer 301 to the readable slug, keeping bookmarks and shared links alive.
  if (/^\d+$/.test(slug)) {
    const target = await slugForLegacyArticleId(Number(slug));
    if (target) permanentRedirect(`${locale === 'en' ? '/en' : ''}/articles/${target}`);
    notFound();
  }

  const article = await getPublicArticle(slug);
  if (!article) notFound();
  return <ArticleDetailView article={article} />;
}
