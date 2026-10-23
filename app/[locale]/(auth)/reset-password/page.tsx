import { getUser } from '@/lib/auth/session';
import { getMyMember } from '@/modules/members/queries';
import ResetPasswordForm from './ResetPasswordForm';

// The recovery link (/auth/confirm) sets a session cookie; without one the form explains the link is invalid.
// `welcome=1` marks the activation link a new member gets when their application is accepted.
export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ welcome?: string }>;
}) {
  const [user, sp] = await Promise.all([getUser(), searchParams]);
  const welcome = sp.welcome === '1';
  const lang = (await params).locale === 'en' ? 'en' : 'ar';
  const member = welcome && user ? await getMyMember() : null;
  const name = member
    ? lang === 'en'
      ? member.values.firstNameEn || member.values.firstNameAr
      : member.values.firstNameAr
    : '';
  return (
    <ResetPasswordForm
      hasSession={!!user}
      welcome={welcome}
      name={name}
      email={user?.email ?? ''}
    />
  );
}
