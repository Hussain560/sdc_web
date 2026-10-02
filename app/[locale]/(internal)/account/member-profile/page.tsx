import { IdCard } from 'lucide-react';
import { Alert, Badge, EmptyState } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { requireUser } from '@/lib/auth/session';
import { getReferenceData } from '@/modules/membership/queries';
import { ProfileForm } from '@/modules/members/components/ProfileForm';
import { getMyMember } from '@/modules/members/queries';
import { MEMBER_STATUS_LABEL } from '@/modules/members/schemas';

// MEM-003: members edit their own profile and directory visibility. Ownership rule — no permission key.
export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  await requireUser('/account/member-profile');
  const member = await getMyMember();

  if (!member) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-extrabold">{ar ? 'ملف العضوية' : 'Member profile'}</h1>
        <EmptyState
          icon={<IdCard size={36} aria-hidden="true" />}
          title={ar ? 'هذه الصفحة للأعضاء فقط' : 'This page is for members only'}
          description={
            ar
              ? 'بعد قبول طلب عضويتك ستجد ملفك هنا. إن كان لديك ملف قديم فاطلب رابط المطالبة من قيادة المجتمع.'
              : 'Once your membership application is accepted your profile appears here. If you have an older profile, ask the leadership for a claim link.'
          }
          action={
            <Link
              href="/join"
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-on-accent"
            >
              {ar ? 'صفحة الانضمام' : 'Join page'}
            </Link>
          }
        />
      </div>
    );
  }

  if (member.status === 'suspended') {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-extrabold">{ar ? 'ملف العضوية' : 'Member profile'}</h1>
        <Alert tone="warning">
          {ar
            ? 'عضويتك موقوفة — تواصل مع قيادة المجتمع.'
            : 'Your membership is suspended — contact the community leadership.'}
        </Alert>
      </div>
    );
  }

  const reference = await getReferenceData();
  const st = MEMBER_STATUS_LABEL[member.status];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">{ar ? 'ملف العضوية' : 'Member profile'}</h1>
        <Badge tone={st.tone === 'danger' ? 'danger' : st.tone}>{st[lang]}</Badge>
      </div>
      {member.status === 'inactive' ? (
        <Alert tone="info">
          {ar
            ? 'عضويتك غير نشطة. يمكنك التقديم مجددًا في دورة الاستقبال القادمة.'
            : 'Your membership is inactive. You can apply again in the next intake.'}
        </Alert>
      ) : (
        <ProfileForm memberId={member.id} initial={member.values} reference={reference} />
      )}
    </div>
  );
}
