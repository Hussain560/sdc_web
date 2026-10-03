import { requireUser } from '@/lib/auth/session';
import { SecurityForms } from '@/modules/account/components/SecurityForms';

export default async function AccountSecurityPage() {
  const user = await requireUser('/account/security');
  return <SecurityForms email={user.email ?? ''} />;
}
