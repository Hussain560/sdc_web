import { cn } from '@/components/ui/cn';

/**
 * The SDC mark drawn as two crossing capsules, used where a picture is missing (an event without a cover, the
 * featured card). Pure CSS from tokens, so it follows the theme. Size it with `className` (width and height).
 */
export function CapsuleMark({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn('relative block aspect-[4/5]', className)}>
      <span className="absolute start-[35%] top-0 h-full w-[30%] rotate-[32deg] rounded-full bg-brand" />
      <span className="absolute start-[35%] top-0 h-full w-[30%] -rotate-[32deg] rounded-full bg-signal opacity-90" />
    </span>
  );
}

/** A framed tile with the dot grid and the mark, standing in for a missing cover. */
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
