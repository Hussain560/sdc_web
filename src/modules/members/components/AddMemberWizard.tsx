'use client';

import * as m from 'motion/react-m';
import { CircleAlert, Loader2, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Chips,
  Dialog,
  Field,
  PhoneField,
  ResultDialog,
  Select,
  Stepper,
  type StepperStep,
} from '@/components/ui';
import { MotionProvider } from '@/components/motion/MotionProvider';
import { useLanguage } from '@/context/LanguageContext';
import { Link, useRouter } from '@/i18n/navigation';
import { toE164, type PhoneCountry } from '@/lib/phone';
import { withMinimumDuration } from '@/lib/min-duration';
import { presets } from '@/lib/motion';
import { searchAssignableUsers } from '@/modules/access/actions';
import type { CommitteeOption } from '@/modules/access/admin-queries';
import type { Localized } from '@/modules/access/types';
import {
  ACADEMIC_LABEL,
  ACADEMIC_STATUSES,
  type ReferenceOption,
} from '@/modules/membership/types';
import {
  checkMemberEmail,
  createMember,
  resendMemberActivation,
  type EmailCheck,
  type MemberEmailStatus,
} from '../actions';
import {
  NEW_MEMBER_STEPS,
  emptyNewMember,
  fullName,
  startsAtIso,
  validateStep,
  WIZARD_ROLE_KEYS,
  type NewMemberStep,
  type NewMemberValues,
  type StepErrors,
} from '../new-member';

type Reference = {
  universities: ReferenceOption[];
  majors: ReferenceOption[];
  tracks: ReferenceOption[];
};
type Phase = 'form' | 'sending';
type Outcome =
  | { kind: 'success'; id: string; email: string; emailStatus: MemberEmailStatus }
  | { kind: 'delayed'; id: string; email: string }
  | { kind: 'failed'; code: string; message: string };

const todayRiyadh = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(new Date());

/**
 * Add a member in four steps (Sprint 17, MEM-014): identity, study, committee and position, review. One call at the
 * end creates the account, the membership and the position together: when the position is refused nothing is saved
 * and nothing is e-mailed. The result is always shown (done, e-mail delayed, or failed with the way back).
 */
export function AddMemberWizard({
  reference,
  committees,
  roles,
  canAssign,
}: {
  reference: Reference;
  committees: CommitteeOption[];
  /** The committee positions this person may give (already limited to what they may grant). */
  roles: Array<{ key: string; name: Localized }>;
  /** May give a position at all (roles.assign or committee_members.manage). Hides step three otherwise. */
  canAssign: boolean;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<NewMemberValues>(emptyNewMember());
  const [stepIndex, setStepIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [reached, setReached] = useState(0);
  const [errors, setErrors] = useState<StepErrors>({});
  const [phase, setPhase] = useState<Phase>('form');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [nameLang, setNameLang] = useState<'ar' | 'en'>('ar');
  const [emailCheck, setEmailCheck] = useState<{
    email: string;
    result: EmailCheck;
  } | null>(null);
  const [head, setHead] = useState<{
    committeeId: string;
    name: string | null;
  } | null>(null);
  const [resending, setResending] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  const steps: NewMemberStep[] = canAssign
    ? [...NEW_MEMBER_STEPS]
    : NEW_MEMBER_STEPS.filter((s) => s !== 'position');
  const step = steps[stepIndex]!;
  const stepLabels: Record<NewMemberStep, string> = {
    identity: L('الهوية', 'Identity'),
    academic: L('الدراسة', 'Study'),
    position: L('اللجنة والمنصب', 'Committee and position'),
    review: L('المراجعة', 'Review'),
  };
  const stepperSteps: StepperStep[] = steps.map((s) => ({
    label: stepLabels[s],
    error: false,
  }));

  const set = <K extends keyof NewMemberValues>(key: K, value: NewMemberValues[K]) => {
    setValues((p) => ({ ...p, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  // Focus moves to the title of the new step (screen reader users hear where they are).
  useEffect(() => {
    if (open) heading.current?.focus();
  }, [step, open]);

  // Who leads the chosen committee now: choosing "head" warns before anything is saved.
  useEffect(() => {
    if (!open || values.roleKey !== 'committee_head' || !values.committeeId) return;
    let live = true;
    const committeeId = values.committeeId;
    void searchAssignableUsers('', committeeId).then((r) => {
      if (!live || !r.ok) return;
      const h = r.data.head;
      setHead({ committeeId, name: h ? (ar ? h.nameAr : (h.nameEn ?? h.nameAr)) : null });
    });
    return () => {
      live = false;
    };
  }, [open, values.roleKey, values.committeeId, ar]);
  const currentHead =
    values.roleKey === 'committee_head' && head?.committeeId === values.committeeId
      ? head.name
      : null;

  const name = (o: ReferenceOption) => (ar ? o.nameAr : o.nameEn || o.nameAr);
  const committeeName = (id: string) => committees.find((c) => c.id === id)?.name[lang] ?? '';
  const roleName = (key: string) => roles.find((r) => r.key === key)?.name[lang] ?? '';
  const ref = (list: ReferenceOption[], id: string) => {
    const o = list.find((x) => String(x.id) === id);
    return o ? name(o) : '';
  };

  const emailTaken =
    emailCheck && emailCheck.email === values.email.trim().toLowerCase() ? emailCheck.result : null;

  const checkEmail = async () => {
    const mail = values.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) return;
    if (emailCheck?.email === mail) return;
    const r = await checkMemberEmail(mail);
    if (r.ok) setEmailCheck({ email: mail, result: r.data });
  };

  const close = () => {
    if (phase === 'sending') return;
    setOpen(false);
  };
  const reset = () => {
    setValues(emptyNewMember());
    setStepIndex(0);
    setReached(0);
    setErrors({});
    setEmailCheck(null);
    setHead(null);
    setOutcome(null);
    setPhase('form');
  };

  const go = (to: number) => {
    setDir(to >= stepIndex ? 1 : -1);
    setStepIndex(to);
    setReached((r) => Math.max(r, to));
  };

  const next = () => {
    const found = validateStep(step, values, lang, { canAssign });
    if (step === 'identity' && emailTaken?.member)
      found.email = L('هذا البريد لعضو آخر.', 'This e-mail belongs to another member.');
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    go(stepIndex + 1);
  };

  const submit = async () => {
    // Everything is checked again so a skipped step cannot send an incomplete form.
    for (const s of steps) {
      const found = validateStep(s, values, lang, { canAssign });
      if (Object.keys(found).length > 0) {
        setErrors(found);
        go(steps.indexOf(s));
        return;
      }
    }
    setPhase('sending');
    const phone = values.phone ? toE164(values.phoneCountry, values.phone) : null;
    const position = canAssign && values.roleKey && values.committeeId;
    try {
      const r = await withMinimumDuration(
        createMember(
          {
            firstNameAr: values.firstNameAr,
            middleNameAr: values.middleNameAr,
            lastNameAr: values.lastNameAr,
            firstNameEn: values.firstNameEn,
            middleNameEn: values.middleNameEn,
            lastNameEn: values.lastNameEn,
            email: values.email,
            phone: phone ?? '',
            academicStatus: values.academicStatus as 'student',
            universityId: values.universityId,
            majorId: values.majorId,
            subMajorId: values.subMajorId,
            trackId: values.trackId,
            ...(position
              ? {
                  committeeId: values.committeeId,
                  roleKey: values.roleKey as 'committee_member',
                  startsAt: values.startsAt ? startsAtIso(values.startsAt) : '',
                  handover: values.handover,
                  keepAsDeputy: values.keepAsDeputy,
                }
              : {}),
          },
          { lang },
        ),
      );
      setOpen(false);
      setPhase('form');
      if (r.ok) {
        const email = values.email.trim();
        setOutcome(
          r.data.emailStatus === 'queued'
            ? { kind: 'delayed', id: r.data.id, email }
            : { kind: 'success', id: r.data.id, email, emailStatus: r.data.emailStatus },
        );
        router.refresh();
      } else {
        setOutcome({ kind: 'failed', code: r.code, message: r.message });
      }
    } catch {
      setOpen(false);
      setPhase('form');
      setOutcome({
        kind: 'failed',
        code: 'INTERNAL',
        message: L(
          'تعذّر الوصول إلى الخادم. لم يُحفظ شيء.',
          'The server could not be reached. Nothing was saved.',
        ),
      });
    }
  };

  const backToReview = () => {
    const code = outcome?.kind === 'failed' ? outcome.code : '';
    setOutcome(null);
    if (code === 'ALREADY_MEMBER') {
      setErrors({ email: L('هذا البريد لعضو آخر.', 'This e-mail belongs to another member.') });
      go(0);
    } else if (code === 'HEAD_ALREADY_ACTIVE' && canAssign) go(steps.indexOf('position'));
    else go(steps.length - 1);
    setOpen(true);
  };

  const resend = async () => {
    if (outcome?.kind !== 'delayed') return;
    setResending(true);
    const r = await resendMemberActivation(outcome.id, { lang }).catch(() => null);
    setResending(false);
    if (r?.ok && r.data.emailStatus !== 'queued')
      setOutcome({
        kind: 'success',
        id: outcome.id,
        email: outcome.email,
        emailStatus: r.data.emailStatus,
      });
  };

  // ------------------------------------------------------------------------------------------ steps
  const nameField = (
    key: keyof NewMemberValues,
    label: string,
    dirAttr: 'rtl' | 'ltr',
    required?: boolean,
  ) => (
    <Field
      label={label}
      requiredLabel={required ? L('مطلوب', 'required') : undefined}
      value={values[key] as string}
      onChange={(e) => set(key, e.target.value as never)}
      error={errors[key]}
      dir={dirAttr}
      maxLength={100}
    />
  );

  const identity = (
    <div className="flex flex-col gap-5">
      {/* On phones the two languages are shown one at a time; a red dot warns about a missing field. */}
      <div
        className="flex gap-1 rounded-full bg-surface-raised p-1 md:hidden"
        role="radiogroup"
        aria-label={L('لغة الاسم', 'Name language')}
      >
        {(['ar', 'en'] as const).map((l) => {
          const missing =
            l === 'ar'
              ? !!(errors.firstNameAr || errors.lastNameAr)
              : !!(errors.firstNameEn || errors.lastNameEn);
          return (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={nameLang === l}
              onClick={() => setNameLang(l)}
              className={`relative min-h-11 flex-1 rounded-full px-4 font-semibold focus-visible:outline-2 focus-visible:outline-focus-ring ${nameLang === l ? 'bg-accent text-on-accent' : 'text-muted'}`}
            >
              {l === 'ar' ? 'العربية' : 'English'}
              {missing && (
                <>
                  <span
                    aria-hidden="true"
                    className="absolute top-2 end-3 size-2 rounded-full bg-danger"
                  />
                  <span className="sr-only"> ({L('حقل ناقص', 'a field is missing')})</span>
                </>
              )}
            </button>
          );
        })}
      </div>
      <fieldset className="flex flex-col gap-4">
        <legend className="t-label mb-2 text-text">{L('الاسم', 'Name')}</legend>
        <div className="grid gap-4 md:grid-cols-2">
          <div className={`flex flex-col gap-4 ${nameLang === 'en' ? 'max-md:hidden' : ''}`}>
            {nameField(
              'firstNameAr',
              L('الاسم الأول (بالعربية)', 'First name (Arabic)'),
              'rtl',
              true,
            )}
            {nameField('middleNameAr', L('الاسم الأوسط (بالعربية)', 'Middle name (Arabic)'), 'rtl')}
            {nameField(
              'lastNameAr',
              L('الاسم الأخير (بالعربية)', 'Last name (Arabic)'),
              'rtl',
              true,
            )}
          </div>
          <div className={`flex flex-col gap-4 ${nameLang === 'ar' ? 'max-md:hidden' : ''}`}>
            {nameField(
              'firstNameEn',
              L('First name (English)', 'First name (English)'),
              'ltr',
              true,
            )}
            {nameField('middleNameEn', L('Middle name (English)', 'Middle name (English)'), 'ltr')}
            {nameField('lastNameEn', L('Last name (English)', 'Last name (English)'), 'ltr', true)}
          </div>
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Field
          type="email"
          label={L('البريد الإلكتروني', 'E-mail')}
          requiredLabel={L('مطلوب', 'required')}
          value={values.email}
          onChange={(e) => set('email', e.target.value)}
          onBlur={checkEmail}
          error={errors.email}
          hint={L(
            'يصله رابط التفعيل بعد الإنشاء.',
            'The activation link is sent after the member is created.',
          )}
          maxLength={160}
        />
        {emailTaken?.member && (
          <Alert tone="warning">
            {L('هذا البريد مسجّل لعضو آخر: ', 'This e-mail belongs to another member: ')}
            <strong>
              {ar
                ? emailTaken.member.nameAr
                : (emailTaken.member.nameEn ?? emailTaken.member.nameAr)}
            </strong>{' '}
            <Link
              href={`/dashboard/members/${emailTaken.member.id}`}
              className="font-semibold underline"
            >
              {L('فتح سجلها', 'Open the record')}
            </Link>
          </Alert>
        )}
        {emailTaken && emailTaken.account && !emailTaken.member && (
          <Alert tone="info">
            {L(
              'يوجد حساب بهذا البريد. سنربطه بالعضوية الجديدة ولن نرسل رابط تفعيل.',
              'An account with this e-mail exists. It will be linked to the new membership and no activation link is sent.',
            )}
          </Alert>
        )}
      </div>

      <PhoneField
        label={L('الجوال', 'Phone')}
        optionalLabel={L('اختياري', 'optional')}
        country={values.phoneCountry}
        onCountryChange={(c: PhoneCountry) => set('phoneCountry', c)}
        value={values.phone}
        onChange={(d) => set('phone', d)}
        lang={lang}
        countryLabel={L('رمز الدولة', 'Country calling code')}
        error={errors.phone}
      />
    </div>
  );

  const academic = (
    <div className="flex flex-col gap-5">
      <Chips
        label={L('الحالة', 'Status')}
        value={values.academicStatus}
        options={ACADEMIC_STATUSES.map((s) => ({ value: s, label: ACADEMIC_LABEL[s][lang] }))}
        onChange={(x) => set('academicStatus', x)}
        error={errors.academicStatus}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label={L('الجامعة', 'University')}
          value={values.universityId}
          onChange={(e) => set('universityId', e.target.value)}
        >
          <option value="">{L('— اختياري —', '— optional —')}</option>
          {reference.universities.map((o) => (
            <option key={o.id} value={o.id}>
              {name(o)}
            </option>
          ))}
        </Select>
        <Select
          label={L('المسار', 'Track')}
          value={values.trackId}
          onChange={(e) => set('trackId', e.target.value)}
        >
          <option value="">{L('— اختياري —', '— optional —')}</option>
          {reference.tracks.map((o) => (
            <option key={o.id} value={o.id}>
              {name(o)}
            </option>
          ))}
        </Select>
        <Select
          label={L('التخصص', 'Major')}
          value={values.majorId}
          onChange={(e) => {
            set('majorId', e.target.value);
            set('subMajorId', '');
          }}
        >
          <option value="">{L('— اختياري —', '— optional —')}</option>
          {reference.majors
            .filter((o) => !o.parentId)
            .map((o) => (
              <option key={o.id} value={o.id}>
                {name(o)}
              </option>
            ))}
        </Select>
        <Select
          label={L('التخصص الفرعي', 'Sub-major')}
          value={values.subMajorId}
          onChange={(e) => set('subMajorId', e.target.value)}
          disabled={!values.majorId}
        >
          <option value="">{L('— اختياري —', '— optional —')}</option>
          {reference.majors
            .filter((o) => o.parentId && String(o.parentId) === values.majorId)
            .map((o) => (
              <option key={o.id} value={o.id}>
                {name(o)}
              </option>
            ))}
        </Select>
      </div>
    </div>
  );

  const position = (
    <div className="flex flex-col gap-5">
      <p className="t-body-sm text-muted">
        {L(
          'اختياري. يمكنك تخطّي هذه الخطوة وتعيين المنصب لاحقاً.',
          'Optional. You can skip this step and assign the position later.',
        )}
      </p>
      <Select
        label={L('اللجنة', 'Committee')}
        value={values.committeeId}
        onChange={(e) => {
          set('committeeId', e.target.value);
          set('handover', false);
          set('keepAsDeputy', false);
        }}
        error={errors.committeeId}
      >
        <option value="">{L('— بلا لجنة —', '— no committee —')}</option>
        {committees
          .filter((c) => c.status === 'active')
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.name[lang]}
            </option>
          ))}
      </Select>
      <Chips
        label={L('المنصب', 'Position')}
        value={values.roleKey}
        options={roles
          .filter((r) => (WIZARD_ROLE_KEYS as readonly string[]).includes(r.key))
          .map((r) => ({ value: r.key as 'committee_member', label: r.name[lang] }))}
        onChange={(x) => {
          set('roleKey', x);
          set('handover', false);
          set('keepAsDeputy', false);
        }}
        error={errors.roleKey}
      />
      <Field
        type="date"
        label={L('تاريخ البدء', 'Start date')}
        optionalLabel={L('اليوم إن تُرك فارغاً', 'today if left empty')}
        value={values.startsAt}
        min={todayRiyadh()}
        onChange={(e) => set('startsAt', e.target.value)}
        error={errors.startsAt}
      />
      {currentHead && (
        <Alert tone="warning">
          <p>
            {L(
              `للجنة قائد حالي: ${currentHead}. عند الحفظ ينتهي منصبه في تاريخ البدء.`,
              `This committee has a head: ${currentHead}. Saving ends that term on the start date.`,
            )}
          </p>
          <div className="mt-2">
            <Checkbox
              label={L(
                `اجعل ${currentHead} نائباً للقائد بدلاً من إنهاء منصبه`,
                `Make ${currentHead} the deputy head instead of ending the role`,
              )}
              checked={values.keepAsDeputy}
              onChange={(e) => {
                set('handover', true);
                set('keepAsDeputy', e.target.checked);
              }}
            />
          </div>
        </Alert>
      )}
    </div>
  );

  const row = (label: string, value: string) => (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="t-body-sm w-32 shrink-0 text-muted">{label}</dt>
      <dd className="t-body min-w-0 break-words">{value || '—'}</dd>
    </div>
  );
  const section = (title: string, target: NewMemberStep, children: React.ReactNode) => (
    <section className="rounded-shape-md border border-line p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="t-h4">{title}</h3>
        <button
          type="button"
          onClick={() => go(steps.indexOf(target))}
          className="min-h-11 px-2 text-sm font-semibold text-accent-text focus-visible:outline-2 focus-visible:outline-focus-ring"
        >
          {L('تعديل', 'Edit')}
        </button>
      </div>
      <dl className="flex flex-col gap-2">{children}</dl>
    </section>
  );
  const phoneShown = values.phone
    ? (toE164(values.phoneCountry, values.phone) ?? values.phone)
    : '';
  const review = (
    <div className="flex flex-col gap-4">
      {section(
        L('الهوية', 'Identity'),
        'identity',
        <>
          {row(
            L('الاسم', 'Name'),
            `${fullName(values.firstNameAr, values.middleNameAr, values.lastNameAr)} · ${fullName(values.firstNameEn, values.middleNameEn, values.lastNameEn)}`,
          )}
          {row(L('البريد', 'E-mail'), values.email.trim())}
          {row(L('الجوال', 'Phone'), phoneShown)}
        </>,
      )}
      {section(
        L('الدراسة', 'Study'),
        'academic',
        <>
          {row(
            L('الحالة', 'Status'),
            values.academicStatus ? ACADEMIC_LABEL[values.academicStatus][lang] : '',
          )}
          {row(
            L('الجامعة', 'University'),
            [
              ref(reference.universities, values.universityId),
              ref(reference.majors, values.majorId),
            ]
              .filter(Boolean)
              .join(' · '),
          )}
          {row(L('المسار', 'Track'), ref(reference.tracks, values.trackId))}
        </>,
      )}
      {canAssign &&
        section(
          L('اللجنة والمنصب', 'Committee and position'),
          'position',
          <>
            {row(L('اللجنة', 'Committee'), committeeName(values.committeeId))}
            {row(
              L('المنصب', 'Position'),
              values.roleKey
                ? `${roleName(values.roleKey)} · ${L('من', 'from')} ${values.startsAt || todayRiyadh()}`
                : L('بلا منصب', 'No position'),
            )}
          </>,
        )}
      <p className="t-body-sm text-muted">
        {L('سيُرسل بريد تفعيل واحد.', 'One activation e-mail will be sent.')}
      </p>
    </div>
  );

  const body: Record<NewMemberStep, React.ReactNode> = { identity, academic, position, review };
  const last = stepIndex === steps.length - 1;
  // Enter-only on purpose: the old step is removed at once, so a slow or failed load of the animation code can never
  // leave the wizard waiting for an exit animation. The new step slides in from the side of progress.
  const stepMotion = presets.step(dir, ar);

  return (
    <>
      <Button
        onClick={() => {
          if (outcome?.kind !== 'failed') reset();
          setOpen(true);
        }}
      >
        <UserPlus size={16} aria-hidden="true" />
        {L('إضافة عضو', 'Add member')}
      </Button>

      <Dialog
        open={open}
        onClose={close}
        title={L('إضافة عضو', 'Add a member')}
        description={L(
          'ننشئ الحساب والعضوية والمنصب معاً، ونرسل بريد التفعيل مرة واحدة.',
          'We create the account, the membership and the position together, and send the activation e-mail once.',
        )}
        busy={phase === 'sending'}
        closeLabel={L('إغلاق', 'Close')}
        presentation="sheet"
        className="w-[min(46rem,calc(100vw-2rem))] max-md:min-h-dvh max-md:rounded-none"
        footer={
          phase === 'sending' ? undefined : (
            <>
              <span className="t-body-sm me-auto text-muted">
                {L(
                  `الخطوة ${stepIndex + 1} من ${steps.length}`,
                  `Step ${stepIndex + 1} of ${steps.length}`,
                )}
              </span>
              {stepIndex > 0 ? (
                <Button type="button" variant="ghost" onClick={() => go(stepIndex - 1)}>
                  {L('السابق', 'Back')}
                </Button>
              ) : (
                <Button type="button" variant="secondary" onClick={close}>
                  {L('إلغاء', 'Cancel')}
                </Button>
              )}
              {last ? (
                <Button type="button" onClick={submit}>
                  {L('إضافة العضو', 'Add member')}
                </Button>
              ) : (
                <Button type="button" onClick={next}>
                  {L('التالي', 'Next')}
                </Button>
              )}
            </>
          )
        }
      >
        <MotionProvider>
          <div className="flex flex-col gap-6">
            <Stepper
              steps={stepperSteps}
              current={stepIndex + 1}
              maxReached={reached + 1}
              onSelect={(n) => go(n - 1)}
              labelOf={(n, total, label) =>
                L(`الخطوة ${n} من ${total}: ${label}`, `Step ${n} of ${total}: ${label}`)
              }
              navLabel={L('خطوات الإضافة', 'Add member steps')}
            />
            {phase === 'sending' ? (
              <div
                role="status"
                aria-live="polite"
                className="flex flex-col items-center gap-3 py-10 text-center"
              >
                <span className="inline-flex size-16 items-center justify-center rounded-full bg-surface-raised text-accent">
                  <Loader2
                    aria-hidden="true"
                    className="size-8 animate-spin motion-reduce:animate-none"
                  />
                </span>
                <h3 className="t-h3">{L('جارٍ إنشاء العضو…', 'Creating the member…')}</h3>
                <p className="t-body text-muted">
                  {L(
                    'ننشئ الحساب والعضوية والمنصب في عملية واحدة. لا تغلق النافذة.',
                    'We create the account, the membership and the position in one operation. Do not close the window.',
                  )}
                </p>
              </div>
            ) : (
              <div>
                <h3 ref={heading} tabIndex={-1} className="t-h3 mb-4 outline-none">
                  {stepLabels[step]}
                </h3>
                <m.div
                  key={step}
                  initial={stepMotion.initial}
                  animate={stepMotion.animate}
                  transition={stepMotion.transition}
                >
                  {body[step]}
                </m.div>
                {Object.values(errors).some(Boolean) && (
                  <p role="alert" className="mt-4 flex items-center gap-2 text-sm text-danger">
                    <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
                    {L('يرجى مراجعة الحقول المحددة.', 'Please review the highlighted fields.')}
                  </p>
                )}
              </div>
            )}
          </div>
        </MotionProvider>
      </Dialog>

      <ResultDialog
        open={outcome?.kind === 'success'}
        // Closing one result dialog to open the next also fires its close event: clear only our own outcome.
        onClose={() => setOutcome((o) => (o?.kind === 'success' ? null : o))}
        tone="success"
        title={L(
          `أُضيف ${fullName(values.firstNameAr, values.middleNameAr, values.lastNameAr)}`,
          `${fullName(values.firstNameEn, values.middleNameEn, values.lastNameEn)} was added`,
        )}
        description={
          outcome?.kind === 'success'
            ? [
                outcome.emailStatus === 'none'
                  ? L(
                      'لم يُرسل بريد تفعيل (للحساب القائم).',
                      'No activation e-mail was needed (existing account).',
                    )
                  : L(
                      `أُرسل بريد التفعيل إلى ${outcome.email}.`,
                      `The activation e-mail was sent to ${outcome.email}.`,
                    ),
                values.roleKey && values.committeeId
                  ? L(
                      `${roleName(values.roleKey)} في ${committeeName(values.committeeId)}.`,
                      `${roleName(values.roleKey)} of ${committeeName(values.committeeId)}.`,
                    )
                  : '',
              ]
                .filter(Boolean)
                .join(' ')
            : undefined
        }
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                reset();
                setOpen(true);
              }}
            >
              {L('إضافة عضو آخر', 'Add another member')}
            </Button>
            {outcome?.kind === 'success' && (
              <Link
                href={`/dashboard/members/${outcome.id}`}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 font-semibold text-on-accent"
              >
                {L('عرض العضو', 'View member')}
              </Link>
            )}
          </>
        }
      />

      <ResultDialog
        open={outcome?.kind === 'delayed'}
        // Closing one result dialog to open the next also fires its close event: clear only our own outcome.
        onClose={() => setOutcome((o) => (o?.kind === 'delayed' ? null : o))}
        tone="warning"
        title={L('أُضيف العضو، وتأخّر البريد', 'The member was added, but the e-mail is delayed')}
        description={L(
          'الحساب والمنصب محفوظان. بريد التفعيل في قائمة الانتظار وسيُعاد إرساله تلقائياً.',
          'The account and the position are saved. The activation e-mail is queued and will be sent again automatically.',
        )}
        actions={
          <>
            <Button type="button" variant="secondary" loading={resending} onClick={resend}>
              {L('إعادة إرسال الآن', 'Send again now')}
            </Button>
            {outcome?.kind === 'delayed' && (
              <Link
                href={`/dashboard/members/${outcome.id}`}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 font-semibold text-on-accent"
              >
                {L('عرض العضو', 'View member')}
              </Link>
            )}
          </>
        }
      />

      <ResultDialog
        open={outcome?.kind === 'failed'}
        // Closing one result dialog to open the next also fires its close event: clear only our own outcome.
        onClose={() => setOutcome((o) => (o?.kind === 'failed' ? null : o))}
        tone="danger"
        title={L('لم نتمكن من إضافة العضو', 'We could not add the member')}
        description={
          outcome?.kind === 'failed'
            ? `${outcome.message} ${L('لم يُحفظ أي شيء ولم يُرسل أي بريد. بياناتك ما زالت في النموذج.', 'Nothing was saved and no e-mail was sent. Your data is still in the form.')}`
            : undefined
        }
        actions={
          <>
            <Button type="button" variant="secondary" onClick={backToReview}>
              {L('رجوع للمراجعة', 'Back to review')}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setOutcome(null);
                setOpen(true);
                void submit();
              }}
            >
              {L('إعادة المحاولة', 'Try again')}
            </Button>
          </>
        }
      />
    </>
  );
}
