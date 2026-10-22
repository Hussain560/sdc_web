import { getLocale } from 'next-intl/server';
import { TablePageSkeleton } from '@/components/layout/PageHeader';

// Same shape as the queue: header with the cycle select + export, nine status tabs, one filter row, the table.
export default async function ApplicationsLoading() {
  const ar = (await getLocale()) === 'ar';
  return (
    <TablePageSkeleton
      actions={2}
      tabs={9}
      inlineFilters={4}
      selectable
      columns={[
        { header: ar ? 'المتقدّم' : 'Applicant', cell: 'user' },
        { header: ar ? 'الدراسة' : 'Study', cell: 'two-lines' },
        { header: ar ? 'الحالة' : 'Status', cell: 'badge' },
        { header: ar ? 'الدرجة' : 'Score', cell: 'score' },
        { header: ar ? 'المراجع' : 'Reviewer', cell: 'text' },
        { header: ar ? 'قُدّم' : 'Submitted', cell: 'date' },
        { header: '', cell: 'action' },
      ]}
    />
  );
}
