import { getLocale } from 'next-intl/server';
import { TablePageSkeleton } from '@/components/layout/PageHeader';

export default async function CyclesLoading() {
  const ar = (await getLocale()) === 'ar';
  return (
    <TablePageSkeleton
      action
      columns={[
        { header: ar ? 'الدورة' : 'Cycle', cell: 'text' },
        { header: ar ? 'الفترة' : 'Window', cell: 'date' },
        { header: ar ? 'المرحلة' : 'Phase', cell: 'badge' },
        { header: ar ? 'الطلبات' : 'Applications', cell: 'text' },
        { header: '', cell: 'action' },
      ]}
    />
  );
}
