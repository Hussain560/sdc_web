import { requireUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { MyDataOverview } from '@/modules/privacy/components/MyDataOverview';
import { MyDataPanel } from '@/modules/privacy/components/MyDataPanel';
import { getMyData } from '@/modules/privacy/my-data';

// SEC-003: access to one's own data (on screen and as a download) and the deletion request.
export default async function AccountPrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const user = await requireUser('/account/privacy');
  const supabase = await createClient();
  const [{ count }, data] = await Promise.all([
    supabase
      .from('data_requests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'pending'),
    getMyData(user.id, user.email ?? ''),
  ]);
  return (
    <div className="flex flex-col gap-6">
      {data && <MyDataOverview data={data} lang={lang} />}
      <MyDataPanel pending={(count ?? 0) > 0} />
    </div>
  );
}
