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
}: {
  count: number;
  actions: ReactNode;
  onClear: () => void;
  /** Shown while nothing is selected (desktop only). */
  hint?: string;
  className?: string;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  if (count === 0)
    return hint ? (
      <p className="hidden min-h-11 items-center text-sm text-muted md:flex">{hint}</p>
    ) : null;
  return (
    <div
      role="region"
      aria-label={ar ? 'إجراءات على المحدّد' : 'Actions on the selection'}
      className={cn(
        'm-enter z-30 flex flex-wrap items-center gap-2 rounded-shape-xl border border-line-accent bg-surface-overlay p-2 shadow-elev-2',
        'max-md:fixed max-md:inset-x-3 max-md:bottom-[max(0.75rem,env(safe-area-inset-bottom))]',
        className,
      )}
    >
      <button
        type="button"
        onClick={onClear}
        aria-label={ar ? 'إلغاء التحديد' : 'Clear the selection'}
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-raised hover:text-text focus-visible:outline-2 focus-visible:outline-focus-ring"
      >
        <X size={18} aria-hidden="true" />
      </button>
      <span aria-live="polite" className="me-auto px-1 text-sm font-semibold tabular-nums">
        {ar ? `${count} محدّد` : `${count} selected`}
      </span>
      <div className="flex flex-wrap items-center gap-2 max-md:w-full max-md:justify-end">
        {actions}
      </div>
    </div>
  );
}
