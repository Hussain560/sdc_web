import { Skeleton } from '@/components/ui';

/** Editor skeleton: header, language tabs, title line, two editor blocks and the sidebar form. */
export default function ArticleEditorLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20 rounded-full" />
          <Skeleton className="h-10 w-36 rounded-full" />
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-9 w-40 rounded-lg" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-[26rem] w-full rounded-xl" />
            <Skeleton className="h-[26rem] w-full rounded-xl" />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
