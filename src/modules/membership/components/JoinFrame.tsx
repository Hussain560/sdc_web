import { Award, BookOpen, Check, Rocket, Users } from 'lucide-react';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SectionHeader } from '@/components/patterns/SectionHeader';
import { Accordion } from '@/components/ui/Accordion';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card } from '@/components/ui/Card';

const COPY = {
  ar: {
    home: 'الرئيسية',
    title: 'انضم إلى المجتمع',
    lede: 'العضوية مجانية وتفتح في دورات محددة خلال العام.',
    breadcrumb: 'مسار التنقل',
    journey: 'كيف تصبح عضواً',
    steps: ['قدّم الطلب', 'نراجع طلبك', 'نرسل النتيجة', 'تفعّل حسابك', 'تبدأ مع لجنتك'],
    gets: 'ماذا تحصل عليه',
    benefits: [
      ['BookOpen', 'ورش ولقاءات تقنية'],
      ['Users', 'شبكة من المطورين'],
      ['Award', 'شهادات حضور'],
      ['Rocket', 'فرص للمشاركة'],
    ],
    faqTitle: 'الأسئلة الشائعة',
    faq: [
      ['هل العضوية مجانية؟', 'نعم، العضوية مجانية بالكامل.'],
      ['متى أعرف نتيجة طلبي؟', 'نراجع الطلبات بعد إغلاق باب التقديم ونراسلك بالنتيجة على بريدك.'],
      ['هل أحتاج إلى حساب للتقديم؟', 'لا، يكفي بريدك. نفعّل حسابك بعد القبول.'],
    ],
  },
  en: {
    home: 'Home',
    title: 'Join the community',
    lede: 'Membership is free and opens in set windows during the year.',
    breadcrumb: 'Breadcrumb',
    journey: 'How to become a member',
    steps: [
      'Apply',
      'We review',
      'We send the result',
      'You activate your account',
      'You start with your committee',
    ],
    gets: 'What you get',
    benefits: [
      ['BookOpen', 'Workshops and meetups'],
      ['Users', 'A network of developers'],
      ['Award', 'Certificates of attendance'],
      ['Rocket', 'Ways to take part'],
    ],
    faqTitle: 'Frequently asked questions',
    faq: [
      ['Is membership free?', 'Yes, membership is completely free.'],
      [
        'When do I hear about my application?',
        'We review applications once the window closes and e-mail you the result.',
      ],
      [
        'Do I need an account to apply?',
        'No, your e-mail is enough. We activate your account after acceptance.',
      ],
    ],
  },
} as const;

const ICON = { BookOpen, Users, Award, Rocket } as const;

/**
 * /join frame (09-join): title, the cycle panel (the children, changing by phase), the read-only membership
 * journey, what members get, and the FAQ. The application form itself lives inside the cycle panel.
 */
export function JoinFrame({ ar, children }: { ar: boolean; children: React.ReactNode }) {
  const t = COPY[ar ? 'ar' : 'en'];
  const wrap = 'mx-auto w-full max-w-(--container) px-4 md:px-8';
  return (
    <>
      <SiteHeader />
      <main id="main">
        <div className={`${wrap} pt-6`}>
          <Breadcrumb
            label={t.breadcrumb}
            items={[{ label: t.home, href: '/' }, { label: t.title }]}
          />
        </div>
        <header className={`${wrap} mt-6 flex flex-col gap-3`}>
          <h1 className="t-h1">{t.title}</h1>
          <p className="t-lede text-muted">{t.lede}</p>
        </header>

        <div className="mx-auto mt-8 w-full max-w-(--container-narrow) px-4">
          <div className="rounded-shape-xl border border-line bg-surface p-6 md:p-8">
            {children}
          </div>
        </div>

        <section aria-labelledby="j-journey" className={`${wrap} mt-(--section-gap)`}>
          <SectionHeader headingId="j-journey" title={t.journey} />
          <ol className="grid gap-4 md:grid-cols-5">
            {t.steps.map((label, i) => (
              <li key={label} className="flex items-center gap-3 md:flex-col md:items-start">
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold tabular-nums text-on-accent-soft"
                >
                  {i === 0 ? <Check className="size-4" /> : i + 1}
                </span>
                <span className="t-label">{label}</span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="j-gets" className={`${wrap} mt-(--section-gap)`}>
          <SectionHeader headingId="j-gets" title={t.gets} />
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {t.benefits.map(([icon, label], i) => {
              const Icon = ICON[icon as keyof typeof ICON];
              return (
                <li key={label}>
                  <Card
                    variant={i % 2 === 0 ? 'feature' : 'feature-alt'}
                    className="flex h-full flex-col gap-3"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-12 items-center justify-center rounded-shape-md bg-accent-soft text-on-accent-soft"
                    >
                      <Icon className="size-6" />
                    </span>
                    <h3 className="t-h4">{label}</h3>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>

        <section
          aria-labelledby="j-faq"
          className="mx-auto mt-(--section-gap) w-full max-w-(--container-narrow) px-4"
        >
          <SectionHeader headingId="j-faq" title={t.faqTitle} className="text-center" />
          <Accordion
            items={t.faq.map(([question, answer], i) => ({ id: `q${i}`, question, answer }))}
          />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
