import type { ReactNode } from 'react';
import { cn } from './cn';

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
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
