import { Skeleton } from '@/components/ui';

/** Title block of an internal page: title, one-line description and the single primary action at the inline-end. */
export function PageHeader({
  title,
  description,
  action,
  readOnly,
  readOnlyLabel,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  readOnly?: boolean;
  readOnlyLabel?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {description && <p className="mt-1 text-muted">{description}</p>}
        {readOnly && (
          <span className="mt-2 inline-flex rounded-full border border-line px-3 py-0.5 text-xs text-muted">
            {readOnlyLabel}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

/** Skeleton matching PageHeader + a table (INTERNAL-SCREENS/04 §2.1). */
export function TablePageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <Skeleton className="mb-3 h-8 w-56" />
      <Skeleton className="mb-6 h-4 w-80" />
      <div className="rounded-2xl border border-line bg-surface p-4">
        <Skeleton className="mb-4 h-5 w-full" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="mb-3 flex items-center gap-4">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
