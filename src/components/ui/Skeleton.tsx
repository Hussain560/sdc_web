import type { HTMLAttributes } from 'react';
import { cn } from './cn';

/** Loading placeholder shaped like the content it replaces (see INTERNAL-SCREENS skeleton rules). */
export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} aria-hidden="true" className={cn('ui-skeleton rounded-lg', className)} />;
}

/** Container for a group of skeletons: busy for assistive tech, with one hidden "Loading…" announcement. */
export function SkeletonGroup({
  label,
  className,
  children,
}: {
  /** Translated "Loading…". */
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Text lines at 100% / 80% / 60% width. */
export function SkeletonLines({ lines = 3 }: { lines?: number }) {
  const widths = ['w-full', 'w-4/5', 'w-3/5'];
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-4', widths[i % widths.length])} />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton className="shrink-0 rounded-full" style={{ width: size, height: size }} />;
}

/** Same geometry as the event card (image 16:9, status row, title, meta, footer). */
export function SkeletonEventCard() {
  return (
    <div className="rounded-shape-xl border border-line bg-surface p-5 md:p-6">
      <Skeleton className="aspect-video w-full rounded-shape-lg" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-6 w-4/5" />
      <Skeleton className="mt-2 h-6 w-3/5" />
      <Skeleton className="mt-4 h-4 w-2/5" />
    </div>
  );
}

/** Same geometry as the member directory card (avatar 72, name, track, badge). */
export function SkeletonMemberCard() {
  return (
    <div className="flex flex-col gap-3 rounded-shape-xl border border-line bg-surface p-5 md:p-6">
      <SkeletonAvatar size={72} />
      <Skeleton className="h-5 w-3/5" />
      <Skeleton className="h-4 w-2/5" />
      <Skeleton className="h-6 w-24 rounded-full" />
    </div>
  );
}
