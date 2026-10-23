import type { CSSProperties } from 'react';
import { CountUp } from '@/components/motion/CountUp';
import { cn } from '@/components/ui/cn';

/**
 * Key figures (components §3.1 `stat`): a large tabular numeral in the signal colour over a muted label, with
 * hairline dividers between tiles. 2 × 2 on phones. Pass only real figures; the caller hides the row below three.
 */
export function StatsRow({
  items,
  label,
  locale,
  className,
}: {
  items: ReadonlyArray<{ key: string; value: number; label: string }>;
  /** Accessible name of the group. */
  label: string;
  locale: 'ar' | 'en';
  className?: string;
}) {
  if (items.length === 0) return null;
  const fmt = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB');
  return (
    <dl
      aria-label={label}
      className={cn(
        'grid grid-cols-2 gap-y-8 md:flex md:justify-between md:gap-0',
        '*:flex *:flex-col-reverse *:items-start *:gap-1 md:*:flex-1 md:*:px-6 md:*:border-s md:*:border-line md:*:first:border-s-0',
        className,
      )}
    >
      {items.map((s, i) => (
        <div key={s.key} className="m-reveal" style={{ '--i': i } as CSSProperties}>
          <dd className="t-stat text-signal">
            {s.value < 1000 ? (
              <>
                {/* The digits count up when they scroll into view; the figure is also plain text for screen readers. */}
                <CountUp value={s.value} locale={locale} />
                <span className="sr-only">{fmt.format(s.value)}</span>
              </>
            ) : (
              fmt.format(s.value)
            )}
          </dd>
          <dt className="t-body-sm text-muted">{s.label}</dt>
        </div>
      ))}
    </dl>
  );
}
