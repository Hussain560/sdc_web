import { getUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { getMyData } from '../my-data';
import { MyDataOverview } from './MyDataOverview';
import { MyDataPanel } from './MyDataPanel';

/**
 * SEC-003: access to one's own data (on screen and as a download) and the deletion request. It sits under the
 * membership card on "My membership", where the account's other facts already are.
 */
export async function MyDataSection({ lang }: { lang: 'ar' | 'en' }) {
  const user = await getUser();
  if (!user) return null;
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
    <section
      id="my-data"
      aria-labelledby="my-data-title"
      className="flex scroll-mt-24 flex-col gap-5"
    >
      <h2 id="my-data-title" className="text-xl font-extrabold">
        {lang === 'ar' ? 'بياناتي' : 'My data'}
      </h2>
      {data && <MyDataOverview data={data} lang={lang} />}
      <MyDataPanel pending={(count ?? 0) > 0} />
    </section>
  );
}
