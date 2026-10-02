'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cn } from './cn';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

/** Native <dialog>: focus trap, Esc to close and an inert background come from the browser. */
export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      className={cn(
        'm-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-line-accent bg-surface-overlay p-6 text-text',
        'backdrop:bg-black/75 backdrop:backdrop-blur-sm',
        className,
      )}
    >
      <h2 id={titleId} className="mb-4 text-lg font-bold">
        {title}
      </h2>
      {children}
    </dialog>
  );
}
