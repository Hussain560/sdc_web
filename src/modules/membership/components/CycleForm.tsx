'use client';

import { useState, useTransition } from 'react';
import { Alert, Button, Field, Select, Textarea, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import { saveCycle, transitionCycle } from '../actions';
import { validateCycle } from '../schemas';
import {
  QUESTION_TYPES,
  QUESTION_TYPE_LABEL,
  type CycleFormValues,
  type CycleQuestion,
  type QuestionType,
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
}: {
  id?: string;
  initial?: CycleFormValues;
  /** Questions cannot change once the first application arrives. */
  locked?: boolean;
  /** A running window changes only through extend / close early. */
  windowLocked?: boolean;
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
      className="flex max-w-3xl flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        save('stay');
      }}
      method="post"
    >
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
        {windowLocked && (
          <Alert tone="info">
            {ar
              ? 'الفترة جارية — تُعدَّل بالتمديد أو الإغلاق المبكر من قائمة الدورات.'
              : 'The window is running — change it with Extend or Close early from the cycle list.'}
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
            disabled={windowLocked}
            dir="ltr"
          />
          <Field
            type="datetime-local"
            label={ar ? 'موعد القرار المستهدف' : 'Target decision date'}
            value={v.reviewEndsAt}
            onChange={(e) => set('reviewEndsAt', e.target.value)}
            error={errors.reviewEndsAt}
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
                    ar ? 'الخيارات (سطر لكل خيار، من 2 إلى 12)' : 'Options (one per line, 2 to 12)'
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
    </form>
  );
}
