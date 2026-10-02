import { IdCard } from 'lucide-react';
import { Card, EmptyState } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { requireUser } from '@/lib/auth/session';
import { formatDateRange } from '@/lib/format';
import { ApplicationStatusPanel } from '@/modules/membership/components/ApplicationStatusPanel';
import { WithdrawApplication } from '@/modules/membership/components/WithdrawApplication';
import { listMyApplications } from '@/modules/membership/queries';

// MBR-005: my applications, their status, and withdraw/edit while allowed. Ownership rule — no permission key.
export default async function MyMembershipPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  await requireUser('/account/membership');
  const applications = await listMyApplications();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">{ar ? 'طلب العضوية' : 'Membership application'}</h1>
      {applications.length === 0 ? (
        <EmptyState
          icon={<IdCard size={36} aria-hidden="true" />}
          title={ar ? 'لم تقدّم طلب عضوية بعد' : 'You have not applied for membership yet'}
          description={
            ar
              ? 'نفتح باب العضوية مرة في السنة تقريبًا. تحقّق من صفحة الانضمام.'
              : 'We open membership about once a year. Check the join page.'
          }
          action={
            <Link
              href="/join"
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-on-accent"
            >
              {ar ? 'صفحة الانضمام' : 'Join page'}
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {applications.map((a) => {
            const canChange = a.status === 'submitted' && a.cycle.phase === 'open';
            return (
              <li key={a.id}>
                <Card className="flex flex-col gap-4">
                  <div>
                    <h2 className="text-lg font-bold">
                      {ar ? a.cycle.nameAr : a.cycle.nameEn || a.cycle.nameAr}
                    </h2>
                    <p className="text-sm tabular-nums text-muted">
                      {formatDateRange(
                        a.cycle.opensAt.slice(0, 10),
                        a.cycle.effectiveClosesAt.slice(0, 10),
                        lang,
                      )}
                    </p>
                  </div>
                  <ApplicationStatusPanel
                    status={a.status}
                    submittedAt={a.submittedAt}
                    decidedAt={a.decidedAt}
                    lang={lang}
                  />
                  {a.status === 'rejected' && (
                    <p className="text-sm text-muted">
                      {ar
                        ? 'شكرًا لاهتمامك. يمكنك التقديم مجددًا في الدورة القادمة.'
                        : 'Thank you for your interest. You may apply again in a future cycle.'}
                    </p>
                  )}
                  {canChange && (
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={{ pathname: '/join', query: { edit: '1' } }}
                        className="rounded-full border border-line-accent px-5 py-2 text-sm font-semibold text-accent hover:bg-surface-raised"
                      >
                        {ar ? 'تعديل الطلب' : 'Edit application'}
                      </Link>
                      <WithdrawApplication id={a.id} />
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
