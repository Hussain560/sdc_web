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
      {items.map((s) => (
        <div key={s.key}>
          <dd className="t-stat text-signal">{fmt.format(s.value)}</dd>
          <dt className="t-body-sm text-muted">{s.label}</dt>
        </div>
      ))}
    </dl>
  );
}
