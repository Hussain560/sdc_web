import { getLocale } from 'next-intl/server';
import { TablePageSkeleton } from '@/components/layout/PageHeader';

export default async function ArticlesLoading() {
  const ar = (await getLocale()) === 'ar';
  return (
    <TablePageSkeleton
      tabs={6}
      filters={2}
      action
      columns={[
        { header: ar ? 'العنوان' : 'Title', cell: 'user' },
        { header: ar ? 'الكتّاب' : 'Authors', cell: 'text' },
        { header: ar ? 'اللجنة' : 'Committee', cell: 'text' },
        { header: ar ? 'الحالة' : 'Status', cell: 'badge' },
        { header: ar ? 'التاريخ' : 'Date', cell: 'date' },
        { header: '', cell: 'action' },
      ]}
    />
  );
}
