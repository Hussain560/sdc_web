import { redirect } from 'next/navigation';

// دُمجت هذي الصفحة بصفحة /members الموحّدة (الهرم + الفلتر + كل الأعضاء بنفس مكان واحد).
// نبقي هذا المسار شغّال (بدل ما يرجع 404) لأي رابط قديم كان يشاور له.
export default function AllMembersRedirect() {
  redirect('/members');
}
