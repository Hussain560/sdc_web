/* The brand SVGs are plain files, not optimised by next/image: an <img> is the right element. */
/* eslint-disable @next/next/no-img-element */
import { Link } from '@/i18n/navigation';
import { cn } from '@/components/ui/cn';

/**
 * The SDC wordmark (brand kit: `public/assets/brand`). Two SVGs are rendered and CSS shows the one that matches the
 * theme (`.logo-on-dark` / `.logo-on-light` in ui.css), so there is no flash and no hydration mismatch. The files are
 * used as they are: never redraw, recolour or stretch them.
 */
const SIZE = {
  header: 'h-10! md:h-12!',
  footer: 'h-16! md:h-20!',
} as const;

export function LogoWordmark({
  alt,
  size = 'header',
  priority,
}: {
  alt: string;
  size?: keyof typeof SIZE;
  priority?: boolean;
}) {
  return (
    <>
      <img
        src="/assets/brand/sdc-logo-white-3.svg"
        alt={alt}
        width={231}
        height={98}
        fetchPriority={priority ? 'high' : undefined}
        className={cn('logo-on-dark w-auto!', SIZE[size])}
      />
      <img
        src="/assets/brand/sdc-logo-black-1.svg"
        alt={alt}
        width={231}
        height={98}
        fetchPriority={priority ? 'high' : undefined}
        className={cn('logo-on-light w-auto!', SIZE[size])}
      />
    </>
  );
}

/** The wordmark linking home. */
export function Logo({
  label,
  alt,
  className,
  priority,
}: {
  /** The link's accessible name, e.g. "Saudi Developer Community — home". */
  label: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label={label}
      className={cn(
        'inline-flex shrink-0 rounded-shape-xs focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring',
        className,
      )}
    >
      <LogoWordmark alt={alt} priority={priority} />
    </Link>
  );
}
