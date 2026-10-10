import { Search, X } from 'lucide-react';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button, LinkButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Link } from '@/i18n/navigation';
import { ArticleCard } from '../ArticleCard';
import { tagLabel, type PublicArticleCard } from '../../types';

type Lang = 'ar' | 'en';
export const ARTICLES_PAGE_SIZE = 12;

const COPY = {
  ar: {
    home: 'الرئيسية',
    title: 'المقالات',
    lede: 'خلاصات وتجارب يكتبها أعضاء المجتمع.',
    breadcrumb: 'مسار التنقل',
    search: 'ابحث في المقالات',
    searchBtn: 'بحث',
    all: 'الكل',
    topics: 'المواضيع',
    more: 'عرض المزيد',
    count: (n: number) => `${n} مقالة`,
    empty: 'لم تُنشر مقالات بعد',
    noResults: 'لا مقالات تطابق بحثك',
    noResultsBody: 'جرّب كلمات أقل أو اختر موضوعاً آخر.',
    clear: 'مسح البحث',
  },
  en: {
    home: 'Home',
    title: 'Articles',
    lede: 'Summaries and experiences written by community members.',
    breadcrumb: 'Breadcrumb',
    search: 'Search articles',
    searchBtn: 'Search',
    all: 'All',
    topics: 'Topics',
    more: 'Load more',
    count: (n: number) => `${n} articles`,
    empty: 'No articles have been published yet',
    noResults: 'No articles match your search',
    noResultsBody: 'Try fewer words or pick another topic.',
    clear: 'Clear search',
  },
} as const;

export type ArticlesQuery = { q: string; tag: string; page: number };

function hrefWith(base: ArticlesQuery, change: Partial<ArticlesQuery>) {
  const n = { ...base, ...change };
  const sp = new URLSearchParams();
  if (n.q) sp.set('q', n.q);
  if (n.tag) sp.set('tag', n.tag);
  if (n.page > 1) sp.set('page', String(n.page));
  const qs = sp.toString();
  return qs ? `/articles?${qs}` : '/articles';
}

/** Search by title or excerpt (both languages) and by one tag; newest first as the data layer ranks them. */
export function filterArticles(all: PublicArticleCard[], query: ArticlesQuery) {
  const q = query.q.normalize('NFKD').toLowerCase().trim();
  const rows = all.filter((a) => {
    if (query.tag && !a.tags.some((t) => t.slug === query.tag)) return false;
    if (!q) return true;
    return `${a.titleAr} ${a.titleEn ?? ''} ${a.excerptAr ?? ''} ${a.excerptEn ?? ''}`
      .normalize('NFKD')
      .toLowerCase()
      .includes(q);
  });
  return { total: rows.length, items: rows.slice(0, ARTICLES_PAGE_SIZE * Math.max(1, query.page)) };
}

/** Articles list (PUBLIC-SCREENS-V2/07-articles.md §1): search, topic chips, a card grid, load more. */
export function ArticlesListView({
  lang,
  all,
  query,
}: {
  lang: Lang;
  all: PublicArticleCard[];
  query: ArticlesQuery;
}) {
  const t = COPY[lang];
  const { total, items } = filterArticles(all, query);
  const tags = new Map<string, string>();
  for (const a of all) for (const tg of a.tags) tags.set(tg.slug, tagLabel(tg, lang));
  const wrap = 'mx-auto w-full max-w-(--container) px-4 md:px-8';
  const filtered = !!(query.q || query.tag);
  const chip = (active: boolean) =>
    `inline-flex min-h-9 shrink-0 items-center rounded-full px-4 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
      active ? 'bg-accent-soft text-on-accent-soft' : 'border border-line-strong text-text hover:bg-surface-raised'
    }`;

  return (
    <>
      <SiteHeader />
      <main id="main">
        <div className={`${wrap} pt-6`}>
          <Breadcrumb label={t.breadcrumb} items={[{ label: t.home, href: '/' }, { label: t.title }]} />
          <h1 className="t-h1 mt-6">{t.title}</h1>
          <p className="t-lede mt-2 text-muted">{t.lede}</p>
        </div>

        <section className={`${wrap} mt-10`} aria-label={t.title}>
          <form method="get" action={lang === 'en' ? '/en/articles' : '/articles'} role="search" className="flex gap-3">
            {query.tag && <input type="hidden" name="tag" value={query.tag} />}
            <label className="relative block flex-1">
              <span className="sr-only">{t.search}</span>
              <Search aria-hidden="true" className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
              <input
                type="search"
                name="q"
                defaultValue={query.q}
                placeholder={t.search}
                className="min-h-12 w-full rounded-shape-md border border-line-strong bg-field ps-12 pe-4 text-base text-text focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              />
            </label>
            <Button type="submit" size="lg">
              {t.searchBtn}
            </Button>
          </form>

          {tags.size > 0 && (
            <nav aria-label={t.topics} className="-mx-4 mt-4 overflow-x-auto px-4 md:mx-0 md:px-0">
              <ul className="flex gap-2 whitespace-nowrap">
                <li>
                  <Link href={hrefWith(query, { tag: '', page: 1 })} aria-current={!query.tag ? 'true' : undefined} className={chip(!query.tag)}>
                    {t.all}
                  </Link>
                </li>
                {[...tags.entries()].map(([slug, label]) => (
                  <li key={slug}>
                    <Link
                      href={hrefWith(query, { tag: slug, page: 1 })}
                      aria-current={query.tag === slug ? 'true' : undefined}
                      className={chip(query.tag === slug)}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {filtered && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {query.q && (
                <Link
                  href={hrefWith(query, { q: '', page: 1 })}
                  className="t-body-sm inline-flex min-h-9 items-center gap-2 rounded-full bg-accent-soft px-4 font-semibold text-on-accent-soft"
                >
                  {query.q}
                  <X aria-hidden="true" className="size-4" />
                </Link>
              )}
            </div>
          )}

          <p role="status" aria-live="polite" className="t-body-sm mt-4 tabular-nums text-muted">
            {t.count(total)}
          </p>

          {items.length > 0 ? (
            <ul className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((a) => (
                <li key={a.id}>
                  <ArticleCard article={a} lang={lang} />
                </li>
              ))}
            </ul>
          ) : filtered ? (
            <EmptyState
              variant="no-results"
              title={t.noResults}
              description={t.noResultsBody}
              action={
                <LinkButton href="/articles" variant="secondary">
                  {t.clear}
                </LinkButton>
              }
            />
          ) : (
            <EmptyState variant="no-data" title={t.empty} />
          )}

          {total > items.length && (
            <div className="mt-8 flex justify-center">
              <LinkButton href={hrefWith(query, { page: query.page + 1 })} variant="secondary" size="lg">
                {t.more}
              </LinkButton>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
