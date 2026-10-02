import { notFound } from 'next/navigation';
import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { canGlobal } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { getAccess } from '@/modules/access/queries';
import { CycleForm } from '@/modules/membership/components/CycleForm';
import { getCycleForEdit } from '@/modules/membership/queries';

export default async function EditCyclePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const ar = locale !== 'en';
  await requireUser(`/dashboard/membership/cycles/${id}/edit`);
  const access = await getAccess();
  if (!access || !canGlobal(access, 'membership.manage_cycles')) return <Forbidden />;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const found = await getCycleForEdit(id);
  if (!found || found.row.status === 'completed') notFound();
  return (
    <>
      <PageHeader title={ar ? 'تعديل الدورة' : 'Edit cycle'} />
      <CycleForm
        id={id}
        initial={found.values}
        locked={found.hasApplications}
        windowLocked={found.row.phase === 'open' || found.row.phase === 'closed'}
      />
    </>
  );
}
