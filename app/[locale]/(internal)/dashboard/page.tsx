import { Card } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { Link, redirect } from '@/i18n/navigation';
import { can, hasDashboardAccess } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { getAccess } from '@/modules/access/queries';
import { formatDate } from '@/lib/format';

export default async function DashboardOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  await requireUser('/dashboard');
  const access = await getAccess();

  // A plain user has no dashboard (INTERNAL-SCREENS/02 §2): their home is the account area.
  if (!access || !hasDashboardAccess(access)) redirect({ href: '/account', locale });
  if (!access) return null;

  return (
    <>
      <PageHeader
        title={`${ar ? 'مرحبًا' : 'Welcome'}، ${access.displayName}`}
        description={
          ar
            ? 'ملخص مناصبك وما يمكنك الوصول إليه.'
            : 'A summary of your positions and what you can reach.'
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">{ar ? 'مناصبي الحالية' : 'My current positions'}</h2>
          <ul className="flex flex-col gap-2">
            {access.positions.map((p) => (
              <li
                key={p.assignmentId}
                className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2"
              >
                <span>
                  {p.title?.[lang] ?? p.roleName[lang]}
                  {p.committeeName && (
                    <span className="text-muted"> · {p.committeeName[lang]}</span>
                  )}
                </span>
                <span className="text-xs text-muted">
                  {formatDate(p.startsAt, lang)} →{' '}
                  {p.endsAt ? formatDate(p.endsAt, lang) : ar ? 'مفتوح' : 'open'}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        {(can(access, 'roles.view') || can(access, 'users.view')) && (
          <Card className="flex flex-col gap-3">
            <h2 className="text-lg font-bold">{ar ? 'إدارة الوصول' : 'Access management'}</h2>
            <p className="text-muted">
              {ar
                ? 'تعيين المناصب وإنهاء الفترات والبحث عن المستخدمين.'
                : 'Assign positions, end terms and look up users.'}
            </p>
            <div className="flex gap-4 text-sm">
              {can(access, 'roles.view') && (
                <Link href="/dashboard/admin/roles" className="text-accent underline">
                  {ar ? 'الأدوار والمناصب' : 'Roles & positions'}
                </Link>
              )}
              {can(access, 'users.view') && (
                <Link href="/dashboard/admin/users" className="text-accent underline">
                  {ar ? 'المستخدمون' : 'Users'}
                </Link>
              )}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
