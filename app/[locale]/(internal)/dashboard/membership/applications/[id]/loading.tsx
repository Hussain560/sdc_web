import { CardSkeleton } from '@/components/layout/skeletons';
import { Skeleton } from '@/components/ui';

// Same shape as the review page: queue bar, name header, then details on one side and score + decision on the other.
export default function ApplicationLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="hidden h-5 w-80 lg:block" />
        <div className="flex gap-2">
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="size-11 rounded-full" />
        </div>
      </div>
      <div className="mb-5 flex items-center gap-4">
        <Skeleton className="size-[72px] rounded-full" />
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-5">
          <CardSkeleton lines={4} />
          <CardSkeleton lines={5} />
          <CardSkeleton lines={4} />
          <CardSkeleton lines={4} />
        </div>
        <div className="flex flex-col gap-4">
          <CardSkeleton lines={6} />
          <CardSkeleton lines={4} />
        </div>
      </div>
    </div>
  );
}
