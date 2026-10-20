'use client';

import { Minus, Plus } from 'lucide-react';
import { useId, useState, type CSSProperties } from 'react';
import { cn } from '@/components/ui/cn';

/**
 * The values as numbered rows that open one at a time (one stays open so the page is never a wall of titles).
 * Each row is a heading with a real button, wired with `aria-expanded` and `aria-controls`.
 */
export function ValuesList({ items }: { items: ReadonlyArray<readonly [string, string]> }) {
  const base = useId();
  const [open, setOpen] = useState(0);
  return (
    <ol className="border-t border-line">
      {items.map(([title, text], i) => {
        const isOpen = open === i;
        const panel = `${base}-${i}`;
        return (
          <li
            key={title}
            className="m-reveal border-b border-line"
            style={{ '--i': i } as CSSProperties}
          >
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panel}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="grid min-h-11 w-full grid-cols-[3.5rem_1fr_2.5rem] items-center gap-4 py-5 text-start focus-visible:rounded-shape-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring md:grid-cols-[4.5rem_1fr_2.5rem]"
              >
                <span
                  className={cn(
                    'text-[2rem] leading-none font-bold tabular-nums transition-colors duration-(--duration-fast) md:text-[2.5rem]',
                    isOpen ? 'text-signal' : 'text-subtle',
                  )}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[length:clamp(1.25rem,1.1rem+0.6vw,1.75rem)] leading-snug font-bold">
                  {title}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-10 items-center justify-center rounded-full transition-colors duration-(--duration-fast)',
                    isOpen ? 'bg-accent text-on-accent' : 'bg-surface-raised text-text',
                  )}
                >
                  {isOpen ? <Minus className="size-5" /> : <Plus className="size-5" />}
                </span>
              </button>
            </h3>
            <p
              id={panel}
              hidden={!isOpen}
              className="t-body -mt-2 pb-6 ps-[4.5rem] pe-14 text-muted md:ps-[5.5rem]"
            >
              {text}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
