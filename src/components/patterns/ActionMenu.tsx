'use client';

import { MoreVertical } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/components/ui';
import { Link } from '@/i18n/navigation';

export type MenuItem = {
  key: string;
  label: string;
  icon?: ReactNode;
  onSelect?: () => void;
  href?: string;
  tone?: 'default' | 'danger';
  disabled?: boolean;
  /** Why it is unavailable (shown as the tooltip). */
  reason?: string;
};

/**
 * The "⋮" menu of a row. Opens below the button at the inline-end, closes on Escape, outside click or choosing an
 * item, keeps a 44 px target, and gives focus back to the button. Items with `href` navigate; the rest call back.
 */
export function ActionMenu({
  label,
  items,
  className,
}: {
  label: string;
  items: MenuItem[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const item =
    'flex min-h-11 w-full items-center gap-2 rounded-shape-md px-3 text-start text-sm hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-45';
  return (
    <div ref={root} className={cn('relative', className)}>
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex size-11 items-center justify-center rounded-full text-muted hover:bg-surface-raised hover:text-text focus-visible:outline-2 focus-visible:outline-focus-ring"
      >
        <MoreVertical size={18} aria-hidden="true" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute end-0 top-full z-20 mt-1 w-56 rounded-shape-xl border border-line bg-surface-overlay p-1.5 shadow-elev-2"
        >
          {items.map((it) =>
            it.href && !it.disabled ? (
              <Link
                key={it.key}
                role="menuitem"
                href={it.href}
                onClick={() => setOpen(false)}
                className={cn(item, it.tone === 'danger' && 'text-danger')}
              >
                {it.icon}
                {it.label}
              </Link>
            ) : (
              <button
                key={it.key}
                type="button"
                role="menuitem"
                disabled={it.disabled}
                title={it.reason}
                onClick={() => {
                  setOpen(false);
                  it.onSelect?.();
                }}
                className={cn(item, it.tone === 'danger' && 'text-danger')}
              >
                {it.icon}
                {it.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
