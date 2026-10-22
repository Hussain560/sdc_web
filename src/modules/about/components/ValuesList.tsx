import type { CSSProperties } from 'react';

/** The community values are always visible in cards, with no interaction required to read them. */
export function ValuesList({ items }: { items: ReadonlyArray<readonly [string, string]> }) {
  return (
    <ol className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([title, text], i) => (
        <li key={title} className="m-reveal h-full" style={{ '--i': i } as CSSProperties}>
          <article className="m-lift flex h-full min-h-[250px] flex-col gap-4 rounded-shape-xl border border-line bg-surface px-5 py-6 sm:px-6 sm:py-7">
            <h3 className="t-h4">{title}</h3>
            <p className="t-body text-muted">{text}</p>
          </article>
        </li>
      ))}
    </ol>
  );
}
