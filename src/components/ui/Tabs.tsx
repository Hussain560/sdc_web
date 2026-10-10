import { Link } from '@/i18n/navigation';
import { cn } from './cn';

export type TabItem = {
  key: string;
  label: string;
  href: string;
  count?: number;
  tone?: 'warning';
};

/** Link-based tabs (the tab lives in the URL, so it is shareable and works without JavaScript). */
export function Tabs({
  items,
  active,
  label,
  className,
}: {
  items: TabItem[];
  active: string;
  label: string;
  className?: string;
}) {
  return (
    <nav
      aria-label={label}
      className={cn('mb-4 flex gap-x-1 overflow-x-auto border-b border-line', className)}
    >
      {items.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={t.key === active ? 'page' : undefined}
          className={cn(
            '-mb-px inline-flex min-h-11 shrink-0 items-center gap-2 border-b-[3px] px-4 py-2.5 text-base whitespace-nowrap transition-colors duration-(--duration-fast) ease-(--ease-standard)',
            'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring',
            t.key === active
              ? 'border-accent font-semibold text-text'
              : 'border-transparent text-muted hover:text-text',
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span
              className={cn(
                'rounded-full px-2 text-xs tabular-nums',
                t.tone === 'warning' && t.count > 0
                  ? 'bg-warning-soft text-warning'
                  : 'bg-surface-raised text-muted',
              )}
            >
              {t.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
