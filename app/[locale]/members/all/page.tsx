import { redirect } from '@/i18n/navigation';

// دُمجت هذي الصفحة بصفحة /members الموحّدة (الهرم + الفلتر + كل الأعضاء بنفس مكان واحد).
// نبقي هذا المسار شغّال (بدل ما يرجع 404) لأي رابط قديم كان يشاور له.
export default async function AllMembersRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: '/members', locale });
}
