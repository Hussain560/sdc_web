import { HeaderSkeleton } from '@/components/layout/skeletons';
import { Skeleton } from '@/components/ui';

// Same shape as the leave requests: header, then two columns of decision cards (person, reason, two buttons).
export default function LeaveRequestsLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <HeaderSkeleton />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-shape-2xl border border-line bg-surface p-5"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-14 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-3.5 w-32" />
              </div>
            </div>
            <Skeleton className="h-16 w-full rounded-shape-lg" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-12 rounded-full" />
              <Skeleton className="h-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
