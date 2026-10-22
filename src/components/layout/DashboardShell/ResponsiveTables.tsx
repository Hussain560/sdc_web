'use client';

import { usePathname } from '@/i18n/navigation';
import { useEffect } from 'react';

/**
 * Marks every data table in the dashboard as "card on phones" and copies each column header onto its cells, so the
 * CSS in ui.css can stack them. One place instead of a card list per table; tables that already ship their own phone
 * cards (hidden on phones), icon-only tables and `data-no-cards` tables are left alone.
 */
export function ResponsiveTables() {
  const pathname = usePathname();
  useEffect(() => {
    const apply = () => {
      document
        .querySelectorAll<HTMLTableElement>('main table:not([data-cards]):not([data-no-cards])')
        .forEach((table) => {
          const heads = [...table.querySelectorAll('thead th')].map(
            (th) => th.textContent?.trim() ?? '',
          );
          if (heads.filter(Boolean).length < 2 || table.closest('.sr-only')) return;
          table.querySelectorAll('tbody tr').forEach((tr) => {
            [...tr.children].forEach((cell, i) => {
              if (
                cell instanceof HTMLElement &&
                cell.tagName === 'TD' &&
                !cell.hasAttribute('data-label')
              )
                cell.dataset.label = heads[i] ?? '';
            });
          });
          table.setAttribute('data-cards', '');
        });
    };
    // Wait until hydration is over: changing attributes of server-rendered markup before React has claimed it
    // would be reported as a hydration mismatch.
    let observer: MutationObserver | undefined;
    const begin = () => {
      apply();
      // Rows that arrive later (sorting, paging, streaming) get their labels too.
      const main = document.querySelector('main');
      if (!main) return;
      observer = new MutationObserver(() => {
        observer?.disconnect();
        document.querySelectorAll('main table[data-cards] tbody tr').forEach((tr) => {
          const table = tr.closest('table');
          const heads = [...(table?.querySelectorAll('thead th') ?? [])].map(
            (th) => th.textContent?.trim() ?? '',
          );
          [...tr.children].forEach((cell, i) => {
            if (
              cell instanceof HTMLElement &&
              cell.tagName === 'TD' &&
              !cell.hasAttribute('data-label')
            )
              cell.dataset.label = heads[i] ?? '';
          });
        });
        apply();
        observer?.observe(main, { childList: true, subtree: true });
      });
      observer.observe(main, { childList: true, subtree: true });
    };
    const timer = setTimeout(begin, 1500);
    return () => {
      clearTimeout(timer);
      observer?.disconnect();
    };
  }, [pathname]);
  return null;
}
