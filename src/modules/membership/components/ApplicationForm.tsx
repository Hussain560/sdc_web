'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button, Chips, Field, Select, Stepper, Textarea, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { Link } from '@/i18n/navigation';
import { submitApplication, updateApplication } from '../actions';
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
  personal: { ar: 'البيانات الشخصية', en: 'Personal details' },
  academic: { ar: 'الدراسة والعمل', en: 'Study & work' },
  links: { ar: 'نبذة وروابط', en: 'Bio & links' },
  questions: { ar: 'أسئلة', en: 'Questions' },
  review: { ar: 'المراجعة', en: 'Review' },
};

const draftKey = (cycleId: string) => `sdc-join-draft:${cycleId}`;

/**
 * The 5-step application (docs/10-design-system/INTERNAL-SCREENS/25-join-page.md §1.4). Each step validates on
 * *Next*; the draft survives a refresh (sessionStorage, never the password or anything sensitive); the server
 * re-checks the cycle is open at submit time and the local draft is kept if it closed meanwhile.
 */
export function ApplicationForm({
  cycle,
  reference,
  initial,
  applicationId,
  defaultName,
}: {
  cycle: PublicCycle;
  reference: Reference;
  /** Present when editing an existing application. */
  initial?: ApplicationValues;
  applicationId?: string;
  defaultName?: string;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const editing = Boolean(applicationId);
  const questions: CycleQuestion[] = cycle.questions;

  const steps = APPLICATION_STEPS.filter((s) => s !== 'questions' || questions.length > 0);
  const [values, setValues] = useState<ApplicationValues>(() => ({
    ...(initial ?? emptyApplication()),
    fullNameAr: initial?.fullNameAr ?? defaultName ?? '',
  }));
  const [stepIndex, setStepIndex] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const restored = useRef(false);

  // Restore a draft once, after mount (never during render: sessionStorage does not exist on the server).
  useEffect(() => {
    if (editing || restored.current) return;
    restored.current = true;
    try {
      const raw = sessionStorage.getItem(draftKey(cycle.id));
      // Restoring browser-only state after hydration (same pattern as the event wizard draft).
      if (raw)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setValues((v) => ({
          ...v,
          ...(JSON.parse(raw) as Partial<ApplicationValues>),
          consent: false,
        }));
    } catch {
      /* private mode or blocked storage: the form simply starts empty */
    }
  }, [cycle.id, editing]);

  useEffect(() => {
    if (editing || done) return;
    try {
      sessionStorage.setItem(draftKey(cycle.id), JSON.stringify({ ...values, consent: false }));
    } catch {
      /* ignore */
    }
  }, [values, cycle.id, editing, done]);

  const step = steps[stepIndex]!;
  const set = <K extends keyof ApplicationValues>(key: K, value: ApplicationValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => {
      if (!(key in e)) return e;
      const { [key as string]: _drop, ...rest } = e;
      return rest;
    });
  };
  const setAnswer = (key: string, value: string | string[]) => {
    setValues((v) => ({ ...v, answers: { ...v.answers, [key]: value } }));
    setErrors((e) => {
      const { [`q:${key}`]: _drop, ...rest } = e;
      return rest;
    });
  };

  const next = () => {
    const found = validateApplicationStep(step, values, questions, lang);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0]!;
      document.getElementById(`field-${first}`)?.focus();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    setMaxReached((m) => Math.max(m, stepIndex + 1));
  };

  const submit = () => {
    const found = validateApplicationStep('review', values, questions, lang);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error(ar ? 'يرجى مراجعة الحقول المحددة.' : 'Please review the highlighted fields.');
      return;
    }
    startTransition(async () => {
      const r = editing
        ? await updateApplication({ id: applicationId!, values }, { lang })
        : await submitApplication({ cycleId: cycle.id, values }, { lang });
      if (!r.ok) {
        toast.error(r.message);
        if (r.fieldErrors) setErrors(r.fieldErrors);
        return;
      }
      try {
        sessionStorage.removeItem(draftKey(cycle.id));
      } catch {
        /* ignore */
      }
      toast.success(
        editing
          ? ar
            ? 'تم حفظ التعديلات على طلبك.'
            : 'Your application was updated.'
          : ar
            ? 'تم إرسال طلبك.'
            : 'Your application was submitted.',
      );
      setDone(true);
    });
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center" role="status">
        <CheckCircle2 size={44} className="text-accent" aria-hidden="true" />
        <h2 className="text-xl font-extrabold">
          {editing
            ? ar
              ? 'تم تحديث طلبك'
              : 'Your application was updated'
            : ar
              ? 'تم استلام طلبك ✓'
              : 'Application received ✓'}
        </h2>
        <p className="max-w-md text-muted">
          {ar
            ? 'سنراجع الطلبات بعد إغلاق باب التقديم وسيصلك القرار بالبريد الإلكتروني. تابع حالة طلبك من حسابك.'
            : 'We review applications once the window closes and you will receive the decision by e-mail. Follow your status from your account.'}
        </p>
        <Link
          href="/account/membership"
          className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-on-accent hover:bg-accent-hover"
        >
          {ar ? 'طلبي' : 'My application'}
        </Link>
      </div>
    );
  }

  const name = (o: { nameAr: string; nameEn: string | null }) =>
    ar ? o.nameAr : o.nameEn || o.nameAr;
  const parents = reference.majors.filter((m) => !m.parentId);
  const subMajors = reference.majors.filter(
    (m) => m.parentId && String(m.parentId) === values.majorId,
  );
  const err = (k: string) => errors[k];

  return (
    <div className="flex flex-col gap-6">
      <Stepper
        steps={steps.map((s) => ({
          label: STEP_LABEL[s][lang],
          warning: false,
        }))}
        current={stepIndex + 1}
        maxReached={maxReached + 1}
        onSelect={(n) => setStepIndex(n - 1)}
        labelOf={(n, total, label) =>
          ar ? `الخطوة ${n} من ${total} — ${label}` : `Step ${n} of ${total} — ${label}`
        }
      />

      <div className="flex flex-col gap-4">
        {step === 'personal' && (
          <>
            <Field
              id="field-fullNameAr"
              label={ar ? 'الاسم بالعربية *' : 'Name in Arabic *'}
              value={values.fullNameAr}
              onChange={(e) => set('fullNameAr', e.target.value)}
              error={err('fullNameAr')}
              autoComplete="name"
              maxLength={100}
            />
            <Field
              id="field-fullNameEn"
              label={ar ? 'الاسم بالإنجليزية' : 'Name in English'}
              value={values.fullNameEn}
              onChange={(e) => set('fullNameEn', e.target.value)}
              dir="ltr"
              maxLength={100}
            />
            <Field
              id="field-phone"
              label={ar ? 'رقم الجوال' : 'Mobile number'}
              hint={ar ? 'اختياري — مثال: +966501234567' : 'Optional — e.g. +966501234567'}
              value={values.phone}
              onChange={(e) => set('phone', e.target.value)}
              error={err('phone')}
              dir="ltr"
              inputMode="tel"
              autoComplete="tel"
            />
          </>
        )}

        {step === 'academic' && (
          <>
            <Chips
              id="field-academicStatus"
              label={ar ? 'الحالة *' : 'Status *'}
              value={values.academicStatus as string}
              options={ACADEMIC_STATUSES.map((s) => ({ value: s, label: ACADEMIC_LABEL[s][lang] }))}
              onChange={(v) => set('academicStatus', v as ApplicationValues['academicStatus'])}
              error={err('academicStatus')}
            />
            <Select
              id="field-universityId"
              label={ar ? 'الجامعة *' : 'University *'}
              value={values.universityId}
              onChange={(e) => set('universityId', e.target.value)}
              error={err('universityId')}
            >
              <option value="">{ar ? 'اختر…' : 'Choose…'}</option>
              {reference.universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {name(u)}
                </option>
              ))}
              <option value={OTHER}>{ar ? 'أخرى (اكتبها)' : 'Other (type it)'}</option>
            </Select>
            {values.universityId === OTHER && (
              <Field
                id="field-otherUniversity"
                label={ar ? 'اسم الجامعة' : 'University name'}
                value={values.otherUniversity}
                onChange={(e) => set('otherUniversity', e.target.value)}
                maxLength={150}
              />
            )}
            <Select
              id="field-majorId"
              label={ar ? 'التخصص *' : 'Major *'}
              value={values.majorId}
              onChange={(e) =>
                setValues((v) => ({ ...v, majorId: e.target.value, subMajorId: '' }))
              }
              error={err('majorId')}
            >
              <option value="">{ar ? 'اختر…' : 'Choose…'}</option>
              {parents.map((m) => (
                <option key={m.id} value={m.id}>
                  {name(m)}
                </option>
              ))}
              <option value={OTHER}>{ar ? 'أخرى (اكتبه)' : 'Other (type it)'}</option>
            </Select>
            {values.majorId === OTHER && (
              <Field
                id="field-otherMajor"
                label={ar ? 'اسم التخصص' : 'Major name'}
                value={values.otherMajor}
                onChange={(e) => set('otherMajor', e.target.value)}
                maxLength={150}
              />
            )}
            {subMajors.length > 0 && (
              <Select
                id="field-subMajorId"
                label={ar ? 'التخصص الدقيق' : 'Sub-major'}
                value={values.subMajorId}
                onChange={(e) => set('subMajorId', e.target.value)}
              >
                <option value="">{ar ? 'اختياري' : 'Optional'}</option>
                {subMajors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {name(m)}
                  </option>
                ))}
              </Select>
            )}
            <Select
              id="field-trackId"
              label={ar ? 'المسار *' : 'Track *'}
              value={values.trackId}
              onChange={(e) => set('trackId', e.target.value)}
              error={err('trackId')}
            >
              <option value="">{ar ? 'اختر…' : 'Choose…'}</option>
              {reference.tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {name(t)}
                </option>
              ))}
            </Select>
            <Select
              id="field-preferredCommitteeId"
              label={ar ? 'اللجنة المفضلة' : 'Preferred committee'}
              value={values.preferredCommitteeId}
              onChange={(e) => set('preferredCommitteeId', e.target.value)}
            >
              <option value="">{ar ? 'اختياري' : 'Optional'}</option>
              {reference.committees.map((c) => (
                <option key={c.id} value={c.id}>
                  {name(c)}
                </option>
              ))}
            </Select>
          </>
        )}

        {step === 'links' && (
          <>
            <Textarea
              id="field-bioAr"
              label={ar ? 'نبذة عنك (عربي)' : 'About you (Arabic)'}
              value={values.bioAr}
              onChange={(e) => set('bioAr', e.target.value)}
              maxLength={1000}
              counter
              error={err('bioAr')}
              rows={4}
            />
            <Textarea
              id="field-bioEn"
              label={ar ? 'نبذة عنك (إنجليزي)' : 'About you (English)'}
              value={values.bioEn}
              onChange={(e) => set('bioEn', e.target.value)}
              maxLength={1000}
              counter
              dir="ltr"
              rows={4}
            />
            {(
              [
                ['portfolioUrl', ar ? 'موقعك الشخصي / أعمالك' : 'Portfolio / website'],
                ['githubUrl', 'GitHub'],
                ['linkedinUrl', 'LinkedIn'],
                ['xUrl', 'X'],
              ] as const
            ).map(([key, label]) => (
              <Field
                key={key}
                id={`field-${key}`}
                label={label}
                value={values[key]}
                onChange={(e) => set(key, e.target.value)}
                error={err(key)}
                dir="ltr"
                placeholder="https://"
                inputMode="url"
              />
            ))}
          </>
        )}

        {step === 'questions' &&
          questions.map((q) => {
            const label = `${ar ? q.label_ar : q.label_en || q.label_ar}${q.required ? ' *' : ''}`;
            const value = values.answers[q.key];
            const error = err(`q:${q.key}`);
            if (q.type === 'long_text')
              return (
                <Textarea
                  key={q.key}
                  id={`field-q:${q.key}`}
                  label={label}
                  value={typeof value === 'string' ? value : ''}
                  onChange={(e) => setAnswer(q.key, e.target.value)}
                  maxLength={2000}
                  counter
                  error={error}
                  rows={4}
                />
              );
            if (q.type === 'single_choice')
              return (
                <Chips
                  key={q.key}
                  id={`field-q:${q.key}`}
                  label={label}
                  value={typeof value === 'string' ? value : ''}
                  options={(q.options ?? []).map((o) => ({ value: o, label: o }))}
                  onChange={(v) => setAnswer(q.key, v)}
                  error={error}
                />
              );
            if (q.type === 'multi_choice') {
              const chosen = Array.isArray(value) ? value : [];
              return (
                <fieldset key={q.key} id={`field-q:${q.key}`} className="flex flex-col gap-2">
                  <legend className="mb-1 text-sm font-medium">{label}</legend>
                  {(q.options ?? []).map((o) => (
                    <label key={o} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={chosen.includes(o)}
                        onChange={(e) =>
                          setAnswer(
                            q.key,
                            e.target.checked ? [...chosen, o] : chosen.filter((x) => x !== o),
                          )
                        }
                      />
                      {o}
                    </label>
                  ))}
                  {error && (
                    <p role="alert" className="text-xs text-danger">
                      {error}
                    </p>
                  )}
                </fieldset>
              );
            }
            return (
              <Field
                key={q.key}
                id={`field-q:${q.key}`}
                label={label}
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => setAnswer(q.key, e.target.value)}
                maxLength={2000}
                error={error}
              />
            );
          })}

        {step === 'review' && (
          <>
            <ReviewSummary
              values={values}
              reference={reference}
              questions={questions}
              onEdit={(s) => setStepIndex(steps.indexOf(s))}
            />
            <label className="flex items-start gap-2 text-sm">
              <input
                id="field-consent"
                type="checkbox"
                className="mt-1"
                checked={values.consent}
                onChange={(e) => set('consent', e.target.checked)}
              />
              <span>
                {ar
                  ? 'قرأت سياسة الخصوصية وأوافق على معالجة بياناتي لغرض طلب العضوية *'
                  : 'I have read the privacy notice and agree to my data being processed for this membership application *'}
              </span>
            </label>
            {err('consent') && (
              <p role="alert" className="text-xs text-danger">
                {err('consent')}
              </p>
            )}
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={values.wantsDirectoryListing}
                onChange={(e) => set('wantsDirectoryListing', e.target.checked)}
              />
              <span>
                {ar
                  ? 'أرغب في الظهور في دليل الأعضاء العام عند قبولي'
                  : 'I would like to appear in the public member directory if accepted'}
              </span>
            </label>
          </>
        )}
      </div>

      <div className="flex justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          disabled={stepIndex === 0 || pending}
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
        >
          {ar ? 'السابق' : 'Back'}
        </Button>
        {step === 'review' ? (
          <Button type="button" onClick={submit} loading={pending}>
            {editing
              ? ar
                ? 'حفظ التعديلات'
                : 'Save changes'
              : ar
                ? 'إرسال الطلب'
                : 'Submit application'}
          </Button>
        ) : (
          <Button type="button" onClick={next}>
            {ar ? 'التالي' : 'Next'}
          </Button>
        )}
      </div>
    </div>
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
  const rows: Array<[ApplicationStep, string, string]> = [
    [
      'personal',
      ar ? 'الاسم' : 'Name',
      values.fullNameAr + (values.fullNameEn ? ` / ${values.fullNameEn}` : ''),
    ],
    ['personal', ar ? 'الجوال' : 'Mobile', values.phone || '—'],
    [
      'academic',
      ar ? 'الحالة' : 'Status',
      values.academicStatus ? ACADEMIC_LABEL[values.academicStatus][lang] : '—',
    ],
    [
      'academic',
      ar ? 'الجامعة' : 'University',
      find(reference.universities, values.universityId, values.otherUniversity),
    ],
    [
      'academic',
      ar ? 'التخصص' : 'Major',
      find(reference.majors, values.majorId, values.otherMajor),
    ],
    ['academic', ar ? 'المسار' : 'Track', find(reference.tracks, values.trackId, '')],
    ...questions.map((q): [ApplicationStep, string, string] => {
      const a = values.answers[q.key];
      return [
        'questions',
        ar ? q.label_ar : q.label_en || q.label_ar,
        Array.isArray(a) ? a.join('، ') : a || '—',
      ];
    }),
  ];
  return (
    <dl className="grid gap-3 rounded-xl border border-line bg-surface-raised p-4 text-sm">
      {rows.map(([step, label, value], i) => (
        <div key={i} className="flex flex-wrap items-baseline justify-between gap-2">
          <dt className="text-muted">{label}</dt>
          <dd className="flex items-center gap-3">
            <span>{value}</span>
            <button
              type="button"
              className="text-xs text-accent underline"
              onClick={() => onEdit(step)}
            >
              {ar ? 'تعديل' : 'Edit'}
            </button>
          </dd>
        </div>
      ))}
    </dl>
  );
}
