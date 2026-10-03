import { getUser } from '@/lib/auth/session';
import ResetPasswordForm from './ResetPasswordForm';

// The recovery link (/auth/confirm) sets a session cookie; without one the form explains the link is invalid.
// `welcome=1` marks the activation link a new member gets when their application is accepted.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const [user, sp] = await Promise.all([getUser(), searchParams]);
  return <ResetPasswordForm hasSession={!!user} welcome={sp.welcome === '1'} />;
}
