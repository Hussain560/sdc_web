'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/components/ui/cn';

/**
 * A numbered list whose steps come alive as they scroll into view: the number circle fills, the text slides in and,
 * on phones, a line grows down to the latest step. It uses an IntersectionObserver (not scroll-linked CSS), so it works
 * on every phone. Without scripts, or with reduced motion, every step simply shows in its final state.
 */
export function StepsReveal({ children, className }: { children: ReactNode; className?: string }) {
  const list = useRef<HTMLOListElement>(null);

  useLayoutEffect(() => {
    const ol = list.current;
    if (!ol || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const items = [...ol.children].filter(
      (c): c is HTMLElement => c.tagName === 'LI' && !c.classList.contains('m-steps-line'),
    );
    // The thread runs from the first circle's centre to the last one's.
    const measure = () => {
      const dots = ol.querySelectorAll<HTMLElement>('.m-step-dot');
      const first = dots[0];
      const last = dots[dots.length - 1];
      if (!first || !last) return;
      const base = ol.getBoundingClientRect().top;
      const top = first.getBoundingClientRect().top - base + first.offsetHeight / 2;
      const bottom = last.getBoundingClientRect().top - base + last.offsetHeight / 2;
      ol.style.setProperty('--l-top', `${top}px`);
      ol.style.setProperty('--l-h', `${Math.max(0, bottom - top)}px`);
    };
    measure();
    window.addEventListener('resize', measure);
    ol.setAttribute('data-armed', '');
    ol.style.setProperty('--p', '0');
    const watch = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).setAttribute('data-in', '');
          watch.unobserve(e.target);
        }
        const last = items.reduce((n, el, i) => (el.hasAttribute('data-in') ? i : n), -1);
        ol.style.setProperty(
          '--p',
          String(items.length > 1 ? Math.max(0, last) / (items.length - 1) : 1),
        );
      },
      { threshold: 0.6, rootMargin: '0px 0px -12% 0px' },
    );
    items.forEach((el) => watch.observe(el));
    return () => {
      window.removeEventListener('resize', measure);
      watch.disconnect();
      ol.removeAttribute('data-armed');
      items.forEach((el) => el.removeAttribute('data-in'));
    };
  }, []);

  return (
    <ol ref={list} className={cn('m-steps relative', className)}>
      {/* The thread behind the circles on phones; the circles' own ring hides it where they sit. */}
      <li aria-hidden="true" className="m-steps-line md:hidden">
        <span className="m-steps-line-fill" />
      </li>
      {children}
    </ol>
  );
}
