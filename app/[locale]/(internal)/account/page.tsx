import { Card } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { requireUser } from '@/lib/auth/session';
import { getMyProfile } from '@/modules/account/queries';

export default async function AccountOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const ar = locale === 'ar';
  const user = await requireUser('/account');
  const profile = await getMyProfile(user.id);

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

      <Card className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">{ar ? 'حسابك' : 'Your account'}</h2>
        <p className="text-muted">
          {ar
            ? 'هذا حساب على المنصة وليس عضوية. للانضمام إلى المجتمع قدّم طلبك عند فتح باب التسجيل.'
            : 'This is an account on the platform, not membership. To join the community, apply when intake is open.'}
        </p>
        <div className="mt-2 flex gap-4 text-sm">
          <Link href="/account/profile" className="text-accent underline">
            {ar ? 'تعديل ملفي' : 'Edit my profile'}
          </Link>
          <Link href="/account/security" className="text-accent underline">
            {ar ? 'الأمان' : 'Security'}
          </Link>
        </div>
      </Card>
    </div>
  );
}
