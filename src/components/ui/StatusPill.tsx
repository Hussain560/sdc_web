import {
  CalendarClock,
  Check,
  CircleCheck,
  CircleX,
  Flag,
  CalendarX,
  Clock,
  Hourglass,
  ListOrdered,
  Radio,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Badge, type BadgeTone } from './Badge';

/** The fixed event-status vocabulary (components §2.2): the tone and icon are decided here, the words by the caller. */
export const STATUS_META = {
  'registration-open': { tone: 'success', icon: CircleCheck },
  'closes-soon': { tone: 'warning', icon: Hourglass },
  'full-waitlist': { tone: 'warning', icon: ListOrdered },
  full: { tone: 'neutral', icon: Users },
  closed: { tone: 'neutral', icon: CalendarX },
  'members-only': { tone: 'info', icon: UserRound },
  registered: { tone: 'accent', icon: Check },
  'under-review': { tone: 'info', icon: Clock },
  'on-waitlist': { tone: 'warning', icon: ListOrdered },
  'running-now': { tone: 'info', icon: Radio },
  finished: { tone: 'neutral', icon: Flag },
  cancelled: { tone: 'danger', icon: CircleX },
  'opens-soon': { tone: 'neutral', icon: CalendarClock },
} as const satisfies Record<string, { tone: BadgeTone; icon: LucideIcon }>;

export type EventStatus = keyof typeof STATUS_META;

/** A Badge with a required icon, so status is never colour alone. `label` is the translated status text. */
export function StatusPill({ status, label }: { status: EventStatus; label: string }) {
  const { tone, icon: Icon } = STATUS_META[status];
  return (
    <Badge tone={tone} icon={<Icon className="size-3.5" />} data-status={status}>
      {label}
    </Badge>
  );
}
