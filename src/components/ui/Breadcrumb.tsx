import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from './cn';

export interface Crumb {
  label: string;
  /** Omit on the current page. */
  href?: string;
}

/**
 * Breadcrumb trail (components §4.5). The separator is one chevron that points along the reading direction (it
 * mirrors by direction, not by language, so `dir` is read from the surrounding document through CSS `rtl:`).
 * On phones only the parent is shown, with a back arrow. `label` is the translated "Breadcrumb".
 */
export function Breadcrumb({
  items,
  label,
  className,
}: {
  items: ReadonlyArray<Crumb>;
  label: string;
  className?: string;
}) {
  const parent = [...items].reverse().find((c) => c.href);
  return (
    <nav aria-label={label} className={cn('t-body-sm text-muted', className)}>
      {parent && (
        <Link
          href={parent.href!}
          className="inline-flex min-h-11 items-center gap-1 rounded-sm hover:text-text focus-visible:outline-2 focus-visible:outline-focus-ring md:hidden"
        >
          <ChevronRight aria-hidden="true" className="size-4 ltr:hidden" />
          <ChevronLeft aria-hidden="true" className="size-4 rtl:hidden" />
          {parent.label}
        </Link>
      )}
      <ol className="hidden flex-wrap items-center gap-x-2 md:flex">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-x-2">
              {c.href && !last ? (
                <Link
                  href={c.href}
                  className="rounded-sm hover:text-text focus-visible:outline-2 focus-visible:outline-focus-ring"
                >
                  {c.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className="font-semibold text-text">
                  {c.label}
                </span>
              )}
              {!last && (
                <>
                  <ChevronRight aria-hidden="true" className="size-4 rtl:hidden" />
                  <ChevronLeft aria-hidden="true" className="size-4 ltr:hidden" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
