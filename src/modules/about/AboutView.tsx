import { ArrowLeft, ArrowRight, CalendarDays, Eye, Rocket, UsersRound } from 'lucide-react';
import Image from 'next/image';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { CtaBand } from '@/components/patterns/CtaBand';
import { SectionHeader } from '@/components/patterns/SectionHeader';
import { StatsRow } from '@/components/patterns/StatsRow';
import { Avatar } from '@/components/ui/Avatar';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { LinkButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextLink } from '@/components/ui/TextLink';
import { HOME_COPY } from '@/modules/home/copy';
import { SignedOutOnly } from '@/modules/home/SignedOutOnly';
import { visibleStats, type PublicStats } from '@/modules/home/sections';
import type { LeadershipPerson } from '@/modules/members/public';

type Lang = 'ar' | 'en';

const COPY = {
  ar: {
    home: 'الرئيسية',
    title: 'من نحن',
    breadcrumb: 'مسار التنقل',
    intro:
      'المجتمع السعودي مجتمع تقني غير ربحي يهدف إلى تمكين المطورين والمهتمين بالتقنية من اكتساب الخبرات العملية وبناء مشاريع حقيقية، ونشر المعرفة في مجالات الذكاء الاصطناعي والتقنيات الحديثة، وإثراء المحتوى العربي التقني.',
    visionMission: 'رؤيتنا ورسالتنا',
    vision: 'رؤيتنا',
    visionText:
      'أن نكون الحاضنة الأكبر للمطورين السعوديين وأصحاب العقول المتميزة في مجال الذكاء الاصطناعي.',
    mission: 'رسالتنا',
    missionText:
      'تمكين المطورين السعوديين من خلال التعليم، والتعاون، وبناء مشاريع تقنية تسهم في النهضة الرقمية.',
    numbers: 'أرقامنا',
    how: 'كيف نعمل',
    howLede: 'لجان تقود، وفعاليات تجمع، وأعضاء يصنعون الأثر.',
    steps: [
      ['UsersRound', 'اللجان', 'فرق تطوعية لكل منها مجال واضح.', '/committees'],
      ['CalendarDays', 'الفعاليات', 'ورش ولقاءات مفتوحة طوال العام.', '/events'],
      ['Rocket', 'الأعضاء', 'مطورون يتعلمون ويشاركون ويبنون.', '/members'],
    ],
    leadership: 'القيادة',
    allMembers: 'تعرّف على كل الأعضاء',
    cta: 'انضم إلى المجتمع',
    apply: 'قدّم طلب العضوية',
  },
  en: {
    home: 'Home',
    title: 'About',
    breadcrumb: 'Breadcrumb',
    intro:
      'The Saudi community is a non-profit tech community that empowers developers and technology enthusiasts to gain practical experience, build real projects, share knowledge in AI and modern technologies, and enrich Arabic technical content.',
    visionMission: 'Our vision and mission',
    vision: 'Our vision',
    visionText:
      'To be the leading hub for Saudi developers and exceptional minds in artificial intelligence.',
    mission: 'Our mission',
    missionText:
      'Empowering Saudi developers through education, collaboration and building technical projects that contribute to digital growth.',
    numbers: 'Our numbers',
    how: 'How we work',
    howLede: 'Committees lead, events bring people together, and members make the impact.',
    steps: [
      ['UsersRound', 'Committees', 'Volunteer teams, each with a clear focus.', '/committees'],
      ['CalendarDays', 'Events', 'Open workshops and meetups all year.', '/events'],
      ['Rocket', 'Members', 'Developers who learn, take part and build.', '/members'],
    ],
    leadership: 'Leadership',
    allMembers: 'Meet all members',
    cta: 'Join the community',
    apply: 'Apply for membership',
  },
} as const;

const ICON = { UsersRound, CalendarDays, Rocket } as const;

/** About (06-about): who we are, vision and mission, real figures, how we work, leadership, then the invitation. */
export function AboutView({
  lang,
  stats,
  leadership,
}: {
  lang: Lang;
  stats: PublicStats | null;
  leadership: LeadershipPerson[];
}) {
  const t = COPY[lang];
  const h = HOME_COPY[lang];
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;
  const wrap = 'mx-auto w-full max-w-(--container) px-4 md:px-8';
  const figures = visibleStats(stats);
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

        <header className={`${wrap} mt-8 grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]`}>
          <div className="flex flex-col gap-4">
            <h1 className="t-h1">{t.title}</h1>
            <p className="t-lede text-muted">{t.intro}</p>
          </div>
          <div className="flex justify-center">
            <Image
              src="/brand/hero-mark-dark.png"
              alt=""
              width={546}
              height={380}
              className="logo-on-dark h-auto w-3/5 lg:w-full"
            />
            <Image
              src="/brand/hero-mark-light.png"
              alt=""
              width={1504}
              height={1046}
              className="logo-on-light h-auto w-3/5 rounded-shape-xl lg:w-full"
            />
          </div>
        </header>

        <section aria-labelledby="ab-vm" className={`${wrap} mt-(--section-gap)`}>
          <SectionHeader headingId="ab-vm" title={t.visionMission} />
          <div className="grid gap-4 md:grid-cols-2">
            <Card variant="feature">
              <span
                aria-hidden="true"
                className="mb-4 flex size-12 items-center justify-center rounded-shape-md bg-accent-soft text-on-accent-soft"
              >
                <Eye className="size-6" />
              </span>
              <h3 className="t-h3">{t.vision}</h3>
              <p className="t-body mt-2 text-muted">{t.visionText}</p>
            </Card>
            <Card variant="feature-alt">
              <span
                aria-hidden="true"
                className="mb-4 flex size-12 items-center justify-center rounded-shape-md bg-accent-soft text-on-accent-soft"
              >
                <Rocket className="size-6" />
              </span>
              <h3 className="t-h3">{t.mission}</h3>
              <p className="t-body mt-2 text-muted">{t.missionText}</p>
            </Card>
          </div>
        </section>

        {figures.length > 0 && (
          <section aria-labelledby="ab-num" className="mt-(--section-gap) bg-band py-12 md:py-16">
            <div className={wrap}>
              <SectionHeader headingId="ab-num" title={t.numbers} />
              <StatsRow
                label={t.numbers}
                locale={lang}
                items={figures.map(([key, value]) => ({ key, value, label: h.stats[key] }))}
              />
            </div>
          </section>
        )}

        <section aria-labelledby="ab-how" className={`${wrap} mt-(--section-gap)`}>
          <SectionHeader headingId="ab-how" title={t.how} lede={t.howLede} />
          <ol className="grid gap-4 md:grid-cols-3">
            {t.steps.map(([icon, title, body, href]) => {
              const Icon = ICON[icon as keyof typeof ICON];
              return (
                <li key={href}>
                  <Card variant="surface" className="flex h-full flex-col gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-12 items-center justify-center rounded-shape-md bg-accent-soft text-on-accent-soft"
                    >
                      <Icon className="size-6" />
                    </span>
                    <h3 className="t-h4">{title}</h3>
                    <p className="t-body-sm text-muted">{body}</p>
                    <TextLink href={href} variant="standalone" className="mt-auto min-h-11">
                      {title}
                      <Arrow aria-hidden="true" className="size-4" />
                    </TextLink>
                  </Card>
                </li>
              );
            })}
          </ol>
        </section>

        {leadership.length > 0 && (
          <section aria-labelledby="ab-lead" className={`${wrap} mt-(--section-gap)`}>
            <SectionHeader
              headingId="ab-lead"
              title={t.leadership}
              action={
                <TextLink href="/members" variant="standalone" className="min-h-11">
                  {t.allMembers}
                  <Arrow aria-hidden="true" className="size-4" />
                </TextLink>
              }
            />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {leadership.slice(0, 8).map((p) => {
                const n = lang === 'en' ? p.nameEn : p.nameAr;
                return (
                  <li key={p.id}>
                    <Card variant="surface" className="flex h-full flex-col gap-3">
                      <Avatar name={n} size={56} />
                      <h3 className="t-h4">{n}</h3>
                      <p className="t-body-sm font-semibold text-accent-text">
                        {lang === 'en' ? p.roleEn : p.roleAr}
                      </p>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <SignedOutOnly>
          <div className={`${wrap} mt-(--section-gap)`}>
            <CtaBand
              title={t.cta}
              action={
                <LinkButton href="/join" size="lg">
                  {t.apply}
                </LinkButton>
              }
            />
          </div>
        </SignedOutOnly>
      </main>
      <SiteFooter />
    </>
  );
}
