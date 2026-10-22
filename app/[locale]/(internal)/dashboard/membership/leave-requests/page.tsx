import { LogOut } from 'lucide-react';
import { EmptyState, Pagination } from '@/components/ui';
import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { can } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { pageMeta, parsePage } from '@/lib/pagination';
import { getAccess } from '@/modules/access/queries';
import { listAdminMembers } from '@/modules/members/admin-queries';
import { LeaveRequestsList } from '@/modules/members/components/LeaveRequestsList';

// MEM-017 / MEM-018: the leave requests waiting for leadership. A member never ends their own membership: they ask,
// and a leader (never the member themselves) approves or declines, one by one or in bulk.
export default async function LeaveRequestsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; size?: string }>;
}) {
  const { locale } = await params;
  const ar = locale !== 'en';
  await requireUser('/dashboard/membership/leave-requests');
  const access = await getAccess();
  if (!access || !can(access, 'members.manage')) return <Forbidden />;
  const sp = await searchParams;
  const request = parsePage(sp);
  const list = await listAdminMembers({ status: 'leave_requests' }, request);
  const meta = pageMeta(list.total, request);

  return (
    <>
      <PageHeader
        title={ar ? 'طلبات المغادرة' : 'Leave requests'}
        description={
          ar
            ? 'يبقى العضو نشطاً حتى تقرّروا. لا يقرّر القائد في طلبه هو؛ يقرّر قائد آخر أو مدير النظام.'
            : 'The member stays active until you decide. A leader never decides their own request; another leader or the system administrator does.'
        }
      />
      {list.rows.length === 0 ? (
        <EmptyState
          icon={<LogOut size={36} aria-hidden="true" />}
          title={ar ? 'لا طلبات مغادرة' : 'No leave requests'}
          description={
            ar
              ? 'حين يطلب عضو المغادرة يظهر هنا، ونخبرك في الملخص اليومي.'
              : 'When a member asks to leave it shows here, and the daily summary tells you.'
          }
        />
      ) : (
        <LeaveRequestsList rows={list.rows} />
      )}
      <Pagination meta={meta} searchParams={sp} lang={ar ? 'ar' : 'en'} />
    </>
  );
}
