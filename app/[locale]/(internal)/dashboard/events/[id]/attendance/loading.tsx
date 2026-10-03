import { Skeleton } from '@/components/ui';

/** Four stat tiles and a five-row session list (INTERNAL-SCREENS/16 §6). */
export default function AttendanceLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
