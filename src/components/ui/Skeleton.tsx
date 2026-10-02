import type { HTMLAttributes } from 'react';
import { cn } from './cn';

/** Loading placeholder shaped like the content it replaces (see INTERNAL-SCREENS skeleton rules). */
export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} aria-hidden="true" className={cn('ui-skeleton rounded-lg', className)} />;
}
