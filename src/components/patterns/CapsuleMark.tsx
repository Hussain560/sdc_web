import { cn } from '@/components/ui/cn';

/**
 * The SDC emblem (brand kit, `public/assets/brand/sdc-mark.png`) where a picture is missing: an event without a cover,
 * a project without a cover, the featured card. Size it with `className` (height or width); it keeps its proportions.
 */
export function CapsuleMark({ className }: { className?: string }) {
  return (
    <img src="/assets/brand/sdc-mark.png" alt="" className={cn('block h-auto w-auto', className)} />
  );
}

/** A framed tile with the dot grid and the emblem, standing in for a missing cover. */
export function CapsuleCover({
  className,
  size = 'md',
}: {
  className?: string;
  size?: 'md' | 'lg';
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'motif-dots relative grid size-full place-items-center overflow-hidden bg-accent-soft text-accent-text',
        className,
      )}
    >
      <CapsuleMark className={size === 'lg' ? 'h-36' : 'h-16'} />
    </div>
  );
}
