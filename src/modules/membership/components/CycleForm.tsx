'use client';

import { useState, useTransition } from 'react';
import {
  CalendarCheck,
  FileText,
  KeyRound,
  Minus,
  Plus,
  Search,
  Star,
  Trash2,
  UserRoundCheck,
} from 'lucide-react';
import { Alert, Button, Field, Select, Switch, Textarea, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import { saveCycle, transitionCycle } from '../actions';
import { rubricKey, validateCycle } from '../schemas';
import {
  DEFAULT_RUBRIC,
  MAX_RUBRIC,
  QUESTION_TYPES,
  QUESTION_TYPE_LABEL,
  type CycleFormValues,
  type CycleQuestion,
  type QuestionType,
  type RubricCriterion,
  type RubricWeight,
} from '../types';

const empty = (): CycleFormValues => ({
  nameAr: '',
  nameEn: '',
  descriptionAr: '',
  descriptionEn: '',
  opensAt: '',
  closesAt: '',
  reviewEndsAt: '',
  capacity: '',
  questions: [],
  termEndsAt: '',
  activationDeadlineDays: '7',
  rubric: [],
});

const slug = (n: number) => `q${n}`;

/**
 * Create / edit a cycle (docs/10-design-system/INTERNAL-SCREENS/17-membership-cycles.md §2). Phase is derived
 * from the dates, so there is no "mark as open": *Open now* simply moves the opening time to now.
 */
export function CycleForm({
  id,
  initial,
  locked,
  windowLocked,
  closeEditable,
  freeEdit,
  rubricLocked,
}: {
  id?: string;
  initial?: CycleFormValues;
  /** Questions cannot change once the first application arrives. */
  locked?: boolean;
  /** A window that is running or ended: the opening time no longer changes. */
  windowLocked?: boolean;
  /** A running window: the closing time can still move, earlier or later, as long as it is ahead. */
  closeEditable?: boolean;
  /** Nobody has applied yet: the dates can be corrected freely, even on a running or closed window. */
  freeEdit?: boolean;
  /** A reviewer has already scored: the rubric is fixed. */
  rubricLocked?: boolean;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();
  const [v, setV] = useState<CycleFormValues>(initial ?? empty());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof CycleFormValues>(k: K, value: CycleFormValues[K]) => {
    setV((x) => ({ ...x, [k]: value }));
    setErrors((e) => {
      const { [k as string]: _d, ...rest } = e;
      return rest;
    });
  };
  const setQuestion = (i: number, patch: Partial<CycleQuestion>) =>
    set(
      'questions',
      v.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)),
    );
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= v.questions.length) return;
    const next = [...v.questions];
    [next[i], next[j]] = [next[j]!, next[i]!];
    set('questions', next);
  };
  const addQuestion = () => {
    const used = new Set(v.questions.map((q) => q.key));
    let n = v.questions.length + 1;
    while (used.has(slug(n))) n += 1;
    set('questions', [
      ...v.questions,
      { key: slug(n), type: 'text', required: false, label_ar: '' },
    ]);
  };

  const setRubric = (next: RubricCriterion[]) => set('rubric', next);
  const patchCriterion = (i: number, patch: Partial<RubricCriterion>) =>
    setRubric(v.rubric.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const addCriterion = () => {
    if (v.rubric.length >= MAX_RUBRIC) return;
    setRubric([
      ...v.rubric,
      {
        key: rubricKey(
          '',
          v.rubric.map((r) => r.key),
        ),
        label_ar: '',
        label_en: '',
        weight: 1,
      },
    ]);
  };
  const stepWeight = (i: number, dir: -1 | 1) => {
    const w = Math.min(3, Math.max(1, (v.rubric[i]?.weight ?? 1) + dir)) as RubricWeight;
    patchCriterion(i, { weight: w });
  };

  const save = (then: 'stay' | 'publish' | 'open_now') => {
    const found = validateCycle(v, lang);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error(ar ? 'يرجى مراجعة الحقول المحددة.' : 'Please review the highlighted fields.');
      return;
    }
    startTransition(async () => {
      const r = await saveCycle({ id, values: v }, { lang });
      if (!r.ok) {
        toast.error(r.message);
        if (r.fieldErrors) setErrors(r.fieldErrors);
        return;
      }
      if (then !== 'stay') {
        const t = await transitionCycle({ id: r.data.id, action: then }, { lang });
        if (!t.ok) {
          toast.error(t.message);
          if (t.code === 'CYCLE_OVERLAP' || t.code === 'INVALID_DATES')
            setErrors({ closesAt: t.message });
          // The draft was saved; stay on the edit page so nothing is lost.
          router.replace(`/dashboard/membership/cycles/${r.data.id}/edit`);
          return;
        }
      }
      toast.success(
        then === 'stay'
          ? ar
            ? 'تم حفظ المسودة.'
            : 'Draft saved.'
          : then === 'publish'
            ? ar
              ? 'نُشر الجدول.'
              : 'Cycle published.'
            : ar
              ? 'فُتح باب التقديم.'
              : 'Applications are open.',
      );
      router.push('/dashboard/membership/cycles');
    });
  };

  return (
    <form
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"
      onSubmit={(e) => {
        e.preventDefault();
        save('stay');
      }}
      method="post"
    >
      <div className="flex min-w-0 flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-shape-xl border border-line bg-surface p-5">
          <h2 className="font-bold">{ar ? 'الاسم والوصف' : 'Name & description'}</h2>
          <Field
            id="field-nameAr"
            label={ar ? 'الاسم (عربي) *' : 'Name (Arabic) *'}
            value={v.nameAr}
            onChange={(e) => set('nameAr', e.target.value)}
            error={errors.nameAr}
            maxLength={150}
          />
          <Field
            label={ar ? 'الاسم (إنجليزي)' : 'Name (English)'}
            value={v.nameEn}
            onChange={(e) => set('nameEn', e.target.value)}
            dir="ltr"
            maxLength={150}
          />
          <Textarea
            label={
              ar
                ? 'الوصف والشروط (عربي) — يدعم القوائم والخط الغامق'
                : 'Description & eligibility (Arabic) — lists and bold supported'
            }
            value={v.descriptionAr}
            onChange={(e) => set('descriptionAr', e.target.value)}
            maxLength={5000}
            counter
            rows={5}
          />
          <Textarea
            label={ar ? 'الوصف والشروط (إنجليزي)' : 'Description & eligibility (English)'}
            value={v.descriptionEn}
            onChange={(e) => set('descriptionEn', e.target.value)}
            maxLength={5000}
            counter
            dir="ltr"
            rows={5}
          />
        </section>

        <section className="flex flex-col gap-4 rounded-shape-xl border border-line bg-surface p-5">
          <h2 className="font-bold">{ar ? 'الفترة' : 'Window'}</h2>
          <p className="text-xs text-muted">
            {ar ? 'التوقيت بتوقيت السعودية (UTC+3).' : 'Saudi time (UTC+3).'}
          </p>
          {freeEdit && (
            <Alert tone="info">
              {ar
                ? 'لم يصل أي طلب بعد، فيمكنك تصحيح التواريخ بحرية. إذا كانت الدورة أُغلقت مبكراً فستتبع التواريخ الجديدة.'
                : 'No application has arrived yet, so you can correct the dates freely. If the cycle was closed early, it will follow the new dates.'}
            </Alert>
          )}
          {windowLocked && (
            <Alert tone="info">
              {closeEditable
                ? ar
                  ? 'الفترة جارية — وقت الفتح لا يتغيّر، لكن يمكنك تعديل وقت الإغلاق (أبكر أو أبعد) ما دام في المستقبل.'
                  : 'The window is running — the opening time stays, but you can move the closing time (earlier or later) while it is still ahead.'
                : ar
                  ? 'انتهت الفترة — لتمديدها استخدم «تمديد» من قائمة الدورات.'
                  : 'The window has ended — use Extend from the cycle list to continue it.'}
            </Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="field-opensAt"
              type="datetime-local"
              label={ar ? 'يفتح *' : 'Opens *'}
              value={v.opensAt}
              onChange={(e) => set('opensAt', e.target.value)}
              error={errors.opensAt}
              disabled={windowLocked}
              dir="ltr"
            />
            <Field
              id="field-closesAt"
              type="datetime-local"
              label={ar ? 'يغلق *' : 'Closes *'}
              value={v.closesAt}
              onChange={(e) => set('closesAt', e.target.value)}
              error={errors.closesAt}
              disabled={windowLocked && !closeEditable}
              dir="ltr"
            />
            <Field
              id="field-capacity"
              type="number"
              min={1}
              label={ar ? 'الحد الأقصى للقبول' : 'Acceptance limit'}
              hint={ar ? 'اختياري' : 'Optional'}
              value={v.capacity}
              onChange={(e) => set('capacity', e.target.value)}
              error={errors.capacity}
              dir="ltr"
            />
          </div>
        </section>

        <section className="m-reveal flex flex-col gap-4 rounded-shape-xl border border-line bg-surface p-5">
          <h2 className="font-bold">{ar ? 'المراجعة والعضوية' : 'Review & membership'}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              type="datetime-local"
              label={ar ? 'موعد القرار المتوقع' : 'Expected decision date'}
              hint={
                ar
                  ? 'يظهر للمتقدّم في صفحة الانضمام وبريد الاستلام.'
                  : 'Shown to applicants on the join page and the received e-mail.'
              }
              value={v.reviewEndsAt}
              onChange={(e) => set('reviewEndsAt', e.target.value)}
              error={errors.reviewEndsAt}
              dir="ltr"
            />
            <Field
              id="field-termEndsAt"
              type="date"
              label={ar ? 'نهاية مدة العضوية' : 'Membership end date'}
              hint={ar ? 'بدونه: سنة من القبول.' : 'Without it: one year from acceptance.'}
              value={v.termEndsAt}
              onChange={(e) => set('termEndsAt', e.target.value)}
              error={errors.termEndsAt}
              dir="ltr"
            />
            <Field
              id="field-activationDeadlineDays"
              type="number"
              min={1}
              max={30}
              label={ar ? 'مهلة التفعيل (أيام)' : 'Activation period (days)'}
              hint={
                ar
                  ? 'بعدها يسقط المقعد ويُعرض على قائمة الانتظار.'
                  : 'After that the place goes to the waiting list.'
              }
              value={v.activationDeadlineDays}
              onChange={(e) => set('activationDeadlineDays', e.target.value)}
              error={errors.activationDeadlineDays}
              dir="ltr"
            />
          </div>
          <p className="flex items-start gap-2 rounded-shape-lg bg-surface-raised p-3 text-sm text-muted">
            <KeyRound size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span>
              {ar
                ? 'تذكيرات التفعيل تُرسل في اليوم 3 واليوم 6. تذكيرات نهاية المدة قبل 30 و7 أيام ويوم واحد.'
                : 'Activation reminders go out on day 3 and day 6. Term-end reminders 30 and 7 days and 1 day before.'}
            </span>
          </p>
        </section>

        <section className="m-reveal flex flex-col gap-4 rounded-shape-xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold">{ar ? 'معايير التقييم' : 'Scoring rubric'}</h2>
              <p className="mt-1 text-sm text-muted">
                {ar
                  ? 'اختيارية، حتى 6 معايير. يعطي كل مراجع من 1 إلى 5 لكل معيار. لا يراها المتقدّم.'
                  : 'Optional, up to 6 criteria. Each reviewer gives 1 to 5 per criterion. Applicants never see it.'}
              </p>
            </div>
            <Switch
              checked={v.rubric.length > 0}
              disabled={rubricLocked}
              label={ar ? 'مفعّلة' : 'On'}
              onChange={(on) => setRubric(on ? DEFAULT_RUBRIC.map((r) => ({ ...r })) : [])}
            />
          </div>
          {rubricLocked && (
            <Alert tone="info">
              {ar
                ? 'بدأ المراجعون التقييم، فمعايير هذه الدورة مقفلة.'
                : 'Reviewers have started scoring, so the rubric of this cycle is locked.'}
            </Alert>
          )}
          {errors.rubric && <Alert tone="danger">{errors.rubric}</Alert>}
          {v.rubric.length > 0 && (
            <>
              <ol className="flex flex-col gap-3">
                {v.rubric.map((r, i) => (
                  <li
                    key={r.key}
                    className="grid items-end gap-3 rounded-shape-lg bg-surface-raised p-3 sm:grid-cols-[1fr_1fr_auto_auto]"
                  >
                    <Field
                      label={ar ? 'المعيار بالعربية' : 'Criterion in Arabic'}
                      value={r.label_ar}
                      disabled={rubricLocked}
                      maxLength={80}
                      onChange={(e) => patchCriterion(i, { label_ar: e.target.value })}
                    />
                    <Field
                      label={ar ? 'Criterion in English' : 'Criterion in English'}
                      value={r.label_en}
                      disabled={rubricLocked}
                      maxLength={80}
                      dir="ltr"
                      onChange={(e) => patchCriterion(i, { label_en: e.target.value })}
                    />
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-muted">
                        {ar ? 'الوزن' : 'Weight'}
                      </span>
                      <div className="inline-flex h-11 items-center rounded-full border border-line-strong">
                        <button
                          type="button"
                          aria-label={ar ? 'خفض الوزن' : 'Lower the weight'}
                          disabled={rubricLocked || r.weight <= 1}
                          onClick={() => stepWeight(i, -1)}
                          className="flex size-11 items-center justify-center rounded-full hover:bg-surface disabled:opacity-40"
                        >
                          <Minus size={14} aria-hidden="true" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold tabular-nums">
                          {r.weight}×
                        </span>
                        <button
                          type="button"
                          aria-label={ar ? 'رفع الوزن' : 'Raise the weight'}
                          disabled={rubricLocked || r.weight >= 3}
                          onClick={() => stepWeight(i, 1)}
                          className="flex size-11 items-center justify-center rounded-full hover:bg-surface disabled:opacity-40"
                        >
                          <Plus size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={rubricLocked}
                      aria-label={ar ? 'حذف المعيار' : 'Remove the criterion'}
                      onClick={() => setRubric(v.rubric.filter((_, j) => j !== i))}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-muted tabular-nums">
                  {v.rubric.length} {ar ? 'من' : 'of'} {MAX_RUBRIC}
                </span>
                {!rubricLocked && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRubric(DEFAULT_RUBRIC.map((r) => ({ ...r })))}
                    >
                      {ar ? 'استخدم المجموعة الافتراضية' : 'Use the default set'}
                    </Button>
                    {v.rubric.length < MAX_RUBRIC && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={addCriterion}
                        iconStart={<Plus size={14} aria-hidden="true" />}
                      >
                        {ar ? 'إضافة معيار' : 'Add a criterion'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-shape-xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold">
              {ar ? 'أسئلة إضافية (اختياري)' : 'Extra questions (optional)'}
            </h2>
            <span className="text-xs text-muted tabular-nums">{v.questions.length}/10</span>
          </div>
          {locked && (
            <Alert tone="info">
              {ar
                ? '🔒 الأسئلة مقفلة بعد وصول أول طلب.'
                : '🔒 Questions are locked once the first application arrives.'}
            </Alert>
          )}
          {errors.questions && <Alert tone="danger">{errors.questions}</Alert>}
          <ol className="flex flex-col gap-4">
            {v.questions.map((q, i) => (
              <li
                key={q.key}
                className="flex flex-col gap-3 rounded-xl border border-line bg-surface-raised p-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label={ar ? 'السؤال (عربي) *' : 'Question (Arabic) *'}
                    value={q.label_ar}
                    onChange={(e) => setQuestion(i, { label_ar: e.target.value })}
                    disabled={locked}
                    maxLength={200}
                  />
                  <Field
                    label={ar ? 'السؤال (إنجليزي)' : 'Question (English)'}
                    value={q.label_en ?? ''}
                    onChange={(e) => setQuestion(i, { label_en: e.target.value })}
                    disabled={locked}
                    dir="ltr"
                    maxLength={200}
                  />
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <Select
                    label={ar ? 'النوع' : 'Type'}
                    value={q.type}
                    disabled={locked}
                    onChange={(e) => {
                      const type = e.target.value as QuestionType;
                      setQuestion(i, {
                        type,
                        options:
                          type === 'single_choice' || type === 'multi_choice'
                            ? q.options?.length
                              ? q.options
                              : ['', '']
                            : undefined,
                      });
                    }}
                  >
                    {QUESTION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {QUESTION_TYPE_LABEL[t][lang]}
                      </option>
                    ))}
                  </Select>
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={q.required}
                      disabled={locked}
                      onChange={(e) => setQuestion(i, { required: e.target.checked })}
                    />
                    {ar ? 'مطلوب' : 'Required'}
                  </label>
                  {!locked && (
                    <div className="ms-auto flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-9 px-3"
                        onClick={() => move(i, -1)}
                        aria-label={ar ? 'أعلى' : 'Move up'}
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-9 px-3"
                        onClick={() => move(i, 1)}
                        aria-label={ar ? 'أسفل' : 'Move down'}
                      >
                        ↓
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-9 px-3"
                        onClick={() =>
                          set(
                            'questions',
                            v.questions.filter((_, j) => j !== i),
                          )
                        }
                      >
                        {ar ? 'حذف' : 'Remove'}
                      </Button>
                    </div>
                  )}
                </div>
                {(q.type === 'single_choice' || q.type === 'multi_choice') && (
                  <Textarea
                    label={
                      ar
                        ? 'الخيارات (سطر لكل خيار، من 2 إلى 12)'
                        : 'Options (one per line, 2 to 12)'
                    }
                    value={(q.options ?? []).join('\n')}
                    disabled={locked}
                    onChange={(e) =>
                      setQuestion(i, { options: e.target.value.split('\n').map((s) => s.trim()) })
                    }
                    rows={3}
                  />
                )}
              </li>
            ))}
          </ol>
          {!locked && v.questions.length < 10 && (
            <div>
              <Button type="button" variant="secondary" onClick={addQuestion}>
                {ar ? '+ سؤال' : '+ Question'}
              </Button>
            </div>
          )}
        </section>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" variant="secondary" loading={pending}>
            {ar ? 'حفظ كمسودة' : 'Save'}
          </Button>
          {!id && (
            <>
              <Button type="button" onClick={() => save('publish')} disabled={pending}>
                {ar ? 'نشر الجدول' : 'Publish schedule'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => save('open_now')}
                disabled={pending}
              >
                {ar ? 'فتح الآن' : 'Open now'}
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/dashboard/membership/cycles')}
            disabled={pending}
          >
            {ar ? 'إلغاء' : 'Cancel'}
          </Button>
        </div>
      </div>
      <CyclePreview values={v} ar={ar} lang={lang} />
    </form>
  );
}

const day = (iso: string, lang: 'ar' | 'en') =>
  iso
    ? new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      }).format(new Date(`${iso.slice(0, 10)}T00:00:00Z`))
    : '—';

/** What the applicant will see, from the dates being typed: the same path the join page and the e-mails show. */
function CyclePreview({
  values: v,
  ar,
  lang,
}: {
  values: CycleFormValues;
  ar: boolean;
  lang: 'ar' | 'en';
}) {
  const steps: Array<{ icon: typeof FileText; label: string }> = [
    {
      icon: FileText,
      label: ar ? `قدّم حتى ${day(v.closesAt, lang)}` : `Apply by ${day(v.closesAt, lang)}`,
    },
    { icon: Search, label: ar ? 'نراجع الطلبات' : 'We review applications' },
    {
      icon: UserRoundCheck,
      label: ar
        ? `القرار بحلول ${day(v.reviewEndsAt, lang)}`
        : `Decision by ${day(v.reviewEndsAt, lang)}`,
    },
    {
      icon: KeyRound,
      label: ar
        ? `التفعيل خلال ${v.activationDeadlineDays || 7} أيام`
        : `Activate within ${v.activationDeadlineDays || 7} days`,
    },
    {
      icon: CalendarCheck,
      label: ar
        ? `العضوية حتى ${day(v.termEndsAt, lang)}`
        : `Membership until ${day(v.termEndsAt, lang)}`,
    },
  ];
  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
      <section className="rounded-shape-xl border border-line bg-surface p-5">
        <h2 className="font-bold">{ar ? 'ما يراه المتقدّم' : 'What the applicant sees'}</h2>
        <ol className="mt-4 flex flex-col gap-3">
          {steps.map((st, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-on-accent-soft">
                <st.icon size={15} aria-hidden="true" />
              </span>
              <span className="font-medium">{st.label}</span>
            </li>
          ))}
        </ol>
      </section>
      <section className="rounded-shape-xl border border-line bg-surface p-5">
        <h2 className="flex items-center gap-2 font-bold">
          <Star size={16} aria-hidden="true" />
          {ar ? 'ترتيب قائمة الانتظار' : 'Waiting-list order'}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {v.rubric.length > 0
            ? ar
              ? 'بالدرجة المرجّحة، ثم بترتيب التقديم عند التساوي.'
              : 'By the weighted score, then by order of submission on a tie.'
            : ar
              ? 'بترتيب التقديم (لا معايير تقييم لهذه الدورة).'
              : 'By order of submission (this cycle has no rubric).'}
        </p>
      </section>
    </aside>
  );
}
