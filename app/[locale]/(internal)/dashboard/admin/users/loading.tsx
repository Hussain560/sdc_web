import { getLocale } from 'next-intl/server';
import { TablePageSkeleton } from '@/components/layout/PageHeader';

export default async function UsersLoading() {
  const ar = (await getLocale()) === 'ar';
  return (
    <TablePageSkeleton
      filters={1}
      columns={[
        { header: ar ? 'المستخدم' : 'User', cell: 'user' },
        { header: ar ? 'المناصب' : 'Positions', cell: 'badge' },
        { header: ar ? 'اللغة' : 'Language', cell: 'text' },
        { header: ar ? 'أُنشئ' : 'Created', cell: 'date' },
      ]}
    />
  );
}
