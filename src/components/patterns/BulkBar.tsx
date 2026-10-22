'use client';

import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';

/**
 * The selection bar of a list: how many rows are selected and what can be done with them. On a phone it floats at
 * the bottom of the screen (thumb reach) and the list gets room behind it; on a wide screen it is a calm row above
 * the table. It appears only while something is selected, and announces the count politely.
 */
export function BulkBar({
  count,
  actions,
  onClear,
  hint,
  className,
  floating = false,
}: {
  count: number;
  actions: ReactNode;
  onClear: () => void;
  /** Shown while nothing is selected (desktop only). */
  hint?: string;
  className?: string;
  /** A dark pill floating at the bottom centre on every screen size (the applications queue). */
  floating?: boolean;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  if (count === 0)
    return hint && !floating ? (
      <p className="hidden min-h-11 items-center text-sm text-muted md:flex">{hint}</p>
    ) : null;
  return (
    <div
      role="region"
      aria-label={ar ? 'إجراءات على المحدّد' : 'Actions on the selection'}
      className={cn(
        'z-30 flex flex-wrap items-center gap-2 p-2',
        floating
          ? 'm-pop fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-40 w-max max-w-[calc(100vw-1.5rem)] -translate-x-1/2 justify-center rounded-full bg-brand text-on-brand shadow-elev-3'
          : 'm-enter rounded-shape-xl border border-line-accent bg-surface-overlay shadow-elev-2 max-md:fixed max-md:inset-x-3 max-md:bottom-[max(0.75rem,env(safe-area-inset-bottom))]',
        className,
      )}
    >
      <span
        aria-live="polite"
        className={cn(
          'px-2 text-sm font-semibold tabular-nums',
          floating ? 'order-first' : 'order-2 me-auto',
        )}
      >
        {ar ? `${count} محدّد` : `${count} selected`}
      </span>
      <div
        className={cn(
          'flex flex-wrap items-center gap-2',
          floating ? 'order-2 justify-center' : 'order-3 max-md:w-full max-md:justify-end',
        )}
      >
        {actions}
      </div>
      <button
        type="button"
        onClick={onClear}
        aria-label={ar ? 'إلغاء التحديد' : 'Clear the selection'}
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-focus-ring',
          floating
            ? 'order-last text-on-brand/80 hover:bg-white/10 hover:text-on-brand'
            : 'order-1 text-muted hover:bg-surface-raised hover:text-text',
        )}
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
