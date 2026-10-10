'use client';

import { useState, useTransition } from 'react';
import { Button, Chips, Field, Select, Switch, Textarea, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { Link, useRouter } from '@/i18n/navigation';
import {
  ACADEMIC_LABEL,
  ACADEMIC_STATUSES,
  type ReferenceOption,
} from '@/modules/membership/types';
import { setMemberStatus, updateMyMemberProfile } from '../actions';
import { validateProfile, type ProfileValues } from '../schemas';

/**
 * My member profile (docs/11-modules/members §9). Members edit profile fields and directory visibility only;
 * status and dates are leadership's (ME-2), which the database enforces regardless of this form.
 */
export function ProfileForm({
  memberId,
  initial,
  reference,
}: {
  memberId: string;
  initial: ProfileValues;
  reference: {
    universities: ReferenceOption[];
    majors: ReferenceOption[];
    tracks: ReferenceOption[];
  };
}) {
  const { lang } = useLanguage();
  const toast = useToast();
  const ar = lang === 'ar';
  const router = useRouter();
  const [v, setV] = useState<ProfileValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [leaving, setLeaving] = useState(false);

  const set = <K extends keyof ProfileValues>(k: K, value: ProfileValues[K]) => {
    setV((x) => ({ ...x, [k]: value }));
    setErrors((e) => {
      const { [k as string]: _d, ...rest } = e;
      return rest;
    });
  };
  const name = (o: ReferenceOption) => (ar ? o.nameAr : o.nameEn || o.nameAr);
  const parents = reference.majors.filter((m) => !m.parentId);
  const subs = reference.majors.filter((m) => m.parentId && String(m.parentId) === v.majorId);

  const save = () => {
    const found = validateProfile(v, lang);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    startTransition(async () => {
      const r = await updateMyMemberProfile(v, { lang });
      if (!r.ok) {
        toast.error(r.message);
        if (r.fieldErrors) setErrors(r.fieldErrors);
        return;
      }
      toast.success(ar ? 'تم حفظ ملفك.' : 'Your profile was saved.');
      router.refresh();
    });
  };

  const leave = () => {
    startTransition(async () => {
      const r = await setMemberStatus({ id: memberId, status: 'inactive' }, { lang });
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      setLeaving(false);
      router.refresh();
    });
  };

  return (
    <form
      method="post"
      className="flex max-w-3xl flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-bold">{ar ? 'الظهور في الدليل' : 'Directory visibility'}</h2>
        <Switch
          label={
            ar
              ? 'إظهار ملفي في دليل الأعضاء العام'
              : 'Show my profile in the public member directory'
          }
          checked={v.isDirectoryVisible}
          onChange={(checked) => set('isDirectoryVisible', checked)}
        />
        <p className="text-xs text-muted">
          {ar
            ? 'عند الإخفاء يختفي ملفك من الدليل ويعيد رابطه صفحة غير موجودة.'
            : 'When hidden, your profile disappears from the directory and its link shows a not-found page.'}
        </p>
        {v.isDirectoryVisible && (
          <div className="flex flex-col gap-3 border-t border-line pt-4">
            <p className="text-sm font-medium">
              {ar ? 'ما الذي يظهر على بطاقتك العامة' : 'What your public card shows'}
            </p>
            <Switch
              label={ar ? 'إظهار جامعتي' : 'Show my university'}
              checked={v.showUniversity}
              onChange={(c) => set('showUniversity', c)}
            />
            <Switch
              label={ar ? 'إظهار مساري' : 'Show my track'}
              checked={v.showTrack}
              onChange={(c) => set('showTrack', c)}
            />
            <Switch
              label={
                ar
                  ? 'إظهار روابطي (LinkedIn وGitHub وغيرها)'
                  : 'Show my links (LinkedIn, GitHub, …)'
              }
              checked={v.showLinks}
              onChange={(c) => set('showLinks', c)}
            />
            <Switch
              label={ar ? 'إظهار صورتي' : 'Show my photo'}
              hint={
                ar
                  ? 'الصور غير مفعّلة بعد؛ يظهر الاسم بالأحرف الأولى.'
                  : 'Photos are not available yet; initials are shown.'
              }
              checked={v.showPhoto}
              onChange={(c) => set('showPhoto', c)}
            />
            <Switch
              label={ar ? 'إظهار الفعاليات التي شاركت فيها' : 'Show the events I took part in'}
              hint={ar ? 'مغلق افتراضياً.' : 'Off by default.'}
              checked={v.showParticipation}
              onChange={(c) => set('showParticipation', c)}
            />
            <div
              aria-label={ar ? 'معاينة بطاقتك العامة' : 'Preview of your public card'}
              className="mt-2 flex items-center gap-3 rounded-xl bg-surface-raised p-4"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft font-semibold text-on-accent-soft">
                {(ar ? v.firstNameAr : v.firstNameEn || v.firstNameAr)
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </span>
              <div className="flex flex-col text-sm">
                <span className="font-semibold">
                  {[
                    ar ? v.firstNameAr : v.firstNameEn || v.firstNameAr,
                    ar ? v.lastNameAr : v.lastNameEn || v.lastNameAr,
                  ]
                    .join(' ')
                    .trim()}
                </span>
                <span className="text-muted">
                  {[
                    v.showTrack && v.trackId ? (ar ? 'المسار' : 'Track') : null,
                    v.showUniversity && v.universityId ? (ar ? 'الجامعة' : 'University') : null,
                    v.showLinks && (v.githubUrl || v.linkedinUrl || v.xUrl || v.portfolioUrl)
                      ? ar
                        ? 'الروابط'
                        : 'Links'
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || (ar ? 'الاسم فقط' : 'Name only')}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-bold">{ar ? 'البيانات الشخصية' : 'Personal details'}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="field-firstNameAr"
            label={ar ? 'الاسم الأول (عربي) *' : 'First name (Arabic) *'}
            value={v.firstNameAr}
            onChange={(e) => set('firstNameAr', e.target.value)}
            error={errors.firstNameAr}
          />
          <Field
            label={ar ? 'اسم العائلة (عربي)' : 'Last name (Arabic)'}
            value={v.lastNameAr}
            onChange={(e) => set('lastNameAr', e.target.value)}
          />
          <Field
            label={ar ? 'الاسم الأول (إنجليزي)' : 'First name (English)'}
            value={v.firstNameEn}
            onChange={(e) => set('firstNameEn', e.target.value)}
            dir="ltr"
          />
          <Field
            label={ar ? 'اسم العائلة (إنجليزي)' : 'Last name (English)'}
            value={v.lastNameEn}
            onChange={(e) => set('lastNameEn', e.target.value)}
            dir="ltr"
          />
        </div>
        <Chips
          label={ar ? 'الحالة' : 'Status'}
          value={v.academicStatus as string}
          options={ACADEMIC_STATUSES.map((s) => ({ value: s, label: ACADEMIC_LABEL[s][lang] }))}
          onChange={(x) => set('academicStatus', x as ProfileValues['academicStatus'])}
          error={errors.academicStatus}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={ar ? 'الجامعة' : 'University'}
            value={v.universityId}
            onChange={(e) => set('universityId', e.target.value)}
          >
            <option value="">{ar ? '—' : '—'}</option>
            {reference.universities.map((o) => (
              <option key={o.id} value={o.id}>
                {name(o)}
              </option>
            ))}
          </Select>
          <Select
            label={ar ? 'المسار' : 'Track'}
            value={v.trackId}
            onChange={(e) => set('trackId', e.target.value)}
          >
            <option value="">—</option>
            {reference.tracks.map((o) => (
              <option key={o.id} value={o.id}>
                {name(o)}
              </option>
            ))}
          </Select>
          <Select
            label={ar ? 'التخصص' : 'Major'}
            value={v.majorId}
            onChange={(e) => setV((x) => ({ ...x, majorId: e.target.value, subMajorId: '' }))}
          >
            <option value="">—</option>
            {parents.map((o) => (
              <option key={o.id} value={o.id}>
                {name(o)}
              </option>
            ))}
          </Select>
          {subs.length > 0 && (
            <Select
              label={ar ? 'التخصص الدقيق' : 'Sub-major'}
              value={v.subMajorId}
              onChange={(e) => set('subMajorId', e.target.value)}
            >
              <option value="">—</option>
              {subs.map((o) => (
                <option key={o.id} value={o.id}>
                  {name(o)}
                </option>
              ))}
            </Select>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-bold">{ar ? 'نبذة وروابط' : 'Bio & links'}</h2>
        <Textarea
          label={ar ? 'نبذة (عربي)' : 'Bio (Arabic)'}
          value={v.bioAr}
          onChange={(e) => set('bioAr', e.target.value)}
          maxLength={1000}
          counter
          error={errors.bioAr}
          rows={4}
        />
        <Textarea
          label={ar ? 'نبذة (إنجليزي)' : 'Bio (English)'}
          value={v.bioEn}
          onChange={(e) => set('bioEn', e.target.value)}
          maxLength={1000}
          counter
          error={errors.bioEn}
          dir="ltr"
          rows={4}
        />
        {(
          [
            ['portfolioUrl', ar ? 'موقعك الشخصي' : 'Portfolio / website'],
            ['githubUrl', 'GitHub'],
            ['linkedinUrl', 'LinkedIn'],
            ['xUrl', 'X'],
          ] as const
        ).map(([key, label]) => (
          <Field
            key={key}
            label={label}
            value={v[key]}
            onChange={(e) => set(key, e.target.value)}
            error={errors[key]}
            dir="ltr"
            placeholder="https://"
            inputMode="url"
          />
        ))}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={pending}>
          {ar ? 'حفظ' : 'Save'}
        </Button>
        <Link href="/members" className="text-sm text-accent underline">
          {ar ? 'عرض الدليل العام' : 'View the public directory'}
        </Link>
        <span className="flex-1" />
        {leaving ? (
          <span className="flex items-center gap-2 text-sm">
            {ar ? 'تأكيد مغادرة المجتمع؟' : 'Leave the community?'}
            <Button
              type="button"
              variant="danger"
              className="min-h-9 px-4"
              onClick={leave}
              loading={pending}
            >
              {ar ? 'نعم، مغادرة' : 'Yes, leave'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-9 px-4"
              onClick={() => setLeaving(false)}
            >
              {ar ? 'تراجع' : 'Back'}
            </Button>
          </span>
        ) : (
          <Button type="button" variant="ghost" onClick={() => setLeaving(true)}>
            {ar ? 'مغادرة المجتمع' : 'Leave the community'}
          </Button>
        )}
      </div>
    </form>
  );
}
