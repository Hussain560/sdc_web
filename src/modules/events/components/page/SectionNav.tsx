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
  items: ReadonlyArray<{ id: string; label: string; hideAt?: 'lg' }>;
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
      className="sticky top-14 z-(--z-sticky) -mx-4 overflow-x-auto bg-canvas/90 px-4 backdrop-blur-md lg:top-24 lg:mx-0 lg:border-b lg:border-line lg:px-0"
    >
      <ul className="flex gap-2 whitespace-nowrap max-lg:py-2 lg:gap-7">
        {items.map((i) => (
          <li key={i.id} className={i.hideAt === 'lg' ? 'lg:hidden' : undefined}>
            <a
              href={`#${i.id}`}
              aria-current={current === i.id ? 'location' : undefined}
              className={cn(
                // Phones: chips (accent-soft when current). Desktop: tabs with an accent underline.
                'inline-flex min-h-11 items-center font-semibold transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring',
                'max-lg:rounded-full max-lg:border max-lg:px-4 lg:border-b-[3px]',
                current === i.id
                  ? 'text-text max-lg:border-transparent max-lg:bg-accent-soft max-lg:text-on-accent-soft lg:border-accent'
                  : 'text-muted hover:text-text max-lg:border-line lg:border-transparent',
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
