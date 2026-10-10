import type { AnchorHTMLAttributes, HTMLAttributes } from 'react';
import { Link } from '@/i18n/navigation';
import { cn } from './cn';

/**
 * Card variants (components §3.1). `plain` is the original dashboard card and stays the default; the others are the
 * v2 public cards. Domain cards (EventCard, ArticleCard, MemberCard) live in their modules and compose this.
 */
export type CardVariant =
  'plain' | 'surface' | 'feature' | 'feature-alt' | 'cta' | 'stat' | 'poster';

const variants: Record<CardVariant, string> = {
  plain: 'rounded-shape-xl border border-line bg-surface p-5 text-text',
  surface: 'rounded-shape-xl border border-line bg-surface p-5 text-text md:p-6',
  feature: 'rounded-shape-xl border border-line bg-surface p-5 text-text md:p-6',
  'feature-alt': 'rounded-shape-xl border border-line bg-surface-raised p-5 text-text md:p-6',
  cta: 'rounded-shape-xl bg-accent-soft p-6 text-on-accent-soft md:p-8',
  stat: 'rounded-shape-xl bg-surface p-5 text-text md:p-6',
  poster: 'overflow-hidden rounded-shape-xl border border-line bg-surface text-text',
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  /** Lift, `--elev-1` and an accent border on hover. The card needs exactly one `CardLink`. */
  interactive?: boolean;
}

export function Card({ variant = 'plain', interactive, className, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={cn(
        variants[variant],
        interactive &&
          'relative transition-[transform,box-shadow,border-color] duration-(--duration-base) ease-(--ease-standard) hover:-translate-y-0.5 hover:border-line-accent hover:shadow-elev-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-focus-ring',
        className,
      )}
    />
  );
}

/**
 * The single primary link of an interactive card. Its `::after` covers the whole card, so the card is one target
 * and there are no nested links. Put secondary actions above it with `relative`.
 */
export function CardLink({
  href,
  className,
  children,
  ...rest
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string }) {
  return (
    <Link
      {...rest}
      href={href}
      className={cn(
        'after:absolute after:inset-0 after:content-[""] focus-visible:outline-none',
        className,
      )}
    >
      {children}
    </Link>
  );
}
