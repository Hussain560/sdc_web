import { Forbidden } from '@/components/layout/Forbidden';
import { can, committeesWith } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { listCommittees } from '@/modules/access/admin-queries';
import { getAccess } from '@/modules/access/queries';
import { ArticleEditor } from '@/modules/articles/components/ArticleEditor';
import { articlePerms } from '@/modules/articles/permissions';
import { listTags } from '@/modules/articles/queries';
import { EMPTY_ARTICLE } from '@/modules/articles/types';

export default async function NewArticlePage() {
  const user = await requireUser('/dashboard/articles/new');
  const access = await getAccess();
  if (!access || !can(access, 'articles.create')) return <Forbidden />;

  // Only committees where the user may write (all active ones for global holders).
  const scope = committeesWith(access, 'articles.create');
  const committees = (await listCommittees())
    .filter((c) => c.status === 'active' && (scope === 'all' || scope.includes(c.id)))
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <ArticleEditor
      articleId={null}
      initial={{
        ...EMPTY_ARTICLE,
        committeeId: committees.length === 1 ? committees[0]!.id : '',
        authors: [{ userId: user.id, label: access.displayName }],
      }}
      initialUpdatedAt={null}
      status="draft"
      reviewNote={null}
      submittedAt={null}
      publishedAt={null}
      committees={committees}
      tagSuggestions={await listTags()}
      perms={articlePerms(access, { committeeId: null, createdBy: user.id, status: 'draft' })}
      me={{ id: user.id, name: access.displayName }}
    />
  );
}
