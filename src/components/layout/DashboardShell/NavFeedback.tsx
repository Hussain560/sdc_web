'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { usePathname } from '@/i18n/navigation';

const ATTR = 'data-navigating';

/**
 * System status for navigation (Nielsen #1): the moment a link, tab or filter is used a thin bar runs across the top
 * and the page content dims, until the new URL arrives. No spinner state is kept in React: the signal is one
 * attribute on <html> (styled in motion.css), cleared when the pathname or query changes, with a safety timeout.
 */
export function NavFeedback() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const key = `${pathname}?${search}`;

  useEffect(() => {
    document.documentElement.removeAttribute(ATTR);
  }, [key]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      document.documentElement.setAttribute(ATTR, '');
      clearTimeout(timer);
      timer = setTimeout(() => document.documentElement.removeAttribute(ATTR), 10_000);
    };
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      start();
    };
    const onSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      if (!e.defaultPrevented && form.method.toLowerCase() === 'get') start();
    };
    document.addEventListener('click', onClick, true);
    document.addEventListener('submit', onSubmit);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('submit', onSubmit);
    };
  }, []);

  return <div aria-hidden="true" className="nav-bar" />;
}
