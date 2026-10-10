import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type Tone = 'info' | 'success' | 'warning' | 'danger';

// Tone-soft fill with the tone colour for the icon; the text stays on --text so every pair passes AA.
const tones: Record<Tone, { box: string; icon: string; Icon: LucideIcon }> = {
  info: { box: 'bg-info-soft', icon: 'text-info', Icon: Info },
  success: { box: 'bg-success-soft', icon: 'text-success', Icon: CircleCheck },
  warning: { box: 'bg-warning-soft', icon: 'text-warning', Icon: TriangleAlert },
  danger: { box: 'bg-danger-soft', icon: 'text-danger', Icon: CircleAlert },
};

/**
 * Inline message (components §6.5). `danger` and `warning` are announced as alerts, the rest as status.
 * Pass `title` for the bold first line and `action` for a trailing link or button.
 */
export function Alert({
  tone = 'info',
  title,
  action,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { tone?: Tone; title?: string; action?: ReactNode }) {
  const { box, icon, Icon } = tones[tone];
  return (
    <div
      {...rest}
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-shape-md p-4 text-sm text-text', box, className)}
    >
      <Icon aria-hidden="true" className={cn('mt-0.5 size-5 shrink-0', icon)} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5 text-muted')}>{children}</div>}
        {action && <div className="mt-2 font-semibold text-accent-text">{action}</div>}
      </div>
    </div>
  );
}
