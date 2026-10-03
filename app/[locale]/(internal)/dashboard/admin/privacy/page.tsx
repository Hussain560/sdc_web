import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { can } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { getAccess } from '@/modules/access/queries';
import {
  DataRequestsTable,
  type DataRequestRow,
} from '@/modules/privacy/components/DataRequestsTable';

// SEC-003: account deletion requests. Permission: settings.manage.
export default async function PrivacyRequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const ar = locale !== 'en';
  await requireUser('/dashboard/admin/privacy');
  const access = await getAccess();
  if (!access || !can(access, 'settings.manage')) return <Forbidden />;

  const supabase = await createClient();
  const { data } = await supabase
    .from('data_requests')
    .select('id, email, reason, note, status, created_at, handled_at')
    .order('status')
    .order('created_at', { ascending: false })
    .limit(200);
  const rows: DataRequestRow[] = (data ?? []).map((r) => ({
    id: r.id,
    email: r.email,
    reason: r.reason,
    note: r.note,
    status: r.status as DataRequestRow['status'],
    createdAt: r.created_at,
    handledAt: r.handled_at,
  }));

  return (
    <>
      <PageHeader
        title={ar ? 'طلبات الخصوصية' : 'Privacy requests'}
        description={
          ar
            ? 'طلبات حذف الحسابات. التنفيذ يجهّل البيانات التعريفية ويحذف الحساب، ويُسجَّل في سجل التدقيق.'
            : 'Account deletion requests. Completing one anonymizes the identifying data and removes the account; it is recorded in the audit log.'
        }
      />
      <DataRequestsTable rows={rows} />
    </>
  );
}
