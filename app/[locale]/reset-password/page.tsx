import { getUser } from '@/lib/auth/session';
import ResetPasswordForm from './ResetPasswordForm';

// The recovery link (/auth/confirm) sets a session cookie; without one the form explains the link is invalid.
export default async function ResetPasswordPage() {
  const user = await getUser();
  return <ResetPasswordForm hasSession={!!user} />;
}
