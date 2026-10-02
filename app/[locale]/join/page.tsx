import { CalendarClock, Lock } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getUser } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { daysUntil } from '@/lib/time';
import { ApplicationForm } from '@/modules/membership/components/ApplicationForm';
import { ApplicationStatusPanel } from '@/modules/membership/components/ApplicationStatusPanel';
import { JoinFrame } from '@/modules/membership/components/JoinFrame';
import { SimpleMarkdown } from '@/modules/membership/components/SimpleMarkdown';
import { WithdrawApplication } from '@/modules/membership/components/WithdrawApplication';
import { getJoinCycle, getMyApplication, getReferenceData } from '@/modules/membership/queries';
import { fromApplicationRow } from '@/modules/membership/schemas';

/**
 * /join — the dedicated membership page (D-001). The phase comes from the database view, so the page changes
 * state exactly when the window opens or closes, with no cron and no deploy.
 */
export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  const { edit } = await searchParams;

  const [cycle, user] = await Promise.all([getJoinCycle(), getUser()]);
  const title = cycle ? (ar ? cycle.nameAr : cycle.nameEn || cycle.nameAr) : '';
  const description = cycle
    ? ar
      ? cycle.descriptionAr
      : cycle.descriptionEn || cycle.descriptionAr
    : null;

  // ---- closed (nothing open or scheduled)
  if (!cycle || cycle.phase === 'completed') {
    return (
      <JoinFrame ar={ar}>
        <ClosedCard ar={ar} />
      </JoinFrame>
    );
  }

  // ---- scheduled
  if (cycle.phase === 'scheduled') {
    const days = daysUntil(cycle.opensAt);
    return (
      <JoinFrame ar={ar}>
        <div className="flex flex-col items-center gap-4 text-center">
          <CalendarClock size={40} className="text-accent" aria-hidden="true" />
          <h2 className="text-xl font-extrabold">
            {ar
              ? `يفتح استقبال الطلبات في ${formatDate(cycle.opensAt, lang)}`
              : `Applications open on ${formatDate(cycle.opensAt, lang)}`}
          </h2>
          <p className="text-muted tabular-nums">
            {ar ? `بعد ${days} يوم` : `In ${days} day${days === 1 ? '' : 's'}`} · {title}
          </p>
          {description && (
            <div className="w-full text-start">
              <SimpleMarkdown source={description} />
            </div>
          )}
          {!user && (
            <>
              <p className="text-muted">
                {ar ? 'أنشئ حسابك الآن لتكون جاهزًا.' : 'Create your account now so you are ready.'}
              </p>
              <Link
                href="/register"
                className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-on-accent hover:bg-accent-hover"
              >
                {ar ? 'إنشاء حساب' : 'Create account'}
              </Link>
            </>
          )}
        </div>
      </JoinFrame>
    );
  }

  const application = user ? await getMyApplication(cycle.id) : null;
  const active = application && application.status !== 'withdrawn' ? application : null;

  // ---- closed, awaiting decisions
  if (cycle.phase === 'closed') {
    return (
      <JoinFrame ar={ar}>
        <div className="flex flex-col items-center gap-4 text-center">
          <Lock size={40} className="text-accent" aria-hidden="true" />
          <h2 className="text-xl font-extrabold">
            {ar
              ? `أُغلق استقبال الطلبات في ${formatDate(cycle.effectiveClosesAt, lang)}`
              : `Applications closed on ${formatDate(cycle.effectiveClosesAt, lang)}`}
          </h2>
          <p className="text-muted">
            {ar ? 'ستصلك النتيجة بالبريد الإلكتروني.' : 'You will receive the result by e-mail.'}
          </p>
          {active && (
            <Link href="/account/membership" className="text-accent underline">
              {ar ? 'عرض حالة طلبي' : 'View my application'}
            </Link>
          )}
        </div>
      </JoinFrame>
    );
  }

  // ---- open
  const header = (
    <div className="mb-6 flex flex-col gap-3">
      <h2 className="text-xl font-extrabold">✦ {title}</h2>
      <p className="text-sm text-muted">
        {ar
          ? `مفتوح حتى ${formatDate(cycle.effectiveClosesAt, lang)}`
          : `Open until ${formatDate(cycle.effectiveClosesAt, lang)}`}
      </p>
      {description && <SimpleMarkdown source={description} />}
    </div>
  );

  if (!user) {
    return (
      <JoinFrame ar={ar}>
        {header}
        <ol className="mb-6 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
          <li>① {ar ? 'سجّل الدخول' : 'Sign in'}</li>
          <li>② {ar ? 'املأ النموذج' : 'Fill in the form'}</li>
          <li>③ {ar ? 'انتظر القرار' : 'Wait for the decision'}</li>
        </ol>
        <div className="flex flex-wrap gap-3">
          <Link
            href={{ pathname: '/login', query: { redirect: '/join' } }}
            className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-on-accent hover:bg-accent-hover"
          >
            {ar ? 'تسجيل الدخول للتقديم' : 'Sign in to apply'}
          </Link>
          <Link
            href={{ pathname: '/register', query: { redirect: '/join' } }}
            className="rounded-full border border-line-accent px-6 py-2 text-sm font-semibold text-accent hover:bg-surface-raised"
          >
            {ar ? 'إنشاء حساب' : 'Create account'}
          </Link>
        </div>
      </JoinFrame>
    );
  }

  const reference = await getReferenceData();

  if (active && !(edit === '1' && active.status === 'submitted')) {
    return (
      <JoinFrame ar={ar}>
        {header}
        <h3 className="mb-3 text-lg font-bold">{ar ? 'طلبك' : 'Your application'}</h3>
        <ApplicationStatusPanel
          status={active.status}
          submittedAt={active.submittedAt}
          decidedAt={active.decidedAt}
          lang={lang}
        />
        <div className="mt-6 flex flex-wrap gap-3">
          {active.status === 'submitted' && (
            <>
              <Link
                href={{ pathname: '/join', query: { edit: '1' } }}
                className="rounded-full border border-line-accent px-6 py-2 text-sm font-semibold text-accent hover:bg-surface-raised"
              >
                {ar ? 'تعديل الطلب' : 'Edit application'}
              </Link>
              <WithdrawApplication id={active.id} />
            </>
          )}
          <Link href="/account/membership" className="self-center text-sm text-accent underline">
            {ar ? 'طلبي في حسابي' : 'My application in my account'}
          </Link>
        </div>
      </JoinFrame>
    );
  }

  return (
    <JoinFrame ar={ar}>
      {header}
      <ApplicationForm
        cycle={cycle}
        reference={reference}
        applicationId={active?.id}
        initial={active ? fromApplicationRow(active.row) : undefined}
        defaultName={String(user.user_metadata?.full_name ?? '')}
      />
    </JoinFrame>
  );
}

function ClosedCard({ ar }: { ar: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Lock size={40} className="text-accent" aria-hidden="true" />
      <h2 className="text-xl font-extrabold">
        {ar ? 'استقبال طلبات العضوية مغلق حاليًا' : 'Membership applications are closed'}
      </h2>
      <p className="max-w-md text-muted">
        {ar
          ? 'نفتح باب العضوية مرة في السنة تقريبًا. تابع حساباتنا ليصلك إعلان الدورة القادمة.'
          : 'We open membership about once a year. Follow our accounts to hear about the next intake.'}
      </p>
      <p className="text-muted">
        {ar ? 'يمكنك حضور فعالياتنا دون عضوية →' : 'You can attend our events without membership →'}{' '}
        <Link href="/events" className="text-accent underline">
          {ar ? 'تصفح الفعاليات' : 'Browse events'}
        </Link>
      </p>
    </div>
  );
}
