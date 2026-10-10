import { ArticlesListView } from '@/modules/articles/components/public/ArticlesListView';
import { listPublicArticles } from '@/modules/articles/public';

type SP = { q?: string; tag?: string; page?: string };

/** /articles: search and the topic filter live in the URL and render on the server. */
export default async function AllArticlesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SP>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const all = await listPublicArticles();
  return (
    <ArticlesListView
      lang={locale === 'en' ? 'en' : 'ar'}
      all={all}
      query={{
        q: (sp.q ?? '').slice(0, 80),
        tag: (sp.tag ?? '').slice(0, 80),
        page: Math.min(Math.max(Number(sp.page) || 1, 1), 40),
      }}
    />
  );
}
