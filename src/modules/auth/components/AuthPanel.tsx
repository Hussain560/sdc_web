'use client';

import Image from 'next/image';
import { AnimatedBrandVideo } from '@/components/patterns/AnimatedBrandVideo';
import { usePathname } from '@/i18n/navigation';

/**
 * The decorative side of the auth pages: the dotted band background on every page. The sign-in page shows the animated
 * SDC mark on it; the other pages (forgot / reset password…) keep the still emblem.
 */
export function AuthPanel() {
  const isLogin = usePathname() === '/login';

  return (
    <aside
      aria-hidden="true"
      className={`motif-dots relative flex shrink-0 items-center justify-center overflow-hidden rounded-b-shape-2xl bg-band text-muted lg:col-start-2 lg:row-start-1 lg:h-auto lg:rounded-shape-2xl ${
        isLogin ? 'h-30' : 'h-24'
      }`}
    >
      {isLogin ? (
        <AnimatedBrandVideo className="h-26 w-auto max-w-[55%] object-contain object-center lg:h-auto lg:max-h-[75vh] lg:max-w-[min(70%,420px)]" />
      ) : (
        <Image
          src="/assets/brand/sdc-mark.png"
          alt=""
          width={160}
          height={160}
          className="size-12 lg:size-40"
        />
      )}
    </aside>
  );
}
