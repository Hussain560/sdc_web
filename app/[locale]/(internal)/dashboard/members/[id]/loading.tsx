import { CardSkeleton } from '@/components/layout/skeletons';
import { Skeleton } from '@/components/ui';

// Same shape as the member record: the header card with actions, then history on one side and term/account/notes.
export default function MemberLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-5 rounded-shape-2xl border border-line bg-surface p-5">
        <div className="flex items-start gap-5">
          <Skeleton className="size-[72px] rounded-full" />
          <div className="flex flex-col gap-2.5">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-28 rounded-full" />
          <Skeleton className="h-11 w-24 rounded-full" />
          <Skeleton className="h-11 w-32 rounded-full" />
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="mb-4 flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full" />
            ))}
          </div>
          <div className="rounded-shape-2xl border border-line bg-surface p-5">
            <Skeleton className="mb-5 h-6 w-40" />
            <div className="flex flex-col gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-3.5 w-72 max-w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <CardSkeleton lines={3} />
          <CardSkeleton lines={4} />
          <CardSkeleton lines={3} />
        </div>
      </div>
    </div>
  );
}
