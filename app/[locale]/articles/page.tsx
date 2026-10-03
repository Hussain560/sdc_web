import ArticlesListView from '@/modules/articles/components/public/ArticlesListView';
import { listPublicArticles } from '@/modules/articles/public';

// Public data, cookie-less read: cached and refreshed every minute (and on every publish via revalidatePath).
export const revalidate = 60;

export default async function AllArticlesPage() {
  const articles = await listPublicArticles();
  return <ArticlesListView articles={articles} />;
}
