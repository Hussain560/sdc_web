import { getLocale } from 'next-intl/server';
import { TablePageSkeleton } from '@/components/layout/PageHeader';

export default async function EventsLoading() {
  const ar = (await getLocale()) === 'ar';
  return (
    <TablePageSkeleton
      tabs={6}
      filters={3}
      action
      columns={[
        { header: ar ? 'الفعالية' : 'Event', cell: 'user' },
        { header: ar ? 'اللجنة' : 'Committee', cell: 'text' },
        { header: ar ? 'الموعد' : 'Date', cell: 'date' },
        { header: ar ? 'الحالة' : 'Status', cell: 'badge' },
        { header: '', cell: 'action' },
      ]}
    />
  );
}
