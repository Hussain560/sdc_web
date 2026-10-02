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
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold lg:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
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

export type SkeletonCell = 'user' | 'badge' | 'text' | 'date' | 'action';
export type SkeletonColumn = { header: string; cell: SkeletonCell };

function CellSkeleton({ kind }: { kind: SkeletonCell }) {
  switch (kind) {
    case 'user':
      return (
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      );
    case 'badge':
      return <Skeleton className="h-6 w-24 rounded-full" />;
    case 'date':
      return <Skeleton className="h-3.5 w-20" />;
    case 'action':
      return <Skeleton className="ms-auto h-8 w-20 rounded-full" />;
    default:
      return <Skeleton className="h-3.5 w-28" />;
  }
}

/**
 * Table placeholder with the REAL column headers and the same shapes as the loaded rows (avatar + two lines,
 * pill, date, action), so nothing jumps when data arrives (INTERNAL-SCREENS/04 §2.1).
 */
export function TableSkeleton({
  columns,
  rows = 8,
  minWidth = 720,
}: {
  columns: SkeletonColumn[];
  rows?: number;
  minWidth?: number;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full text-sm" style={{ minWidth }}>
        <thead className="border-b border-line text-xs text-muted">
          <tr>
            {columns.map((c, i) => (
              <th key={i} scope="col" className="px-4 py-3 text-start font-medium">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-line last:border-0">
              {columns.map((c, i) => (
                <td key={i} className="px-4 py-3.5">
                  <CellSkeleton kind={c.cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Whole list-page skeleton: title, description, optional tabs and filter bar, the table, and the pagination bar. */
export function TablePageSkeleton({
  columns,
  rows = 8,
  tabs = 0,
  filters = 0,
  action = false,
}: {
  columns: SkeletonColumn[];
  rows?: number;
  tabs?: number;
  filters?: number;
  action?: boolean;
}) {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        {action && <Skeleton className="h-10 w-36 rounded-full" />}
      </div>
      {tabs > 0 && (
        <div className="mb-4 flex gap-2">
          {Array.from({ length: tabs }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full" />
          ))}
        </div>
      )}
      {filters > 0 && (
        <div className="mb-4 flex flex-wrap items-end gap-3">
          {Array.from({ length: filters }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-10 w-40 rounded-xl" />
            </div>
          ))}
          <Skeleton className="h-10 w-20 rounded-full" />
        </div>
      )}
      <TableSkeleton columns={columns} rows={rows} />
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-4 w-36" />
        <div className="flex gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="size-9 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Card-grid / detail skeleton used by overview-style pages. */
export function CardsPageSkeleton({ cards = 2 }: { cards?: number }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-6 flex flex-col gap-2.5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-surface p-5">
            <Skeleton className="mb-4 h-5 w-40" />
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="mb-3 h-11 w-full rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
