'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Crumb = { label: string; href?: string };

const Ctx = createContext<{ crumbs: Crumb[]; set: (c: Crumb[]) => void }>({
  crumbs: [],
  set: () => undefined,
});

/** Holds the extra breadcrumb segments a page adds after the sidebar item (an event name, a committee name). */
export function CrumbsProvider({ children }: { children: React.ReactNode }) {
  const [crumbs, set] = useState<Crumb[]>([]);
  return <Ctx.Provider value={{ crumbs, set }}>{children}</Ctx.Provider>;
}

export const useCrumbs = () => useContext(Ctx).crumbs;

/** Rendered by a server page: sets the breadcrumb tail while the page is mounted. */
export function SetCrumbs({ items }: { items: Crumb[] }) {
  const { set } = useContext(Ctx);
  const key = JSON.stringify(items);
  useEffect(() => {
    set(JSON.parse(key) as Crumb[]);
    return () => set([]);
  }, [key, set]);
  return null;
}
