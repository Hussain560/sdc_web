'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/components/ui/cn';

/**
 * In-page navigation (event page §3): anchors to the sections that rendered, `aria-current` on the one in view.
 * It scrolls sideways inside itself on phones and sticks under the header on desktop.
 */
export function SectionNav({
  items,
  label,
}: {
  items: ReadonlyArray<{ id: string; label: string }>;
  label: string;
}) {
  const [current, setCurrent] = useState(items[0]?.id);

  useEffect(() => {
    const els = items
      .map((i) => document.getElementById(i.id))
      .filter((e): e is HTMLElement => !!e);
    if (els.length === 0 || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setCurrent(visible[0].target.id);
      },
      { rootMargin: '-96px 0px -60% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  if (items.length < 2) return null;
  return (
    <nav
      aria-label={label}
      className="sticky top-14 z-(--z-sticky) -mx-4 overflow-x-auto border-b border-line bg-canvas/90 px-4 backdrop-blur-md lg:top-24 lg:mx-0 lg:px-0"
    >
      <ul className="flex gap-1 whitespace-nowrap">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              aria-current={current === i.id ? 'location' : undefined}
              className={cn(
                'inline-flex min-h-11 items-center border-b-[3px] px-4 font-semibold transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring',
                current === i.id
                  ? 'border-accent text-text'
                  : 'border-transparent text-muted hover:text-text',
              )}
            >
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
