import { getLocale } from 'next-intl/server';
import { TablePageSkeleton } from '@/components/layout/PageHeader';

// Same shape as the members list: header with export + add, four summary cards, nine tabs, the filter row, the table.
export default async function MembersLoading() {
  const ar = (await getLocale()) === 'ar';
  return (
    <TablePageSkeleton
      actions={2}
      kpis={4}
      tabs={9}
      inlineFilters={4}
      selectable
      columns={[
        { header: ar ? 'العضو' : 'Member', cell: 'user' },
        { header: ar ? 'اللجنة والمنصب' : 'Committee and position', cell: 'two-lines' },
        { header: ar ? 'الحالة' : 'Status', cell: 'badge' },
        { header: ar ? 'نهاية المدة' : 'Term end', cell: 'date' },
        { header: ar ? 'اكتمال الملف' : 'Profile', cell: 'text' },
        { header: ar ? 'الدليل' : 'Directory', cell: 'text' },
        { header: '', cell: 'action' },
      ]}
    />
  );
}
