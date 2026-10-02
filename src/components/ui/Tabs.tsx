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
    <nav aria-label={label} className={cn('mb-4 flex flex-wrap gap-2', className)}>
      {items.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={t.key === active ? 'page' : undefined}
          className={cn(
            'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors',
            t.key === active
              ? 'border-line-accent bg-surface-raised font-semibold text-accent'
              : 'border-line text-muted hover:text-text',
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span
              className={cn(
                'rounded-full px-2 text-xs tabular-nums',
                t.tone === 'warning' && t.count > 0
                  ? 'bg-warning text-on-accent'
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
