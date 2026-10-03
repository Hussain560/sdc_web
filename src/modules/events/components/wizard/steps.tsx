'use client';

import { Lock } from 'lucide-react';
import { useRef, useState, useTransition } from 'react';
import { Button, Chips, Field, Select, Switch, useToast } from '@/components/ui';
import { formatDateRange, formatTimeRange } from '@/lib/format';
import type { Localized } from '@/modules/access/types';
import { uploadEventCover } from '../../actions';
import {
  EVENT_TYPES,
  LOCATION_LABEL,
  LOCATION_MODES,
  SCHEDULE_TYPES,
  TYPE_LABEL,
  type DisplayConfig,
  type EventFormValues,
} from '../../types';
import {
  DatesEditor,
  DetailsEditor,
  FaqEditor,
  GoalsEditor,
  MarkdownField,
  PresentersEditor,
  type StepProps,
} from './fields';

type Common = StepProps<EventFormValues> & { set: (patch: Partial<EventFormValues>) => void };

const SCHEDULE_LABEL: Record<(typeof SCHEDULE_TYPES)[number], Localized> = {
  single_day: { ar: 'يوم واحد', en: 'Single day' },
  consecutive_range: { ar: 'أيام متتالية', en: 'Consecutive days' },
  specific_dates: { ar: 'تواريخ محددة', en: 'Specific dates' },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="border-b border-line pb-2 text-base font-bold">{title}</h3>
      {children}
    </section>
  );
}

// ------------------------------------------------------------------------------- step 1
export function Step1Identity({
  values,
  set,
  errors,
  lang,
  readOnly,
  committees,
  lockCommittee,
  slugLocked,
}: Common & {
  committees: Array<{ id: string; name: Localized }>;
  lockCommittee: boolean;
  slugLocked: boolean;
}) {
  const ar = lang === 'ar';
  return (
    <div className="flex flex-col gap-6">
      <Section title={ar ? 'الهوية' : 'Identity'}>
        <Select
          id="field-committeeId"
          label={`${ar ? 'اللجنة المنظِّمة' : 'Organizing committee'} *`}
          value={values.committeeId}
          error={errors.committeeId}
          disabled={readOnly || lockCommittee}
          onChange={(e) => set({ committeeId: e.target.value })}
        >
          <option value="">{ar ? 'اختر…' : 'Choose…'}</option>
          {committees.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name[lang]}
            </option>
          ))}
        </Select>

        <Chips
          id="field-type"
          label={`${ar ? 'نوع الفعالية' : 'Event type'} *`}
          value={values.type}
          disabled={readOnly}
          error={errors.type}
          options={EVENT_TYPES.map((t) => ({ value: t, label: TYPE_LABEL[t][lang] }))}
          onChange={(type) => set({ type })}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            id="field-titleAr"
            label={`${ar ? 'العنوان (عربي)' : 'Title (Arabic)'} *`}
            value={values.titleAr}
            error={errors.titleAr}
            maxLength={200}
            disabled={readOnly}
            onChange={(e) => set({ titleAr: e.target.value })}
          />
          <Field
            id="field-titleEn"
            label={ar ? 'العنوان (إنجليزي)' : 'Title (English)'}
            dir="ltr"
            value={values.titleEn}
            error={errors.titleEn}
            maxLength={200}
            disabled={readOnly}
            onChange={(e) => set({ titleEn: e.target.value })}
          />
        </div>

        <Field
          id="field-slug"
          label={ar ? 'الرابط' : 'Slug'}
          dir="ltr"
          value={values.slug}
          error={errors.slug}
          disabled={readOnly || slugLocked}
          placeholder={
            ar ? 'يُنشأ تلقائيًا من العنوان الإنجليزي' : 'Generated from the English title'
          }
          hint={
            slugLocked
              ? ar
                ? 'مقفل بعد النشر'
                : 'Locked after publishing'
              : ar
                ? 'أحرف إنجليزية صغيرة وأرقام وشرطات. اتركه فارغًا ليُنشأ تلقائيًا.'
                : 'Lowercase letters, digits and hyphens. Leave empty to generate it.'
          }
          onChange={(e) => set({ slug: e.target.value.toLowerCase() })}
        />
      </Section>

      <Section title={ar ? 'الوصف' : 'Description'}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label={ar ? 'ملخص (عربي)' : 'Summary (Arabic)'}
            value={values.summaryAr}
            error={errors.summaryAr}
            maxLength={500}
            disabled={readOnly}
            onChange={(e) => set({ summaryAr: e.target.value })}
          />
          <Field
            label={ar ? 'ملخص (إنجليزي)' : 'Summary (English)'}
            dir="ltr"
            value={values.summaryEn}
            maxLength={500}
            disabled={readOnly}
            onChange={(e) => set({ summaryEn: e.target.value })}
          />
        </div>
        <MarkdownField
          label={ar ? 'الوصف (عربي)' : 'Description (Arabic)'}
          value={values.descriptionAr}
          maxLength={5000}
          lang={lang}
          disabled={readOnly}
          error={errors.descriptionAr}
          onChange={(descriptionAr) => set({ descriptionAr })}
        />
        <MarkdownField
          label={ar ? 'الوصف (إنجليزي)' : 'Description (English)'}
          value={values.descriptionEn}
          maxLength={5000}
          lang={lang}
          dir="ltr"
          disabled={readOnly}
          onChange={(descriptionEn) => set({ descriptionEn })}
        />
      </Section>
    </div>
  );
}

// ------------------------------------------------------------------------------- step 2
export function Step2Logistics({ values, set, errors, lang, readOnly }: Common) {
  const ar = lang === 'ar';
  const unlimited = values.seats === '';
  return (
    <div className="flex flex-col gap-6">
      <Section title={ar ? 'الجدولة' : 'Schedule'}>
        <Chips
          id="field-scheduleType"
          label={`${ar ? 'نمط الجدولة' : 'Schedule type'} *`}
          value={values.scheduleType}
          disabled={readOnly}
          options={SCHEDULE_TYPES.map((s) => ({ value: s, label: SCHEDULE_LABEL[s][lang] }))}
          onChange={(scheduleType) => set({ scheduleType })}
        />
        {values.scheduleType === 'single_day' && (
          <Field
            id="field-startDate"
            type="date"
            label={`${ar ? 'التاريخ' : 'Date'} *`}
            value={values.startDate}
            error={errors.startDate}
            disabled={readOnly}
            onChange={(e) => set({ startDate: e.target.value })}
          />
        )}
        {values.scheduleType === 'consecutive_range' && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              id="field-startDate"
              type="date"
              label={`${ar ? 'من' : 'From'} *`}
              value={values.startDate}
              error={errors.startDate}
              disabled={readOnly}
              onChange={(e) => set({ startDate: e.target.value })}
            />
            <Field
              id="field-endDate"
              type="date"
              label={`${ar ? 'إلى' : 'To'} *`}
              value={values.endDate}
              error={errors.endDate}
              disabled={readOnly}
              onChange={(e) => set({ endDate: e.target.value })}
            />
          </div>
        )}
        {values.scheduleType === 'specific_dates' && (
          <DatesEditor
            dates={values.dates}
            onChange={(dates) => set({ dates })}
            lang={lang}
            readOnly={readOnly}
            error={errors.dates}
          />
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            id="field-startTime"
            type="time"
            label={ar ? 'من الساعة' : 'From'}
            value={values.startTime}
            error={errors.startTime}
            disabled={readOnly}
            onChange={(e) => set({ startTime: e.target.value })}
          />
          <Field
            id="field-endTime"
            type="time"
            label={ar ? 'إلى الساعة' : 'To'}
            value={values.endTime}
            error={errors.endTime}
            disabled={readOnly}
            hint={ar ? 'بتوقيت الرياض' : 'Riyadh time'}
            onChange={(e) => set({ endTime: e.target.value })}
          />
        </div>
      </Section>

      <Section title={ar ? 'المكان' : 'Place'}>
        <Chips
          id="field-locationMode"
          label={`${ar ? 'نوع الحضور' : 'Attendance'} *`}
          value={values.locationMode}
          disabled={readOnly}
          options={LOCATION_MODES.map((l) => ({ value: l, label: LOCATION_LABEL[l][lang] }))}
          onChange={(locationMode) => set({ locationMode })}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            id="field-locationAr"
            label={`${ar ? 'المكان (عربي)' : 'Location (Arabic)'}${values.locationMode !== 'online' ? ' *' : ''}`}
            value={values.locationAr}
            error={errors.locationAr}
            maxLength={500}
            disabled={readOnly}
            onChange={(e) => set({ locationAr: e.target.value })}
          />
          <Field
            label={ar ? 'المكان (إنجليزي)' : 'Location (English)'}
            dir="ltr"
            value={values.locationEn}
            maxLength={500}
            disabled={readOnly}
            onChange={(e) => set({ locationEn: e.target.value })}
          />
        </div>
        {values.locationMode !== 'online' && (
          <Field
            id="field-mapUrl"
            label={ar ? 'رابط الخريطة' : 'Map link'}
            dir="ltr"
            value={values.mapUrl}
            error={errors.mapUrl}
            disabled={readOnly}
            placeholder="https://maps.google.com/…"
            onChange={(e) => set({ mapUrl: e.target.value })}
          />
        )}
      </Section>

      <Section title={ar ? 'روابط خاصة' : 'Private links'}>
        <p className="flex items-center gap-2 text-sm text-muted">
          <Lock size={16} aria-hidden="true" />
          {ar
            ? 'تظهر الروابط المقفلة للمقبولين والمنظمين فقط، وتُرسل في بريد القبول.'
            : 'Locked links are visible to accepted registrants and organizers only, and are sent in the acceptance e-mail.'}
        </p>
        <Field
          id="field-meetingUrl"
          label={ar ? 'رابط اللقاء (اختياري)' : 'Meeting link (optional)'}
          dir="ltr"
          value={values.meetingUrl}
          error={errors.meetingUrl}
          disabled={readOnly}
          placeholder="https://meet.google.com/…"
          onChange={(e) => set({ meetingUrl: e.target.value })}
        />
        <Field
          label={ar ? 'ملاحظات اللقاء' : 'Meeting notes'}
          value={values.meetingNotes}
          maxLength={1000}
          disabled={readOnly}
          hint={ar ? 'رمز الدخول وتعليمات الانضمام.' : 'Passcode and joining instructions.'}
          onChange={(e) => set({ meetingNotes: e.target.value })}
        />
        <Field
          id="field-groupLink"
          label={`${ar ? 'رابط المجموعة' : 'Group link'} *`}
          dir="ltr"
          value={values.groupLink}
          error={errors.groupLink}
          disabled={readOnly}
          placeholder="https://chat.whatsapp.com/…"
          onChange={(e) => set({ groupLink: e.target.value })}
        />
      </Section>

      <Section title={ar ? 'التسجيل' : 'Registration'}>
        <div className="grid items-end gap-4 md:grid-cols-2">
          <Field
            id="field-seats"
            type="number"
            min={1}
            label={ar ? 'عدد المقاعد' : 'Seats'}
            value={values.seats}
            error={errors.seats}
            disabled={readOnly || unlimited}
            onChange={(e) => set({ seats: e.target.value })}
          />
          <Switch
            label={ar ? 'غير محدود' : 'Unlimited'}
            checked={unlimited}
            disabled={readOnly}
            onChange={(on) =>
              set({ seats: on ? '' : '50', waitlistEnabled: on ? false : values.waitlistEnabled })
            }
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            id="field-registrationStartAt"
            type="datetime-local"
            label={ar ? 'يفتح التسجيل' : 'Registration opens'}
            value={values.registrationStartAt}
            disabled={readOnly}
            hint={ar ? 'فارغ = عند النشر' : 'Empty = at publish'}
            onChange={(e) => set({ registrationStartAt: e.target.value })}
          />
          <Field
            id="field-registrationEndAt"
            type="datetime-local"
            label={ar ? 'يغلق التسجيل' : 'Registration closes'}
            value={values.registrationEndAt}
            error={errors.registrationEndAt}
            disabled={readOnly}
            hint={
              ar
                ? 'يمكن تمديده لاحقًا ولو بعد بدء الفعالية.'
                : 'Can be extended later, even after the event starts.'
            }
            onChange={(e) => set({ registrationEndAt: e.target.value })}
          />
        </div>
        <Switch
          label={ar ? 'يتطلب موافقة على التسجيل' : 'Registration needs approval'}
          checked={values.requiresApproval}
          disabled={readOnly}
          onChange={(requiresApproval) => set({ requiresApproval })}
        />
        {!unlimited && (
          <Switch
            label={ar ? 'قائمة انتظار' : 'Waitlist'}
            hint={ar ? 'عند اكتمال المقاعد' : 'When seats are full'}
            checked={values.waitlistEnabled}
            disabled={readOnly}
            onChange={(waitlistEnabled) => set({ waitlistEnabled })}
          />
        )}
        <Chips
          label={ar ? 'الجمهور' : 'Audience'}
          value={values.audience}
          disabled={readOnly}
          options={[
            { value: 'public', label: ar ? 'عام' : 'Public' },
            { value: 'members_only', label: ar ? 'للأعضاء فقط' : 'Members only' },
          ]}
          onChange={(audience) => set({ audience })}
        />
      </Section>
    </div>
  );
}

// ------------------------------------------------------------------------------- step 3
export function Step3Content({
  values,
  set,
  errors,
  lang,
  readOnly,
  eventId,
  coverUrl,
  onCoverUrl,
}: Common & {
  eventId: string | null;
  coverUrl: string | null;
  onCoverUrl: (url: string | null) => void;
}) {
  const ar = lang === 'ar';
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = useTransition();
  const toast = useToast();

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const form = new FormData();
    form.set('file', file);
    form.set('eventId', eventId ?? '');
    startUpload(async () => {
      const r = await uploadEventCover(form, { lang });
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      set({ coverImagePath: r.data.path });
      onCoverUrl(r.data.url);
      toast.success(ar ? 'تم رفع الغلاف.' : 'Cover uploaded.');
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Section title={ar ? 'صورة الغلاف' : 'Cover image'}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex aspect-video w-64 items-center justify-center overflow-hidden rounded-xl border border-dashed border-line bg-surface-raised text-sm text-muted">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="" className="size-full object-cover" />
            ) : ar ? (
              'لا توجد صورة'
            ) : (
              'No image'
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              aria-label={ar ? 'اختر صورة' : 'Choose an image'}
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="secondary"
              loading={uploading}
              disabled={readOnly}
              onClick={() => fileRef.current?.click()}
            >
              {ar ? 'اختر صورة' : 'Choose image'}
            </Button>
            {coverUrl && !readOnly && (
              <button
                type="button"
                className="text-start text-sm text-muted underline"
                onClick={() => {
                  set({ coverImagePath: '' });
                  onCoverUrl(null);
                }}
              >
                {ar ? 'إزالة الصورة' : 'Remove image'}
              </button>
            )}
            <p className="text-xs text-muted">
              {ar
                ? 'JPEG أو PNG أو WebP · 16:9 · حتى 2 ميغابايت'
                : 'JPEG, PNG or WebP · 16:9 · up to 2 MB'}
            </p>
          </div>
        </div>
      </Section>

      <Section title={ar ? 'الأهداف والأسئلة' : 'Goals and FAQ'}>
        <GoalsEditor
          goals={values.goals}
          onChange={(goals) => set({ goals })}
          lang={lang}
          readOnly={readOnly}
          error={errors.goals}
        />
        <FaqEditor
          faq={values.faq}
          onChange={(faq) => set({ faq })}
          lang={lang}
          readOnly={readOnly}
          error={errors.faq}
        />
      </Section>

      <Section title={ar ? 'المقدّمون' : 'Presenters'}>
        <PresentersEditor
          presenters={values.presenters}
          onChange={(presenters) => set({ presenters })}
          lang={lang}
          readOnly={readOnly}
          error={errors.presenters}
        />
      </Section>

      <Section title={ar ? 'تفاصيل إضافية' : 'More details'}>
        <DetailsEditor
          details={values.details}
          onChange={(details) => set({ details })}
          lang={lang}
          readOnly={readOnly}
        />
        <Switch
          label={ar ? 'شهادة حضور' : 'Attendance certificate'}
          checked={values.certificateAvailable}
          disabled={readOnly}
          onChange={(certificateAvailable) => set({ certificateAvailable })}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label={ar ? 'الجوائز (عربي)' : 'Awards (Arabic)'}
            value={values.awardsAr}
            disabled={readOnly}
            onChange={(e) => set({ awardsAr: e.target.value })}
          />
          <Field
            label={ar ? 'الجوائز (إنجليزي)' : 'Awards (English)'}
            dir="ltr"
            value={values.awardsEn}
            disabled={readOnly}
            onChange={(e) => set({ awardsEn: e.target.value })}
          />
          <Field
            id="field-contactEmail"
            type="email"
            dir="ltr"
            label={ar ? 'بريد التواصل' : 'Contact e-mail'}
            value={values.contactEmail}
            error={errors.contactEmail}
            disabled={readOnly}
            onChange={(e) => set({ contactEmail: e.target.value })}
          />
          <Field
            id="field-contactPhone"
            dir="ltr"
            label={ar ? 'هاتف التواصل' : 'Contact phone'}
            value={values.contactPhone}
            error={errors.contactPhone}
            disabled={readOnly}
            placeholder="+9665…"
            onChange={(e) => set({ contactPhone: e.target.value })}
          />
        </div>
      </Section>
    </div>
  );
}

// ------------------------------------------------------------------------------- step 4
const DISPLAY_TOGGLES: Array<{ key: keyof DisplayConfig; ar: string; en: string }> = [
  { key: 'show_presenters', ar: 'إظهار المقدّمين', en: 'Show presenters' },
  { key: 'show_goals', ar: 'إظهار الأهداف', en: 'Show goals' },
  { key: 'show_faq', ar: 'إظهار الأسئلة الشائعة', en: 'Show FAQ' },
  { key: 'show_details', ar: 'إظهار التفاصيل الإضافية', en: 'Show extra details' },
  { key: 'show_seats_remaining', ar: 'إظهار المقاعد المتبقية', en: 'Show remaining seats' },
  {
    key: 'auto_close_registration',
    ar: 'إغلاق التسجيل تلقائيًا عند الامتلاء',
    en: 'Close registration automatically when full',
  },
];

function Block({
  title,
  step,
  children,
  readOnly,
  ar,
  goStep,
}: {
  title: string;
  step: number;
  children: React.ReactNode;
  readOnly: boolean;
  ar: boolean;
  goStep: (n: number) => void;
}) {
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-bold">{title}</h4>
        {!readOnly && (
          <button
            type="button"
            className="text-sm text-accent underline"
            onClick={() => goStep(step)}
          >
            {ar ? 'تعديل' : 'Edit'}
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1 text-sm">{children}</div>
    </div>
  );
}

export function Step4Review({
  values,
  set,
  errors,
  lang,
  readOnly,
  committeeName,
  goStep,
  showConfirmation,
}: Common & { committeeName: string; goStep: (n: number) => void; showConfirmation: boolean }) {
  const ar = lang === 'ar';
  const dash = <span className="text-muted">—</span>;
  const start =
    values.scheduleType === 'specific_dates' ? (values.dates[0] ?? null) : values.startDate || null;
  const end =
    values.scheduleType === 'specific_dates'
      ? (values.dates.at(-1) ?? null)
      : values.scheduleType === 'consecutive_range'
        ? values.endDate || null
        : null;
  const goalCount = values.goals.filter((g) => g.ar.trim()).length;

  return (
    <div className="flex flex-col gap-6">
      <Section title={ar ? 'ملخص الفعالية' : 'Event summary'}>
        <Block
          readOnly={readOnly}
          ar={ar}
          goStep={goStep}
          title={ar ? 'الهوية' : 'Identity'}
          step={1}
        >
          <p>
            {TYPE_LABEL[values.type][lang]} · {committeeName || dash} ·{' '}
            {(ar ? values.titleAr : values.titleEn || values.titleAr) || dash}
          </p>
        </Block>
        <Block
          readOnly={readOnly}
          ar={ar}
          goStep={goStep}
          title={ar ? 'التفاصيل' : 'Logistics'}
          step={2}
        >
          <p>
            {formatDateRange(start, end, lang)}{' '}
            {formatTimeRange(values.startTime, values.endTime) &&
              `· ${formatTimeRange(values.startTime, values.endTime)}`}{' '}
            · {LOCATION_LABEL[values.locationMode][lang]}
            {values.seats
              ? ` · ${values.seats} ${ar ? 'مقعدًا' : 'seats'}`
              : ` · ${ar ? 'مقاعد غير محدودة' : 'unlimited seats'}`}
          </p>
          <p>
            {ar ? 'رابط المجموعة' : 'Group link'}: {values.groupLink ? '✓' : dash} ·{' '}
            {ar ? 'رابط اللقاء' : 'Meeting link'}: {values.meetingUrl ? '✓' : dash}
          </p>
        </Block>
        <Block
          readOnly={readOnly}
          ar={ar}
          goStep={goStep}
          title={ar ? 'المحتوى' : 'Content'}
          step={3}
        >
          <p>
            {goalCount} {ar ? 'أهداف' : 'goals'} · {values.faq.length} {ar ? 'أسئلة' : 'FAQ'} ·{' '}
            {values.presenters.length} {ar ? 'مقدّمين' : 'presenters'} · {ar ? 'غلاف' : 'cover'}{' '}
            {values.coverImagePath ? '✓' : dash}
          </p>
        </Block>
      </Section>

      <Section title={ar ? 'إعدادات العرض' : 'Display settings'}>
        <div className="grid gap-4 md:grid-cols-2">
          {DISPLAY_TOGGLES.map((t) => (
            <Switch
              key={t.key}
              label={ar ? t.ar : t.en}
              checked={values.displayConfig[t.key]}
              disabled={readOnly}
              onChange={(on) => set({ displayConfig: { ...values.displayConfig, [t.key]: on } })}
            />
          ))}
        </div>
      </Section>

      {showConfirmation && (
        <Section title={ar ? 'التأكيد' : 'Confirmation'}>
          <Field
            label={ar ? 'ملاحظة للمراجِع (اختياري)' : 'Note for the reviewer (optional)'}
            value={values.submissionNote}
            maxLength={1000}
            disabled={readOnly}
            onChange={(e) => set({ submissionNote: e.target.value })}
          />
          <label className="flex items-start gap-3 text-sm">
            <input
              id="field-confirmed"
              type="checkbox"
              className="mt-1 size-4"
              checked={values.confirmed}
              disabled={readOnly}
              onChange={(e) => set({ confirmed: e.target.checked })}
            />
            <span>
              {ar
                ? 'أؤكد أن المعلومات صحيحة ومكتملة *'
                : 'I confirm the information is correct and complete *'}
            </span>
          </label>
          {errors.confirmed && (
            <p role="alert" className="text-xs text-danger">
              {errors.confirmed}
            </p>
          )}
        </Section>
      )}
    </div>
  );
}
