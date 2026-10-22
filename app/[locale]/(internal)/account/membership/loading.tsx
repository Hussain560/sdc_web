import { CardSkeleton } from '@/components/layout/skeletons';
import { Skeleton } from '@/components/ui';

// Same shape as "My membership": the title, the card, its buttons, the term and the leave section.
export default function MyMembershipLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-5">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-56 w-full rounded-shape-2xl" />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-11 w-44 rounded-full" />
        <Skeleton className="h-11 w-52 rounded-full" />
        <Skeleton className="h-11 w-24 rounded-full" />
      </div>
      <CardSkeleton lines={2} />
      <CardSkeleton lines={2} />
    </div>
  );
}
