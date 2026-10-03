import { CalendarClock, Lock } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getUser } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { daysUntil } from '@/lib/time';
import { ApplicationForm } from '@/modules/membership/components/ApplicationForm';
import { JoinFrame } from '@/modules/membership/components/JoinFrame';
import { SimpleMarkdown } from '@/modules/membership/components/SimpleMarkdown';
import { getJoinCycle, getReferenceData } from '@/modules/membership/queries';

/**
 * /join — the dedicated membership page (D-001). The phase comes from the database view, so the page changes
 * state exactly when the window opens or closes, with no cron and no deploy.
 */
export default async function JoinPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';

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
        </div>
      </JoinFrame>
    );
  }

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

  // A signed-in member does not apply again.
  if (user) {
    return (
      <JoinFrame ar={ar}>
        {header}
        <p className="text-muted">
          {ar
            ? 'أنت مسجّل الدخول بحساب عضو. التقديم هنا لمن ليس عضوًا بعد.'
            : 'You are signed in with a member account. Applying here is for people who are not members yet.'}
        </p>
        <Link href="/account" className="mt-4 inline-block text-accent underline">
          {ar ? 'حسابي' : 'My account'}
        </Link>
      </JoinFrame>
    );
  }

  const reference = await getReferenceData();
  return (
    <JoinFrame ar={ar}>
      {header}
      <p className="mb-6 text-sm text-muted">
        {ar
          ? 'لا تحتاج إلى حساب للتقديم. إذا قُبل طلبك سنراسلك على بريدك برابط لتفعيل حسابك في بوابة الأعضاء.'
          : 'You do not need an account to apply. If you are accepted we e-mail you a link to activate your account in the members portal.'}
      </p>
      <ApplicationForm cycle={cycle} reference={reference} />
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
          ? 'تابع حساباتنا ليصلك إعلان فتح باب العضوية في الدورة القادمة.'
          : 'Follow our accounts to hear when membership opens for the next intake.'}
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
