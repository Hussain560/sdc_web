'use client';

import { Pencil } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Button, Chips, Dialog, Field, PhoneField, Select, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import { toE164, type PhoneCountry } from '@/lib/phone';
import {
  ACADEMIC_LABEL,
  ACADEMIC_STATUSES,
  type AcademicStatus,
  type ReferenceOption,
} from '@/modules/membership/types';
import { updateMemberByStaff } from '../actions';

export type EditMemberValues = {
  firstNameAr: string;
  middleNameAr: string;
  lastNameAr: string;
  firstNameEn: string;
  middleNameEn: string;
  lastNameEn: string;
  phoneCountry: PhoneCountry;
  phone: string;
  academicStatus: AcademicStatus | '';
  universityId: string;
  majorId: string;
  subMajorId: string;
  trackId: string;
};

/**
 * Leadership corrects a member's names, phone and academic data (Sprint 17, Q-M8). The public sections of the profile
 * are not here on purpose: they belong to the member. Every change is audited by the database function.
 */
export function EditMemberDialog({
  memberId,
  initial,
  reference,
  canEditPhone,
}: {
  memberId: string;
  initial: EditMemberValues;
  reference: {
    universities: ReferenceOption[];
    majors: ReferenceOption[];
    tracks: ReferenceOption[];
  };
  /** Needs members.view_contact: the phone is contact data. */
  canEditPhone: boolean;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof EditMemberValues>(k: K, value: EditMemberValues[K]) => {
    setV((p) => ({ ...p, [k]: value }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };
  const name = (o: ReferenceOption) => (ar ? o.nameAr : o.nameEn || o.nameAr);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (!v.firstNameAr.trim())
      found.firstNameAr = L('اكتب الاسم الأول بالعربية.', 'Enter the first name in Arabic.');
    if (!v.lastNameAr.trim())
      found.lastNameAr = L('اكتب الاسم الأخير بالعربية.', 'Enter the last name in Arabic.');
    if (!v.academicStatus) found.academicStatus = L('اختر الحالة.', 'Choose the status.');
    const phone = v.phone ? toE164(v.phoneCountry, v.phone) : '';
    if (canEditPhone && v.phone && !phone)
      found.phone = L(
        'رقم الجوال غير صحيح لهذه الدولة.',
        'This phone number is not valid for the country.',
      );
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    startTransition(async () => {
      const r = await updateMemberByStaff(
        memberId,
        {
          firstNameAr: v.firstNameAr,
          middleNameAr: v.middleNameAr,
          lastNameAr: v.lastNameAr,
          firstNameEn: v.firstNameEn,
          middleNameEn: v.middleNameEn,
          lastNameEn: v.lastNameEn,
          ...(canEditPhone ? { phone: phone ?? '' } : {}),
          academicStatus: v.academicStatus as 'student',
          universityId: v.universityId,
          majorId: v.majorId,
          subMajorId: v.subMajorId,
          trackId: v.trackId,
        },
        { lang },
      );
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        toast.error(r.message);
        return;
      }
      toast.success(
        L('حُفظت البيانات. سُجّل التعديل في السجل.', 'Saved. The change is in the log.'),
      );
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          setV(initial);
          setErrors({});
          setOpen(true);
        }}
      >
        <Pencil size={16} aria-hidden="true" />
        {L('تعديل البيانات', 'Edit data')}
      </Button>
      <Dialog
        open={open}
        onClose={() => (pending ? undefined : setOpen(false))}
        title={L('تعديل بيانات العضو', 'Edit member data')}
        description={L(
          'الاسم والبيانات الأكاديمية فقط. العضو وحده يعدّل أقسام ملفه العام، ويُسجَّل كل تعديل.',
          'Name and academic data only. The member alone edits the public sections of the profile, and every change is logged.',
        )}
        presentation="sheet"
        size="md"
        closeLabel={L('إغلاق', 'Close')}
        busy={pending}
        className="max-h-[90dvh] overflow-y-auto"
      >
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <Field
                label={L('الاسم الأول (بالعربية)', 'First name (Arabic)')}
                value={v.firstNameAr}
                onChange={(e) => set('firstNameAr', e.target.value)}
                error={errors.firstNameAr}
                dir="rtl"
                maxLength={100}
              />
              <Field
                label={L('الاسم الأوسط (بالعربية)', 'Middle name (Arabic)')}
                value={v.middleNameAr}
                onChange={(e) => set('middleNameAr', e.target.value)}
                dir="rtl"
                maxLength={100}
              />
              <Field
                label={L('الاسم الأخير (بالعربية)', 'Last name (Arabic)')}
                value={v.lastNameAr}
                onChange={(e) => set('lastNameAr', e.target.value)}
                error={errors.lastNameAr}
                dir="rtl"
                maxLength={100}
              />
            </div>
            <div className="flex flex-col gap-4">
              <Field
                label="First name (English)"
                value={v.firstNameEn}
                onChange={(e) => set('firstNameEn', e.target.value)}
                dir="ltr"
                maxLength={100}
              />
              <Field
                label="Middle name (English)"
                value={v.middleNameEn}
                onChange={(e) => set('middleNameEn', e.target.value)}
                dir="ltr"
                maxLength={100}
              />
              <Field
                label="Last name (English)"
                value={v.lastNameEn}
                onChange={(e) => set('lastNameEn', e.target.value)}
                dir="ltr"
                maxLength={100}
              />
            </div>
          </div>
          {canEditPhone && (
            <PhoneField
              label={L('الجوال', 'Phone')}
              optionalLabel={L('اختياري', 'optional')}
              country={v.phoneCountry}
              onCountryChange={(c) => set('phoneCountry', c)}
              value={v.phone}
              onChange={(d) => set('phone', d)}
              lang={lang}
              countryLabel={L('رمز الدولة', 'Country calling code')}
              error={errors.phone}
            />
          )}
          <Chips
            label={L('الحالة', 'Status')}
            value={v.academicStatus}
            options={ACADEMIC_STATUSES.map((s) => ({ value: s, label: ACADEMIC_LABEL[s][lang] }))}
            onChange={(x) => set('academicStatus', x)}
            error={errors.academicStatus}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label={L('الجامعة', 'University')}
              value={v.universityId}
              onChange={(e) => set('universityId', e.target.value)}
            >
              <option value="">{L('—', '—')}</option>
              {reference.universities.map((o) => (
                <option key={o.id} value={o.id}>
                  {name(o)}
                </option>
              ))}
            </Select>
            <Select
              label={L('المسار', 'Track')}
              value={v.trackId}
              onChange={(e) => set('trackId', e.target.value)}
            >
              <option value="">{L('—', '—')}</option>
              {reference.tracks.map((o) => (
                <option key={o.id} value={o.id}>
                  {name(o)}
                </option>
              ))}
            </Select>
            <Select
              label={L('التخصص', 'Major')}
              value={v.majorId}
              onChange={(e) => {
                set('majorId', e.target.value);
                set('subMajorId', '');
              }}
            >
              <option value="">{L('—', '—')}</option>
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
              value={v.subMajorId}
              onChange={(e) => set('subMajorId', e.target.value)}
              disabled={!v.majorId}
            >
              <option value="">{L('—', '—')}</option>
              {reference.majors
                .filter((o) => o.parentId && String(o.parentId) === v.majorId)
                .map((o) => (
                  <option key={o.id} value={o.id}>
                    {name(o)}
                  </option>
                ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              {L('إلغاء', 'Cancel')}
            </Button>
            <Button type="submit" loading={pending}>
              {L('حفظ', 'Save')}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
