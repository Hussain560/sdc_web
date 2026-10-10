import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { cn } from '@/components/ui/cn';

/**
 * The SDC wordmark linking home (components §4.1). Both raster files are rendered and CSS shows the one that
 * matches the theme (`.logo-on-dark` / `.logo-on-light` in ui.css), so there is no flash and no hydration
 * mismatch. The logo files are used as they are: never redraw, recolour or stretch them (Q-041 asks for SVGs).
 */
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
      <Image
        src="/assets/Full whiteLogo 1.png"
        alt={alt}
        width={159}
        height={67}
        priority={priority}
        className="logo-on-dark h-8 w-auto md:h-9"
      />
      <Image
        src="/assets/navbar.png"
        alt={alt}
        width={1928}
        height={816}
        sizes="172px"
        priority={priority}
        className="logo-on-light h-8 w-auto md:h-9"
      />
    </Link>
  );
}
