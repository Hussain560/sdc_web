import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { MyDataPanel } from '@/modules/privacy/components/MyDataPanel';

// SEC-003: access to one's own data and the deletion request.
export default async function AccountPrivacyPage() {
  const user = await requireUser('/account/privacy');
  const supabase = await createClient();
  const { count } = await supabase
    .from('data_requests')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'pending');
  return <MyDataPanel pending={(count ?? 0) > 0} />;
}
