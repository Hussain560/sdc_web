import { Badge, Pagination, Avatar } from '@/components/ui';
import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { can } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { pageMeta, parsePage } from '@/lib/pagination';
import { listUsers } from '@/modules/access/admin-queries';
import { getAccess } from '@/modules/access/queries';

export default async function UsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string; size?: string }>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  await requireUser('/dashboard/admin/users');
  const access = await getAccess();
  if (!access || !can(access, 'users.view')) return <Forbidden />;

  const sp = await searchParams;
  const q = sp.q ?? '';
  const request = parsePage(sp);
  const { rows: users, total } = await listUsers(q, request);
  const meta = pageMeta(total, request);

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

      <form method="get" className="mb-4 flex flex-wrap items-center gap-2">
        <input
          name="q"
          defaultValue={q}
          aria-label={ar ? 'بحث' : 'Search'}
          placeholder={ar ? 'الاسم أو البريد…' : 'Name or e-mail…'}
          className="h-9 w-full max-w-sm rounded-lg border border-line bg-surface px-3 text-sm text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-focus-ring"
        />
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-full border border-line-accent px-4 text-sm font-semibold text-accent hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-focus-ring"
        >
          {ar ? 'بحث' : 'Search'}
        </button>
      </form>

      {users.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-8 text-center text-muted">
          {ar ? 'لا يوجد مستخدمون مطابقون.' : 'No matching users.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line bg-surface-raised text-xs text-muted">
              <tr>
                {[
                  ar ? 'المستخدم' : 'User',
                  ar ? 'المناصب' : 'Positions',
                  ar ? 'اللغة' : 'Language',
                  ar ? 'أُنشئ' : 'Created',
                ].map((h) => (
                  <th key={h} scope="col" className="px-4 py-2.5 text-start text-xs font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-line transition-colors last:border-0 hover:bg-surface-raised"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{u.name}</div>
                        <div
                          dir="ltr"
                          className="truncate text-xs text-muted"
                          style={{ textAlign: 'start' }}
                        >
                          {u.email}
                        </div>
                      </div>
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
      <Pagination meta={meta} searchParams={sp} lang={lang} />
    </>
  );
}
