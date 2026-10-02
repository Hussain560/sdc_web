'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Alert, Button, Dialog, Stepper, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import type { Localized } from '@/modules/access/types';
import { saveEvent, transitionEvent } from '../../actions';
import { validateAll, validateDraft, validateStep, type StepNumber } from '../../schemas';
import { STATUS_LABEL, type EventFormValues, type EventStatus } from '../../types';
import { EventPreviewCard } from '../EventPreviewCard';
import { Step1Identity, Step2Logistics, Step3Content, Step4Review } from './steps';

type Props = {
  userId: string;
  eventId: string | null;
  initial: EventFormValues;
  initialUpdatedAt: string | null;
  status: EventStatus;
  reviewNote: string | null;
  committees: Array<{ id: string; name: Localized }>;
  coverUrl: string | null;
  can: { submit: boolean; approve: boolean };
  /** The first save of a new event redirects here; show the confirmation on the fresh page. */
  justSaved?: boolean;
};

const STEP_OF_FIELD: Record<string, StepNumber> = {
  start_date: 2,
  end_date: 2,
  dates: 2,
  location: 2,
  group_link: 2,
  goals: 3,
};
const FIELD_ID: Record<string, string> = {
  start_date: 'field-startDate',
  end_date: 'field-endDate',
  dates: 'field-dates',
  location: 'field-locationAr',
  group_link: 'field-groupLink',
  goals: 'field-goals-first',
  goalsForm: 'field-goals-first',
};

const storageKey = (userId: string, eventId: string | null) =>
  `sdc-event-wizard:${userId}:${eventId ?? 'new'}`;

/**
 * The 4-step creation wizard (docs/10-design-system/INTERNAL-SCREENS/13-event-form.md; ADR-012):
 * Identity → Logistics → Content → Review, per-step validation, refresh-safe local draft, live preview,
 * save-draft on every step, and final actions that depend on the user's permissions.
 */
export function EventWizard(props: Props) {
  const { userId, initial, status, reviewNote, committees, can } = props;
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();

  const [eventId, setEventId] = useState(props.eventId);
  const [updatedAt, setUpdatedAt] = useState(props.initialUpdatedAt);
  const [values, setValues] = useState<EventFormValues>(initial);
  const [step, setStep] = useState<StepNumber>(1);
  const [maxReached, setMaxReached] = useState(props.eventId ? 4 : 1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnSteps, setWarnSteps] = useState<Set<number>>(new Set());
  const [coverUrl, setCoverUrl] = useState<string | null>(props.coverUrl);
  const toast = useToast();
  const invalidText =
    lang === 'ar' ? 'يرجى مراجعة الحقول المحددة.' : 'Please review the highlighted fields.';
  useEffect(() => {
    if (props.justSaved) toast.success(lang === 'ar' ? 'تم حفظ المسودة' : 'Draft saved');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on arrival from the first save
  }, []);
  const [restored, setRestored] = useState(false);
  const [confirmChange, setConfirmChange] = useState<null | 'submit' | 'approve' | 'save'>(null);
  const [pending, startTransition] = useTransition();

  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const dirty = JSON.stringify(values) !== baseline;
  const readOnly = status === 'pending_review';
  const published = status === 'published';
  const key = storageKey(userId, props.eventId);
  const topRef = useRef<HTMLDivElement>(null);

  // ---- refresh-safe draft: restore once on mount (browser-only storage; SSR always renders `initial`)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const saved = JSON.parse(raw) as { values: EventFormValues; step: StepNumber };
      if (JSON.stringify(saved.values) === baseline) return;
      // Restoring browser-only state after hydration (same pattern as the theme/language preferences).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValues(saved.values);
      setStep(saved.step);
      setMaxReached(Math.max(saved.step, props.eventId ? 4 : 1));
      setRestored(true);
    } catch {
      /* ignore corrupt or unavailable storage */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (readOnly) return;
    try {
      if (dirty) localStorage.setItem(key, JSON.stringify({ values, step }));
      else localStorage.removeItem(key);
    } catch {
      /* storage unavailable */
    }
  }, [values, step, dirty, key, readOnly]);

  useEffect(() => {
    if (!dirty) return;
    const guard = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);

  const set = (patch: Partial<EventFormValues>) => {
    setValues((v) => ({ ...v, ...patch }));
    // clear the errors of the fields being edited
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(patch)) delete next[k];
      return next;
    });
  };

  const discardLocal = () => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    setValues(initial);
    setStep(1);
    setRestored(false);
    setErrors({});
  };

  const focusFirst = (errs: Record<string, string>) => {
    const first = Object.keys(errs)[0];
    if (!first) return;
    requestAnimationFrame(() => {
      const id = first === 'goals' ? 'field-goals-first' : `field-${first}`;
      document.getElementById(id)?.focus();
      topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  };

  const goTo = (n: number) => {
    setStep(n as StepNumber);
    setMaxReached((m) => Math.max(m, n));
    topRef.current?.scrollIntoView({ block: 'start' });
  };

  const next = () => {
    const r = validateStep(step, values, lang);
    if (!r.ok) {
      setErrors(r.errors);
      toast.error(invalidText);
      setWarnSteps((w) => new Set(w).add(step));
      focusFirst(r.errors);
      return;
    }
    setErrors({});
    setWarnSteps((w) => {
      const n = new Set(w);
      n.delete(step);
      return n;
    });
    goTo(step + 1);
  };

  const committeeName = committees.find((c) => c.id === values.committeeId)?.name[lang] ?? '';

  // ---- saving
  const applySaved = (saved: { id: string; updatedAt: string }) => {
    setEventId(saved.id);
    setUpdatedAt(saved.updatedAt);
    setBaseline(JSON.stringify(values));
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  };

  const saveDraft = () => {
    const check = validateDraft(values, lang);
    if (!check.ok) {
      setErrors(check.errors);
      toast.error(invalidText);
      goTo(1);
      focusFirst(check.errors);
      return;
    }
    startTransition(async () => {
      const r = await saveEvent(
        { id: eventId ?? undefined, values, expectedUpdatedAt: updatedAt ?? undefined },
        { lang },
      );
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        toast.error(r.message);
        return;
      }
      const wasNew = !eventId;
      applySaved(r.data);
      toast.success(ar ? 'تم حفظ المسودة' : 'Draft saved');
      if (wasNew) router.replace(`/dashboard/events/${r.data.id}/edit?saved=1`);
    });
  };

  const significant = (): boolean =>
    (published &&
      (
        [
          'startDate',
          'endDate',
          'startTime',
          'endTime',
          'locationMode',
          'locationAr',
          'scheduleType',
        ] as const
      ).some((k) => JSON.stringify(values[k]) !== JSON.stringify(initial[k]))) ||
    (published && JSON.stringify(values.dates) !== JSON.stringify(initial.dates));

  const finalize = (action: 'submit' | 'approve' | 'save', confirmed = false) => {
    const all = validateAll(values, lang);
    if (!all.ok) {
      setErrors(all.errors);
      toast.error(invalidText);
      goTo(all.step);
      setWarnSteps((w) => new Set(w).add(all.step));
      focusFirst(all.errors);
      return;
    }
    if (action !== 'save') {
      const s4 = validateStep(4, values, lang);
      if (!s4.ok) {
        setErrors(s4.errors);
        toast.error(invalidText);
        focusFirst(s4.errors);
        return;
      }
    }
    if (action === 'save' && significant() && !confirmed) {
      setConfirmChange('save');
      return;
    }
    setConfirmChange(null);
    startTransition(async () => {
      const saved = await saveEvent(
        { id: eventId ?? undefined, values, expectedUpdatedAt: updatedAt ?? undefined },
        { lang },
      );
      if (!saved.ok) {
        setErrors(saved.fieldErrors ?? {});
        toast.error(saved.message);
        return;
      }
      applySaved(saved.data);
      if (action === 'save') {
        toast.success(ar ? 'تم حفظ التغييرات' : 'Changes saved');
        router.push(`/dashboard/events/${saved.data.id}`);
        return;
      }
      const t = await transitionEvent(
        { id: saved.data.id, action, note: values.submissionNote || undefined },
        { lang },
      );
      if (!t.ok) {
        // Publish/submit guards point at a field: jump to its step.
        const field = Object.keys(t.fieldErrors ?? {})[0];
        if (field && STEP_OF_FIELD[field]) {
          goTo(STEP_OF_FIELD[field]);
          setErrors({ [field === 'group_link' ? 'groupLink' : field]: t.message });
          requestAnimationFrame(() => document.getElementById(FIELD_ID[field] ?? '')?.focus());
        }
        toast.error(t.message);
        if (!eventId) router.replace(`/dashboard/events/${saved.data.id}/edit`);
        return;
      }
      toast.success(
        action === 'approve'
          ? ar
            ? 'تم اعتماد الفعالية.'
            : 'Event approved.'
          : ar
            ? 'أُرسلت الفعالية للمراجعة.'
            : 'Event sent for review.',
      );
      router.push(`/dashboard/events/${saved.data.id}`);
    });
  };

  const withdraw = () => {
    if (!eventId) return;
    startTransition(async () => {
      const r = await transitionEvent({ id: eventId, action: 'withdraw' }, { lang });
      if (!r.ok) toast.error(r.message);
      else {
        toast.success(ar ? 'تم سحب الطلب.' : 'Request withdrawn.');
        router.refresh();
      }
    });
  };

  const stepper = useMemo(
    () =>
      [
        { label: ar ? 'الهوية' : 'Identity', warning: warnSteps.has(1) },
        { label: ar ? 'التفاصيل' : 'Logistics', warning: warnSteps.has(2) },
        { label: ar ? 'المحتوى' : 'Content', warning: warnSteps.has(3) },
        { label: ar ? 'المراجعة' : 'Review', warning: warnSteps.has(4) },
      ] as const,
    [ar, warnSteps],
  );

  const errorList = Object.values(errors);
  const common = { values, set, errors, lang, readOnly } as const;

  return (
    <div ref={topRef} className="scroll-mt-24">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">
            {eventId ? (ar ? 'تعديل الفعالية' : 'Edit event') : ar ? 'فعالية جديدة' : 'New event'}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {STATUS_LABEL[status].label[lang]}
            {dirty && (
              <span className="ms-2 text-warning">
                ● {ar ? 'تغييرات غير محفوظة' : 'Unsaved changes'}
              </span>
            )}
          </p>
        </div>
        {!readOnly && (
          <Button variant="secondary" loading={pending} onClick={saveDraft}>
            {published ? (ar ? 'حفظ' : 'Save') : ar ? 'حفظ كمسودة' : 'Save draft'}
          </Button>
        )}
      </div>

      <div className="mb-8">
        <Stepper
          steps={[...stepper]}
          current={step}
          onSelect={goTo}
          maxReached={maxReached}
          labelOf={(n, total, label) =>
            ar ? `الخطوة ${n} من ${total} — ${label}` : `Step ${n} of ${total} — ${label}`
          }
        />
      </div>

      {readOnly && (
        <Alert tone="warning" className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span>
            {ar
              ? 'بانتظار الاعتماد — اسحب الطلب للتعديل.'
              : 'Pending review — withdraw the request to edit.'}
          </span>
          {can.submit && (
            <Button variant="secondary" loading={pending} onClick={withdraw}>
              {ar ? 'سحب الطلب' : 'Withdraw request'}
            </Button>
          )}
        </Alert>
      )}
      {status === 'changes_requested' && reviewNote && (
        <Alert tone="warning" className="mb-4">
          <strong>{ar ? 'ملاحظات المراجِع: ' : 'Reviewer notes: '}</strong>
          {reviewNote}
        </Alert>
      )}
      {restored && (
        <Alert tone="info" className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span>{ar ? 'استعدنا آخر تعديل غير محفوظ.' : 'We restored your last unsaved edit.'}</span>
          <Button variant="ghost" onClick={discardLocal}>
            {ar ? 'تجاهل' : 'Discard'}
          </Button>
        </Alert>
      )}
      {errorList.length > 0 && (
        <Alert tone="danger" className="mb-4">
          <p className="font-semibold">
            {ar ? 'يرجى معالجة ما يلي:' : 'Please fix the following:'}
          </p>
          <ul className="ms-5 list-disc">
            {errorList.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </Alert>
      )}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="max-w-[720px]">
          {step === 1 && (
            <Step1Identity
              {...common}
              committees={committees}
              lockCommittee={committees.length === 1}
              slugLocked={published && status === 'published'}
            />
          )}
          {step === 2 && <Step2Logistics {...common} />}
          {step === 3 && (
            <Step3Content
              {...common}
              eventId={eventId}
              coverUrl={coverUrl}
              onCoverUrl={setCoverUrl}
            />
          )}
          {step === 4 && (
            <Step4Review
              {...common}
              committeeName={committeeName}
              goStep={goTo}
              showConfirmation={!published && (can.submit || can.approve)}
            />
          )}
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start" aria-label={ar ? 'معاينة' : 'Preview'}>
          <details className="xl:hidden" open={false}>
            <summary className="mb-3 cursor-pointer text-sm font-medium">
              {ar ? 'معاينة البطاقة' : 'Card preview'}
            </summary>
            <EventPreviewCard values={values} lang={lang} coverUrl={coverUrl} />
          </details>
          <div className="hidden xl:block">
            <p className="mb-2 text-sm font-medium">{ar ? 'معاينة البطاقة' : 'Card preview'}</p>
            <EventPreviewCard values={values} lang={lang} coverUrl={coverUrl} />
            <p className="mt-2 text-xs text-muted">
              {ar ? 'تُحدَّث المعاينة أثناء الكتابة.' : 'The preview updates as you type.'}
            </p>
          </div>
        </aside>
      </div>

      <div className="sticky bottom-0 z-20 mt-8 flex items-center justify-between gap-3 border-t border-line bg-canvas/90 py-3 backdrop-blur">
        <div>
          {step > 1 && (
            <Button variant="ghost" onClick={() => goTo(step - 1)}>
              {ar ? 'رجوع' : 'Back'}
            </Button>
          )}
        </div>
        <p className="hidden text-sm text-muted sm:block">
          {ar ? `الخطوة ${step} من 4` : `Step ${step} of 4`}
        </p>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {step < 4 ? (
            <Button onClick={next}>{ar ? 'التالي' : 'Next'}</Button>
          ) : readOnly ? null : published ? (
            <Button loading={pending} onClick={() => finalize('save')}>
              {ar ? 'حفظ التغييرات' : 'Save changes'}
            </Button>
          ) : can.approve ? (
            <Button
              loading={pending}
              disabledReason={
                !values.confirmed
                  ? ar
                    ? 'أكّد صحة المعلومات أولًا'
                    : 'Confirm the information first'
                  : undefined
              }
              onClick={() => finalize('approve')}
            >
              {ar ? 'اعتماد ونشر مباشرة' : 'Approve & publish directly'}
            </Button>
          ) : can.submit ? (
            <Button
              loading={pending}
              disabledReason={
                !values.confirmed
                  ? ar
                    ? 'أكّد صحة المعلومات أولًا'
                    : 'Confirm the information first'
                  : undefined
              }
              onClick={() => finalize('submit')}
            >
              {ar ? 'إرسال للاعتماد' : 'Submit for review'}
            </Button>
          ) : (
            <p className="max-w-xs text-sm text-muted">
              {ar
                ? 'سيقوم رئيس اللجنة بإرسالها للاعتماد.'
                : 'The committee head will submit it for review.'}
            </p>
          )}
        </div>
      </div>

      <Dialog
        open={confirmChange !== null}
        onClose={() => setConfirmChange(null)}
        title={ar ? 'تأكيد تغيير جوهري' : 'Confirm a significant change'}
      >
        <p className="mb-4 text-muted">
          {ar
            ? 'غيّرت الموعد أو نمط الحضور أو المكان لفعالية منشورة. سيُرسل إشعار للمسجلين المقبولين.'
            : 'You changed the date, attendance mode or place of a published event. Accepted registrants will be e-mailed.'}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmChange(null)}>
            {ar ? 'تراجع' : 'Go back'}
          </Button>
          <Button onClick={() => finalize('save', true)}>
            {ar ? 'حفظ وإشعار' : 'Save and notify'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
