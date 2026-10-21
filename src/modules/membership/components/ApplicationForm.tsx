'use client';

import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CircleCheck,
  Copy,
  Moon,
  Send,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Button, Chips, Field, PhoneField, Select, Textarea, cn, useToast } from '@/components/ui';
import { LogoWordmark } from '@/components/layout/Logo';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { Link } from '@/i18n/navigation';
import { buildDayIcs } from '@/lib/ics-day';
import { withMinimumDuration } from '@/lib/min-duration';
import {
  DEFAULT_PHONE_COUNTRY,
  cleanNational,
  splitInternational,
  toE164,
  type PhoneCountry,
} from '@/lib/phone';
import { formatDate } from '@/lib/format';
import { applyForMembership } from '../actions';
import {
  APPLICATION_STEPS,
  OTHER,
  validateApplicationStep,
  type ApplicationStep,
} from '../schemas';
import {
  ACADEMIC_LABEL,
  ACADEMIC_STATUSES,
  emptyApplication,
  type ApplicationValues,
  type CycleQuestion,
  type PublicCycle,
  type ReferenceOption,
} from '../types';

type Reference = {
  universities: ReferenceOption[];
  majors: ReferenceOption[];
  tracks: ReferenceOption[];
  committees: Array<{ id: string; nameAr: string; nameEn: string | null }>;
};

const STEP_LABEL: Record<ApplicationStep, { ar: string; en: string }> = {
  personal: { ar: 'عنك', en: 'About you' },
  academic: { ar: 'الدراسة', en: 'Study' },
  links: { ar: 'الروابط والنبذة', en: 'Links & bio' },
  questions: { ar: 'أسئلة الدورة', en: 'Cycle questions' },
  review: { ar: 'المراجعة والإرسال', en: 'Review & send' },
};
const NEXT_LABEL: Record<ApplicationStep, { ar: string; en: string }> = {
  personal: { ar: 'التالي: الدراسة', en: 'Next: Study' },
  academic: { ar: 'التالي: الروابط والنبذة', en: 'Next: Links & bio' },
  links: { ar: 'التالي: أسئلة الدورة', en: 'Next: Cycle questions' },
  questions: { ar: 'التالي: المراجعة', en: 'Next: Review' },
  review: { ar: 'أرسل طلبي', en: 'Send my application' },
};

const draftKey = (cycleId: string) => `sdc-join-draft:${cycleId}`;
export const trackedKey = (cycleId: string) => `sdc-join-token:${cycleId}`;
const DRAFT_DAYS = 7;

/**
 * The application (MBR-008), full screen like the approved design: a step rail beside the card on a wide screen, a
 * progress bar and a sticky button on a phone. Names are six fields (first, middle, family in Arabic and in English),
 * the phone has a country picker, each step validates on "Next" with inline errors, the draft is kept on this device
 * (never the consent), nothing is sent before "Send", and the result shows the reference number. The anti-spam layers
 * stay: a hidden field, a minimum fill time, and the database throttles.
 */
export function ApplicationForm({
  cycle,
  reference,
}: {
  cycle: PublicCycle;
  reference: Reference;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const { isDarkMode, toggleTheme } = useTheme();
  const toast = useToast();
  const questions: CycleQuestion[] = cycle.questions;
  const steps = useMemo(
    () => APPLICATION_STEPS.filter((s) => s !== 'questions' || questions.length > 0),
    [questions.length],
  );

  const [values, setValues] = useState<ApplicationValues>(() => emptyApplication());
  const [country, setCountry] = useState<PhoneCountry>(DEFAULT_PHONE_COUNTRY);
  const [national, setNational] = useState('');
  const [openedAt] = useState(() => Date.now());
  const [honeypot, setHoneypot] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<'form' | 'done'>('form');
  const [result, setResult] = useState<{ reference: string | null; token: string | null } | null>(
    null,
  );
  const [saved, setSaved] = useState(false);
  const [confirm1, setConfirm1] = useState(false);
  const [nameTab, setNameTab] = useState<'ar' | 'en'>('ar');
  const [pending, startTransition] = useTransition();
  const restored = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Restore a draft once, after mount (localStorage does not exist on the server).
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const raw = localStorage.getItem(draftKey(cycle.id));
      if (!raw) return;
      const d = JSON.parse(raw) as {
        at?: number;
        values?: Partial<ApplicationValues>;
        step?: number;
      };
      if (!d.at || Date.now() - d.at > DRAFT_DAYS * 86_400_000) {
        localStorage.removeItem(draftKey(cycle.id));
        return;
      }
      /* eslint-disable react-hooks/set-state-in-effect -- restoring browser-only state after hydration */
      setValues((v) => ({ ...v, ...(d.values ?? {}), consent: false }));
      const parts = splitInternational(d.values?.phone);
      if (parts) {
        setCountry(parts.country);
        setNational(parts.national);
      }
      if (typeof d.step === 'number') {
        setStepIndex(Math.min(Math.max(0, d.step), steps.length - 1));
        setMaxReached(Math.min(Math.max(0, d.step), steps.length - 1));
      }
      setSaved(true);
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {
      /* private mode or blocked storage: the form simply starts empty */
    }
  }, [cycle.id, steps.length]);

  // Autosave, a moment after typing stops.
  useEffect(() => {
    if (phase === 'done' || !restored.current) return;
    const t = window.setTimeout(() => {
      try {
        const clean = { ...values, consent: false };
        const empty =
          JSON.stringify(clean) === JSON.stringify({ ...emptyApplication(), consent: false });
        if (empty) return;
        localStorage.setItem(
          draftKey(cycle.id),
          JSON.stringify({ at: Date.now(), values: clean, step: stepIndex }),
        );
        setSaved(true);
      } catch {
        /* ignore */
      }
    }, 600);
    return () => window.clearTimeout(t);
  }, [values, stepIndex, cycle.id, phase]);

  const step = steps[stepIndex]!;
  const set = useCallback(
    <K extends keyof ApplicationValues>(key: K, value: ApplicationValues[K]) => {
      setValues((v) => ({ ...v, [key]: value }));
      setErrors((e) => {
        if (!(key in e)) return e;
        const { [key as string]: _drop, ...rest } = e;
        return rest;
      });
    },
    [],
  );
  const setAnswer = (key: string, value: string | string[]) => {
    setValues((v) => ({ ...v, answers: { ...v.answers, [key]: value } }));
    setErrors((e) => {
      const { [`q:${key}`]: _drop, ...rest } = e;
      return rest;
    });
  };
  const setPhone = (c: PhoneCountry, digits: string) => {
    const national = cleanNational(c, digits);
    setCountry(c);
    setNational(national);
    set('phone', national ? (toE164(c, national) ?? '') : '');
  };

  const toStep = (i: number) => {
    setStepIndex(i);
    window.requestAnimationFrame(() =>
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  };
  const focusFirst = (found: Record<string, string>) => {
    const first = Object.keys(found)[0]!;
    if (/^(firstNameEn|middleNameEn|lastNameEn)$/.test(first)) setNameTab('en');
    if (/^(firstNameAr|middleNameAr|lastNameAr)$/.test(first)) setNameTab('ar');
    window.setTimeout(() => document.getElementById(`field-${first}`)?.focus(), 30);
  };

  const next = () => {
    const found = validateApplicationStep(step, values, questions, lang);
    setErrors(found);
    if (Object.keys(found).length > 0) return focusFirst(found);
    setMaxReached((m) => Math.max(m, stepIndex + 1));
    toStep(Math.min(stepIndex + 1, steps.length - 1));
  };

  const submit = () => {
    const found = validateApplicationStep('review', values, questions, lang);
    if (!confirm1)
      found.confirm = L(
        'أكّد أن المعلومات صحيحة وتخصّك.',
        'Confirm the details are correct and yours.',
      );
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error(L('يرجى مراجعة الحقول المحددة.', 'Please review the highlighted fields.'));
      return;
    }
    startTransition(async () => {
      let r: Awaited<ReturnType<typeof applyForMembership>>;
      try {
        r = await withMinimumDuration(
          applyForMembership(
            { cycleId: cycle.id, values, honeypot, elapsedMs: Date.now() - openedAt },
            { lang },
          ),
        );
      } catch {
        toast.error(
          L('تعذّر إرسال الطلب. حاول مرة أخرى.', "We couldn't send your application. Try again."),
        );
        return;
      }
      if (!r.ok) {
        toast.error(r.message);
        if (r.fieldErrors) {
          setErrors(r.fieldErrors);
          if (r.fieldErrors.email) toStep(0);
        }
        return;
      }
      try {
        localStorage.removeItem(draftKey(cycle.id));
        if (r.data.token)
          localStorage.setItem(
            trackedKey(cycle.id),
            JSON.stringify({ token: r.data.token, reference: r.data.reference, at: Date.now() }),
          );
      } catch {
        /* ignore */
      }
      setResult({ reference: r.data.reference, token: r.data.token });
      setPhase('done');
      window.scrollTo({ top: 0 });
    });
  };

  const name = (o: { nameAr: string; nameEn: string | null }) =>
    ar ? o.nameAr : o.nameEn || o.nameAr;
  const parents = reference.majors.filter((m) => !m.parentId);
  const subMajors = reference.majors.filter(
    (m) => m.parentId && String(m.parentId) === values.majorId,
  );
  const err = (k: string) => errors[k];
  const closesLabel = formatDate(cycle.effectiveClosesAt, lang);
  const pct = phase === 'done' ? 100 : Math.round((stepIndex / steps.length) * 100);
  const NextIcon = ar ? ArrowLeft : ArrowRight;
  const BackIcon = ar ? ArrowRight : ArrowLeft;
  const cycleName = ar ? cycle.nameAr : cycle.nameEn || cycle.nameAr;

  const top = (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3 md:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/join"
            aria-label={L('العودة إلى صفحة الانضمام', 'Back to the join page')}
            className="shrink-0"
          >
            <LogoWordmark alt={L('المجتمع السعودي للمطورين', 'Saudi Developer Community')} />
          </Link>
          <div className="hidden min-w-0 md:block">
            <p className="font-bold">{L('طلب الانضمام', 'Application to join')}</p>
            <p className="truncate text-sm text-muted">
              {cycleName} · {L('يُغلق', 'closes')} {closesLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {phase === 'form' && saved && (
            <span
              role="status"
              className="hidden items-center gap-1.5 text-sm text-muted sm:inline-flex"
            >
              <Check size={15} aria-hidden="true" />
              {L('حُفظت المسودة على هذا الجهاز', 'Draft saved on this device')}
            </span>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={L('تبديل المظهر', 'Toggle theme')}
            className="flex size-11 items-center justify-center rounded-full text-muted hover:bg-surface-raised hover:text-text"
          >
            {isDarkMode ? (
              <Sun size={18} aria-hidden="true" />
            ) : (
              <Moon size={18} aria-hidden="true" />
            )}
          </button>
          {phase === 'form' && (
            <Link
              href="/join"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted hover:text-text"
            >
              <X size={16} aria-hidden="true" className="md:hidden" />
              <span className="max-md:sr-only">{L('خروج', 'Exit')}</span>
            </Link>
          )}
        </div>
      </div>
      <div className="h-1 bg-surface-raised" aria-hidden="true">
        <div
          className="h-full bg-accent transition-[width] duration-(--duration-slow) motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
    </header>
  );

  if (phase === 'done') {
    return (
      <>
        {top}
        <Done
          cycle={cycle}
          values={values}
          reference={result?.reference ?? null}
          token={result?.token ?? null}
        />
      </>
    );
  }

  const nameField = (
    key: keyof ApplicationValues,
    label: string,
    opts: { required?: boolean; en?: boolean },
  ) => (
    <Field
      id={`field-${key}`}
      label={label}
      value={values[key] as string}
      onChange={(e) => set(key, e.target.value as never)}
      error={err(key)}
      dir={opts.en ? 'ltr' : undefined}
      maxLength={100}
      autoComplete={
        key.startsWith('first') ? 'given-name' : key.startsWith('last') ? 'family-name' : 'off'
      }
      requiredLabel={opts.required ? L('مطلوب', 'required') : undefined}
      optionalLabel={!opts.required ? L('اختياري', 'optional') : undefined}
    />
  );

  return (
    <>
      {top}
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 pb-32 pt-6 md:px-8 md:pt-10 lg:grid-cols-[17rem_minmax(0,1fr)]">
        {/* Rail (wide) / compact progress (phone) */}
        <nav
          aria-label={L('خطوات الطلب', 'Application steps')}
          className="lg:sticky lg:top-28 lg:self-start"
        >
          <p className="mb-3 text-sm text-muted lg:mb-4">
            {L(
              `الخطوة ${stepIndex + 1} من ${steps.length}`,
              `Step ${stepIndex + 1} of ${steps.length}`,
            )}
          </p>
          <ol className="hidden flex-col gap-1 lg:flex">
            {steps.map((s, i) => {
              const done = i < stepIndex || (i <= maxReached && i !== stepIndex);
              const clickable = i <= maxReached && i !== stepIndex;
              return (
                <li key={s}>
                  <button
                    type="button"
                    disabled={!clickable}
                    aria-current={i === stepIndex ? 'step' : undefined}
                    onClick={() => toStep(i)}
                    className={cn(
                      'flex min-h-13 w-full items-center gap-3 rounded-shape-lg px-3 text-start font-medium transition-colors focus-visible:outline-2 focus-visible:outline-focus-ring',
                      i === stepIndex ? 'bg-surface font-bold text-text' : 'text-muted',
                      clickable && 'hover:bg-surface-raised',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full border-[1.5px] text-sm font-bold tabular-nums',
                        i === stepIndex
                          ? 'border-accent bg-accent text-on-accent'
                          : done
                            ? 'border-transparent bg-accent-soft text-on-accent-soft'
                            : 'border-line-strong',
                      )}
                    >
                      {done && i !== stepIndex ? <Check size={14} /> : i + 1}
                    </span>
                    {STEP_LABEL[s][lang]}
                    {done && i !== stepIndex && (
                      <span className="sr-only">{L('(مكتملة)', '(done)')}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-5 hidden items-start gap-2 rounded-shape-lg bg-surface-raised p-3 text-sm text-muted lg:flex">
            <ShieldCheck size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
            {L(
              'بريدك وجوالك لا يظهران للعموم. لا نرسل شيئاً قبل أن تضغط «أرسل».',
              'Your e-mail and phone are never public. Nothing is sent before you press “Send”.',
            )}
          </p>
        </nav>

        <div ref={cardRef} className="min-w-0 scroll-mt-28">
          <div
            className="m-enter flex flex-col gap-6 rounded-shape-2xl border border-line bg-surface p-5 sm:p-8 lg:p-9"
            key={step}
          >
            {step === 'personal' && (
              <>
                {/* The anti-spam trap: invisible to people, tempting to bots. */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    insetInlineStart: '-9999px',
                    height: 0,
                    overflow: 'hidden',
                  }}
                >
                  <label>
                    Website
                    <input
                      type="text"
                      name="company_website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </label>
                </div>
                <div>
                  <h1 className="t-h3">{L('لنتعرّف عليك', "Let's get to know you")}</h1>
                  <p className="mt-1 text-muted">
                    {L(
                      'اكتب اسمك كما تحب أن يظهر في شهاداتك وبطاقتك.',
                      'Write your name the way you want it on your certificates and card.',
                    )}
                  </p>
                </div>
                {Object.keys(errors).length > 0 && (
                  <div role="alert" className="rounded-shape-lg bg-danger-soft p-4 text-sm">
                    <p className="font-semibold">
                      {L(
                        `بقي ${Object.keys(errors).length} ${Object.keys(errors).length === 1 ? 'حقل' : 'حقول'}`,
                        `${Object.keys(errors).length} field${Object.keys(errors).length === 1 ? '' : 's'} to fix`,
                      )}
                    </p>
                    <ul className="mt-1 list-disc ps-5 text-muted">
                      {Object.values(errors)
                        .slice(0, 4)
                        .map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                    </ul>
                  </div>
                )}
                <div
                  className="flex gap-1 rounded-full bg-surface-raised p-1 sm:hidden"
                  role="tablist"
                  aria-label={L('لغة الاسم', 'Name language')}
                >
                  {(['ar', 'en'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="tab"
                      aria-selected={nameTab === t}
                      onClick={() => setNameTab(t)}
                      className={cn(
                        'relative min-h-11 flex-1 rounded-full text-sm font-semibold',
                        nameTab === t ? 'bg-accent text-on-accent' : 'text-muted',
                      )}
                    >
                      {t === 'ar' ? 'العربية' : 'English'}
                      {t !== nameTab &&
                        Object.keys(errors).some((k) =>
                          t === 'ar' ? /Ar$/.test(k) : /En$/.test(k),
                        ) && (
                          <span
                            aria-hidden="true"
                            className="absolute end-3 top-3 size-2 rounded-full bg-danger"
                          />
                        )}
                    </button>
                  ))}
                </div>
                <fieldset
                  className={cn(
                    'flex flex-col gap-3 sm:flex',
                    nameTab === 'ar' ? 'flex' : 'max-sm:hidden',
                  )}
                >
                  <legend className="mb-1 font-semibold">{L('بالعربية', 'In Arabic')}</legend>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {nameField('firstNameAr', L('الاسم الأول', 'First name'), { required: true })}
                    {nameField('middleNameAr', L('الاسم الأوسط', 'Middle name'), {})}
                    {nameField('lastNameAr', L('اسم العائلة', 'Family name'), { required: true })}
                  </div>
                </fieldset>
                <fieldset
                  className={cn(
                    'flex flex-col gap-3 sm:flex',
                    nameTab === 'en' ? 'flex' : 'max-sm:hidden',
                  )}
                >
                  <legend className="mb-1 font-semibold">
                    {L('بالإنجليزية · In English', 'In English')}
                  </legend>
                  <div className="grid gap-4 sm:grid-cols-3" dir="ltr">
                    {nameField('firstNameEn', 'First name', { required: true, en: true })}
                    {nameField('middleNameEn', 'Middle name', { en: true })}
                    {nameField('lastNameEn', 'Last name', { required: true, en: true })}
                  </div>
                </fieldset>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    id="field-email"
                    label={L('البريد الإلكتروني', 'E-mail')}
                    requiredLabel={L('مطلوب', 'required')}
                    hint={L(
                      'نرسل إليه القرار ورابط متابعة طلبك.',
                      'We send the decision and the link to follow your application there.',
                    )}
                    value={values.email}
                    onChange={(e) => set('email', e.target.value)}
                    error={err('email')}
                    dir="ltr"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    maxLength={160}
                  />
                  <PhoneField
                    id="field-phone"
                    label={L('الجوال', 'Phone')}
                    requiredLabel={L('مطلوب', 'required')}
                    hint={L(
                      'لا يظهر لأحد خارج فريق المراجعة.',
                      'Never visible outside the review team.',
                    )}
                    country={country}
                    onCountryChange={(c) => setPhone(c, national)}
                    value={national}
                    onChange={(d) => setPhone(country, d)}
                    lang={lang}
                    countryLabel={L('مفتاح الدولة', 'Country calling code')}
                    error={err('phone')}
                  />
                </div>
              </>
            )}

            {step === 'academic' && (
              <>
                <div>
                  <h1 className="t-h3">{L('الدراسة', 'Study')}</h1>
                  <p className="mt-1 text-muted">
                    {L(
                      'دراستك أو عملك. لا يُشترط أن تكون طالباً، المجتمع مفتوح للجميع.',
                      'Your study or work. You do not have to be a student, the community is open to everyone.',
                    )}
                  </p>
                </div>
                <Chips
                  id="field-academicStatus"
                  label={L('وضعك الحالي', 'Your current status')}
                  value={values.academicStatus as string}
                  options={ACADEMIC_STATUSES.map((s) => ({
                    value: s,
                    label: ACADEMIC_LABEL[s][lang],
                  }))}
                  onChange={(v) => set('academicStatus', v as ApplicationValues['academicStatus'])}
                  error={err('academicStatus')}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Select
                    id="field-universityId"
                    label={L('الجامعة', 'University')}
                    requiredLabel={L('مطلوب', 'required')}
                    value={values.universityId}
                    onChange={(e) => set('universityId', e.target.value)}
                    error={err('universityId')}
                  >
                    <option value="">{L('اختر…', 'Choose…')}</option>
                    {reference.universities.map((u) => (
                      <option key={u.id} value={u.id}>
                        {name(u)}
                      </option>
                    ))}
                    <option value={OTHER}>{L('أخرى (اكتبها)', 'Other (type it)')}</option>
                  </Select>
                  {values.universityId === OTHER && (
                    <Field
                      id="field-otherUniversity"
                      label={L('اسم الجامعة', 'University name')}
                      value={values.otherUniversity}
                      onChange={(e) => set('otherUniversity', e.target.value)}
                      maxLength={150}
                    />
                  )}
                  <Select
                    id="field-majorId"
                    label={L('التخصص', 'Major')}
                    requiredLabel={L('مطلوب', 'required')}
                    value={values.majorId}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, majorId: e.target.value, subMajorId: '' }))
                    }
                    error={err('majorId')}
                  >
                    <option value="">{L('اختر…', 'Choose…')}</option>
                    {parents.map((m) => (
                      <option key={m.id} value={m.id}>
                        {name(m)}
                      </option>
                    ))}
                    <option value={OTHER}>{L('أخرى (اكتبه)', 'Other (type it)')}</option>
                  </Select>
                  {values.majorId === OTHER && (
                    <Field
                      id="field-otherMajor"
                      label={L('اسم التخصص', 'Major name')}
                      value={values.otherMajor}
                      onChange={(e) => set('otherMajor', e.target.value)}
                      maxLength={150}
                    />
                  )}
                  {subMajors.length > 0 && (
                    <Select
                      id="field-subMajorId"
                      label={L('التخصص الدقيق', 'Sub-major')}
                      optionalLabel={L('اختياري', 'optional')}
                      value={values.subMajorId}
                      onChange={(e) => set('subMajorId', e.target.value)}
                    >
                      <option value="">{L('اختياري', 'Optional')}</option>
                      {subMajors.map((m) => (
                        <option key={m.id} value={m.id}>
                          {name(m)}
                        </option>
                      ))}
                    </Select>
                  )}
                  <Select
                    id="field-trackId"
                    label={L('المسار الذي يهمّك', 'The track you care about')}
                    requiredLabel={L('مطلوب', 'required')}
                    value={values.trackId}
                    onChange={(e) => set('trackId', e.target.value)}
                    error={err('trackId')}
                  >
                    <option value="">{L('اختر…', 'Choose…')}</option>
                    {reference.tracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {name(t)}
                      </option>
                    ))}
                  </Select>
                  <Select
                    id="field-preferredCommitteeId"
                    label={L('اللجنة المفضلة', 'Preferred committee')}
                    optionalLabel={L('اختياري', 'optional')}
                    value={values.preferredCommitteeId}
                    onChange={(e) => set('preferredCommitteeId', e.target.value)}
                  >
                    <option value="">{L('اختياري', 'Optional')}</option>
                    {reference.committees.map((c) => (
                      <option key={c.id} value={c.id}>
                        {name(c)}
                      </option>
                    ))}
                  </Select>
                </div>
                <p className="text-sm text-muted">
                  {L(
                    'لا تجد جامعتك؟ اختر «أخرى» واكتب اسمها.',
                    'Cannot find your university? Choose “Other” and type it.',
                  )}
                </p>
              </>
            )}

            {step === 'links' && (
              <>
                <div>
                  <h1 className="t-h3">{L('أرنا ما تبنيه', 'Show us what you build')}</h1>
                  <p className="mt-1 text-muted">
                    {L(
                      'الروابط اختيارية. إن لم يكن لديك شيء بعد، فلا بأس، أخبرنا بما تريد تعلّمه.',
                      'Links are optional. If you have nothing yet, that is fine: tell us what you want to learn.',
                    )}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {(
                    [
                      ['githubUrl', 'GitHub'],
                      ['linkedinUrl', 'LinkedIn'],
                      ['portfolioUrl', L('موقعك الشخصي / أعمالك', 'Portfolio / website')],
                      ['xUrl', 'X'],
                    ] as const
                  ).map(([key, label]) => (
                    <Field
                      key={key}
                      id={`field-${key}`}
                      label={label}
                      optionalLabel={L('اختياري', 'optional')}
                      value={values[key]}
                      onChange={(e) => set(key, e.target.value)}
                      error={err(key)}
                      dir="ltr"
                      placeholder="https://"
                      inputMode="url"
                    />
                  ))}
                </div>
                <Textarea
                  id="field-bioAr"
                  label={L('نبذة قصيرة', 'A short bio')}
                  requiredLabel={L('مطلوب', 'required')}
                  hint={L(
                    'ماذا تبني الآن؟ ما الذي تريد تعلّمه هذا العام؟',
                    'What are you building now? What do you want to learn this year?',
                  )}
                  value={values.bioAr}
                  onChange={(e) => set('bioAr', e.target.value)}
                  maxLength={1000}
                  counter
                  error={err('bioAr')}
                  rows={5}
                />
                <Textarea
                  id="field-bioEn"
                  label={L('النبذة بالإنجليزية', 'Bio in English')}
                  optionalLabel={L('اختياري', 'optional')}
                  value={values.bioEn}
                  onChange={(e) => set('bioEn', e.target.value)}
                  maxLength={1000}
                  counter
                  dir="ltr"
                  rows={3}
                />
              </>
            )}

            {step === 'questions' && (
              <>
                <div>
                  <h1 className="t-h3">{L('أسئلة الدورة', 'Cycle questions')}</h1>
                  <p className="mt-1 text-muted">
                    {L(
                      `أسئلة هذه الدورة وضعتها القيادة لـ ${cycleName}. أجب بصدق، فلا إجابة خاطئة.`,
                      `These questions were set by leadership for ${cycleName}. Answer honestly, there is no wrong answer.`,
                    )}
                  </p>
                </div>
                {questions.map((q) => (
                  <QuestionField
                    key={q.key}
                    q={q}
                    value={values.answers[q.key]}
                    error={err(`q:${q.key}`)}
                    onChange={(v) => setAnswer(q.key, v)}
                    ar={ar}
                  />
                ))}
              </>
            )}

            {step === 'review' && (
              <>
                <div>
                  <h1 className="t-h3">{L('راجع طلبك', 'Review your application')}</h1>
                  <p className="mt-1 text-muted">
                    {L(
                      'لن يصلنا شيء قبل أن تضغط «أرسل طلبي».',
                      'Nothing reaches us before you press “Send my application”.',
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-shape-lg bg-accent-soft p-4">
                  <div className="min-w-0">
                    <p className="text-sm text-on-accent-soft">
                      {L(
                        'سنرسل القرار ورابط المتابعة إلى',
                        'We will send the decision and the tracking link to',
                      )}
                    </p>
                    <p
                      dir="ltr"
                      className="break-all text-lg font-bold text-on-accent-soft"
                      style={{ textAlign: 'start' }}
                    >
                      {values.email}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      toStep(0);
                      window.setTimeout(() => document.getElementById('field-email')?.focus(), 400);
                    }}
                  >
                    {L('ليس بريدي', 'Not my e-mail')}
                  </Button>
                </div>
                <ReviewSummary
                  values={values}
                  reference={reference}
                  questions={questions}
                  onEdit={(s) => toStep(steps.indexOf(s))}
                />
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-shape-lg border-[1.5px] p-4',
                    confirm1 ? 'border-accent bg-accent-soft' : 'border-line',
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1 size-5 shrink-0 accent-[var(--accent)]"
                    checked={confirm1}
                    onChange={(e) => {
                      setConfirm1(e.target.checked);
                      setErrors((x) => {
                        const { confirm: _c, ...r } = x;
                        return r;
                      });
                    }}
                  />
                  <span>
                    {L(
                      'أؤكد أن المعلومات صحيحة وتخصّني.',
                      'I confirm the details are correct and mine.',
                    )}
                  </span>
                </label>
                {err('confirm') && (
                  <p role="alert" className="-mt-4 text-sm text-danger">
                    {err('confirm')}
                  </p>
                )}
                <label
                  id="field-consent"
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-shape-lg border-[1.5px] p-4',
                    values.consent ? 'border-accent bg-accent-soft' : 'border-line',
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1 size-5 shrink-0 accent-[var(--accent)]"
                    checked={values.consent}
                    onChange={(e) => set('consent', e.target.checked)}
                  />
                  <span>
                    {L('قرأت ', 'I have read the ')}
                    <Link href="/privacy" target="_blank" className="text-accent-text underline">
                      {L('سياسة الخصوصية', 'privacy notice')}
                    </Link>
                    {L(
                      ' وأوافق على أن يطّلع فريق المراجعة على طلبي.',
                      ' and agree that the review team reads my application.',
                    )}
                  </span>
                </label>
                {err('consent') && (
                  <p role="alert" className="-mt-4 text-sm text-danger">
                    {err('consent')}
                  </p>
                )}
                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 size-5 shrink-0 accent-[var(--accent)]"
                    checked={values.wantsDirectoryListing}
                    onChange={(e) => set('wantsDirectoryListing', e.target.checked)}
                  />
                  <span className="text-muted">
                    {L(
                      'أرغب في الظهور في دليل الأعضاء العام عند قبولي (يمكنك تغيير ذلك لاحقاً).',
                      'I would like to appear in the public member directory if accepted (you can change this later).',
                    )}
                  </span>
                </label>
              </>
            )}

            <div className="hidden items-center justify-between gap-3 border-t border-line pt-5 md:flex">
              {stepIndex > 0 ? (
                <Button
                  variant="ghost"
                  onClick={() => toStep(stepIndex - 1)}
                  disabled={pending}
                  iconStart={<BackIcon size={16} aria-hidden="true" />}
                >
                  {L('السابق', 'Back')}
                </Button>
              ) : (
                <span className="text-sm text-muted">{L('السابق', 'Back')}</span>
              )}
              <Button
                onClick={step === 'review' ? submit : next}
                loading={pending}
                size="lg"
                iconEnd={
                  step === 'review' ? (
                    <Send size={16} aria-hidden="true" />
                  ) : (
                    <NextIcon size={16} aria-hidden="true" />
                  )
                }
              >
                {pending ? L('جارٍ الإرسال…', 'Sending…') : NEXT_LABEL[step][lang]}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Phone: the button stays at the bottom, in reach. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-line bg-surface-overlay p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        {stepIndex > 0 && (
          <Button
            variant="secondary"
            aria-label={L('السابق', 'Back')}
            onClick={() => toStep(stepIndex - 1)}
            disabled={pending}
          >
            <BackIcon size={18} aria-hidden="true" />
          </Button>
        )}
        <Button
          className="flex-1"
          size="lg"
          onClick={step === 'review' ? submit : next}
          loading={pending}
        >
          {pending ? L('جارٍ الإرسال…', 'Sending…') : NEXT_LABEL[step][lang]}
        </Button>
      </div>
    </>
  );
}

function QuestionField({
  q,
  value,
  error,
  onChange,
  ar,
}: {
  q: CycleQuestion;
  value: string | string[] | undefined;
  error?: string;
  onChange: (v: string | string[]) => void;
  ar: boolean;
}) {
  const label = ar ? q.label_ar : q.label_en || q.label_ar;
  const required = q.required ? (ar ? 'مطلوب' : 'required') : undefined;
  if (q.type === 'long_text')
    return (
      <Textarea
        id={`field-q:${q.key}`}
        label={label}
        requiredLabel={required}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        maxLength={2000}
        counter
        error={error}
        rows={4}
      />
    );
  if (q.type === 'single_choice')
    return (
      <Chips
        id={`field-q:${q.key}`}
        label={`${label}${q.required ? ' *' : ''}`}
        value={typeof value === 'string' ? value : ''}
        options={(q.options ?? []).map((o) => ({ value: o, label: o }))}
        onChange={(v) => onChange(v)}
        error={error}
      />
    );
  if (q.type === 'multi_choice') {
    const chosen = Array.isArray(value) ? value : [];
    return (
      <fieldset id={`field-q:${q.key}`} className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">
          {label}
          {q.required ? ' *' : ''}
        </legend>
        <div className="flex flex-wrap gap-2">
          {(q.options ?? []).map((o) => {
            const on = chosen.includes(o);
            return (
              <button
                key={o}
                type="button"
                aria-pressed={on}
                onClick={() => onChange(on ? chosen.filter((x) => x !== o) : [...chosen, o])}
                className={cn(
                  'min-h-11 rounded-full border-[1.5px] px-4 text-sm font-medium',
                  on
                    ? 'border-accent bg-accent-soft text-on-accent-soft'
                    : 'border-line-strong text-muted hover:text-text',
                )}
              >
                {o}
              </button>
            );
          })}
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </fieldset>
    );
  }
  return (
    <Field
      id={`field-q:${q.key}`}
      label={label}
      requiredLabel={required}
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      maxLength={2000}
      error={error}
    />
  );
}

function ReviewSummary({
  values,
  reference,
  questions,
  onEdit,
}: {
  values: ApplicationValues;
  reference: Reference;
  questions: CycleQuestion[];
  onEdit: (step: ApplicationStep) => void;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const find = (list: ReferenceOption[], id: string, other: string) =>
    id === OTHER
      ? other
      : (() => {
          const o = list.find((x) => String(x.id) === id);
          return o ? (ar ? o.nameAr : o.nameEn || o.nameAr) : '—';
        })();
  const nameAr = [values.firstNameAr, values.middleNameAr, values.lastNameAr]
    .filter(Boolean)
    .join(' ');
  const nameEn = [values.firstNameEn, values.middleNameEn, values.lastNameEn]
    .filter(Boolean)
    .join(' ');
  const groups: Array<{ step: ApplicationStep; title: string; rows: Array<[string, string]> }> = [
    {
      step: 'personal',
      title: ar ? 'عنك' : 'About you',
      rows: [
        [ar ? 'الاسم' : 'Name', nameAr],
        [ar ? 'بالإنجليزية' : 'In English', nameEn],
        [ar ? 'الجوال' : 'Phone', values.phone || '—'],
      ],
    },
    {
      step: 'academic',
      title: ar ? 'الدراسة' : 'Study',
      rows: [
        [
          ar ? 'الوضع' : 'Status',
          values.academicStatus ? ACADEMIC_LABEL[values.academicStatus][lang] : '—',
        ],
        [
          ar ? 'الجامعة' : 'University',
          find(reference.universities, values.universityId, values.otherUniversity),
        ],
        [ar ? 'التخصص' : 'Major', find(reference.majors, values.majorId, values.otherMajor)],
        [ar ? 'المسار' : 'Track', find(reference.tracks, values.trackId, '')],
      ],
    },
    {
      step: 'links',
      title: ar ? 'الروابط والنبذة' : 'Links & bio',
      rows: [
        ...(values.githubUrl
          ? ([['GitHub', values.githubUrl.replace(/^https:\/\//, '')]] as Array<[string, string]>)
          : []),
        [
          ar ? 'النبذة' : 'Bio',
          values.bioAr.length > 90 ? `${values.bioAr.slice(0, 90)}…` : values.bioAr || '—',
        ],
      ],
    },
    ...(questions.length > 0
      ? [
          {
            step: 'questions' as const,
            title: ar ? 'أسئلة الدورة' : 'Cycle questions',
            rows: questions.map((q): [string, string] => {
              const a = values.answers[q.key];
              const text = Array.isArray(a) ? a.join('، ') : a || '—';
              return [
                ar ? q.label_ar : q.label_en || q.label_ar,
                text.length > 90 ? `${text.slice(0, 90)}…` : text,
              ];
            }),
          },
        ]
      : []),
  ];
  return (
    <div className="flex flex-col gap-3">
      {groups.map((g) => (
        <section key={g.step} className="rounded-shape-lg bg-surface-raised p-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="font-bold">{g.title}</h2>
            <button
              type="button"
              className="min-h-11 px-2 text-sm font-semibold text-accent-text underline-offset-4 hover:underline"
              onClick={() => onEdit(g.step)}
            >
              {ar ? 'تعديل' : 'Edit'}
            </button>
          </div>
          <dl className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[9rem_minmax(0,1fr)]">
            {g.rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted">{k}</dt>
                <dd className="break-words">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

function Done({
  cycle,
  values,
  reference,
  token,
}: {
  cycle: PublicCycle;
  values: ApplicationValues;
  reference: string | null;
  token: string | null;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const decision = cycle.reviewEndsAt ? formatDate(cycle.reviewEndsAt, lang) : null;
  const sentAt = new Intl.DateTimeFormat(ar ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Riyadh',
  }).format(new Date());
  const addToCalendar = () => {
    if (!cycle.reviewEndsAt) return;
    const date = new Date(new Date(cycle.reviewEndsAt).getTime() + 3 * 3_600_000)
      .toISOString()
      .slice(0, 10);
    const ics = buildDayIcs({
      uid: `decision-${reference ?? cycle.id}`,
      date,
      title: L(`قرار طلب العضوية ${reference ?? ''}`, `Membership decision ${reference ?? ''}`),
      description: L('نراسلك بالقرار بالبريد الإلكتروني.', 'We e-mail you the decision.'),
    });
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sdc-membership-decision.ics';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main
      className="mx-auto flex max-w-[44rem] flex-col items-center gap-6 px-4 py-12 text-center md:py-16"
      aria-live="polite"
    >
      <span className="m-pop relative flex size-24 items-center justify-center rounded-full bg-accent text-on-accent">
        <CircleCheck size={44} aria-hidden="true" />
      </span>
      <h1 className="t-h2" tabIndex={-1} ref={(el) => el?.focus()}>
        {L(
          `وصلنا طلبك يا ${values.firstNameAr}`,
          `We received your application, ${values.firstNameEn || values.firstNameAr}`,
        )}
      </h1>
      <p className="t-lede max-w-xl text-muted">
        {L('أرسلنا تأكيداً ورابط متابعة إلى ', 'We sent a confirmation and a tracking link to ')}
        <bdi dir="ltr" className="font-semibold text-text">
          {values.email}
        </bdi>
        {L(
          '. إن لم تجده خلال دقائق، فانظر في الرسائل غير المرغوبة.',
          '. If it does not arrive within minutes, check your spam folder.',
        )}
      </p>
      {reference && (
        <div className="w-full rounded-shape-xl border border-line bg-surface p-6">
          <p className="text-sm text-muted">{L('رقمك المرجعي', 'Your reference number')}</p>
          <p dir="ltr" className="my-2 font-mono text-3xl font-bold tracking-[0.06em] sm:text-5xl">
            {reference}
          </p>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(reference);
                setCopied(true);
                toast.info(L('تم النسخ.', 'Copied.'));
              } catch {
                /* ignore */
              }
            }}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-accent-text hover:bg-surface-raised"
          >
            <Copy size={14} aria-hidden="true" />
            {copied ? L('نُسخ', 'Copied') : L('نسخ الرقم', 'Copy the number')}
          </button>
          <p className="mt-2 text-sm text-muted">{L(`أُرسل طلبك ${sentAt}`, `Sent ${sentAt}`)}</p>
        </div>
      )}
      <div className="w-full rounded-shape-xl bg-surface-raised p-5 text-start">
        <p className="font-semibold">{L('ماذا بعد؟', 'What happens next?')}</p>
        <p className="mt-1 text-muted">
          {decision
            ? L(
                `يصلك القرار بالبريد بحلول ${decision}. إن احتجنا تعديلاً سنراسلك.`,
                `You hear from us by e-mail by ${decision}. If we need a change we will write to you.`,
              )
            : L(
                'نراجع الطلبات بعد إغلاق باب التقديم ويصلك القرار بالبريد. إن احتجنا تعديلاً سنراسلك.',
                'We review applications once the window closes and you get the decision by e-mail. If we need a change we will write to you.',
              )}
        </p>
      </div>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        {token && (
          <Link
            href={`/join/status/${token}`}
            className="inline-flex min-h-13 items-center justify-center rounded-full bg-accent px-7 font-semibold text-on-accent hover:bg-accent-hover"
          >
            {L('تابع طلبك', 'Follow your application')}
          </Link>
        )}
        {cycle.reviewEndsAt && (
          <Button
            variant="secondary"
            size="lg"
            onClick={addToCalendar}
            iconStart={<Calendar size={16} aria-hidden="true" />}
          >
            {L('أضف موعد القرار لتقويمك', 'Add the decision date to your calendar')}
          </Button>
        )}
      </div>
      <p className="text-sm text-muted">
        {L('حتى ذلك الحين: ', 'Until then: ')}
        <Link href="/events" className="text-accent-text underline">
          {L('فعاليات مفتوحة للجميع', 'events open to everyone')}
        </Link>
      </p>
    </main>
  );
}
