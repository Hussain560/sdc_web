import { getLocale } from 'next-intl/server';
import { TablePageSkeleton } from '@/components/layout/PageHeader';

export default async function LeaveRequestsLoading() {
  const ar = (await getLocale()) === 'ar';
  return (
    <TablePageSkeleton
      rows={5}
      columns={[
        { header: ar ? 'العضو' : 'Member', cell: 'user' },
        { header: ar ? 'التاريخ' : 'Date', cell: 'date' },
        { header: ar ? 'السبب' : 'Reason', cell: 'text' },
        { header: '', cell: 'action' },
      ]}
    />
  );
}
