import { getLocale } from 'next-intl/server';
import { TablePageSkeleton } from '@/components/layout/PageHeader';

export default async function RegistrationsLoading() {
  const ar = (await getLocale()) === 'ar';
  return (
    <TablePageSkeleton
      tabs={6}
      filters={2}
      columns={[
        { header: ar ? 'المسجّل' : 'Registrant', cell: 'user' },
        { header: ar ? 'الفعالية' : 'Event', cell: 'text' },
        { header: ar ? 'التسجيل' : 'Registered', cell: 'date' },
        { header: ar ? 'الحالة' : 'Status', cell: 'badge' },
        { header: ar ? 'البريد' : 'E-mail', cell: 'text' },
        { header: '', cell: 'action' },
      ]}
    />
  );
}
