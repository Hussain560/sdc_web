'use client';

import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { cn } from './cn';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  /** `sm` 32 rem (default), `md` 40 rem. */
  size?: 'sm' | 'md';
  /** One sentence under the title, linked as the dialog description. */
  description?: string;
  /** Action row at the inline-end: secondary first, primary last. Stacks on phones with the primary on top. */
  footer?: ReactNode;
  /** Translated "Close". When set, a close button is shown at the inline-end of the header. */
  closeLabel?: string;
  /**
   * A request is in flight: Esc, the close button and the backdrop do nothing and the body is inert, so the
   * flow can't be abandoned half-way (components §6.1). Show `busyHint` next to the footer.
   */
  busy?: boolean;
  busyHint?: string;
  /** `sheet` anchors the dialog to the bottom edge below `md` (components §6.3). */
  presentation?: 'dialog' | 'sheet';
}

/** Opens/closes a native <dialog> from `open`. Focus returns to the trigger on close (browser behaviour). */
export function useModal(open: boolean): RefObject<HTMLDialogElement | null> {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return ref;
}

export const panelClasses = (size: 'sm' | 'md', sheet: boolean) =>
  cn(
    'm-auto max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-shape-xl border border-line-accent bg-surface-overlay p-6 text-text shadow-elev-2 md:p-8',
    size === 'sm' ? 'w-[min(32rem,calc(100vw-2rem))]' : 'w-[min(40rem,calc(100vw-2rem))]',
    'backdrop:bg-scrim backdrop:backdrop-blur-xs',
    sheet &&
      'max-md:mb-0 max-md:max-h-[90dvh] max-md:w-full max-md:max-w-full max-md:rounded-b-none max-md:pb-[max(1.5rem,env(safe-area-inset-bottom))]',
  );

/** Native <dialog>: focus trap, Esc to close and an inert background come from the browser. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
  size = 'sm',
  description,
  footer,
  closeLabel,
  busy,
  busyHint,
  presentation = 'dialog',
}: DialogProps) {
  const ref = useModal(open);
  const titleId = useId();
  const descId = useId();
  const sheet = presentation === 'sheet';

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        if (busy) e.preventDefault();
      }}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      aria-busy={busy || undefined}
      className={cn(panelClasses(size, sheet), className)}
    >
      {sheet && (
        <span
          aria-hidden="true"
          className="mx-auto -mt-2 mb-4 block h-1 w-10 rounded-full bg-line-strong md:hidden"
        />
      )}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 id={titleId} className="t-h3">
            {title}
          </h2>
          {description && (
            <p id={descId} className="t-body-sm mt-1 text-muted">
              {description}
            </p>
          )}
        </div>
        {closeLabel && (
          <button
            type="button"
            aria-label={closeLabel}
            disabled={busy}
            onClick={onClose}
            className="-me-2 -mt-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-raised hover:text-text focus-visible:outline-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-45"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        )}
      </div>
      <div inert={busy || undefined}>{children}</div>
      {(footer || (busy && busyHint)) && (
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          {busy && busyHint && (
            <p role="status" className="t-body-sm me-auto text-muted">
              {busyHint}
            </p>
          )}
          {footer}
        </div>
      )}
    </dialog>
  );
}
