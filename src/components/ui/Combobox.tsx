'use client';

import { CircleAlert, Search, ShieldAlert } from 'lucide-react';
import { useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Avatar } from './Avatar';
import { Badge, type BadgeTone } from './Badge';
import { Button } from './Button';
import { cn } from './cn';
import { controlClasses, FieldLabel } from './field-parts';
import { Skeleton } from './Skeleton';

export type ComboOption = {
  id: string;
  label: string;
  sublabel?: string;
  avatar?: { name: string; src?: string | null };
  badge?: { text: string; tone?: BadgeTone };
  /** Options with the same `group` are listed under one heading, in the order the groups first appear. */
  group?: string;
};

export type ComboStatus = 'idle' | 'loading' | 'ready' | 'error' | 'restricted';

export type ComboTexts = {
  /** Shown while the field is empty or too short. */
  hint: string;
  loading: string;
  noResults: string;
  noResultsHint?: string;
  error: string;
  retry: string;
  /** Shown instead of a silent empty list when the person may only search a part of the people. */
  restricted?: string;
  /** "Use the arrows to move, Enter to choose, Esc to close". */
  keys: string;
  /** Live announcement, for example "3 results". */
  count: (n: number) => string;
  /** Label of the button that clears the chosen option. */
  change: string;
};

/** Splits `text` around the first match of `query` (case-insensitive) so the match can be highlighted. */
export function splitMatch(text: string, query: string): [string, string, string] {
  const q = query.trim();
  if (!q) return [text, '', ''];
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return [text, '', ''];
  return [text.slice(0, i), text.slice(i, i + q.length), text.slice(i + q.length)];
}

function Highlight({ text, query }: { text: string; query: string }) {
  const [pre, hit, post] = splitMatch(text, query);
  if (!hit) return <>{text}</>;
  return (
    <>
      {pre}
      <mark className="bg-transparent font-bold text-accent-text">{hit}</mark>
      {post}
    </>
  );
}

/**
 * Searchable picker that follows the ARIA 1.2 combobox pattern: the input keeps focus, the options are announced
 * through `aria-activedescendant`, the arrows move, Enter chooses, Escape closes (and does not close a dialog
 * around it). Every state has a visible answer: loading, results, nobody found, an error with a retry, and "you may
 * only search part of the people" (never a silent empty list).
 */
export function Combobox({
  label,
  placeholder,
  query,
  onQueryChange,
  options,
  status,
  selected,
  onSelect,
  onClear,
  onRetry,
  texts,
  minChars = 2,
  emptyAction,
  requiredLabel,
  id,
  disabled,
}: {
  label: string;
  placeholder?: string;
  query: string;
  onQueryChange: (q: string) => void;
  options: ComboOption[];
  status: ComboStatus;
  selected?: ComboOption | null;
  onSelect: (o: ComboOption) => void;
  onClear?: () => void;
  onRetry?: () => void;
  texts: ComboTexts;
  minChars?: number;
  /** Shown under "nobody found", for example a link to add the person. */
  emptyAction?: ReactNode;
  requiredLabel?: string;
  id?: string;
  disabled?: boolean;
}) {
  const auto = useId();
  const base = id ?? auto;
  const inputId = `${base}-input`;
  const listId = `${base}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const long = query.trim().length >= minChars;
  const showPanel = open && !selected && !disabled && (long || status === 'restricted');

  // Group while keeping the order in which the groups and the options arrive.
  const groups = useMemo(() => {
    const out: Array<{ name: string | undefined; items: ComboOption[] }> = [];
    for (const o of options) {
      const g = out.find((x) => x.name === o.group);
      if (g) g.items.push(o);
      else out.push({ name: o.group, items: [o] });
    }
    return out;
  }, [options]);
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const optionId = (i: number) => `${base}-opt-${i}`;

  // A new list starts at its first option (adjusted while rendering, as React recommends, not in an effect).
  const [seen, setSeen] = useState(options);
  if (seen !== options) {
    setSeen(options);
    setActive(0);
  }

  const choose = (o: ComboOption) => {
    onSelect(o);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (showPanel) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }
      return;
    }
    if (flat.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % flat.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a - 1 + flat.length) % flat.length);
    } else if (e.key === 'Home' && showPanel) {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End' && showPanel) {
      e.preventDefault();
      setActive(flat.length - 1);
    } else if (e.key === 'Enter' && showPanel && status === 'ready') {
      e.preventDefault();
      const o = flat[active];
      if (o) choose(o);
    }
  };

  if (selected) {
    return (
      <div className="flex flex-col gap-2">
        <span className="t-label text-text">
          {label}
          {requiredLabel && <span className="sr-only"> ({requiredLabel})</span>}
        </span>
        <div className="flex items-center gap-3 rounded-shape-md border border-line-strong bg-surface-raised px-3 py-2">
          {selected.avatar && (
            <Avatar name={selected.avatar.name} src={selected.avatar.src} size={40} />
          )}
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="t-body truncate font-semibold">{selected.label}</span>
            {selected.sublabel && (
              <span dir="auto" className="t-body-sm truncate text-muted">
                {selected.sublabel}
              </span>
            )}
          </span>
          {onClear && (
            <button
              type="button"
              onClick={() => {
                onClear();
                requestAnimationFrame(() => input.current?.focus());
              }}
              className="min-h-11 shrink-0 px-2 text-sm font-semibold text-accent-text focus-visible:outline-2 focus-visible:outline-focus-ring"
            >
              {texts.change}
            </button>
          )}
        </div>
      </div>
    );
  }

  const activeId = showPanel && status === 'ready' && flat[active] ? optionId(active) : undefined;

  return (
    <div className="relative flex flex-col gap-2">
      <FieldLabel htmlFor={inputId} label={label} requiredLabel={requiredLabel} />
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted"
        />
        <input
          ref={input}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          aria-describedby={`${base}-hint`}
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className={cn(controlClasses(status === 'error'), 'min-h-12 ps-12')}
        />
      </div>

      {!showPanel && (
        <p id={`${base}-hint`} className="t-body-sm text-muted">
          {texts.hint}
        </p>
      )}
      {showPanel && (
        <span id={`${base}-hint`} className="sr-only">
          {texts.keys}
        </span>
      )}

      {/* The pointer must not move focus off the input before it has chosen, hence onMouseDown. */}
      {showPanel && (
        <div
          className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-shape-md border border-line-strong bg-surface shadow-(--elev-2)"
          onMouseDown={(e) => e.preventDefault()}
        >
          {status === 'loading' && (
            <div className="flex flex-col gap-3 p-4" aria-busy="true">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-2/5" />
                </div>
              </div>
              <p role="status" className="t-body-sm text-muted">
                {texts.loading}
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center justify-between gap-3 p-4">
              <p role="alert" className="t-body-sm flex items-center gap-2 text-danger">
                <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
                {texts.error}
              </p>
              {onRetry && (
                <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
                  {texts.retry}
                </Button>
              )}
            </div>
          )}

          {status === 'restricted' && texts.restricted && (
            <p
              role="note"
              className="t-body-sm m-3 flex items-start gap-2 rounded-shape-sm bg-info-soft p-3 text-info"
            >
              <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {texts.restricted}
            </p>
          )}

          {status === 'ready' && flat.length === 0 && (
            <div className="flex flex-col gap-1 p-4 text-center">
              <p className="t-body font-semibold">{texts.noResults}</p>
              {texts.noResultsHint && <p className="t-body-sm text-muted">{texts.noResultsHint}</p>}
              {emptyAction}
            </div>
          )}

          {(status === 'ready' || status === 'restricted') && flat.length > 0 && (
            <ul
              id={listId}
              role="listbox"
              aria-label={label}
              className="max-h-72 overflow-y-auto p-2"
            >
              {groups.map((g, gi) => (
                <li key={g.name ?? `g${gi}`} role="presentation">
                  {g.name && (
                    <p
                      id={`${base}-g${gi}`}
                      className="t-body-sm px-3 pt-2 pb-1 font-semibold text-muted"
                    >
                      {g.name}
                    </p>
                  )}
                  <ul role="group" aria-labelledby={g.name ? `${base}-g${gi}` : undefined}>
                    {g.items.map((o) => {
                      const i = flat.indexOf(o);
                      const on = i === active;
                      return (
                        <li
                          key={o.id}
                          id={optionId(i)}
                          role="option"
                          aria-selected={on}
                          onMouseEnter={() => setActive(i)}
                          onClick={() => choose(o)}
                          className={cn(
                            'flex min-h-14 cursor-pointer items-center gap-3 rounded-shape-sm px-3 py-2',
                            on && 'bg-accent-soft',
                          )}
                        >
                          {o.avatar && <Avatar name={o.avatar.name} src={o.avatar.src} size={40} />}
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="t-body truncate font-semibold">
                              <Highlight text={o.label} query={query} />
                            </span>
                            {o.sublabel && (
                              <span dir="auto" className="t-body-sm truncate text-muted">
                                <Highlight text={o.sublabel} query={query} />
                              </span>
                            )}
                          </span>
                          {o.badge && (
                            <Badge tone={o.badge.tone ?? 'neutral'}>{o.badge.text}</Badge>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}

          {(status === 'ready' || status === 'restricted') && flat.length > 0 && (
            <p className="t-body-sm hidden border-t border-line px-4 py-2 text-muted md:block">
              {texts.keys}
            </p>
          )}
        </div>
      )}

      {/* Polite announcement of the result count for screen reader users. */}
      <p role="status" aria-live="polite" className="sr-only">
        {showPanel && status === 'ready' ? texts.count(flat.length) : ''}
      </p>
    </div>
  );
}
