import { Skeleton } from '@/components/ui';

/** Wizard skeleton: progress bar + form fields + preview card (INTERNAL-SCREENS/04 §2.4). */
export default function WizardLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="mb-6 flex items-start justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
      <div className="mb-8 flex items-center gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-1 items-center gap-2">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-px flex-1" />
          </div>
        ))}
      </div>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex max-w-[720px] flex-col gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <Skeleton className="hidden aspect-[3/4] w-full rounded-2xl xl:block" />
      </div>
    </div>
  );
}
