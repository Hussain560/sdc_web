import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { canGlobal } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { getAccess } from '@/modules/access/queries';
import { CycleForm } from '@/modules/membership/components/CycleForm';

export default async function NewCyclePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ar = locale !== 'en';
  await requireUser('/dashboard/membership/cycles/new');
  const access = await getAccess();
  if (!access || !canGlobal(access, 'membership.manage_cycles')) return <Forbidden />;
  return (
    <>
      <PageHeader title={ar ? 'دورة استقبال جديدة' : 'New intake cycle'} />
      <CycleForm />
    </>
  );
}
