import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { ProfileForm } from '@/modules/account/components/ProfileForm';
import { getMyProfile } from '@/modules/account/queries';

export default async function AccountProfilePage() {
  const user = await requireUser('/account/profile');
  const profile = await getMyProfile(user.id);
  if (!profile) notFound();
  return <ProfileForm profile={profile} />;
}
