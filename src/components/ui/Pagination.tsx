import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { DEFAULT_PAGE_SIZE, PAGE_SIZES, pageWindow, type PageMeta } from '@/lib/pagination';
import { cn } from './cn';

type Params = Record<string, string | string[] | undefined>;

/** Builds `?a=1&page=2` from the current query so filters and tabs survive paging. */
function hrefFor(params: Params, overrides: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...overrides })) {
    if (value === undefined || value === '') continue;
    for (const v of Array.isArray(value) ? value : [String(value)]) query.append(key, v);
  }
  const qs = query.toString();
  return qs ? `?${qs}` : '?';
}

/**
 * Reusable server-rendered pagination: result summary, rows-per-page links, previous/next and a page window.
 * Pass the page's current `searchParams` so other filters are preserved. Works without JavaScript.
 */
export function Pagination({
  meta,
  searchParams,
  lang,
  className,
}: {
  meta: PageMeta;
  searchParams: Params;
  lang: 'ar' | 'en';
  className?: string;
}) {
  const ar = lang === 'ar';
  const { page, size, total, totalPages, firstItem, lastItem } = meta;
  if (total === 0) return null;

  // The chevrons point along the reading direction in both languages.
  const Prev = ar ? ChevronRight : ChevronLeft;
  const Next = ar ? ChevronLeft : ChevronRight;
  const step =
    'flex size-11 items-center justify-center rounded-full text-sm focus-visible:outline-2 focus-visible:outline-focus-ring';
  const hrefPage = (p: number) => hrefFor(searchParams, { page: p === 1 ? undefined : p });

  return (
    <nav
      aria-label={ar ? 'التنقل بين الصفحات' : 'Pagination'}
      className={cn('mt-4 flex flex-wrap items-center justify-between gap-3 text-sm', className)}
    >
      <p className="text-muted" aria-live="polite">
        {ar
          ? `عرض ${firstItem}–${lastItem} من ${total}`
          : `Showing ${firstItem}–${lastItem} of ${total}`}
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <div
          className="flex items-center gap-1"
          aria-label={ar ? 'عدد الصفوف' : 'Rows per page'}
          role="group"
        >
          <span className="me-1 text-muted">{ar ? 'الصفوف' : 'Rows'}</span>
          {PAGE_SIZES.map((s) => (
            <Link
              key={s}
              href={hrefFor(searchParams, {
                size: s === DEFAULT_PAGE_SIZE ? undefined : s,
                page: undefined,
              })}
              aria-current={s === size ? 'true' : undefined}
              className={cn(
                'rounded-full px-2.5 py-1 tabular-nums',
                s === size
                  ? 'bg-accent-soft font-semibold text-on-accent-soft'
                  : 'text-muted hover:text-text',
              )}
            >
              {s}
            </Link>
          ))}
        </div>

        {totalPages > 1 && (
          <ul className="flex items-center gap-1 max-sm:[&>li:has([aria-current=page])~li:not(:last-child)]:hidden">
            <li>
              {page > 1 ? (
                <Link
                  href={hrefPage(page - 1)}
                  aria-label={ar ? 'الصفحة السابقة' : 'Previous page'}
                  className={cn(step, 'text-text hover:bg-surface-raised')}
                  rel="prev"
                >
                  <Prev size={16} aria-hidden="true" />
                </Link>
              ) : (
                <span aria-disabled="true" className={cn(step, 'opacity-40')}>
                  <Prev size={16} aria-hidden="true" />
                </span>
              )}
            </li>
            {pageWindow(page, totalPages).map((p, i) => (
              <li key={`${p}-${i}`}>
                {p === null ? (
                  <span aria-hidden="true" className="px-1 text-muted">
                    …
                  </span>
                ) : (
                  <Link
                    href={hrefPage(p)}
                    aria-current={p === page ? 'page' : undefined}
                    aria-label={ar ? `الصفحة ${p}` : `Page ${p}`}
                    className={cn(
                      step,
                      'tabular-nums',
                      p === page
                        ? 'bg-accent-soft font-semibold text-on-accent-soft'
                        : 'text-muted hover:bg-surface-raised hover:text-text',
                    )}
                  >
                    {p}
                  </Link>
                )}
              </li>
            ))}
            <li>
              {page < totalPages ? (
                <Link
                  href={hrefPage(page + 1)}
                  aria-label={ar ? 'الصفحة التالية' : 'Next page'}
                  className={cn(step, 'text-text hover:bg-surface-raised')}
                  rel="next"
                >
                  <Next size={16} aria-hidden="true" />
                </Link>
              ) : (
                <span aria-disabled="true" className={cn(step, 'opacity-40')}>
                  <Next size={16} aria-hidden="true" />
                </span>
              )}
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
}
