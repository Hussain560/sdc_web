import { getLocale } from 'next-intl/server';
import { TablePageSkeleton } from '@/components/layout/PageHeader';

export default async function MembersLoading() {
  const ar = (await getLocale()) === 'ar';
  return (
    <TablePageSkeleton
      action
      tabs={5}
      filters={3}
      columns={[
        { header: ar ? 'العضو' : 'Member', cell: 'user' },
        { header: ar ? 'الحالة' : 'Status', cell: 'badge' },
        { header: ar ? 'المدة' : 'Term', cell: 'date' },
        { header: ar ? 'المسار' : 'Track', cell: 'text' },
        { header: '', cell: 'action' },
      ]}
    />
  );
}
