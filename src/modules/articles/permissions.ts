import { can } from '@/lib/auth/permissions';
import type { AccessContext } from '@/modules/access/types';
import type { ArticleStatus } from './types';

export type ArticlePerms = {
  edit: boolean;
  submit: boolean;
  publish: boolean;
  remove: boolean;
};

/**
 * What the UI offers for one article. Display only: transition_article() / save_article() re-check everything
 * in the database (Q-006 proposal: authors write, committee head/deputy and the leader publish).
 */
export function articlePerms(
  access: AccessContext | null,
  article: { committeeId: string | null; createdBy: string | null; status: ArticleStatus },
): ArticlePerms {
  if (!access) return { edit: false, submit: false, publish: false, remove: false };
  const committee = article.committeeId ?? undefined;
  const owns = article.createdBy === access.userId && can(access, 'articles.create', committee);
  const editor = can(access, 'articles.edit', committee);
  const publish = can(access, 'articles.publish', committee);
  const author = owns || editor;
  const open = article.status === 'draft' || article.status === 'changes_requested';
  return {
    edit: (open && author) || (article.status === 'published' && publish),
    submit: open && author,
    publish,
    remove: open && author,
  };
}
