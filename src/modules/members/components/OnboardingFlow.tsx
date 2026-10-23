'use client';

import {
  ArrowRight,
  CalendarDays,
  Info,
  Lock,
  QrCode,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { useState, useTransition } from 'react';
import { LocaleSwitch } from '@/components/layout/LocaleSwitch';
import { Logo } from '@/components/layout/Logo';
import { ThemeSwitch } from '@/components/layout/ThemeSwitch';
import { Avatar, Button, Switch, cn } from '@/components/ui';
import { Link, useRouter } from '@/i18n/navigation';
import { saveOnboardingStep } from '../lifecycle-actions';
import { saveMyProfilePart, saveMySkills } from '../profile-actions';
import type { PublicSkill } from '../public';
import { PhotoUploader } from './PhotoUploader';
import { SKILL_CATEGORY_LABEL } from './public/members-copy';

type Lang = 'ar' | 'en';

export type OnboardingProps = {
  lang: Lang;
  start: number;
  /** Chrome strings for the logo link. */
  logo: { home: string; alt: string };
  firstName: string;
  fullName: string;
  /** First, middle, last name in each language: shown locked, changed only through leadership. */
  names: { ar: [string, string, string]; en: [string, string, string] };
  photoUrl: string | null;
  catalog: PublicSkill[];
  skills: string[];
  visibility: { directory: boolean; photo: boolean; skills: boolean; headline: boolean };
};

const STEP_COUNT = 5;
const MAX_SKILLS = 12;

const T = {
  ar: {
    of: (n: number) => `الخطوة ${n} من ${STEP_COUNT}`,
    skipAll: 'تخطَّ الآن',
    back: 'السابق',
    notNow: 'ليس الآن',
    next: 'التالي',
    foot: 'نحفظ تقدّمك بعد كل خطوة. إن غادرت، تعود إلى حيث توقفت ومن أي جهاز.',
    panel: [
      ['مرحباً', 'دقيقتان وتصبح جاهزاً.'],
      ['اسمك', 'كما سيُكتب في بطاقتك.'],
      ['صورتك', 'اختيارية ودائماً بيدك.'],
      ['اهتماماتك', 'ليجدك من يبحث عن مهارتك.'],
      ['الخصوصية', 'أنت من يقرّر.'],
    ] as const,
    hello: (n: string) => `أهلاً بك يا ${n}`,
    helloLede:
      'أنت الآن عضو في المجتمع السعودي للمطورين. خمس خطوات قصيرة تجعل ملفك جاهزاً. كلها قابلة للتعديل لاحقاً.',
    cards: [
      ['فعاليات الأعضاء', 'ورش ومعسكرات بمقاعد محجوزة لك'],
      ['بطاقتك الرقمية', 'برقم عضوية ورمز يتحقق منه أي أحد'],
      ['مكانك في الدليل', 'بما تختار أن تُظهره، لا أكثر'],
    ] as const,
    start: 'لنبدأ',
    nameTitle: 'هل اسمك صحيح؟',
    nameLede: 'هكذا سيظهر في بطاقتك وشهاداتك. أخذناه من طلبك.',
    nameAr: ['الأول', 'الأوسط', 'العائلة'] as const,
    nameEn: ['First', 'Middle', 'Last'] as const,
    nameNote: 'تعديل الاسم يمر عبر القيادة لأنه يظهر في الشهادات.',
    nameFix: 'اطلب تصحيحاً',
    nameYes: 'نعم، صحيح',
    photoTitle: 'أضف صورتك',
    photoLede:
      'اختيارية. تساعد الأعضاء على تذكّرك في الفعاليات. أنت تقرّر من يراها في الخطوة الأخيرة.',
    photoSaved: 'حُفظت صورتك.',
    photoRemoved: 'أُزيلت صورتك.',
    interestsTitle: 'بماذا تهتم؟',
    interestsLede: 'اختر بضع مهارات تعرفها أو تتعلّمها. أول ثلاث تظهر على بطاقتك في الدليل.',
    picked: (n: number) =>
      n === 0 ? 'لم تختر شيئاً بعد' : `اخترت ${n} ${n === 1 ? 'مهارة' : 'مهارات'}`,
    limit: `الحد الأقصى ${MAX_SKILLS} مهارة`,
    privacyTitle: 'ماذا يرى الزوار؟',
    privacyLede: 'كل شيء مخفي حتى تختار. بريدك وجوالك لا يظهران أبداً.',
    inDirectory: 'في الدليل',
    showProfile: ['أظهر ملفي في دليل الأعضاء', 'يُظهر اسمك على الأقل'],
    showPhoto: ['صورتي', 'وإلا تظهر أحرف اسمك'],
    showSkills: ['مهاراتي', 'أول ثلاث على بطاقتك'],
    showHeadline: ['العنوان المهني', 'تضيفه لاحقاً من ملفك'],
    finish: 'احفظ وأنهِ',
    failed: 'تعذّر الحفظ. حاول مرة أخرى.',
  },
  en: {
    of: (n: number) => `Step ${n} of ${STEP_COUNT}`,
    skipAll: 'Skip for now',
    back: 'Back',
    notNow: 'Not now',
    next: 'Next',
    foot: 'Your progress is saved after every step. If you leave, you come back to where you stopped, from any device.',
    panel: [
      ['Welcome', 'Two minutes and you are ready.'],
      ['Your name', 'As it will be written on your card.'],
      ['Your photo', 'Optional, and always up to you.'],
      ['Your interests', 'So people can find your skills.'],
      ['Privacy', 'You decide.'],
    ] as const,
    hello: (n: string) => `Welcome, ${n}`,
    helloLede:
      'You are now a member of the Saudi Developers Community. Five short steps get your profile ready. All of it can be changed later.',
    cards: [
      ['Member events', 'Workshops and camps with seats held for you'],
      ['Your digital card', 'A member number and a code anyone can verify'],
      ['Your place in the directory', 'Only what you choose to show'],
    ] as const,
    start: 'Let’s start',
    nameTitle: 'Is your name correct?',
    nameLede:
      'This is how it will appear on your card and certificates. We took it from your application.',
    nameAr: ['الأول', 'الأوسط', 'العائلة'] as const,
    nameEn: ['First', 'Middle', 'Last'] as const,
    nameNote: 'A name change goes through the leadership because it appears on certificates.',
    nameFix: 'Ask for a correction',
    nameYes: 'Yes, it’s correct',
    photoTitle: 'Add your photo',
    photoLede:
      'Optional. It helps members recognise you at events. You decide who sees it in the last step.',
    photoSaved: 'Your photo is saved.',
    photoRemoved: 'Your photo was removed.',
    interestsTitle: 'What are you into?',
    interestsLede:
      'Pick a few skills you know or are learning. The first three show on your card in the directory.',
    picked: (n: number) =>
      n === 0 ? 'Nothing picked yet' : `${n} skill${n === 1 ? '' : 's'} picked`,
    limit: `Up to ${MAX_SKILLS} skills`,
    privacyTitle: 'What do visitors see?',
    privacyLede: 'Everything is hidden until you choose. Your e-mail and phone are never shown.',
    inDirectory: 'In the directory',
    showProfile: ['Show my profile in the members directory', 'Your name at least'],
    showPhoto: ['My photo', 'Otherwise your initials show'],
    showSkills: ['My skills', 'The first three on your card'],
    showHeadline: ['Professional headline', 'You add it later from your profile'],
    finish: 'Save and finish',
    failed: 'Could not save. Try again.',
  },
} as const;

const CARD_ICONS: LucideIcon[] = [CalendarDays, QrCode, UsersRound];

export function OnboardingFlow(p: OnboardingProps) {
  const { lang } = p;
  const ar = lang === 'ar';
  const s = T[lang];
  const router = useRouter();
  const [i, setI] = useState(Math.min(STEP_COUNT - 1, Math.max(0, p.start)));
  const [busy, run] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState(p.photoUrl);
  const [picked, setPicked] = useState<string[]>(p.skills);
  const [vis, setVis] = useState(p.visibility);

  const bySlug = new Map(p.catalog.map((k) => [k.slug, k]));
  const groups = (() => {
    const out = new Map<string, PublicSkill[]>();
    for (const k of p.catalog) out.set(k.category, [...(out.get(k.category) ?? []), k]);
    return [...out];
  })();
  const skillName = (slug: string) => {
    const k = bySlug.get(slug);
    return k ? (ar ? k.nameAr : k.nameEn) : slug;
  };

  const finish = (save: boolean) =>
    run(async () => {
      setError(null);
      if (save) {
        const r = await saveMyProfilePart(
          {
            is_directory_visible: vis.directory,
            show_photo: vis.photo,
            show_skills: vis.skills,
            show_headline: vis.headline,
          },
          { lang },
        );
        if (!r.ok) {
          setError(r.message || s.failed);
          return;
        }
      }
      const d = await saveOnboardingStep({ step: STEP_COUNT, done: true }, { lang });
      if (!d.ok) {
        setError(d.message || s.failed);
        return;
      }
      router.replace('/account/membership');
      router.refresh();
    });

  const go = (to: number, before?: () => Promise<{ ok: boolean; message?: string }>) =>
    run(async () => {
      setError(null);
      if (before) {
        const r = await before();
        if (!r.ok) {
          setError(r.message || s.failed);
          return;
        }
      }
      await saveOnboardingStep({ step: to }, { lang });
      setI(to);
    });

  const toggleSkill = (slug: string) =>
    setPicked((cur) =>
      cur.includes(slug)
        ? cur.filter((x) => x !== slug)
        : cur.length >= MAX_SKILLS
          ? cur
          : [...cur, slug],
    );

  const [title, sub] = s.panel[i] ?? s.panel[0];
  const chip =
    'inline-flex min-h-11 items-center rounded-full border-[1.5px] px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-focus-ring';

  const head = (t: string, lede: string) => (
    <div className="flex flex-col gap-2">
      <h1 className="t-h1">{t}</h1>
      <p className="t-lede text-muted">{lede}</p>
    </div>
  );

  const nameRow = (dir: 'rtl' | 'ltr', label: string, heads: readonly string[], vals: string[]) => (
    <div dir={dir} className="grid grid-cols-3 gap-3">
      {heads.map((h, n) => (
        <div key={h} className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-muted">{h}</span>
          <span
            aria-label={`${label} ${h}`}
            className="flex min-h-12 items-center justify-between gap-2 rounded-shape-xl border border-line bg-surface-raised px-3 text-sm"
          >
            <span className="truncate">{vals[n] || '–'}</span>
            <Lock size={14} aria-hidden="true" className="shrink-0 text-muted" />
          </span>
        </div>
      ))}
    </div>
  );

  const stepBody = (() => {
    if (i === 0)
      return (
        <>
          {head(s.hello(p.firstName), s.helloLede)}
          <ul className="flex flex-col gap-3">
            {s.cards.map(([t, b], n) => {
              const Icon = CARD_ICONS[n]!;
              return (
                <li
                  key={t}
                  className="flex items-center gap-4 rounded-shape-xl border border-line bg-surface p-4"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-12 shrink-0 items-center justify-center rounded-shape-lg bg-accent-soft text-accent-text"
                  >
                    <Icon size={22} />
                  </span>
                  <div>
                    <p className="font-bold">{t}</p>
                    <p className="text-sm text-muted">{b}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      );
    if (i === 1)
      return (
        <>
          {head(s.nameTitle, s.nameLede)}
          <div className="flex flex-col gap-4">
            {nameRow('rtl', 'عربي', s.nameAr, p.names.ar)}
            {nameRow('ltr', 'English', s.nameEn, p.names.en)}
          </div>
          <p className="flex items-start gap-2 rounded-shape-xl border border-line bg-surface p-4 text-sm text-muted">
            <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>
              {s.nameNote}{' '}
              <Link href="/account/profile" className="font-semibold text-accent-text underline">
                {s.nameFix}
              </Link>
            </span>
          </p>
        </>
      );
    if (i === 2)
      return (
        <>
          {head(s.photoTitle, s.photoLede)}
          <div className="rounded-shape-2xl border-[1.5px] border-dashed border-line-strong bg-surface p-5">
            <PhotoUploader
              lang={lang}
              name={p.fullName}
              photoUrl={photo}
              onSaved={(url, shown) => {
                setPhoto(url);
                if (shown !== undefined) setVis((v) => ({ ...v, photo: shown }));
              }}
              savedText={s.photoSaved}
              removedText={s.photoRemoved}
            />
          </div>
        </>
      );
    if (i === 3)
      return (
        <>
          {head(s.interestsTitle, s.interestsLede)}
          <div className="flex flex-col gap-4">
            {groups.map(([cat, list]) => (
              <fieldset key={cat} className="flex flex-col gap-2">
                <legend className="mb-1 text-sm font-semibold text-muted">
                  {SKILL_CATEGORY_LABEL[cat]?.[lang] ?? cat}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {list.map((k) => {
                    const on = picked.includes(k.slug);
                    return (
                      <button
                        key={k.slug}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleSkill(k.slug)}
                        className={cn(
                          chip,
                          on
                            ? 'border-accent bg-accent-soft text-accent-text'
                            : 'border-line-strong hover:border-accent',
                        )}
                      >
                        {ar ? k.nameAr : k.nameEn}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
          <p
            aria-live="polite"
            className={cn(
              'text-sm font-semibold',
              picked.length ? 'text-accent-text' : 'text-muted',
            )}
          >
            {s.picked(picked.length)}
            {picked.length >= MAX_SKILLS ? ` · ${s.limit}` : ''}
          </p>
        </>
      );
    const headline = picked.slice(0, 3).map(skillName).join(' • ');
    return (
      <>
        {head(s.privacyTitle, s.privacyLede)}
        <div className="grid gap-5 md:grid-cols-[1fr_minmax(0,15rem)]">
          <div className="flex flex-col divide-y divide-line">
            <Switch
              checked={vis.directory}
              onChange={(v) => setVis((x) => ({ ...x, directory: v }))}
              label={s.showProfile[0]}
              hint={s.showProfile[1]}
            />
            <Switch
              checked={vis.photo}
              disabled={!vis.directory}
              onChange={(v) => setVis((x) => ({ ...x, photo: v }))}
              label={s.showPhoto[0]}
              hint={s.showPhoto[1]}
            />
            <Switch
              checked={vis.skills}
              disabled={!vis.directory}
              onChange={(v) => setVis((x) => ({ ...x, skills: v }))}
              label={s.showSkills[0]}
              hint={s.showSkills[1]}
            />
            <Switch
              checked={vis.headline}
              disabled={!vis.directory}
              onChange={(v) => setVis((x) => ({ ...x, headline: v }))}
              label={s.showHeadline[0]}
              hint={s.showHeadline[1]}
            />
          </div>
          <div
            className={cn(
              'flex flex-col items-center gap-3 rounded-shape-xl border border-line bg-surface p-4 text-center transition-opacity',
              !vis.directory && 'opacity-50',
            )}
          >
            <span className="self-start text-xs text-muted">{s.inDirectory}</span>
            <Avatar
              name={p.fullName}
              src={vis.photo ? (photo ?? undefined) : undefined}
              size={72}
            />
            <p className="font-bold">{p.fullName}</p>
            <p className="min-h-5 text-sm text-muted">{vis.skills ? headline : ''}</p>
          </div>
        </div>
      </>
    );
  })();

  const primary =
    i === 0 ? (
      <Button size="lg" loading={busy} onClick={() => go(1)}>
        {s.start}
      </Button>
    ) : i === 1 ? (
      <Button size="lg" loading={busy} onClick={() => go(2)}>
        {s.nameYes}
      </Button>
    ) : i === 2 ? (
      <Button size="lg" loading={busy} onClick={() => go(3)}>
        {s.next}
      </Button>
    ) : i === 3 ? (
      <Button
        size="lg"
        loading={busy}
        onClick={() =>
          go(4, async () => {
            const r = await saveMySkills(picked, { lang });
            return r.ok ? { ok: true } : { ok: false, message: r.message };
          })
        }
      >
        {s.next}
      </Button>
    ) : (
      <Button size="lg" loading={busy} onClick={() => finish(true)}>
        {s.finish}
      </Button>
    );

  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[45%_1fr] lg:gap-4 lg:p-4">
      <aside
        aria-hidden="true"
        className="motif-dots relative hidden overflow-hidden rounded-shape-2xl bg-brand text-on-brand lg:flex lg:flex-col lg:justify-between lg:p-10"
      >
        <div className="flex items-center justify-between">
          <Logo label={p.logo.home} alt={p.logo.alt} />
          <span className="text-sm font-semibold">{s.of(i + 1)}</span>
        </div>
        {/* The brand X, drawn as two soft strokes behind the text (the design's corner mark). */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-10 end-10 h-[22rem] w-[16rem]"
        >
          <span className="absolute start-4 top-0 h-full w-16 origin-center -rotate-[32deg] rounded-full bg-on-brand/20" />
          <span className="absolute end-4 top-0 h-full w-16 origin-center rotate-[32deg] rounded-full bg-on-brand/15" />
        </span>
        <div className="relative flex flex-col gap-3">
          <div className="flex items-center gap-2" aria-hidden="true">
            {Array.from({ length: STEP_COUNT }, (_, n) => (
              <span
                key={n}
                className={cn(
                  'h-2 rounded-full bg-on-brand transition-all duration-300',
                  n === i ? 'w-8' : 'w-2 opacity-40',
                )}
              />
            ))}
          </div>
          <p className="text-5xl font-extrabold">{title}</p>
          <p className="text-xl">{sub}</p>
          <p className="mt-10 max-w-md text-sm opacity-90">{s.foot}</p>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col px-4 py-4 lg:min-h-0 lg:px-12 lg:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" disabled={busy} onClick={() => finish(false)}>
              {s.skipAll}
            </Button>
            <LocaleSwitch />
            <ThemeSwitch />
          </div>
          <span className="text-sm font-semibold text-muted lg:hidden">{s.of(i + 1)}</span>
        </div>
        <div
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-line lg:hidden"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEP_COUNT}
          aria-valuenow={i + 1}
        >
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${((i + 1) / STEP_COUNT) * 100}%` }}
          />
        </div>
        <main
          id="main"
          className="m-auto flex w-full max-w-(--container-tight) flex-col gap-6 py-10"
        >
          <div key={i} className="m-enter flex flex-col gap-6">
            {stepBody}
          </div>
          {error && (
            <p role="alert" className="text-sm font-semibold text-danger">
              {error}
            </p>
          )}
          <div className="flex items-center justify-between gap-3 border-t border-line pt-6">
            <Button
              variant="ghost"
              disabled={busy || i === 0}
              onClick={() => i > 0 && go(i - 1)}
              className="gap-1.5"
            >
              {s.back}
              <ArrowRight size={16} aria-hidden="true" className="ltr:rotate-180" />
            </Button>
            <div className="flex items-center gap-2">
              {(i === 2 || i === 3) && (
                <Button variant="ghost" disabled={busy} onClick={() => go(i + 1)}>
                  {s.notNow}
                </Button>
              )}
              {primary}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
