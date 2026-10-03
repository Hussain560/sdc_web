import { notFound } from 'next/navigation';
import { Forbidden } from '@/components/layout/Forbidden';
import { canAny } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { listCommittees } from '@/modules/access/admin-queries';
import { getAccess } from '@/modules/access/queries';
import { ArticleEditor } from '@/modules/articles/components/ArticleEditor';
import { articlePerms } from '@/modules/articles/permissions';
import { getArticleForEdit, listTags } from '@/modules/articles/queries';

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/dashboard/articles/${id}`);
  const access = await getAccess();
  if (!access || !canAny(access, ['articles.create', 'articles.edit', 'articles.publish']))
    return <Forbidden />;

  // Out of scope or unknown → the same 404 (no existence leak).
  const article = await getArticleForEdit(id);
  if (!article) notFound();

  const committees = (await listCommittees())
    .filter((c) => c.status === 'active' || c.id === article.committeeId)
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <ArticleEditor
      articleId={article.id}
      initial={article.form}
      initialUpdatedAt={article.updatedAt}
      status={article.status}
      reviewNote={article.reviewNote}
      submittedAt={article.submittedAt}
      publishedAt={article.publishedAt}
      committees={committees}
      tagSuggestions={await listTags()}
      perms={articlePerms(access, article)}
      me={{ id: user.id, name: access.displayName }}
    />
  );
}
