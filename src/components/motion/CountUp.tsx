'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';

/**
 * A figure that counts up from 0 when it scrolls into view (about 1.1 s, eased out). The server renders the final
 * number, so it is correct without scripts, for screen readers (the caller keeps a plain-text copy) and for people who
 * ask for reduced motion, who never see the count.
 */
export function CountUp({
  value,
  locale,
  duration = 1100,
  className,
}: {
  value: number;
  locale: 'ar' | 'en';
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = useMemo(
    () => new Intl.NumberFormat(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB'),
    [locale],
  );

  // Layout effect: the digits drop to 0 before the first paint, so the final number never flashes.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.textContent = fmt.format(0);
    let frame = 0;
    let settle: ReturnType<typeof setTimeout> | undefined;
    const watch = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        watch.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          el.textContent = fmt.format(Math.round(value * (1 - Math.pow(1 - p, 3))));
          if (p < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        // If frames are throttled (a background tab), the final figure still lands.
        settle = setTimeout(() => (el.textContent = fmt.format(value)), duration + 400);
      },
      { threshold: 0.4 },
    );
    watch.observe(el);
    return () => {
      watch.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(settle);
      el.textContent = fmt.format(value);
    };
  }, [value, fmt, duration]);

  return (
    <span ref={ref} aria-hidden="true" className={className}>
      {fmt.format(value)}
    </span>
  );
}
