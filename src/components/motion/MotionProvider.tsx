'use client';

import { LazyMotion, MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

const loaders = {
  animation: () => import('./features-dom').then((m) => m.default),
  max: () => import('./features-max').then((m) => m.default),
};

/**
 * Wraps ONE animated island, never a whole layout: the `motion` code is fetched only by pages that mount an island,
 * so every other page ships none of it. Features load lazily; `m.*` components render their final state until they
 * arrive. `reducedMotion="user"` makes every spring, drag and layout animation follow the setting of the person.
 */
export function MotionProvider({
  children,
  features = 'animation',
}: {
  children: ReactNode;
  /** `animation` for fades, springs and exit; `max` when the island drags or animates layout. */
  features?: 'animation' | 'max';
}) {
  return (
    <LazyMotion features={loaders[features]} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
