import { Skeleton } from '@/components/ui';

/** Detail skeleton: header + 4-node timeline + rail + preview block (INTERNAL-SCREENS/04 §2.2). */
export default function EventDetailLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-8 w-80 max-w-full" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      </div>
      <div className="mb-4 rounded-2xl border border-line bg-surface p-4">
        <div className="flex gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-1 flex-col gap-2">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-3.5 w-24" />
            </div>
          ))}
        </div>
      </div>
      <div className="mb-4 flex gap-2">
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-line bg-surface p-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="mb-4 flex justify-between gap-4">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-3.5 w-32" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="aspect-video w-full max-w-md rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
