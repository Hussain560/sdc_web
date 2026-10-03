import { Skeleton } from '@/components/ui';

/** Six committee-card skeletons (INTERNAL-SCREENS/20 §3). */
export default function CommitteesLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
