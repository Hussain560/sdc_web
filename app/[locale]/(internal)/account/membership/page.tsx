import { nowMs } from '@/lib/now';
import { IdCard, UsersRound } from 'lucide-react';
import { Alert, Badge, EmptyState } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { requireUser } from '@/lib/auth/session';
import { getAccess } from '@/modules/access/queries';
import { formatDate } from '@/lib/format';
import { MembershipCard } from '@/modules/members/components/MembershipCard';
import {
  CardActions,
  LeaveSection,
  RenewalButton,
} from '@/modules/members/components/MyMembershipActions';
import { getMyMembership } from '@/modules/members/my-membership';
import { MyDataSection } from '@/modules/privacy/components/MyDataSection';
import { MEMBER_STATUS_LABEL } from '@/modules/members/schemas';

const DAY = 86_400_000;

// MEM-020 / MEM-019: my membership, the card, the term, renewal and leaving. Ownership rule — no permission key.
export default async function MyMembershipPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const L = (a: string, e: string) => (lang === 'ar' ? a : e);
  await requireUser('/account/membership');
  const mine = await getMyMembership(lang);

  if (!mine) {
    const access = await getAccess();
    const held = access?.positions ?? [];
    return (
      <div data-wide className="m-enter flex flex-col gap-5">
        <h1 className="text-2xl font-extrabold">{L('عضويتي', 'My membership')}</h1>
        <EmptyState
          icon={<IdCard size={36} aria-hidden="true" />}
          title={L('لا توجد عضوية مرتبطة بحسابك', 'No membership is linked to your account')}
          description={L(
            'إن قدّمت طلباً، تابعه من الرابط الذي وصلك بالبريد. وإن كنت عضواً فتواصل مع القيادة.',
            'If you applied, follow it from the link we e-mailed you. If you are a member, contact leadership.',
          )}
          action={
            <Link
              href="/join"
              className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-sm font-semibold text-on-accent"
            >
              {L('صفحة الانضمام', 'Join page')}
            </Link>
          }
        />
        {held.length > 0 && (
          <section
            className="rounded-shape-2xl border border-line bg-surface p-6"
            aria-labelledby="positions-title"
          >
            <h2 id="positions-title" className="text-xl font-extrabold">
              {L('مناصبي', 'My positions')}
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {held.map((x) => (
                <li key={x.assignmentId} className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-12 shrink-0 items-center justify-center rounded-shape-lg bg-accent-soft text-accent-text"
                  >
                    <UsersRound size={20} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold">
                      {x.title?.[lang] ?? x.roleName[lang]}
                      {x.committeeName ? ` • ${x.committeeName[lang]}` : ''}
                    </p>
                    <p className="text-sm text-muted">
                      {L('منذ', 'Since')} {formatDate(x.startsAt, lang)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
        <MyDataSection lang={lang} />
      </div>
    );
  }

  const { state, card, lastLeave } = mine;
  const days = state.termEndsAt ? Math.ceil((Date.parse(state.termEndsAt) - nowMs()) / DAY) : null;
  const start = state.termStartsAt ? Date.parse(state.termStartsAt) : null;
  const end = state.termEndsAt ? Date.parse(state.termEndsAt) : null;
  const pct =
    start && end && end > start
      ? Math.min(100, Math.max(0, Math.round(((nowMs() - start) / (end - start)) * 100)))
      : 0;
  const active = state.status === 'active';
  const soon = active && days !== null && days <= 30;

  return (
    <div data-wide className="m-enter flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold">{L('عضويتي', 'My membership')}</h1>
        <p className="text-muted">
          {L('بطاقتك، ومدة عضويتك، وما يمكنك فعله.', 'Your card, your term and what you can do.')}
        </p>
      </div>

      {state.status === 'suspended' && (
        <Alert tone="warning">
          {L(
            'عضويتك موقوفة مؤقتاً. بطاقتك لا تُظهر عضوية سارية حتى تعود.',
            'Your membership is paused. Your card does not show a valid membership until you are back.',
          )}
          {state.suspendedUntil &&
            ` ${L('تعود في', 'Back on')} ${formatDate(state.suspendedUntil, lang)}.`}
        </Alert>
      )}
      {state.status === 'expired' && (
        <Alert tone="warning">
          {L(
            'انتهت مدة عضويتك. اطلب التجديد لتعود بطاقتك سارية.',
            'Your term has ended. Request a renewal to make your card valid again.',
          )}
        </Alert>
      )}
      {state.status === 'ended' && (
        <Alert tone="info">
          {L(
            'انتهت عضويتك. حسابك باقٍ لشهاداتك ولا تظهر في الدليل.',
            'Your membership has ended. Your account stays for your certificates and you are not in the directory.',
          )}
        </Alert>
      )}
      {lastLeave?.status === 'declined' && (
        <Alert tone="info">
          {L(
            'لم توافق القيادة على طلب المغادرة، وما زلت عضواً.',
            'Leadership did not approve the leave request. You are still a member.',
          )}
        </Alert>
      )}
      {lastLeave?.status === 'approved' && state.status !== 'ended' && (
        <Alert tone="info">
          {L('وافقت القيادة على مغادرتك', 'Leadership approved your leaving')}
          {state.leavesOn ? ` — ${formatDate(state.leavesOn, lang)}` : ''}.
        </Alert>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] xl:items-start">
        <div className="flex flex-col gap-4">
          <div className="m-pop">
            <MembershipCard data={card} lang={lang} />
          </div>
          {active && <CardActions canRotate={!!mine.cardToken} />}
          {mine.cardToken && (
            <p className="text-sm text-muted">
              {L(
                'من يمسح الرمز يرى اسمك ورقم عضويتك وحالتها وتاريخ انتهائها فقط. ',
                'Whoever scans the code sees only your name, member number, status and end date. ',
              )}
              <Link
                href={`/verify/member/${mine.cardToken}`}
                className="font-semibold text-accent-text underline underline-offset-4"
              >
                {L('شاهد صفحة التحقق', 'See the verification page')}
              </Link>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <section
            className="rounded-shape-2xl border border-line bg-surface p-6"
            aria-labelledby="term-title"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="term-title" className="text-xl font-extrabold">
                {L('حالة العضوية', 'Membership status')}
              </h2>
              <Badge tone={MEMBER_STATUS_LABEL[state.status].tone}>
                {MEMBER_STATUS_LABEL[state.status][lang]}
              </Badge>
            </div>
            {state.termEndsAt ? (
              <>
                <div className="mt-4 flex items-center justify-between text-sm text-muted">
                  <span>{formatDate(state.joinedAt, lang)}</span>
                  <span>{formatDate(state.termEndsAt, lang)}</span>
                </div>
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full bg-surface-sunken"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={L('مضى من المدة', 'Term elapsed')}
                >
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-4 text-muted">
                  {days !== null && days >= 0 ? (
                    <>
                      <span className="text-3xl font-extrabold text-text">{days}</span>{' '}
                      {L('يوماً متبقياً', days === 1 ? 'day left' : 'days left')}
                    </>
                  ) : (
                    L(
                      `انتهت في ${formatDate(state.termEndsAt, lang)}.`,
                      `Ended on ${formatDate(state.termEndsAt, lang)}.`,
                    )
                  )}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted">
                {L('عضويتك مفتوحة بلا تاريخ انتهاء.', 'Your membership has no end date.')}
              </p>
            )}
            {(soon || state.status === 'expired') && (
              <div className="mt-4">
                <RenewalButton
                  requestedAt={state.renewalRequestedAt}
                  label={L('اطلب التجديد', 'Request a renewal')}
                />
              </div>
            )}
          </section>

          {mine.positions.length > 0 && (
            <section
              className="rounded-shape-2xl border border-line bg-surface p-6"
              aria-labelledby="positions-title"
            >
              <h2 id="positions-title" className="text-xl font-extrabold">
                {L('مناصبي', 'My positions')}
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                {mine.positions.map((x) => (
                  <li key={x.id} className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-12 shrink-0 items-center justify-center rounded-shape-lg bg-accent-soft text-accent-text"
                    >
                      <UsersRound size={20} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold">{x.title}</p>
                      <p className="text-sm text-muted">
                        {L('منذ', 'Since')} {formatDate(x.since, lang)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(active || state.status === 'suspended') && (
            <LeaveSection
              pending={
                state.leaveRequest
                  ? {
                      createdAt: state.leaveRequest.createdAt,
                      preferredLastDay: state.leaveRequest.preferredLastDay,
                    }
                  : null
              }
            />
          )}
        </div>
      </div>
      <MyDataSection lang={lang} />
    </div>
  );
}
