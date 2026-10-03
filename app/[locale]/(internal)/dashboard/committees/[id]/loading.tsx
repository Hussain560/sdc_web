import { TablePageSkeleton } from '@/components/layout/PageHeader';

export default function CommitteeLoading() {
  return (
    <TablePageSkeleton
      tabs={4}
      action
      columns={[
        { header: '', cell: 'user' },
        { header: '', cell: 'badge' },
        { header: '', cell: 'date' },
        { header: '', cell: 'date' },
        { header: '', cell: 'badge' },
        { header: '', cell: 'action' },
      ]}
    />
  );
}
