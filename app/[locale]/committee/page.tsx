import { can } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { getAccess } from '@/modules/access/queries';
import CommitteeView from './CommitteeView';

// Legacy registrations review page. It stays until Sprint 06 replaces it with the permission-scoped dashboard
// screens; meanwhile access comes from the database (`registrations.review`), not from a hardcoded e-mail list.
export default async function CommitteePage() {
  await requireUser('/committee');
  const access = await getAccess();
  return <CommitteeView authorized={can(access, 'registrations.review')} />;
}
