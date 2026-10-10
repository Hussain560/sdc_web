'use client';

import { CalendarDays, FileText, Image as ImageIcon, User } from 'lucide-react';
import { useState } from 'react';
import { cn } from './cn';

const RATIOS = { '16/9': 'aspect-video', '1/1': 'aspect-square', '3/4': 'aspect-[3/4]' } as const;
const ICONS = { event: CalendarDays, article: FileText, person: User, image: ImageIcon } as const;

/**
 * Image in a fixed-ratio box so the layout never shifts (components §3.3). While loading the box shows the
 * skeleton tint; with no source or on error it shows the dot-grid motif and the content-type icon.
 * Content images need a localized `alt`; pass `alt=""` only for decorative images.
 */
export function Media({
  src,
  alt,
  ratio = '16/9',
  kind = 'image',
  priority,
  className,
}: {
  src?: string | null;
  alt: string;
  ratio?: keyof typeof RATIOS;
  kind?: keyof typeof ICONS;
  priority?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const Icon = ICONS[kind];
  const showImage = !!src && !failed;
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden bg-surface-raised',
        RATIOS[ratio],
        !loaded && showImage && 'ui-skeleton',
        className,
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div
          role={alt ? 'img' : undefined}
          aria-label={alt || undefined}
          className="motif-dots absolute inset-0 flex items-center justify-center text-muted"
        >
          <Icon aria-hidden="true" className="size-8" />
        </div>
      )}
    </div>
  );
}
