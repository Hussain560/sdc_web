import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Card, CardLink } from '@/components/ui/Card';
import { TagChip } from '@/components/ui/TagChip';
import { formatDate } from '@/lib/format';
import { articleTitle, type PublicArticleCard } from '../types';

type Lang = 'ar' | 'en';

const TEXT = {
  ar: { min: (n: number) => `${n} دقائق قراءة` },
  en: { min: (n: number) => `${n} min read` },
} as const;

const excerptOf = (a: PublicArticleCard, lang: Lang) =>
  (lang === 'en' ? a.excerptEn : null) || a.excerptAr || '';

/**
 * Article list card (components §3.1 `list`): the topic, a title that is the card's one link, a two-line excerpt
 * and the date with the reading time. No cover is stored for articles yet, so every article uses this shape.
 */
export function ArticleCard({ article, lang }: { article: PublicArticleCard; lang: Lang }) {
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;
  const tag = article.tags[0];
  const excerpt = excerptOf(article, lang);
  return (
    <Card variant="surface" interactive className="flex flex-col gap-3">
      {tag && (
        <TagChip className="w-fit">
          {lang === 'en' && tag.labelEn ? tag.labelEn : tag.labelAr}
        </TagChip>
      )}
      <h3 className="t-h4 line-clamp-2">
        <CardLink href={`/articles/${article.slug}`}>{articleTitle(article, lang)}</CardLink>
      </h3>
      {excerpt && <p className="t-body-sm line-clamp-2 text-muted">{excerpt}</p>}
      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="t-caption text-muted">
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt, lang)}</time>
          <span aria-hidden="true"> · </span>
          <span className="tabular-nums">{TEXT[lang].min(article.readingMinutes)}</span>
        </p>
        <Arrow aria-hidden="true" className="size-5 shrink-0 text-accent-text" />
      </div>
    </Card>
  );
}
