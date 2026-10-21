import {
  CalendarDays,
  CalendarPlus,
  FileText,
  IdCard,
  KeyRound,
  Lock,
  Mail,
  Search,
  Star,
  Users,
  Clock,
  Link2,
  PenLine,
  Send,
} from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { PageMain } from '@/components/motion/PageMain';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SectionHeader } from '@/components/patterns/SectionHeader';
import { Accordion, Badge, Breadcrumb, Card, LinkButton } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { getUser } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { daysUntil } from '@/lib/time';
import { getAccountState } from '@/modules/account/state';
import {
  ApplyCta,
  Countdown,
  CopyLinkButton,
  RequestLinkForm,
} from '@/modules/membership/components/JoinClient';
import { SimpleMarkdown } from '@/modules/membership/components/SimpleMarkdown';
import { getJoinCycle } from '@/modules/membership/queries';
import type { PublicCycle } from '@/modules/membership/types';

const dayTime = (iso: string, lang: 'ar' | 'en') =>
  new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Riyadh',
  }).format(new Date(iso));
const dayMonth = (iso: string, lang: 'ar' | 'en') =>
  new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Riyadh',
  }).format(new Date(iso));
const weekdayDate = (iso: string, lang: 'ar' | 'en') =>
  new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Riyadh',
  }).format(new Date(iso));

/**
 * /join — the membership entrance (D-001, Sprint 18 design). The state comes from the database view, so the page
 * changes exactly when the window opens or closes: open, scheduled, closed, and "already a member" for a signed-in
 * member. A person who applied from this browser sees their application instead of the apply button.
 */
export default async function JoinPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);

  const [cycle, user, account] = await Promise.all([getJoinCycle(), getUser(), getAccountState()]);
  const cycleName = cycle ? (ar ? cycle.nameAr : cycle.nameEn || cycle.nameAr) : '';
  const description = cycle
    ? ar
      ? cycle.descriptionAr
      : cycle.descriptionEn || cycle.descriptionAr
    : null;
  const member = account?.member && account.member.status !== 'ended' ? account.member : null;
  const wrap = 'mx-auto w-full max-w-(--container) px-4 md:px-8';

  let hero: ReactNode;
  if (user && member)
    hero = <MemberHero lang={lang} memberNo={member.memberNo} termEndsAt={member.termEndsAt} />;
  else if (!cycle || cycle.phase === 'completed') hero = <ClosedHero lang={lang} cycle={cycle} />;
  else if (cycle.phase === 'scheduled')
    hero = <ScheduledHero lang={lang} cycle={cycle} cycleName={cycleName} />;
  else if (cycle.phase === 'closed') hero = <ClosedHero lang={lang} cycle={cycle} waiting />;
  else
    hero = <OpenHero lang={lang} cycle={cycle} cycleName={cycleName} description={description} />;

  const gets = [
    {
      icon: CalendarDays,
      title: L('ورش ومعسكرات', 'Workshops and camps'),
      text: L(
        'أكثر من 20 فعالية في السنة، بالعربية ومجاناً.',
        'More than 20 events a year, in Arabic and free.',
      ),
    },
    {
      icon: Star,
      title: L('شهادات حضور', 'Attendance certificates'),
      text: L(
        'تصدر لكل فعالية تحضرها، ويُتحقّق منها برابط.',
        'Issued for every event you attend and verifiable with a link.',
      ),
    },
    {
      icon: IdCard,
      title: L('بطاقة عضوية', 'A membership card'),
      text: L('رقمية برمز QR، تحفظها في جوالك.', 'Digital with a QR code, kept in your phone.'),
    },
    {
      icon: Users,
      title: L('ملف في الدليل', 'A directory profile'),
      text: L(
        'يراه الزوار والجهات المهتمة، بما تختار أن تُظهره.',
        'Seen by visitors and interested organisations, as much as you choose to show.',
      ),
    },
  ];
  const before = [
    {
      icon: Clock,
      title: L('10 دقائق تقريباً', 'About 10 minutes'),
      text: L(
        'والمسودة تُحفظ في متصفحك إذا انقطعت.',
        'Your draft is kept in your browser if you get interrupted.',
      ),
    },
    {
      icon: Mail,
      title: L('بريد وجوال', 'An e-mail and a phone'),
      text: L(
        'لنرسل لك القرار ولا يظهران للعموم.',
        'So we can send the decision. Neither is public.',
      ),
    },
    {
      icon: PenLine,
      title: L('نبذة قصيرة', 'A short bio'),
      text: L('بضعة أسطر عنك وعن سبب انضمامك.', 'A few lines about you and why you want to join.'),
    },
    {
      icon: Link2,
      title: L('روابط أعمالك', 'Links to your work'),
      text: L(
        'اختيارية: GitHub أو LinkedIn أو معرض أعمال.',
        'Optional: GitHub, LinkedIn or a portfolio.',
      ),
    },
  ];
  const faq = [
    {
      id: 'q1',
      question: L('كيف نختار الأعضاء؟', 'How do we choose members?'),
      answer: L(
        'يقرأ كل طلب مراجع من القيادة، ويقيّمه بمعايير معلنة: الدافع، والخبرة أو الرغبة في التعلّم، والمشاركة المتوقعة. لا يقرّر الرقم وحده؛ بل يقرّر شخص.',
        'A reviewer from the leadership reads every application and scores it against stated criteria: motivation, experience or eagerness to learn, and expected participation. A number never decides alone; a person does.',
      ),
    },
    {
      id: 'q2',
      question: L('هل العضوية مجانية؟', 'Is membership free?'),
      answer: L('نعم، العضوية مجانية بالكامل.', 'Yes, membership is completely free.'),
    },
    {
      id: 'q3',
      question: L('ماذا لو لم أُقبل هذه المرة؟', 'What if I am not accepted this time?'),
      answer: L(
        'يصلك بريد بسيط، ويمكنك التقديم في الدورة القادمة. فعالياتنا العامة مفتوحة لك دائماً.',
        'You get a plain e-mail, and you can apply in the next intake. Our public events are always open to you.',
      ),
    },
  ];

  return (
    <>
      <SiteHeader />
      <PageMain>
        <div className={`${wrap} pt-6`}>
          <Breadcrumb
            label={L('مسار التنقل', 'Breadcrumb')}
            items={[
              { label: L('الرئيسية', 'Home'), href: '/' },
              { label: L('انضم إلينا', 'Join us') },
            ]}
          />
        </div>
        <div className={`${wrap} mt-6`}>{hero}</div>

        {cycle && cycle.phase !== 'completed' && (
          <>
            <section aria-labelledby="j-gets" className={`${wrap} mt-(--section-gap)`}>
              <SectionHeader headingId="j-gets" title={L('ما الذي تحصل عليه', 'What you get')} />
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {gets.map((g, i) => (
                  <li key={g.title} className="m-reveal" style={{ '--i': i } as CSSProperties}>
                    <Card
                      variant={i % 2 === 0 ? 'feature' : 'feature-alt'}
                      className="flex h-full flex-col gap-3"
                    >
                      <span
                        aria-hidden="true"
                        className="flex size-12 items-center justify-center rounded-shape-md bg-accent-soft text-on-accent-soft"
                      >
                        <g.icon className="size-6" />
                      </span>
                      <h3 className="t-h4">{g.title}</h3>
                      <p className="text-muted">{g.text}</p>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>

            <div className={`${wrap} mt-(--section-gap) grid gap-10 lg:grid-cols-2`}>
              <section aria-labelledby="j-faq">
                <SectionHeader headingId="j-faq" title={L('أسئلة سريعة', 'Quick questions')} />
                <Accordion items={faq} />
              </section>
              <section aria-labelledby="j-before">
                <SectionHeader headingId="j-before" title={L('قبل أن تبدأ', 'Before you start')} />
                <ul className="grid gap-4 sm:grid-cols-2">
                  {before.map((b, i) => (
                    <li
                      key={b.title}
                      className="m-reveal flex gap-3 rounded-shape-xl bg-surface-raised p-4"
                      style={{ '--i': i } as CSSProperties}
                    >
                      <b.icon
                        size={20}
                        aria-hidden="true"
                        className="mt-1 shrink-0 text-accent-text"
                      />
                      <div>
                        <p className="font-bold">{b.title}</p>
                        <p className="text-sm text-muted">{b.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </>
        )}
      </PageMain>
      <SiteFooter />
    </>
  );
}

const heroCard =
  'relative overflow-hidden rounded-shape-2xl border border-line-accent bg-accent-soft p-6 md:p-10';
const dots = {
  backgroundImage:
    'radial-gradient(color-mix(in srgb, var(--accent) 22%, transparent) 1px, transparent 1px)',
  backgroundSize: '22px 22px',
} as CSSProperties;

function OpenHero({
  lang,
  cycle,
  cycleName,
  description,
}: {
  lang: 'ar' | 'en';
  cycle: PublicCycle;
  cycleName: string;
  description: string | null;
}) {
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const days = daysUntil(cycle.effectiveClosesAt);
  const closes = cycle.effectiveClosesAt;
  const review = cycle.reviewEndsAt
    ? L(
        `من ${dayMonth(new Date(new Date(closes).getTime() + 86_400_000).toISOString(), lang)} إلى ${dayMonth(new Date(new Date(cycle.reviewEndsAt).getTime() - 86_400_000).toISOString(), lang)}، وقد نطلب منك تعديلاً بسيطاً`,
        `From ${dayMonth(new Date(new Date(closes).getTime() + 86_400_000).toISOString(), lang)} to ${dayMonth(new Date(new Date(cycle.reviewEndsAt).getTime() - 86_400_000).toISOString(), lang)}, and we may ask for a small edit`,
      )
    : L(
        'بعد إغلاق باب التقديم، وقد نطلب منك تعديلاً بسيطاً',
        'After applications close, and we may ask for a small edit',
      );
  const steps = [
    {
      icon: FileText,
      title: L('قدّم طلبك', 'Apply'),
      text: L(`حتى ${dayTime(closes, lang)}`, `Until ${dayTime(closes, lang)}`),
    },
    { icon: Search, title: L('نراجع الطلبات', 'We review'), text: review },
    {
      icon: Mail,
      title: L('يصلك القرار بالبريد', 'You get the decision by e-mail'),
      text: cycle.reviewEndsAt
        ? L(
            `بحلول ${weekdayDate(cycle.reviewEndsAt, lang)}`,
            `By ${weekdayDate(cycle.reviewEndsAt, lang)}`,
          )
        : L('بعد المراجعة', 'After the review'),
    },
    {
      icon: KeyRound,
      title: L('فعّل حسابك', 'Activate your account'),
      text: L(
        `خلال ${cycle.activationDeadlineDays} أيام من القبول، بكلمة مرور تختارها`,
        `Within ${cycle.activationDeadlineDays} days of acceptance, with a password you choose`,
      ),
    },
    {
      icon: CalendarDays,
      title: L('عضويتك تبدأ', 'Your membership starts'),
      text: cycle.termEndsAt
        ? L(
            `وتستمر حتى ${formatDate(cycle.termEndsAt, lang)}، ويمكن تجديدها`,
            `Running until ${formatDate(cycle.termEndsAt, lang)}, and can be renewed`,
          )
        : L('وتستمر سنة، ويمكن تجديدها', 'Lasting a year, and can be renewed'),
    },
  ];
  return (
    <section
      aria-labelledby="j-title"
      className={`${heroCard} grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={dots}
      />
      <div className="m-enter relative flex flex-col items-start gap-5">
        <Badge tone="accent" icon={<span className="size-2 rounded-full bg-accent" />}>
          {L(`التسجيل مفتوح · ${cycleName}`, `Applications open · ${cycleName}`)}
        </Badge>
        <h1 id="j-title" className="t-display">
          {L('مكانك بيننا', 'Your place with us')}
        </h1>
        <p className="t-lede max-w-xl text-text">
          {L(
            'مجتمع مجاني من المطوّرين يتعلّمون ويبنون معاً بالعربية. قدّم طلبك في عشر دقائق تقريباً، ولا تحتاج حساباً.',
            'A free community of developers who learn and build together in Arabic. Apply in about ten minutes, no account needed.',
          )}
        </p>
        {description && (
          <div className="max-w-xl text-muted">
            <SimpleMarkdown source={description} />
          </div>
        )}
        <ApplyCta
          cycleId={cycle.id}
          secondary={
            <Link
              href="#j-faq"
              className="inline-flex min-h-13 items-center rounded-full border-[1.5px] border-line-strong px-7 font-semibold hover:border-accent"
            >
              {L('كيف نختار؟', 'How do we choose?')}
            </Link>
          }
        >
          <LinkButton
            href="/join/apply"
            size="lg"
            iconEnd={<Send size={16} aria-hidden="true" className="rtl:-scale-x-100" />}
          >
            {L('ابدأ طلبك', 'Start your application')}
          </LinkButton>
        </ApplyCta>
        <dl className="flex gap-8">
          <div>
            <dt className="text-sm text-muted">
              {L('حتى يُغلق التسجيل', 'Until applications close')}
            </dt>
            <dd className="text-3xl font-extrabold tabular-nums">
              {days} {L('يوماً', days === 1 ? 'day' : 'days')}
            </dd>
          </div>
          {cycle.capacity !== null && (
            <div>
              <dt className="text-sm text-muted">
                {L('مقعداً في هذه الدورة', 'places in this cycle')}
              </dt>
              <dd className="text-3xl font-extrabold tabular-nums">{cycle.capacity}</dd>
            </div>
          )}
        </dl>
      </div>
      <div className="relative">
        <h2 className="mb-3 font-bold">
          {L('ماذا يحدث بعد التقديم؟', 'What happens after you apply?')}
        </h2>
        <ol className="flex flex-col divide-y divide-dashed divide-line rounded-shape-xl border border-line bg-surface p-4 sm:p-5">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="m-reveal flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              style={{ '--i': i } as CSSProperties}
            >
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-shape-md bg-accent-soft text-on-accent-soft"
              >
                <s.icon size={18} />
              </span>
              <div className="min-w-0">
                <p className="font-bold">{s.title}</p>
                <p className="text-sm text-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ScheduledHero({
  lang,
  cycle,
  cycleName,
}: {
  lang: 'ar' | 'en';
  cycle: PublicCycle;
  cycleName: string;
}) {
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  return (
    <section
      aria-labelledby="j-title"
      className={`${heroCard} grid items-center gap-8 lg:grid-cols-2`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={dots}
      />
      <div className="m-enter relative flex flex-col items-start gap-5">
        <Badge tone="info">{L('يفتح قريباً', 'Opens soon')}</Badge>
        <h1 id="j-title" className="t-display">
          {L(`${cycleName} تفتح قريباً`, `${cycleName} opens soon`)}
        </h1>
        <p className="t-lede max-w-xl">
          {L(
            `يفتح التسجيل ${weekdayDate(cycle.opensAt, lang)} ويستمر حتى ${formatDate(cycle.effectiveClosesAt, lang)}. جهّز نبذة قصيرة وروابط أعمالك إن وُجدت.`,
            `Applications open ${weekdayDate(cycle.opensAt, lang)} and run until ${formatDate(cycle.effectiveClosesAt, lang)}. Prepare a short bio and links to your work, if you have any.`,
          )}
        </p>
        <a
          href={`data:text/calendar;charset=utf-8,${encodeURIComponent(`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Saudi Developer Community//Membership//AR\r\nBEGIN:VEVENT\r\nUID:cycle-${cycle.id}@sdc\r\nDTSTAMP:20260101T000000Z\r\nDTSTART;VALUE=DATE:${new Date(new Date(cycle.opensAt).getTime() + 3 * 3_600_000).toISOString().slice(0, 10).replace(/-/g, '')}\r\nSUMMARY:${L('يفتح تسجيل العضوية', 'Membership applications open')}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`)}`}
          download="sdc-membership-opens.ics"
          className="inline-flex min-h-13 items-center gap-2 rounded-full bg-accent px-7 font-semibold text-on-accent hover:bg-accent-hover"
        >
          <CalendarPlus size={18} aria-hidden="true" />
          {L('أضف الموعد لتقويمك', 'Add the date to your calendar')}
        </a>
      </div>
      <div className="relative flex flex-col items-start gap-3 lg:items-center">
        <p className="text-sm text-muted">{L('يفتح التسجيل بعد', 'Applications open in')}</p>
        <Countdown target={cycle.opensAt} />
        <p className="text-xs text-muted">
          {L('ملف التقويم لا يجمع أي بيانات عنك.', 'The calendar file collects no data about you.')}
        </p>
      </div>
    </section>
  );
}

function ClosedHero({
  lang,
  cycle,
  waiting,
}: {
  lang: 'ar' | 'en';
  cycle: PublicCycle | null;
  waiting?: boolean;
}) {
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const name = cycle ? (ar ? cycle.nameAr : cycle.nameEn || cycle.nameAr) : '';
  return (
    <section
      aria-labelledby="j-title"
      className={`${heroCard} grid items-start gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={dots}
      />
      <div className="m-enter relative flex flex-col items-start gap-5">
        <Badge icon={<Lock />}>{L('التسجيل مغلق', 'Applications closed')}</Badge>
        <h1 id="j-title" className="t-display">
          {L('التسجيل مغلق الآن', 'Applications are closed')}
        </h1>
        <p className="t-lede max-w-xl">
          {waiting && cycle
            ? L(
                `أُغلقت ${name} في ${formatDate(cycle.effectiveClosesAt, lang)}. تصلك النتيجة بالبريد الإلكتروني.`,
                `${name} closed on ${formatDate(cycle.effectiveClosesAt, lang)}. You will receive the result by e-mail.`,
              )
            : L(
                'نتوقع الدورة القادمة قريباً. حتى ذلك الحين، فعالياتنا مفتوحة للجميع.',
                'We expect the next intake soon. Until then, our events are open to everyone.',
              )}
        </p>
        <div className="flex flex-wrap gap-3">
          <LinkButton href="/events" size="lg">
            {L('تصفّح الفعاليات', 'Browse events')}
          </LinkButton>
        </div>
      </div>
      <div className="relative flex flex-col gap-4 rounded-shape-xl border border-line bg-surface p-5">
        <h2 className="font-bold">{L('قدّمت في هذه الدورة؟', 'Applied in this cycle?')}</h2>
        <p className="text-sm text-muted">
          {L(
            'استخدم رابط المتابعة في بريد الاستلام لترى حالة طلبك.',
            'Use the tracking link in the received e-mail to see your application.',
          )}
        </p>
        <div className="border-t border-line pt-4">
          <p className="mb-3 font-semibold text-accent-text">
            {L('لم يصلك البريد؟ اطلب رابطاً جديداً', 'Did not get the e-mail? Ask for a new link')}
          </p>
          <RequestLinkForm />
        </div>
        <div className="border-t border-line pt-4">
          <CopyLinkButton
            label={L('انسخ رابط الانضمام', 'Copy the join link')}
            copied={L('تم النسخ.', 'Copied.')}
          />
        </div>
      </div>
    </section>
  );
}

function MemberHero({
  lang,
  memberNo,
  termEndsAt,
}: {
  lang: 'ar' | 'en';
  memberNo: string;
  termEndsAt: string | null;
}) {
  const L = (a: string, e: string) => (lang === 'ar' ? a : e);
  return (
    <section
      aria-labelledby="j-title"
      className={`${heroCard} grid items-center gap-8 lg:grid-cols-2`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={dots}
      />
      <div className="m-enter relative flex flex-col items-start gap-5">
        <Badge tone="accent">{L('أنت عضو', 'You are a member')}</Badge>
        <h1 id="j-title" className="t-display">
          {L('أنت منّا بالفعل', 'You are already one of us')}
        </h1>
        <p className="t-lede max-w-xl">
          {termEndsAt
            ? L(
                `عضويتك نشطة حتى ${formatDate(termEndsAt, lang)}. لا تحتاج إلى التقديم مرة أخرى. شارك الرابط مع صديق يستحق المكان.`,
                `Your membership is active until ${formatDate(termEndsAt, lang)}. You do not need to apply again. Share the link with a friend who deserves a place.`,
              )
            : L(
                'عضويتك نشطة. لا تحتاج إلى التقديم مرة أخرى. شارك الرابط مع صديق يستحق المكان.',
                'Your membership is active. You do not need to apply again. Share the link with a friend who deserves a place.',
              )}
        </p>
        <div className="flex flex-wrap gap-3">
          <LinkButton href="/account/membership" size="lg">
            {L('عضويتي وبطاقتي', 'My membership and card')}
          </LinkButton>
          <CopyLinkButton
            label={L('انسخ رابط الانضمام', 'Copy the join link')}
            copied={L('تم النسخ.', 'Copied.')}
          />
        </div>
      </div>
      <div className="relative rounded-shape-xl border border-line bg-surface p-5">
        <p className="text-sm text-muted">{L('رقم العضوية', 'Member number')}</p>
        <p dir="ltr" className="mt-1 text-start font-mono text-2xl font-bold">
          {memberNo}
        </p>
      </div>
    </section>
  );
}
