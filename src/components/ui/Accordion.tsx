'use client';

import { Minus, Plus } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { cn } from './cn';

export interface AccordionItem {
  id: string;
  question: string;
  answer: ReactNode;
}

/**
 * FAQ-style accordion (components §7.2). Each item is its own card; several may be open at once. The trigger is a
 * button with `aria-expanded` and `aria-controls` inside a heading; the answer is a labelled region.
 */
export function Accordion({
  items,
  defaultOpen = [],
  headingLevel = 3,
}: {
  items: ReadonlyArray<AccordionItem>;
  defaultOpen?: string[];
  headingLevel?: 2 | 3 | 4;
}) {
  const base = useId();
  const [open, setOpen] = useState<Set<string>>(new Set(defaultOpen));
  const Heading = `h${headingLevel}` as const;
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const isOpen = open.has(item.id);
        const panelId = `${base}-${item.id}-panel`;
        const buttonId = `${base}-${item.id}-button`;
        return (
          <div
            key={item.id}
            className={cn(
              'rounded-shape-lg p-6 transition-colors duration-(--duration-fast) motion-reduce:transition-none',
              isOpen ? 'bg-accent-soft' : 'bg-surface-raised',
            )}
          >
            <Heading className="t-h4">
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="flex w-full items-center justify-between gap-4 text-start focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring"
              >
                <span className={isOpen ? 'text-on-accent-soft' : 'text-text'}>
                  {item.question}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'inline-flex size-8 shrink-0 items-center justify-center rounded-full',
                    isOpen ? 'bg-accent text-on-accent' : 'bg-surface text-text',
                  )}
                >
                  {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
                </span>
              </button>
            </Heading>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="t-body mt-3 text-text"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
