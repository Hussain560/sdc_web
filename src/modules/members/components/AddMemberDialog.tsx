'use client';

import { UserPlus } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Button, Chips, Dialog, Field, Select, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import {
  ACADEMIC_LABEL,
  ACADEMIC_STATUSES,
  type ReferenceOption,
} from '@/modules/membership/types';
import { createMember } from '../actions';

type Reference = {
  universities: ReferenceOption[];
  majors: ReferenceOption[];
  tracks: ReferenceOption[];
};

const empty = {
  fullNameAr: '',
  fullNameEn: '',
  email: '',
  academicStatus: '',
  universityId: '',
  majorId: '',
  trackId: '',
};

/**
 * Add a member directly (leadership). The member receives an e-mail with the link to activate their account, like a
 * member accepted from an application. Validation messages come from the server so the rules live in one place.
 */
export function AddMemberDialog({ reference }: { reference: Reference }) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, startTransition] = useTransition();
  const set = (k: keyof typeof empty, value: string) => {
    setV((p) => ({ ...p, [k]: value }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };
  const name = (o: ReferenceOption) => (ar ? o.nameAr : o.nameEn || o.nameAr);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (v.fullNameAr.trim().length < 3)
      found.fullNameAr = L('اكتب الاسم الكامل.', 'Enter the full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim()))
      found.email = L('اكتب بريدًا إلكترونيًا صحيحًا.', 'Enter a valid e-mail address.');
    if (!v.academicStatus) found.academicStatus = L('اختر الحالة.', 'Choose the status.');
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    startTransition(async () => {
      const r = await createMember(
        { ...v, academicStatus: v.academicStatus as 'student' },
        { lang },
      );
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        toast.error(r.message);
        return;
      }
      toast.success(
        r.data.activationSent
          ? L(
              'أُضيف العضو وأُرسل إليه رابط تفعيل الحساب.',
              'Member added; the activation link was e-mailed.',
            )
          : L('أُضيف العضو وأُبلغ بالبريد.', 'Member added and notified by e-mail.'),
      );
      setOpen(false);
      setV(empty);
      router.refresh();
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus size={16} aria-hidden="true" />
        {L('إضافة عضو', 'Add member')}
      </Button>
      <Dialog
        open={open}
        onClose={() => (busy ? undefined : setOpen(false))}
        title={L('إضافة عضو', 'Add a member')}
        className="w-[min(36rem,calc(100vw-2rem))]"
      >
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            {L(
              'سيصل العضو بريد فيه رابط لاختيار كلمة المرور وتفعيل حسابه.',
              'The member gets an e-mail with a link to choose a password and activate the account.',
            )}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={L('الاسم بالعربية *', 'Name in Arabic *')}
              value={v.fullNameAr}
              onChange={(e) => set('fullNameAr', e.target.value)}
              error={errors.fullNameAr}
              maxLength={100}
              disabled={busy}
            />
            <Field
              label={L('الاسم بالإنجليزية', 'Name in English')}
              value={v.fullNameEn}
              onChange={(e) => set('fullNameEn', e.target.value)}
              dir="ltr"
              maxLength={100}
              disabled={busy}
            />
          </div>
          <Field
            label={L('البريد الإلكتروني *', 'E-mail *')}
            type="email"
            value={v.email}
            onChange={(e) => set('email', e.target.value)}
            error={errors.email}
            dir="ltr"
            maxLength={160}
            disabled={busy}
          />
          <Chips
            label={L('الحالة *', 'Status *')}
            value={v.academicStatus}
            options={ACADEMIC_STATUSES.map((s) => ({ value: s, label: ACADEMIC_LABEL[s][lang] }))}
            onChange={(x) => set('academicStatus', x)}
            error={errors.academicStatus}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label={L('الجامعة', 'University')}
              value={v.universityId}
              onChange={(e) => set('universityId', e.target.value)}
              disabled={busy}
            >
              <option value="">{L('—', '—')}</option>
              {reference.universities.map((o) => (
                <option key={o.id} value={o.id}>
                  {name(o)}
                </option>
              ))}
            </Select>
            <Select
              label={L('التخصص', 'Major')}
              value={v.majorId}
              onChange={(e) => set('majorId', e.target.value)}
              disabled={busy}
            >
              <option value="">{L('—', '—')}</option>
              {reference.majors
                .filter((m) => !m.parentId)
                .map((o) => (
                  <option key={o.id} value={o.id}>
                    {name(o)}
                  </option>
                ))}
            </Select>
            <Select
              label={L('المسار', 'Track')}
              value={v.trackId}
              onChange={(e) => set('trackId', e.target.value)}
              disabled={busy}
            >
              <option value="">{L('—', '—')}</option>
              {reference.tracks.map((o) => (
                <option key={o.id} value={o.id}>
                  {name(o)}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              {L('إلغاء', 'Cancel')}
            </Button>
            <Button type="submit" loading={busy}>
              {L('إضافة العضو', 'Add member')}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
