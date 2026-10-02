import { Badge } from '@/components/ui';
import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { can } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { listUsers } from '@/modules/access/admin-queries';
import { getAccess } from '@/modules/access/queries';

export default async function UsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  await requireUser('/dashboard/admin/users');
  const access = await getAccess();
  if (!access || !can(access, 'users.view')) return <Forbidden />;

  const { q = '' } = await searchParams;
  const users = await listUsers(q);

  return (
    <>
      <PageHeader
        title={ar ? 'المستخدمون' : 'Users'}
        description={
          ar
            ? 'حسابات المنصة ومناصبها الحالية. الحساب ليس عضوية.'
            : 'Platform accounts and their current positions. An account is not membership.'
        }
      />

      <form method="get" className="mb-4 flex gap-3">
        <input
          name="q"
          defaultValue={q}
          aria-label={ar ? 'بحث' : 'Search'}
          placeholder={ar ? 'الاسم أو البريد…' : 'Name or e-mail…'}
          className="min-h-10 w-full max-w-sm rounded-xl border border-line bg-surface-raised px-3 text-sm text-text"
        />
        <button
          type="submit"
          className="min-h-10 rounded-full border border-line-accent px-5 text-sm font-semibold text-accent"
        >
          {ar ? 'بحث' : 'Search'}
        </button>
      </form>

      {users.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-8 text-center text-muted">
          {ar ? 'لا يوجد مستخدمون مطابقون.' : 'No matching users.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                {[
                  ar ? 'المستخدم' : 'User',
                  ar ? 'المناصب' : 'Positions',
                  ar ? 'اللغة' : 'Language',
                  ar ? 'أُنشئ' : 'Created',
                ].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 text-start font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.name}</div>
                    <div dir="ltr" className="text-xs text-muted" style={{ textAlign: 'start' }}>
                      {u.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.positions.length === 0 && <span className="text-muted">—</span>}
                      {u.positions.slice(0, 2).map((p, i) => (
                        <Badge key={i} tone="accent">
                          {p.label[lang]}
                        </Badge>
                      ))}
                      {u.positions.length > 2 && <Badge>+{u.positions.length - 2}</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">{u.locale === 'en' ? 'English' : 'العربية'}</td>
                  <td className="px-4 py-3 tabular-nums">{formatDate(u.createdAt, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
