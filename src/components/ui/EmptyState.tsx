import { CircleAlert, SearchX, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from './cn';

const DEFAULT_ICON = {
  'no-data': Inbox,
  'no-results': SearchX,
  error: CircleAlert,
} as const;

/**
 * Empty block (components §8.1): an icon in a raised circle, one title, one sentence, one action. `variant`
 * picks the default icon; pass `icon` to override. The original dashed look is kept for `variant="dashed"`.
 */
export function EmptyState({
  title,
  description,
  action,
  icon,
  variant = 'dashed',
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  variant?: 'dashed' | keyof typeof DEFAULT_ICON;
  className?: string;
}) {
  if (variant === 'dashed') {
    return (
      <div
        className={cn(
          'flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-surface p-10 text-center',
          className,
        )}
      >
        {icon && <div className="text-muted">{icon}</div>}
        <p className="text-lg font-bold">{title}</p>
        {description && <p className="max-w-md text-muted">{description}</p>}
        {action}
      </div>
    );
  }
  const Icon = DEFAULT_ICON[variant];
  return (
    <div
      className={cn(
        'mx-auto flex max-w-[420px] flex-col items-center gap-3 py-12 text-center',
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-surface-raised text-muted">
        {icon ?? <Icon aria-hidden="true" className="size-6" />}
      </div>
      <p className="t-h3">{title}</p>
      {description && <p className="t-body text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
