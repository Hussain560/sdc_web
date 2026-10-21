import { notFound } from 'next/navigation';
import { Alert, Badge } from '@/components/ui';
import { requireUser } from '@/lib/auth/session';
import { getAccess } from '@/modules/access/queries';
import { ProfileForm } from '@/modules/account/components/ProfileForm';
import { getMyProfile } from '@/modules/account/queries';
import { getReferenceData } from '@/modules/membership/queries';
import { MemberProfileEditor } from '@/modules/members/components/editor/MemberProfileEditor';
import { getMyEditorData } from '@/modules/members/editor';
import { getSkillCatalog } from '@/modules/members/public';
import { MEMBER_STATUS_LABEL, type MemberStatus } from '@/modules/members/schemas';

/**
 * My profile: one page for the account (e-mail, message language) and, for community members, the public profile
 * editor. The member's name is shown but cannot be changed here: it is set when the membership is accepted and
 * only leadership edits it.
 */
export default async function AccountProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  const user = await requireUser('/account/profile');
  const [profile, editor, access] = await Promise.all([
    getMyProfile(user.id),
    getMyEditorData(),
    getAccess(),
  ]);
  const canEditNames = Boolean(access?.grants['members.edit_own_name']);
  if (!profile) notFound();

  // Not a member: the plain account form, as before.
  if (!editor)
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 rounded-shape-xl border border-line bg-surface p-5">
          <h2 className="text-lg font-bold">{ar ? 'حسابك' : 'Your account'}</h2>
          <p className="text-muted">
            {ar
              ? 'هذا حساب على المنصة وليس عضوية. للانضمام إلى المجتمع قدّم طلبك عند فتح باب التسجيل.'
              : 'This is an account on the platform, not membership. To join the community, apply when intake is open.'}
          </p>
        </div>
        <ProfileForm profile={profile} />
      </div>
    );

  const status = editor.status as MemberStatus;
  const st = MEMBER_STATUS_LABEL[status];
  const canEdit = status === 'active';
  const [reference, catalog] = canEdit
    ? await Promise.all([getReferenceData(), getSkillCatalog()])
    : [null, null];

  return (
    <div data-wide className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">{ar ? 'ملفي الشخصي' : 'My profile'}</h1>
        {st && <Badge tone={st.tone === 'danger' ? 'danger' : st.tone}>{st[lang]}</Badge>}
      </div>
      {status === 'suspended' && (
        <Alert tone="warning">
          {ar
            ? 'عضويتك موقوفة. تواصل مع قيادة المجتمع.'
            : 'Your membership is suspended. Contact the community leadership.'}
        </Alert>
      )}
      {status === 'inactive' && (
        <Alert tone="info">
          {ar
            ? 'عضويتك غير نشطة. يمكنك التقديم مجددًا في دورة الاستقبال القادمة.'
            : 'Your membership is inactive. You can apply again in the next intake.'}
        </Alert>
      )}
      {canEdit && reference && catalog && (
        <MemberProfileEditor
          data={editor}
          reference={reference}
          catalog={[...catalog.values()]}
          lang={lang}
          canEditNames={canEditNames}
        />
      )}
      <div className="max-w-3xl">
        <ProfileForm profile={profile} hideNames />
      </div>
    </div>
  );
}
