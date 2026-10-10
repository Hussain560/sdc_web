'use client';

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from './cn';

export interface PanelTab {
  key: string;
  label: string;
  content: ReactNode;
}

/**
 * In-page tabs for content sections (event page: About, Agenda, Speakers, FAQ; components §7.1). Roving tabindex,
 * `aria-selected`, Home/End, and arrow keys that follow the reading direction. The link-based `Tabs` stays for
 * dashboard filters that live in the URL.
 */
export function PanelTabs({
  tabs,
  label,
  defaultKey,
}: {
  tabs: ReadonlyArray<PanelTab>;
  label: string;
  defaultKey?: string;
}) {
  const base = useId();
  const [active, setActive] = useState(defaultKey ?? tabs[0]?.key);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function move(to: number) {
    const tab = tabs[(to + tabs.length) % tabs.length];
    if (!tab) return;
    setActive(tab.key);
    refs.current[tab.key]?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((t) => t.key === active);
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === forward) move(index + 1);
    else if (e.key === back) move(index - 1);
    else if (e.key === 'Home') move(0);
    else if (e.key === 'End') move(tabs.length - 1);
    else return;
    e.preventDefault();
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="flex gap-x-1 overflow-x-auto border-b border-line"
      >
        {tabs.map((t) => {
          const selected = t.key === active;
          return (
            <button
              key={t.key}
              ref={(el) => {
                refs.current[t.key] = el;
              }}
              id={`${base}-${t.key}-tab`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${base}-${t.key}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.key)}
              className={cn(
                '-mb-px inline-flex min-h-11 shrink-0 items-center border-b-[3px] px-4 py-2.5 font-semibold whitespace-nowrap',
                'transition-colors duration-(--duration-fast) ease-(--ease-standard) motion-reduce:transition-none',
                'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring',
                selected
                  ? 'border-accent text-text'
                  : 'border-transparent text-muted hover:text-text',
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div
          key={t.key}
          id={`${base}-${t.key}-panel`}
          role="tabpanel"
          aria-labelledby={`${base}-${t.key}-tab`}
          hidden={t.key !== active}
          tabIndex={0}
          className="pt-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
