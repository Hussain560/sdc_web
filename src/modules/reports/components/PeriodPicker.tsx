import { Link } from '@/i18n/navigation';
import { cn } from '@/components/ui/cn';
import type { Period, PeriodKind } from '../period';

/** Period presets as links (state lives in the URL, so a report can be shared) plus a custom range form (GET). */
export function PeriodPicker({ base, period, ar }: { base: string; period: Period; ar: boolean }) {
  const presets: Array<[PeriodKind, string]> = [
    ['last12', ar ? 'آخر 12 شهرًا' : 'Last 12 months'],
    ['year', ar ? 'هذه السنة' : 'This year'],
    ['month', ar ? 'هذا الشهر' : 'This month'],
  ];
  const input =
    'min-h-10 rounded-xl border border-line bg-surface px-3 text-sm text-text focus-visible:outline-2 focus-visible:outline-focus-ring';
  return (
    <div className="mb-5 flex flex-wrap items-end gap-3">
      <nav aria-label={ar ? 'الفترة' : 'Period'} className="flex flex-wrap gap-2">
        {presets.map(([kind, label]) => (
          <Link
            key={kind}
            href={`${base}?period=${kind}`}
            aria-current={period.kind === kind ? 'true' : undefined}
            className={cn(
              'inline-flex min-h-9 items-center rounded-full border px-4 text-sm font-semibold',
              period.kind === kind
                ? 'border-line-accent bg-surface-raised text-accent'
                : 'border-line text-muted hover:text-text',
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
      <form action={base} method="get" className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="period" value="custom" />
        <label className="flex flex-col gap-1 text-xs text-muted">
          {ar ? 'من' : 'From'}
          <input type="date" name="from" defaultValue={period.from} required className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          {ar ? 'إلى' : 'To'}
          <input type="date" name="to" defaultValue={period.to} required className={input} />
        </label>
        <button
          type="submit"
          className="inline-flex min-h-10 items-center rounded-full border border-line-accent px-4 text-sm font-semibold text-accent hover:bg-surface-raised"
        >
          {ar ? 'تطبيق' : 'Apply'}
        </button>
      </form>
    </div>
  );
}
