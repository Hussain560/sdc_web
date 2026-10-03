import { CalendarDays, CheckCircle2, FileText, Mail, UserCheck } from 'lucide-react';
import { Avatar, Badge, Card, StatCard } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { Link, redirect } from '@/i18n/navigation';
import { can, hasDashboardAccess } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { getAccess } from '@/modules/access/queries';
import { pct, small } from '@/modules/reports/format';
import { getDashboardSummary, getMyActivity, getPendingQueues } from '@/modules/reports/queries';

const REG_STATUS: Record<
  string,
  { ar: string; en: string; tone: 'accent' | 'warning' | 'neutral' }
> = {
  pending: { ar: 'قيد المراجعة', en: 'Pending', tone: 'warning' },
  accepted: { ar: 'مقبول', en: 'Accepted', tone: 'accent' },
  waitlisted: { ar: 'قائمة انتظار', en: 'Waitlisted', tone: 'neutral' },
  rejected: { ar: 'غير مقبول', en: 'Not accepted', tone: 'neutral' },
};

// RPT-003 (screen 10): one role-aware home. Counts come from SECURITY DEFINER functions that only count what
// the caller may act on, so a tile can never leak an out-of-scope number.
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

  const [summary, queues, activity] = await Promise.all([
    getDashboardSummary(),
    getPendingQueues(),
    getMyActivity(),
  ]);

  const primary = access.positions[0];
  const today = new Intl.DateTimeFormat(ar ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
    dateStyle: 'full',
    timeZone: 'Asia/Riyadh',
  }).format(new Date());

  const queueRows: Array<{
    key: string;
    icon: React.ReactNode;
    text: string;
    href: string;
    cta: string;
  }> = [
    ...queues.items.map((i) => ({
      key: `${i.kind}-${i.id}`,
      icon:
        i.kind === 'article' ? (
          <FileText size={18} aria-hidden="true" />
        ) : (
          <CalendarDays size={18} aria-hidden="true" />
        ),
      text:
        (i.kind === 'article'
          ? ar
            ? 'مقال: '
            : 'Article: '
          : i.kind === 'event_changes'
            ? ar
              ? 'تعديلات مطلوبة: '
              : 'Changes requested: '
            : ar
              ? 'فعالية: '
              : 'Event: ') + (ar ? i.titleAr : (i.titleEn ?? i.titleAr)),
      href: i.kind === 'article' ? `/dashboard/articles/${i.id}` : `/dashboard/events/${i.id}`,
      cta: i.kind === 'event_changes' ? (ar ? 'تعديل' : 'Edit') : ar ? 'مراجعة' : 'Review',
    })),
    ...(queues.applicationsOpen > 0
      ? [
          {
            key: 'applications',
            icon: <UserCheck size={18} aria-hidden="true" />,
            text: ar
              ? `${queues.applicationsOpen} طلب عضوية بانتظار القرار`
              : `${queues.applicationsOpen} membership applications awaiting a decision`,
            href: '/dashboard/membership/applications',
            cta: ar ? 'مراجعة' : 'Review',
          },
        ]
      : []),
    ...(queues.failedEmails > 0
      ? [
          {
            key: 'emails',
            icon: <Mail size={18} aria-hidden="true" />,
            text: ar
              ? `${queues.failedEmails} رسائل تحتاج متابعة`
              : `${queues.failedEmails} e-mails need attention`,
            href: '/dashboard/admin/emails',
            cta: ar ? 'عرض' : 'View',
          },
        ]
      : []),
  ].slice(0, 6);

  const tiles: React.ReactNode[] = [];
  if (can(access, 'reports.view_community'))
    tiles.push(
      <Link key="members" href="/dashboard/members" className="block">
        <StatCard
          label={ar ? 'الأعضاء النشطون' : 'Active members'}
          value={small(summary.activeMembers)}
          hint={
            summary.newMembersYear === null
              ? undefined
              : ar
                ? `${summary.newMembersYear} جدد هذه السنة`
                : `${summary.newMembersYear} new this year`
          }
        />
      </Link>,
    );
  if (can(access, 'events.view_drafts'))
    tiles.push(
      <Link key="events" href="/dashboard/events" className="block">
        <StatCard label={ar ? 'فعاليات قادمة' : 'Upcoming events'} value={summary.upcomingEvents} />
      </Link>,
    );
  if (can(access, 'membership.review'))
    tiles.push(
      <Link key="apps" href="/dashboard/membership/applications" className="block">
        <StatCard
          label={ar ? 'طلبات بانتظار القرار' : 'Applications awaiting decision'}
          value={queues.applicationsOpen}
          hint={queues.applicationsOpen > 0 ? (ar ? 'يحتاج إجراء' : 'Needs action') : undefined}
        />
      </Link>,
    );
  if (can(access, 'registrations.review'))
    tiles.push(
      <Link key="regs" href="/dashboard/registrations?status=pending" className="block">
        <StatCard
          label={ar ? 'تسجيلات معلقة' : 'Pending registrations'}
          value={queues.registrationsPending}
          hint={queues.registrationsPending > 0 ? (ar ? 'يحتاج إجراء' : 'Needs action') : undefined}
        />
      </Link>,
    );
  if (can(access, 'events.create'))
    tiles.push(
      <Link key="changes" href="/dashboard/events?status=changes_requested" className="block">
        <StatCard
          label={ar ? 'فعاليات تحتاج تعديلات' : 'Events needing changes'}
          value={queues.changesRequested}
        />
      </Link>,
    );

  return (
    <>
      <PageHeader title={`${ar ? 'مرحبًا،' : 'Welcome,'} ${access.displayName}`} />

      <Card className="mb-6 flex flex-wrap items-center gap-4 border-t-2 border-t-accent">
        <Avatar name={access.displayName} className="size-11 text-base" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">{today}</p>
          {summary.openCycle && (
            <p className="text-sm">
              {ar
                ? `دورة استقبال العضوية مفتوحة حتى ${formatDate(summary.openCycle.closesAt, lang)}`
                : `Membership intake is open until ${formatDate(summary.openCycle.closesAt, lang)}`}
            </p>
          )}
        </div>
        {primary && (
          <Badge tone="accent">
            {primary.title?.[lang] ?? primary.roleName[lang]}
            {primary.committeeName ? ` · ${primary.committeeName[lang]}` : ''}
          </Badge>
        )}
      </Card>

      {tiles.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{tiles}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">{ar ? 'بانتظار إجرائك' : 'Awaiting your action'}</h2>
          {queueRows.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-muted">
              <CheckCircle2 size={18} aria-hidden="true" />
              {ar ? 'لا توجد مهام بانتظارك.' : 'Nothing waiting for you.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {queueRows.map((r) => (
                <li
                  key={r.key}
                  className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-sm"
                >
                  <span className="text-muted">{r.icon}</span>
                  <span className="min-w-0 flex-1 truncate">{r.text}</span>
                  <Link
                    href={r.href}
                    className="shrink-0 font-semibold text-accent hover:underline"
                  >
                    {r.cta}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">{ar ? 'الفعاليات القادمة' : 'Upcoming events'}</h2>
          {summary.upcoming.length === 0 ? (
            <p className="text-sm text-muted">
              {ar ? 'لا توجد فعاليات قادمة.' : 'No upcoming events.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {summary.upcoming.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/dashboard/events/${e.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5 text-sm transition-colors hover:border-line-accent"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {ar ? e.titleAr : (e.titleEn ?? e.titleAr)}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {ar ? e.committeeAr : (e.committeeEn ?? e.committeeAr)}
                        {e.startDate ? ` · ${formatDate(e.startDate, lang)}` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted">
                      {e.seats ? `${e.accepted}/${e.seats}` : e.accepted}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{ar ? 'نشاطي' : 'My activity'}</h2>
          <Link
            href="/account/registrations"
            className="inline-flex min-h-9 items-center rounded-full border border-line-accent px-4 text-sm font-semibold text-accent hover:bg-surface-raised"
          >
            {ar ? 'عرض كل تسجيلاتي' : 'View all my registrations'}
          </Link>
        </div>
        {activity.registrations.length === 0 ? (
          <p className="text-sm text-muted">
            {ar ? 'لا توجد تسجيلات قادمة.' : 'You have no upcoming registrations.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {activity.registrations.slice(0, 3).map((r) => {
              const st = REG_STATUS[r.status];
              return (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5 text-sm"
                >
                  <Link
                    href={`/events/${r.slug}`}
                    className="min-w-0 truncate font-semibold hover:underline"
                  >
                    {ar ? r.titleAr : (r.titleEn ?? r.titleAr)}
                  </Link>
                  <span className="flex shrink-0 items-center gap-3 text-xs text-muted">
                    {r.startDate && <span>{formatDate(r.startDate, lang)}</span>}
                    {r.attendancePercent !== null && <span>{pct(r.attendancePercent)}</span>}
                    {st && <Badge tone={st.tone}>{st[lang]}</Badge>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
