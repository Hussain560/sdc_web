import { Forbidden } from '@/components/layout/Forbidden';
import { can, committeesWith } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { listCommittees } from '@/modules/access/admin-queries';
import { getAccess } from '@/modules/access/queries';
import { EventWizard } from '@/modules/events/components/wizard/EventWizard';
import { emptyForm } from '@/modules/events/types';

export default async function NewEventPage() {
  const user = await requireUser('/dashboard/events/new');
  const access = await getAccess();
  if (!access || !can(access, 'events.create')) return <Forbidden />;

  // Only committees where the user may create events (all active ones for global holders).
  const scope = committeesWith(access, 'events.create');
  const committees = (await listCommittees())
    .filter((c) => c.status === 'active' && (scope === 'all' || scope.includes(c.id)))
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <EventWizard
      userId={user.id}
      eventId={null}
      initial={emptyForm(committees.length === 1 ? committees[0]!.id : '')}
      initialUpdatedAt={null}
      status="draft"
      reviewNote={null}
      committees={committees}
      coverUrl={null}
      can={{ submit: can(access, 'events.submit'), approve: can(access, 'events.approve') }}
    />
  );
}
