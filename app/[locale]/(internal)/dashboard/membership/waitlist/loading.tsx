import { CardSkeleton, HeaderSkeleton } from '@/components/layout/skeletons';
import { Skeleton } from '@/components/ui';

// Same shape as the waiting list: the cycle select, the two lists on one side, the daily summary on the other.
export default function WaitlistLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <HeaderSkeleton buttons={1} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-5">
          {[5, 4].map((n) => (
            <div key={n} className="rounded-shape-2xl border border-line bg-surface p-5">
              <Skeleton className="mb-4 h-5 w-48" />
              <div className="flex flex-col gap-4">
                {Array.from({ length: n }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex flex-1 flex-col gap-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-9 w-28 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <CardSkeleton lines={4} />
      </div>
    </div>
  );
}
