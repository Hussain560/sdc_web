'use client';

import { CalendarDays, IdCard, MessagesSquare, PartyPopper, UserRound } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui';
import { Link, useRouter } from '@/i18n/navigation';
import { saveOnboardingStep } from '../lifecycle-actions';

type Step = {
  icon: typeof PartyPopper;
  title: [string, string];
  body: [string, string];
  action?: { href: string; label: [string, string] };
};

const STEPS: Step[] = [
  {
    icon: PartyPopper,
    title: ['أهلاً بك في المجتمع', 'Welcome to the community'],
    body: [
      'حسابك جاهز. هذه جولة قصيرة تعرّفك بما يمكنك فعله، وتستطيع تخطّيها في أي وقت.',
      'Your account is ready. This short tour shows what you can do, and you can skip it at any time.',
    ],
  },
  {
    icon: UserRound,
    title: ['أكمل ملفك', 'Complete your profile'],
    body: [
      'أضف نبذة وصورة وروابط أعمالك. أنت تقرّر ما يظهر في دليل الأعضاء.',
      'Add a bio, a photo and links to your work. You decide what shows in the members directory.',
    ],
    action: { href: '/account/member-profile', label: ['افتح ملفي', 'Open my profile'] },
  },
  {
    icon: IdCard,
    title: ['بطاقتك الرقمية', 'Your digital card'],
    body: [
      'بطاقتك تثبت عضويتك في الفعاليات. افتحها بملء الشاشة وأضفها إلى شاشتك الرئيسية.',
      'Your card proves your membership at events. Open it full screen and add it to your home screen.',
    ],
    action: { href: '/account/membership', label: ['عضويتي', 'My membership'] },
  },
  {
    icon: CalendarDays,
    title: ['الفعاليات القادمة', 'Upcoming events'],
    body: [
      'سجّل في الفعاليات التي تهمك، وتصلك شهادة الحضور هنا.',
      'Register for events you like; your attendance certificate arrives here.',
    ],
    action: { href: '/events', label: ['تصفّح الفعاليات', 'Browse events'] },
  },
  {
    icon: MessagesSquare,
    title: ['تواصل مع المجتمع', 'Join the conversation'],
    body: [
      'تابع إعلانات المجتمع، وتعرّف على لجانك ومناصبك.',
      'Follow community announcements and see your committees and positions.',
    ],
    action: { href: '/committees', label: ['اللجان', 'Committees'] },
  },
];

export function WelcomeTour({ start, lang }: { start: number; lang: 'ar' | 'en' }) {
  const ar = lang === 'ar';
  const L = (p: [string, string]) => (ar ? p[0] : p[1]);
  const router = useRouter();
  const [i, setI] = useState(start);
  const [pending, run] = useTransition();
  const step = STEPS[i] ?? STEPS[0]!;
  const last = i === STEPS.length - 1;
  const Icon = step.icon;

  const go = (next: number, done = false) =>
    run(async () => {
      await saveOnboardingStep({ step: next, done }, { lang });
      if (done) {
        router.replace('/account/membership');
        router.refresh();
      } else setI(next);
    });

  return (
    <section className="m-enter flex flex-col gap-6" aria-labelledby="tour-title">
      <div
        className="flex items-center gap-2"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={i + 1}
        aria-label={ar ? 'خطوات الجولة' : 'Tour steps'}
      >
        {STEPS.map((_, n) => (
          <span
            key={n}
            className={`h-1.5 flex-1 rounded-full transition-colors ${n <= i ? 'bg-accent' : 'bg-line'}`}
          />
        ))}
      </div>
      <div
        key={i}
        className="m-pop flex flex-col items-start gap-4 rounded-shape-2xl border border-line bg-surface p-6 md:p-8"
      >
        <span
          aria-hidden="true"
          className="flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent-text"
        >
          <Icon size={28} />
        </span>
        <p className="text-sm text-muted">
          {ar ? `الخطوة ${i + 1} من ${STEPS.length}` : `Step ${i + 1} of ${STEPS.length}`}
        </p>
        <h1 id="tour-title" className="t-h2">
          {L(step.title)}
        </h1>
        <p className="t-lede text-muted">{L(step.body)}</p>
        {step.action && (
          <Link
            href={step.action.href}
            className="inline-flex min-h-11 items-center rounded-full border-[1.5px] border-line-strong px-5 font-semibold hover:border-accent"
          >
            {L(step.action.label)}
          </Link>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" disabled={pending} onClick={() => go(STEPS.length, true)}>
          {ar ? 'تخطَّ الجولة' : 'Skip the tour'}
        </Button>
        <div className="flex gap-2">
          {i > 0 && (
            <Button variant="secondary" disabled={pending} onClick={() => go(i - 1)}>
              {ar ? 'السابق' : 'Back'}
            </Button>
          )}
          <Button loading={pending} onClick={() => (last ? go(STEPS.length, true) : go(i + 1))}>
            {last ? (ar ? 'ابدأ' : 'Get started') : ar ? 'التالي' : 'Next'}
          </Button>
        </div>
      </div>
    </section>
  );
}
