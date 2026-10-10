import { Building2 } from 'lucide-react';
import { Badge, Card, EmptyState } from '@/components/ui';
import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { Link, redirect } from '@/i18n/navigation';
import { can, canAny } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { getAccess } from '@/modules/access/queries';
import { CommitteeForm } from '@/modules/committees/components/CommitteeForm';
import { listCommitteeCards, listCommunityLeadership } from '@/modules/committees/queries';

// CMT-003 (screen 20 §1.1): the committees, their head and deputy, and the community leadership strip.
export default async function CommitteesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  await requireUser('/dashboard/committees');
  const access = await getAccess();
  if (!access || !canAny(access, ['committees.manage', 'roles.view', 'committee_members.manage']))
    return <Forbidden />;

  const [cards, leadership] = await Promise.all([listCommitteeCards(), listCommunityLeadership()]);
  const canManage = can(access, 'committees.manage');
  const canView = canManage || can(access, 'roles.view');

  // A committee head sees only their own committee: open it straight away.
  if (!canView && cards.length === 1)
    redirect({ href: `/dashboard/committees/${cards[0]!.id}`, locale });

  const active = cards.filter((c) => c.status === 'active');
  const inactive = cards.filter((c) => c.status === 'inactive');

  const card = (c: (typeof cards)[number]) => (
    <Link
      key={c.id}
      href={`/dashboard/committees/${c.id}`}
      className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-focus-ring"
    >
      <Card className="flex h-full flex-col gap-3 transition-colors group-hover:border-line-accent">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold">{c.name[lang]}</h2>
            <p className="truncate text-xs text-muted" dir="ltr" style={{ textAlign: 'start' }}>
              {ar ? c.name.en : c.name.ar} · {c.slug}
            </p>
          </div>
          <Badge tone={c.status === 'active' ? 'accent' : 'neutral'}>
            {c.status === 'active' ? (ar ? 'نشطة' : 'Active') : ar ? 'غير نشطة' : 'Inactive'}
          </Badge>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted">{ar ? 'القائد' : 'Head'}</dt>
          <dd>{c.head?.[lang] ?? '—'}</dd>
          <dt className="text-muted">{ar ? 'النائب' : 'Deputy'}</dt>
          <dd>{c.deputy?.[lang] ?? '—'}</dd>
        </dl>
        <p className="mt-auto text-xs tabular-nums text-muted">
          {ar
            ? `${c.members} منصبًا حاليًا · ${c.events} فعاليات هذا العام · ${c.articles} مقالات`
            : `${c.members} current positions · ${c.events} events this year · ${c.articles} threads`}
        </p>
      </Card>
    </Link>
  );

  return (
    <>
      <PageHeader
        title={ar ? 'اللجان' : 'Committees'}
        description={
          ar
            ? 'اللجان ومن يشغل مناصبها. تُبنى صفحة القيادة العامة من هذه المناصب.'
            : 'The committees and who holds their positions. The public leadership view is built from these.'
        }
        readOnly={!canManage}
        readOnlyLabel={ar ? 'عرض فقط' : 'View only'}
        action={canManage ? <CommitteeForm trigger="create" /> : undefined}
      />

      {cards.length === 0 ? (
        <EmptyState
          icon={<Building2 size={36} aria-hidden="true" />}
          title={ar ? 'لا توجد لجان بعد' : 'No committees yet'}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{active.map(card)}</div>
          {inactive.length > 0 && (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-semibold text-muted hover:text-text">
                {ar ? `غير النشطة (${inactive.length})` : `Inactive (${inactive.length})`}
              </summary>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {inactive.map(card)}
              </div>
            </details>
          )}
        </>
      )}

      <section aria-labelledby="leadership-h" className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="leadership-h" className="text-lg font-bold">
            {ar ? 'قيادة المجتمع' : 'Community leadership'}
          </h2>
          {can(access, 'roles.assign') && (
            <Link
              href="/dashboard/admin/roles"
              className="inline-flex min-h-9 items-center rounded-full border border-line-accent px-4 text-sm font-semibold text-accent hover:bg-surface-raised"
            >
              {ar ? 'تعيين منصب' : 'Assign a position'}
            </Link>
          )}
        </div>
        {leadership.length === 0 ? (
          <p className="text-sm text-muted">
            {ar ? 'لا توجد مناصب عامة حالية.' : 'There are no current public positions.'}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-3">
            {leadership.map((l, i) => (
              <li
                key={`${l.roleKey}-${i}`}
                className="rounded-xl border border-line bg-surface px-4 py-3 text-sm"
              >
                <p className="font-semibold">{l.name[lang]}</p>
                <p className="text-xs text-muted">{l.title?.[lang] ?? l.role[lang]}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
