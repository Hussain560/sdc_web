import { FileText } from 'lucide-react';
import { Avatar, Badge, EmptyState, Pagination, Tabs, type TabItem } from '@/components/ui';
import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { Link } from '@/i18n/navigation';
import { can, canAny } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { formatDate, formatRelative } from '@/lib/format';
import { pageMeta, parsePage } from '@/lib/pagination';
import { listCommittees } from '@/modules/access/admin-queries';
import { getAccess } from '@/modules/access/queries';
import { getArticleCounts, listArticles } from '@/modules/articles/queries';
import {
  ARTICLE_STATUSES,
  ARTICLE_STATUS_LABEL as STATUS_LABEL,
  readingLabel,
  type ArticleStatus,
} from '@/modules/articles/types';

type Search = { status?: string; committee?: string; q?: string; page?: string; size?: string };

// ART-002 (screen 21): drafts, review queue, published and archived threads. RLS limits the rows to what the
// caller wrote or may edit/review; the database is the authority, this screen only shows the result.
export default async function ArticlesListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Search>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  await requireUser('/dashboard/articles');
  const access = await getAccess();
  if (!access || !canAny(access, ['articles.create', 'articles.edit', 'articles.publish']))
    return <Forbidden />;

  const sp = await searchParams;
  const status = (ARTICLE_STATUSES as readonly string[]).includes(sp.status ?? '')
    ? sp.status
    : undefined;
  const request = parsePage(sp);

  const [{ rows, total }, counts, committees] = await Promise.all([
    listArticles({ status, committeeId: sp.committee, q: sp.q }, request),
    getArticleCounts(),
    listCommittees(),
  ]);
  const meta = pageMeta(total, request);
  const allCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const canCreate = can(access, 'articles.create');
  const canPublish = can(access, 'articles.publish');

  const keep = (extra: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ committee: sp.committee, q: sp.q, ...extra }))
      if (v) q.set(k, v);
    const s = q.toString();
    return s ? `?${s}` : '?';
  };

  const tabs: TabItem[] = [
    ...(canPublish
      ? [
          {
            key: 'in_review',
            label: STATUS_LABEL.in_review[lang],
            href: keep({ status: 'in_review' }),
            count: counts.in_review ?? 0,
            tone: 'warning' as const,
          },
        ]
      : []),
    { key: 'all', label: ar ? 'الكل' : 'All', href: keep({}), count: allCount },
    ...ARTICLE_STATUSES.filter((s) => !(canPublish && s === 'in_review')).map((s) => ({
      key: s,
      label: STATUS_LABEL[s][lang],
      href: keep({ status: s }),
      count: counts[s] ?? 0,
    })),
  ];
  const filtersActive = Boolean(sp.q || sp.committee);

  return (
    <>
      <PageHeader
        title={ar ? 'الثريدات' : 'Threads'}
        description={
          ar
            ? 'اكتب مقالات اللجان وراجعها وانشرها.'
            : 'Write, review and publish committee articles.'
        }
        readOnly={!canCreate}
        readOnlyLabel={ar ? 'عرض فقط' : 'View only'}
        action={
          canCreate ? (
            <Link
              href="/dashboard/articles/new"
              className="inline-flex min-h-10 items-center rounded-full bg-accent px-5 text-sm font-semibold text-on-accent hover:bg-accent-hover"
            >
              {ar ? '+ ثريد جديد' : '+ New thread'}
            </Link>
          ) : undefined
        }
      />

      <Tabs items={tabs} active={status ?? 'all'} label={ar ? 'حالة المقال' : 'Article status'} />

      <form method="get" className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {status && <input type="hidden" name="status" value={status} />}
        <label className="flex items-center gap-2 text-xs text-muted">
          {ar ? 'بحث' : 'Search'}
          <input
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder={ar ? 'العنوان…' : 'Title…'}
            className="h-9 w-56 rounded-lg border border-line bg-surface px-3 text-sm text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-focus-ring"
          />
        </label>
        {committees.length > 1 && (
          <label className="flex items-center gap-2 text-xs text-muted">
            {ar ? 'اللجنة' : 'Committee'}
            <select
              name="committee"
              defaultValue={sp.committee ?? ''}
              className="h-9 rounded-lg border border-line bg-surface px-3 text-sm text-text focus-visible:outline-2 focus-visible:outline-focus-ring"
            >
              <option value="">{ar ? 'الكل' : 'All'}</option>
              {committees.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name[lang]}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-full border border-line-accent px-4 text-sm font-semibold text-accent hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-focus-ring"
        >
          {ar ? 'تطبيق' : 'Apply'}
        </button>
        {filtersActive && (
          <Link
            href={status ? `?status=${status}` : '?'}
            className="inline-flex h-9 items-center text-sm text-muted hover:text-text"
          >
            {ar ? 'مسح التصفية' : 'Reset filters'}
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={<FileText size={36} aria-hidden="true" />}
          title={
            filtersActive || status
              ? ar
                ? 'لا توجد ثريدات مطابقة'
                : 'No matching threads'
              : ar
                ? 'لا توجد ثريدات بعد'
                : 'No threads yet'
          }
          description={
            canCreate && !filtersActive
              ? ar
                ? 'ابدأ بكتابة أول ثريد للجنتك.'
                : 'Start by writing your committee’s first thread.'
              : undefined
          }
          action={
            canCreate && !filtersActive ? (
              <Link
                href="/dashboard/articles/new"
                className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-on-accent"
              >
                {ar ? '+ ثريد جديد' : '+ New thread'}
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-line bg-surface-raised text-xs text-muted">
              <tr>
                {[
                  ar ? 'العنوان' : 'Title',
                  ar ? 'الكتّاب' : 'Authors',
                  ar ? 'اللجنة' : 'Committee',
                  ar ? 'الحالة' : 'Status',
                  ar ? 'التاريخ' : 'Date',
                  '',
                ].map((h, i) => (
                  <th key={i} scope="col" className="px-4 py-2.5 text-start text-xs font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const st = STATUS_LABEL[a.status as ArticleStatus];
                const title = ar ? a.titleAr : a.titleEn || a.titleAr;
                const other = ar ? a.titleEn : a.titleAr;
                const authors = (ar ? a.authorsAr : a.authorsEn).join(' – ');
                return (
                  <tr
                    key={a.id}
                    className="border-b border-line align-middle transition-colors last:border-0 hover:bg-surface-raised"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/articles/${a.id}`}
                        className="font-medium hover:text-accent"
                      >
                        {title}
                      </Link>
                      {other && other !== title && (
                        <div
                          dir={ar ? 'ltr' : 'rtl'}
                          className="text-xs text-muted"
                          style={{ textAlign: 'start' }}
                        >
                          {other}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-muted">
                        {readingLabel(a.readingMinutes, lang)}
                        {' · '}
                        {ar ? `${a.tagCount} وسوم` : `${a.tagCount} tags`}
                      </div>
                      {a.status === 'changes_requested' && a.reviewNote && (
                        <p
                          className="mt-1 max-w-md truncate text-xs text-danger"
                          title={a.reviewNote}
                        >
                          ↳ {a.reviewNote}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={(ar ? a.authorsAr : a.authorsEn)[0] ?? '?'} />
                        <span className="max-w-48 truncate">{authors || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{a.committeeName?.[lang] ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={st.tone}>{st[lang]}</Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted">
                      {a.publishedAt
                        ? formatDate(a.publishedAt, lang)
                        : formatRelative(a.updatedAt, lang)}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Link
                        href={`/dashboard/articles/${a.id}`}
                        className="text-sm text-accent underline"
                      >
                        {ar ? 'فتح' : 'Open'}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination meta={meta} searchParams={sp} lang={lang} />
    </>
  );
}
