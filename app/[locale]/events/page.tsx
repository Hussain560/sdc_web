import EventsListView from '@/modules/events/components/public/EventsListView';
import { listPublicEvents } from '@/modules/events/public';

// Public data, cookie-less read: cached and refreshed every minute (and on every event change via revalidatePath).
export const revalidate = 60;

export default async function AllEventsPage() {
  const events = await listPublicEvents();
  return <EventsListView events={events} />;
}
