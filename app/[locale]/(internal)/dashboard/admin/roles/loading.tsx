import { getLocale } from 'next-intl/server';
import { TablePageSkeleton } from '@/components/layout/PageHeader';

export default async function RolesLoading() {
  const ar = (await getLocale()) === 'ar';
  return (
    <TablePageSkeleton
      tabs={3}
      filters={3}
      action
      columns={[
        { header: ar ? 'المستخدم' : 'User', cell: 'user' },
        { header: ar ? 'الدور' : 'Role', cell: 'badge' },
        { header: ar ? 'النطاق' : 'Scope', cell: 'text' },
        { header: ar ? 'من' : 'From', cell: 'date' },
        { header: ar ? 'إلى' : 'To', cell: 'date' },
        { header: ar ? 'الحالة' : 'State', cell: 'badge' },
        { header: '', cell: 'action' },
      ]}
    />
  );
}
