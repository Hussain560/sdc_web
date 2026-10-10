import { User } from 'lucide-react';
import { cn } from './cn';

export const AVATAR_SIZES = {
  24: 'size-6',
  32: 'size-8',
  40: 'size-10',
  56: 'size-14',
  72: 'size-[72px]',
  120: 'size-[120px]',
} as const;
export type AvatarSize = keyof typeof AVATAR_SIZES;

const TEXT: Record<AvatarSize, string> = {
  24: 'text-[10px]',
  32: 'text-xs',
  40: 'text-sm',
  56: 'text-lg',
  72: 'text-2xl',
  120: 'text-4xl',
};

/** One letter for Arabic names, two for Latin ones (components §3.2). Empty names give an empty string. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (/[؀-ۿ]/.test(words[0]!)) return Array.from(words[0]!)[0] ?? '';
  const first = Array.from(words[0]!)[0] ?? '';
  const last = words.length > 1 ? (Array.from(words[words.length - 1]!)[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/**
 * Person avatar. Shows the photo when `src` is given (only pass it when the member made the photo public;
 * otherwise initials are shown, never a blurred photo). Decorative next to a visible name, so it is
 * `aria-hidden` unless `alt` is provided.
 */
export function Avatar({
  name,
  src,
  alt,
  size = 32,
  className,
}: {
  name: string;
  src?: string | null;
  alt?: string;
  size?: AvatarSize;
  className?: string;
}) {
  const initials = initialsOf(name);
  return (
    <span
      aria-hidden={alt ? undefined : true}
      role={alt ? 'img' : undefined}
      aria-label={alt}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-line',
        AVATAR_SIZES[size],
        src ? 'bg-surface-raised' : 'bg-accent-soft font-semibold text-on-accent-soft',
        TEXT[size],
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
      ) : initials ? (
        initials
      ) : (
        <User aria-hidden="true" className="size-1/2" />
      )}
    </span>
  );
}

/** Overlapping group, at most `max` avatars and a "+N" count (components §3.2). */
export function AvatarGroup({
  people,
  max = 4,
  size = 32,
  moreLabel,
}: {
  people: ReadonlyArray<{ name: string; src?: string | null }>;
  max?: number;
  size?: AvatarSize;
  /** Translated accessible name for the "+N" tile, e.g. "3 more people". */
  moreLabel?: string;
}) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <span className="inline-flex items-center">
      {shown.map((p, i) => (
        <Avatar
          key={`${p.name}-${i}`}
          name={p.name}
          src={p.src}
          size={size}
          className="-ms-2 ring-2 ring-surface first:ms-0"
        />
      ))}
      {rest > 0 && (
        <span
          role="img"
          aria-label={moreLabel}
          className={cn(
            '-ms-2 inline-flex items-center justify-center rounded-full bg-surface-raised text-xs font-semibold tabular-nums text-muted ring-2 ring-surface',
            AVATAR_SIZES[size],
          )}
        >
          +{rest}
        </span>
      )}
    </span>
  );
}
