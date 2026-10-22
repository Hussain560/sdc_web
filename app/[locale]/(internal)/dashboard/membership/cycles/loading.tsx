import { CardSkeleton, HeaderSkeleton } from '@/components/layout/skeletons';
import { Skeleton } from '@/components/ui';

// Same shape as the cycles page: header with "new cycle", the current-cycle card with its funnel, then the others.
export default function CyclesLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-5">
      <HeaderSkeleton buttons={1} />
      <div className="rounded-shape-xl border border-line bg-surface p-5 md:p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="mt-3 h-4 w-72 max-w-full" />
        <div className="mt-6 flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 flex-1 rounded-full" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <Skeleton className="h-11 w-32 rounded-full" />
          <Skeleton className="h-11 w-32 rounded-full" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <CardSkeleton lines={2} />
        <CardSkeleton lines={2} />
      </div>
    </div>
  );
}
