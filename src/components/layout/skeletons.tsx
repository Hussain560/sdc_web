import { Skeleton } from '@/components/ui';

/** A card shell like the loaded cards (rounded-2xl, line border) with a title bar and some body lines. */
export function CardSkeleton({
  lines = 3,
  title = true,
  className = '',
}: {
  lines?: number;
  title?: boolean;
  className?: string;
}) {
  return (
    <div className={`rounded-shape-2xl border border-line bg-surface p-5 ${className}`}>
      {title && <Skeleton className="mb-4 h-5 w-40" />}
      <div className="flex flex-col gap-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </div>
    </div>
  );
}

/** Title + one line + optional right-hand buttons: the header every list and detail page starts with. */
export function HeaderSkeleton({ buttons = 0 }: { buttons?: number }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      {buttons > 0 && (
        <div className="flex gap-3">
          {Array.from({ length: buttons }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-36 rounded-full" />
          ))}
        </div>
      )}
    </div>
  );
}
