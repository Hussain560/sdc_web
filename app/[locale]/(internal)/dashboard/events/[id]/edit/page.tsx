import { notFound } from 'next/navigation';
import { Forbidden } from '@/components/layout/Forbidden';
import { can, committeesWith } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { listCommittees } from '@/modules/access/admin-queries';
import { getAccess } from '@/modules/access/queries';
import { EventWizard } from '@/modules/events/components/wizard/EventWizard';
import { eventPerms } from '@/modules/events/permissions';
import { getEventDetail } from '@/modules/events/queries';

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const user = await requireUser(`/dashboard/events/${id}/edit`);
  const access = await getAccess();
  const event = await getEventDetail(id);
  // Out of scope or unknown → the same 404 (no existence leak).
  if (!access || !event) notFound();

  const perms = eventPerms(access, event.committeeId);
  if (!perms.edit && event.status !== 'pending_review') return <Forbidden />;
  if (['cancelled', 'completed', 'archived'].includes(event.status)) return <Forbidden />;

  const scope = committeesWith(access, 'events.create');
  const committees = (await listCommittees())
    .filter(
      (c) =>
        c.id === event.committeeId ||
        (c.status === 'active' && (scope === 'all' || scope.includes(c.id))),
    )
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <EventWizard
      userId={user.id}
      eventId={event.id}
      initial={event.form}
      initialUpdatedAt={event.updatedAt}
      status={event.status}
      reviewNote={event.reviewNote}
      committees={committees}
      coverUrl={event.coverUrl}
      justSaved={saved === '1'}
      can={{
        submit: can(access, 'events.submit', event.committeeId),
        approve: can(access, 'events.approve', event.committeeId),
      }}
    />
  );
}
