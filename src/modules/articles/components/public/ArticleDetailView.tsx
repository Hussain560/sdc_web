import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';
import { SectionHeader } from '@/components/patterns/SectionHeader';
import { Alert } from '@/components/ui/Alert';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { TagChip } from '@/components/ui/TagChip';
import { TextLink } from '@/components/ui/TextLink';
import { ArticleCard } from '../ArticleCard';
import {
  articleDate,
  articleTitle,
  authorsLabel,
  readingLabel,
  tagLabel,
  type PublicArticle,
  type PublicArticleCard,
} from '../../types';

type Lang = 'ar' | 'en';

const COPY = {
  ar: { home: 'الرئيسية', articles: 'المقالات', breadcrumb: 'مسار التنقل', arabicOnly: 'هذه المقالة متاحة بالعربية فقط', related: 'مقالات ذات صلة', newTab: '(يفتح في نافذة جديدة)' },
  en: { home: 'Home', articles: 'Articles', breadcrumb: 'Breadcrumb', arabicOnly: 'This article is available in Arabic only', related: 'Related articles', newTab: '(opens in a new tab)' },
} as const;

/** The reading page (07-articles §2): one comfortable column, with the Arabic-only fallback marked and isolated. */
export default function ArticleDetailView({
  article,
  related,
  lang,
}: {
  article: PublicArticle;
  related: PublicArticleCard[];
  lang: Lang;
}) {
  const t = COPY[lang];
  const english = lang === 'en';
  // English readers get the Arabic body when no English one exists (edge case 3), marked as such.
  const arabicOnly = english && !article.bodyEn?.trim();
  const body = english && !arabicOnly ? article.bodyEn! : article.bodyAr;
  const title = articleTitle(article, lang);
  const wrap = 'mx-auto w-full max-w-(--container) px-4 md:px-8';

  return (
    <>
      <SiteHeader />
      <main id="main" className="pb-4">
        <div className={`${wrap} pt-6`}>
          <Breadcrumb
            label={t.breadcrumb}
            items={[{ label: t.home, href: '/' }, { label: t.articles, href: '/articles' }, { label: title }]}
          />
        </div>

        <article className="mx-auto mt-8 w-full max-w-(--container-reading) px-4">
          <header className="flex flex-col gap-4">
            {article.tags.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <li key={tag.slug}>
                    <TagChip>{tagLabel(tag, lang)}</TagChip>
                  </li>
                ))}
              </ul>
            )}
            <h1 className="t-h1 max-w-[24ch]">{title}</h1>
            <p className="t-body-sm text-muted">
              {authorsLabel(article.authors, lang)}
              <span aria-hidden="true"> · </span>
              <time dateTime={article.publishedAt}>{articleDate(article.publishedAt, lang)}</time>
              <span aria-hidden="true"> · </span>
              {readingLabel(article.readingMinutes, lang)}
            </p>
          </header>

          {arabicOnly && (
            <Alert tone="info" className="mt-6">
              {t.arabicOnly}
            </Alert>
          )}
          <div className="mt-8" {...(arabicOnly ? { lang: 'ar', dir: 'rtl' } : {})}>
            <MarkdownRenderer source={body} className="t-body" />
          </div>

          {article.resourceUrl && (
            <p className="mt-8">
              <TextLink href={article.resourceUrl} external externalLabel={t.newTab} variant="standalone" className="min-h-11">
                {(english ? article.resourceLabelEn : null) || article.resourceLabelAr || article.resourceUrl}
              </TextLink>
            </p>
          )}
        </article>

        {related.length > 0 && (
          <section aria-labelledby="a-related" className={`${wrap} mt-(--section-gap)`}>
            <SectionHeader headingId="a-related" title={t.related} />
            <ul className="grid gap-4 md:grid-cols-3">
              {related.map((a) => (
                <li key={a.id}>
                  <ArticleCard article={a} lang={lang} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
