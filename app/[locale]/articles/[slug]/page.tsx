import { notFound, permanentRedirect } from 'next/navigation';
import ArticleDetailView from '@/modules/articles/components/public/ArticleDetailView';
import {
  getPublicArticle,
  listPublicArticles,
  slugForLegacyArticleId,
} from '@/modules/articles/public';

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
  // Related: other articles that share a tag (up to three).
  const tags = new Set(article.tags.map((t) => t.slug));
  const related = (await listPublicArticles())
    .filter((a) => a.slug !== slug && a.tags.some((t) => tags.has(t.slug)))
    .slice(0, 3);
  return (
    <ArticleDetailView article={article} related={related} lang={locale === 'en' ? 'en' : 'ar'} />
  );
}
