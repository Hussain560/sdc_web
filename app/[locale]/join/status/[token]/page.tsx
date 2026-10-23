import {
  CircleCheck,
  Hourglass,
  KeyRound,
  Lock,
  Mail,
  PenLine,
  Search,
  Send,
  Undo2,
  Clock,
} from 'lucide-react';
import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { FocusedHeader } from '@/components/layout/FocusedHeader';
import { Timeline, type TimelineItem } from '@/components/patterns/Timeline';
import { LinkButton } from '@/components/ui';
import { formatDate } from '@/lib/format';
import {
  EditRequestedForm,
  ResendActivation,
  WithdrawButton,
} from '@/modules/membership/components/TrackingActions';
import { RequestLinkForm } from '@/modules/membership/components/JoinClient';
import { getTracking, type Tracking } from '@/modules/membership/track-queries';

// The link carries the only credential: never index it, never leak it through the referrer.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

const when = (iso: string, lang: 'ar' | 'en') =>
  new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Riyadh',
  }).format(new Date(iso));
const shortDay = (iso: string, lang: 'ar' | 'en') =>
  new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Riyadh',
  }).format(new Date(iso));

/**
 * /join/status/<token> — follow an application without signing in (MBR-009). Everything shown comes from one database
 * function that exposes only what the applicant may see: the status, the dates, the reviewer's request when one was
 * made. No score, no reviewer, no internal note, no queue number. A wrong or old link shows one neutral page.
 */
export default async function TrackingPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const res = await getTracking(token);

  if (!res.ok) {
    return (
      <div className="min-h-dvh bg-canvas">
        <FocusedHeader title={L('متابعة طلب الانضمام', 'Follow your application')} />
        <main className="mx-auto flex max-w-md flex-col items-center gap-5 px-4 py-16 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-surface-raised text-muted">
            <Lock size={28} aria-hidden="true" />
          </span>
          <h1 className="t-h2">
            {res.code === 'RATE_LIMITED'
              ? L('محاولات كثيرة', 'Too many attempts')
              : L('هذا الرابط غير صالح', 'This link is not valid')}
          </h1>
          <p className="text-muted">
            {res.code === 'RATE_LIMITED'
              ? L('انتظر دقائق ثم حاول مرة أخرى.', 'Wait a few minutes and try again.')
              : L(
                  'اكتب بريدك وسنرسل رابطاً جديداً إن كان لديك طلب. نرد بالرسالة نفسها دائماً.',
                  'Enter your e-mail and we will send a new link if you have an application. The answer is always the same.',
                )}
          </p>
          {res.code !== 'RATE_LIMITED' && (
            <div className="w-full rounded-shape-xl border border-line bg-surface p-5 text-start">
              <RequestLinkForm />
            </div>
          )}
        </main>
      </div>
    );
  }

  const t = res.tracking;
  const cycleName = ar ? t.cycle.nameAr : t.cycle.nameEn || t.cycle.nameAr;
  const first = ar ? t.firstName : t.firstNameEn || t.firstName;
  const reviewStart = new Date(new Date(t.cycle.closesAt).getTime() + 86_400_000).toISOString();
  const decisionBy = t.cycle.reviewEndsAt;
  const at = (kind: string) => t.timeline.find((x) => x.kind === kind)?.at;

  const ico = (n: ReactNode) => n;
  const items: TimelineItem[] = [
    {
      key: 'sent',
      icon: ico(<CircleCheck />),
      tone: 'done',
      title: L('أُرسل الطلب', 'Application sent'),
      detail: when(t.submittedAt, lang),
    },
  ];
  const reviewed = at('review_started');
  switch (t.status) {
    case 'submitted':
      items.push({
        key: 'review',
        icon: <Hourglass />,
        tone: 'now',
        title: L('بانتظار المراجعة', 'Waiting for review'),
        detail: L(`تبدأ ${shortDay(reviewStart, lang)}`, `Starts ${shortDay(reviewStart, lang)}`),
      });
      items.push({
        key: 'decision',
        icon: <Mail />,
        tone: 'pending',
        title: L('القرار', 'The decision'),
        detail: decisionBy
          ? L(`بحلول ${when(decisionBy, lang)}`, `By ${when(decisionBy, lang)}`)
          : undefined,
      });
      break;
    case 'under_review':
      items.push({
        key: 'review',
        icon: <Search />,
        tone: 'done',
        title: L('بدأت المراجعة', 'Review started'),
        detail: reviewed ? when(reviewed, lang) : undefined,
      });
      items.push({
        key: 'decision',
        icon: <Hourglass />,
        tone: 'now',
        title: L('القرار', 'The decision'),
        detail: decisionBy
          ? L(`بحلول ${when(decisionBy, lang)}`, `By ${when(decisionBy, lang)}`)
          : undefined,
      });
      break;
    case 'info_requested':
      items.push({
        key: 'review',
        icon: <Search />,
        tone: 'done',
        title: L('بدأت المراجعة', 'Review started'),
        detail: reviewed ? when(reviewed, lang) : undefined,
      });
      items.push({
        key: 'info',
        icon: <PenLine />,
        tone: 'warn',
        title: L('طُلب منك تعديل', 'We asked you for a change'),
        detail: t.infoRequestedAt ? when(t.infoRequestedAt, lang) : undefined,
      });
      items.push({
        key: 'decision',
        icon: <Hourglass />,
        tone: 'pending',
        title: L('القرار', 'The decision'),
        detail: L('بعد إعادة الإرسال', 'After you resubmit'),
      });
      break;
    case 'waitlisted':
      items.push({
        key: 'review',
        icon: <Search />,
        tone: 'done',
        title: L('رُوجع الطلب', 'The application was reviewed'),
        detail: reviewed ? when(reviewed, lang) : undefined,
      });
      items.push({
        key: 'wait',
        icon: <Hourglass />,
        tone: 'now',
        title: L('قائمة الانتظار', 'Waiting list'),
        detail: decisionBy
          ? L(`حتى ${shortDay(decisionBy, lang)}`, `Until ${shortDay(decisionBy, lang)}`)
          : undefined,
      });
      break;
    case 'accepted':
      items.push({
        key: 'review',
        icon: <Search />,
        tone: 'done',
        title: L('رُوجع الطلب', 'The application was reviewed'),
        detail: reviewed ? when(reviewed, lang) : undefined,
      });
      items.push({
        key: 'acc',
        icon: <CircleCheck />,
        tone: 'done',
        title: L('تم قبول طلبك', 'Accepted'),
        detail: t.acceptedAt ? when(t.acceptedAt, lang) : undefined,
      });
      items.push({
        key: 'act',
        icon: <KeyRound />,
        tone: 'now',
        title: L('فعّل حسابك', 'Activate your account'),
        detail: t.activationDeadline
          ? L(
              `قبل ${when(t.activationDeadline, lang)}`,
              `Before ${when(t.activationDeadline, lang)}`,
            )
          : undefined,
      });
      break;
    case 'rejected':
      items.push({
        key: 'review',
        icon: <Search />,
        tone: 'done',
        title: L('رُوجع الطلب', 'The application was reviewed'),
        detail: reviewed ? when(reviewed, lang) : undefined,
      });
      items.push({
        key: 'sentdec',
        icon: <Mail />,
        tone: 'done',
        title: L('أُرسل القرار', 'The decision was sent'),
        detail: at('decided') ? when(at('decided')!, lang) : undefined,
      });
      break;
    case 'withdrawn':
      items.push({
        key: 'wd',
        icon: <Undo2 />,
        tone: 'done',
        title: L('سحبت الطلب', 'You withdrew the application'),
        detail: at('withdrawn') ? when(at('withdrawn')!, lang) : undefined,
      });
      break;
    case 'lapsed':
      items.push({
        key: 'acc',
        icon: <CircleCheck />,
        tone: 'done',
        title: L('تم قبول طلبك', 'Accepted'),
        detail: t.acceptedAt ? when(t.acceptedAt, lang) : undefined,
      });
      items.push({
        key: 'lapsed',
        icon: <Clock />,
        tone: 'danger',
        title: L('انتهت مهلة التفعيل', 'The activation period ended'),
      });
      break;
  }

  const hero = heroFor(t, lang, { reviewStart, decisionBy, cycleName });
  const bar: Record<string, string> = {
    warn: 'bg-warning',
    accent: 'bg-accent',
    info: 'bg-info',
    muted: 'bg-line-strong',
  };

  return (
    <div className="min-h-dvh bg-canvas">
      <FocusedHeader title={L('متابعة طلب الانضمام', 'Follow your application')} />
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-8 md:py-10">
        <section className="m-enter flex flex-wrap items-center justify-between gap-x-6 gap-y-1 rounded-shape-xl border border-line bg-surface px-5 py-4">
          <div>
            <p className="text-sm text-muted">{L('الرقم المرجعي', 'Reference number')}</p>
            <p dir="ltr" className="text-start font-mono text-2xl font-bold tracking-[0.04em]">
              {t.reference}
            </p>
          </div>
          <p className="text-sm text-muted">{cycleName}</p>
        </section>

        <div className="flex min-w-0 flex-col gap-5">
          <section className="m-enter relative overflow-hidden rounded-shape-xl border border-line bg-surface p-6 md:p-8">
            <span
              aria-hidden="true"
              className={`absolute inset-x-0 top-0 h-1.5 ${bar[hero.bar]}`}
            />
            <div className="mb-4 flex justify-end">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${hero.chipClass}`}
              >
                {hero.chipIcon}
                {hero.chip}
              </span>
            </div>
            <h1 className="t-h1">{hero.title(first)}</h1>
            <p className="t-lede mt-3 text-muted">{hero.text}</p>
            <h2 id="trk-timeline" className="sr-only">
              {L('مسار الطلب', 'Application timeline')}
            </h2>
            <Timeline
              className="mt-7"
              items={items}
              label={L('مسار الطلب', 'Application timeline')}
            />
          </section>

          {t.status === 'info_requested' && t.infoRequest && (
            <section
              className="rounded-shape-xl border border-warning bg-warning-soft p-5 md:p-6"
              aria-labelledby="trk-msg"
            >
              <h2 id="trk-msg" className="mb-2 flex items-center gap-2 font-bold">
                <Mail size={18} aria-hidden="true" />
                {L('رسالة من فريق المراجعة', 'A message from the review team')}
              </h2>
              <p className="leading-8">{t.infoRequest}</p>
              <p className="mt-3 text-sm text-muted">
                {t.infoRequestedAt ? when(t.infoRequestedAt, lang) : ''}
                {t.infoDeadline
                  ? L(
                      ` · الموعد الأخير لإعادة الإرسال: ${when(t.infoDeadline, lang)}`,
                      ` · Resubmit by: ${when(t.infoDeadline, lang)}`,
                    )
                  : ''}
              </p>
            </section>
          )}
          {t.status === 'info_requested' && t.editable && (
            <EditRequestedForm token={token} values={t.editValues} questions={t.editQuestions} />
          )}
          {t.status === 'info_requested' && !t.editable && (
            <p className="rounded-shape-lg bg-surface-raised p-4 text-sm text-muted">
              {L(
                'انتهت مهلة تعديل هذا الطلب. تواصل معنا إن كنت تحتاج مساعدة.',
                'The time to edit this application has ended. Contact us if you need help.',
              )}
            </p>
          )}
          {t.status === 'accepted' && <ResendActivation token={token} />}

          {(t.status === 'rejected' || t.status === 'lapsed' || t.status === 'withdrawn') && (
            <div>
              <LinkButton href="/events" variant="secondary">
                {L('تصفّح الفعاليات', 'Browse events')}
              </LinkButton>
            </div>
          )}
          {t.withdrawable && (
            <div>
              <WithdrawButton token={token} />
            </div>
          )}
          <p className="flex items-start gap-2 rounded-shape-lg bg-surface-raised p-3 text-sm text-muted">
            <Lock size={15} aria-hidden="true" className="mt-0.5 shrink-0" />
            {L(
              'هذا الرابط خاص بك. لا يحمل بياناتك الشخصية، فلا تشاركه.',
              'This link is yours. It carries no personal data, so do not share it.',
            )}
          </p>
          <p className="text-sm text-muted" style={{ '--i': 0 } as CSSProperties}>
            {L(
              `أُرسل طلبك ${formatDate(t.submittedAt, lang)}. نراسلك على ${t.emailMasked}.`,
              `Sent ${formatDate(t.submittedAt, lang)}. We write to ${t.emailMasked}.`,
            )}
          </p>
        </div>
      </main>
    </div>
  );
}

/** The calm headline of each state. A rejection says nothing about why and a waiting applicant never sees a number. */
function heroFor(
  t: Tracking,
  lang: 'ar' | 'en',
  d: { reviewStart: string; decisionBy: string | null; cycleName: string },
): {
  bar: 'warn' | 'accent' | 'info' | 'muted';
  chip: string;
  chipClass: string;
  chipIcon: ReactNode;
  title: (name: string) => string;
  text: string;
} {
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const date = (iso: string) => shortDay(iso, lang);
  const soft = 'bg-info-soft text-info';
  switch (t.status) {
    case 'submitted':
      return {
        bar: 'info',
        chip: L('مُستلم', 'Received'),
        chipClass: soft,
        chipIcon: <Mail size={14} aria-hidden="true" />,
        title: () => L('وصلنا طلبك', 'We received your application'),
        text: L(
          `يبدأ فريق المراجعة القراءة في ${date(d.reviewStart)}. ستصلك رسالة عند أي تغيير.`,
          `The review team starts reading on ${date(d.reviewStart)}. You will get a message if anything changes.`,
        ),
      };
    case 'under_review':
      return {
        bar: 'info',
        chip: L('قيد المراجعة', 'Under review'),
        chipClass: soft,
        chipIcon: <Search size={14} aria-hidden="true" />,
        title: () => L('نقرأ طلبك الآن', 'We are reading your application'),
        text: L(
          'يراجعه أحد أعضاء القيادة. لا تحتاج أن تفعل شيئاً.',
          'A member of the leadership is reviewing it. You do not need to do anything.',
        ),
      };
    case 'info_requested':
      return {
        bar: 'warn',
        chip: L('بانتظار تعديلك', 'Waiting for your edit'),
        chipClass: 'bg-warning-soft text-warning',
        chipIcon: <PenLine size={14} aria-hidden="true" />,
        title: () => L('نحتاج تعديلاً بسيطاً', 'We need a small change'),
        text: L(
          `اقرأ رسالة الفريق، وعدّل الجزء المطلوب فقط، ثم أعد الإرسال${t.infoDeadline ? ` قبل ${date(t.infoDeadline)}` : ''}.`,
          `Read the team's message, edit only the part asked for, then resubmit${t.infoDeadline ? ` before ${date(t.infoDeadline)}` : ''}.`,
        ),
      };
    case 'waitlisted':
      return {
        bar: 'warn',
        chip: L('قائمة الانتظار', 'Waiting list'),
        chipClass: 'bg-warning-soft text-warning',
        chipIcon: <Hourglass size={14} aria-hidden="true" />,
        title: () => L('طلبك في قائمة الانتظار', 'Your application is on the waiting list'),
        text: L(
          `أعجبنا طلبك، لكن مقاعد الدورة اكتملت. إذا تحرّر مقعد${d.decisionBy ? ` قبل ${date(d.decisionBy)}` : ''} نرسل لك بريد القبول مباشرة.`,
          `We liked your application, but the intake is full. If a place opens${d.decisionBy ? ` before ${date(d.decisionBy)}` : ''} we send you the acceptance e-mail right away.`,
        ),
      };
    case 'accepted':
      return {
        bar: 'accent',
        chip: L('مقبول', 'Accepted'),
        chipClass: 'bg-accent-soft text-on-accent-soft',
        chipIcon: <CircleCheck size={14} aria-hidden="true" />,
        title: () => L('مبروك، تم قبولك!', 'Congratulations, you are in!'),
        text: L(
          `أرسلنا رابط تفعيل حسابك إلى بريدك. فعّله${t.activationDeadline ? ` قبل ${date(t.activationDeadline)}` : ' خلال أيام'} لتحجز مقعدك.`,
          `We sent the link to activate your account to your e-mail. Use it${t.activationDeadline ? ` before ${date(t.activationDeadline)}` : ' within days'} to keep your place.`,
        ),
      };
    case 'rejected':
      return {
        bar: 'muted',
        chip: L('انتهت المراجعة', 'Review finished'),
        chipClass: 'bg-surface-raised text-muted',
        chipIcon: <Mail size={14} aria-hidden="true" />,
        title: () =>
          L(
            'لم نتمكن من قبول طلبك في هذه الدورة',
            'We could not accept your application in this cycle',
          ),
        text: L(
          'شكراً لاهتمامك بالمجتمع. يمكنك التقديم مرة أخرى في الدورة القادمة، وفعالياتنا العامة مفتوحة لك دائماً.',
          'Thank you for your interest in the community. You can apply again in the next intake, and our public events are always open to you.',
        ),
      };
    case 'withdrawn':
      return {
        bar: 'muted',
        chip: L('مسحوب', 'Withdrawn'),
        chipClass: 'bg-surface-raised text-muted',
        chipIcon: <Undo2 size={14} aria-hidden="true" />,
        title: () => L('سحبت طلبك', 'You withdrew your application'),
        text: L(
          'لن نراجع هذا الطلب. يمكنك التقديم من جديد ما دام التسجيل مفتوحاً.',
          'We will not review this application. You can apply again while applications are open.',
        ),
      };
    case 'lapsed':
      return {
        bar: 'muted',
        chip: L('انتهت مهلة التفعيل', 'Activation period ended'),
        chipClass: 'bg-surface-raised text-muted',
        chipIcon: <Clock size={14} aria-hidden="true" />,
        title: () => L('انتهت مهلة تفعيل حسابك', 'The activation period ended'),
        text: L(
          'لم يعد المقعد محجوزاً لك. يمكنك التقديم في الدورة القادمة.',
          'The place is no longer held for you. You can apply in the next intake.',
        ),
      };
    default:
      return {
        bar: 'muted',
        chip: '',
        chipClass: '',
        chipIcon: <Send size={14} />,
        title: () => '',
        text: '',
      };
  }
}
