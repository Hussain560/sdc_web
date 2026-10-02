import { can } from '@/lib/auth/permissions';
import type { AccessContext } from '@/modules/access/types';
import type { EventPerms } from './components/EventActions';

/** UX-only permission snapshot for one event's committee; the database re-checks every action. */
export function eventPerms(access: AccessContext | null, committeeId: string): EventPerms {
  return {
    edit: can(access, 'events.edit', committeeId),
    submit: can(access, 'events.submit', committeeId),
    approve: can(access, 'events.approve', committeeId),
    cancel: can(access, 'events.cancel', committeeId),
    complete: can(access, 'events.complete', committeeId),
    delete: can(access, 'events.delete', committeeId),
  };
}
