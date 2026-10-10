import { ExternalLink } from 'lucide-react';
import type { AnchorHTMLAttributes } from 'react';
import { Link } from '@/i18n/navigation';
import { cn } from './cn';

export type TextLinkVariant = 'inline' | 'standalone' | 'nav';

const variants: Record<TextLinkVariant, string> = {
  inline: 'text-accent-text underline underline-offset-[3px] decoration-1',
  standalone: 'font-semibold text-accent-text hover:underline underline-offset-[3px]',
  nav: 'font-medium text-muted hover:text-text aria-[current=page]:text-text',
};

export interface TextLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  variant?: TextLinkVariant;
  /** Opens in a new tab. Pass `externalLabel` (the translated "(opens in a new tab)"). */
  external?: boolean;
  externalLabel?: string;
  /** For `nav`: marks the current page (aria-current) and shows the two signal dots. */
  active?: boolean;
}

/** Link (components §1.3). Internal links use the locale-aware router; external ones are plain anchors. */
export function TextLink({
  href,
  variant = 'inline',
  external,
  externalLabel,
  active,
  className,
  children,
  ...rest
}: TextLinkProps) {
  const classes = cn(
    'inline-flex items-center gap-1 rounded-sm transition-colors duration-(--duration-fast)',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
    variant === 'nav' && 'relative',
    variants[variant],
    className,
  );
  if (external) {
    return (
      <a
        {...rest}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-current={active ? 'page' : undefined}
        className={classes}
      >
        {children}
        <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
        {externalLabel && <span className="sr-only">{externalLabel}</span>}
      </a>
    );
  }
  return (
    <Link {...rest} href={href} aria-current={active ? 'page' : undefined} className={classes}>
      {children}
      {variant === 'nav' && active && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 -bottom-1 mx-auto flex w-fit gap-0.5 *:size-1 *:rounded-full *:bg-signal"
        >
          <span />
          <span />
        </span>
      )}
    </Link>
  );
}
