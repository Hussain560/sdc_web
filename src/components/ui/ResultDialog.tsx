'use client';

import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cn } from './cn';
import { panelClasses, useModal } from './Dialog';

type Tone = 'success' | 'info' | 'warning' | 'danger';

const TONES: Record<Tone, { circle: string; Icon: LucideIcon }> = {
  success: { circle: 'bg-success-soft text-success', Icon: CircleCheck },
  info: { circle: 'bg-info-soft text-info', Icon: Info },
  warning: { circle: 'bg-warning-soft text-warning', Icon: TriangleAlert },
  danger: { circle: 'bg-danger-soft text-danger', Icon: CircleAlert },
};

/**
 * The outcome of a flow (registration, application): one icon, one title, one sentence, one action
 * (components §6.2, patterns §13). Focus moves to the title on open and the result is announced through
 * role="status" (or role="alert" for a refusal). `actions` holds the primary button and, only when truly useful,
 * a ghost one; the caller builds them so they can be links or buttons.
 */
export function ResultDialog({
  open,
  onClose,
  tone,
  icon,
  title,
  description,
  actions,
  className,
}: {
  open: boolean;
  onClose: () => void;
  tone: Tone;
  /** Overrides the default icon of the tone (e.g. a clock for "under review"). */
  icon?: LucideIcon;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  const ref = useModal(open);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const { circle, Icon: ToneIcon } = TONES[tone];
  const Icon = icon ?? ToneIcon;

  useEffect(() => {
    if (open) titleRef.current?.focus();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby={titleId}
      className={cn(panelClasses('sm', false), 'text-center', className)}
    >
      <div
        role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
        className="flex flex-col items-center gap-3"
      >
        <span
          aria-hidden="true"
          className={cn('flex size-[72px] items-center justify-center rounded-full', circle)}
        >
          <Icon className="size-10" />
        </span>
        <h2 id={titleId} ref={titleRef} tabIndex={-1} className="t-h3 focus-visible:outline-none">
          {title}
        </h2>
        {description && <p className="t-body text-muted">{description}</p>}
      </div>
      {actions && <div className="mt-6 flex flex-col gap-2 *:w-full">{actions}</div>}
    </dialog>
  );
}
