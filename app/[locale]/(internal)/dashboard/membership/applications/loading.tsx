import { getLocale } from 'next-intl/server';
import { TablePageSkeleton } from '@/components/layout/PageHeader';

export default async function ApplicationsLoading() {
  const ar = (await getLocale()) === 'ar';
  return (
    <TablePageSkeleton
      action
      tabs={6}
      filters={4}
      columns={[
        { header: ar ? 'المتقدّم' : 'Applicant', cell: 'user' },
        { header: ar ? 'الدراسة' : 'Study', cell: 'text' },
        { header: ar ? 'الدرجة' : 'Score', cell: 'text' },
        { header: ar ? 'الحالة' : 'Status', cell: 'badge' },
        { header: ar ? 'المراجع' : 'Reviewer', cell: 'text' },
      ]}
    />
  );
}
