import { Badge, Card } from '@/components/ui';
import { requireUser } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { getAccess } from '@/modules/access/queries';
import { getMyProfile } from '@/modules/account/queries';

export default async function AccountOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  const user = await requireUser('/account');
  const [profile, access] = await Promise.all([getMyProfile(user.id), getAccess()]);
  const positions = access?.positions ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold">
          {ar ? 'مرحبًا' : 'Welcome'}، {profile?.fullNameAr ?? user.email}
        </h1>
        <p dir="ltr" className="mt-1 text-muted" style={{ textAlign: 'start' }}>
          {user.email}
        </p>
      </div>

      {positions.length > 0 ? (
        // People who hold a position are part of the community: no "this is not membership" message.
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">
            {ar ? 'أنت جزء من قيادة المجتمع' : 'You are part of the community leadership'}
          </h2>
          <ul className="flex flex-col gap-2">
            {positions.map((p) => (
              <li
                key={p.assignmentId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2"
              >
                <span className="flex items-center gap-2">
                  <Badge tone="accent">{p.title?.[lang] ?? p.roleName[lang]}</Badge>
                  <span className="text-muted">
                    {p.committeeName?.[lang] ?? (ar ? 'عام' : 'Global')}
                  </span>
                </span>
                <span className="text-xs tabular-nums text-muted">
                  {formatDate(p.startsAt, lang)} →{' '}
                  {p.endsAt ? formatDate(p.endsAt, lang) : ar ? 'مفتوح' : 'open'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">{ar ? 'حسابك' : 'Your account'}</h2>
          <p className="text-muted">
            {ar
              ? 'هذا حساب على المنصة وليس عضوية. للانضمام إلى المجتمع قدّم طلبك عند فتح باب التسجيل.'
              : 'This is an account on the platform, not membership. To join the community, apply when intake is open.'}
          </p>
        </Card>
      )}
    </div>
  );
}
