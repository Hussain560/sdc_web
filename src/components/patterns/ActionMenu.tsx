'use client';

import { MoreVertical } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
  const menu = useRef<HTMLDivElement>(null);
  // The menu lives in a portal with fixed coordinates, so a table's scroll container can never clip it.
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (root.current?.contains(t) || menu.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    const place = () => {
      const b = button.current?.getBoundingClientRect();
      if (!b) return;
      const w = 224;
      const h = items.length * 44 + 16;
      const rtl = getComputedStyle(button.current!).direction === 'rtl';
      const left = Math.min(Math.max(8, rtl ? b.left : b.right - w), window.innerWidth - w - 8);
      const below = b.bottom + 4;
      const top = below + h > window.innerHeight - 8 ? Math.max(8, b.top - h - 4) : below;
      setPos({ top, left });
    };
    place();
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {open &&
        pos &&
        createPortal(
          <div
            ref={menu}
            role="menu"
            style={{ top: pos.top, left: pos.left }}
            className="m-pop fixed z-[60] w-56 rounded-shape-xl border border-line bg-surface-overlay p-1.5 shadow-elev-3"
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
          </div>,
          document.body,
        )}
    </div>
  );
}
