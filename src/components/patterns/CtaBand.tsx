import type { ReactNode } from 'react';
import { cn } from '@/components/ui/cn';

/**
 * Closing call-to-action band (patterns §9): a rounded band, one title, one line, one action. The line depends on
 * the membership intake phase, so the caller passes it in.
 */
export function CtaBand({
  title,
  line,
  action,
  extra,
  className,
}: {
  title: string;
  line?: string;
  action: ReactNode;
  /** Optional extra content under the action, e.g. social links when no intake is open. */
  extra?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-shape-2xl bg-accent-soft px-6 py-12 text-center text-on-accent-soft md:px-12 md:py-16',
        className,
      )}
    >
      <div className="mx-auto flex max-w-(--container-narrow) flex-col items-center gap-4">
        <h2 className="t-h2">{title}</h2>
        {line && <p className="t-lede">{line}</p>}
        <div className="mt-2">{action}</div>
        {extra}
      </div>
    </section>
  );
}
