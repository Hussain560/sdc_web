import { getLocale } from 'next-intl/server';
import { TablePageSkeleton } from '@/components/layout/PageHeader';

export default async function EmailLogLoading() {
  const ar = (await getLocale()) === 'ar';
  return (
    <TablePageSkeleton
      tabs={4}
      filters={2}
      action
      columns={[
        { header: ar ? 'الوقت' : 'Time', cell: 'date' },
        { header: ar ? 'المستلم' : 'Recipient', cell: 'text' },
        { header: ar ? 'القالب' : 'Template', cell: 'text' },
        { header: ar ? 'الحالة' : 'State', cell: 'badge' },
        { header: ar ? 'المحاولة' : 'Attempt', cell: 'text' },
        { header: '', cell: 'action' },
      ]}
    />
  );
}
