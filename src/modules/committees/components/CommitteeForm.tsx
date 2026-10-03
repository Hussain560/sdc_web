'use client';

import { useState, useTransition } from 'react';
import { Button, Dialog, Field, Textarea, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import { saveCommittee, type CommitteeInput } from '../actions';
import type { CommitteeDetail } from '../queries';

const EMPTY: CommitteeInput = {
  slug: '',
  nameAr: '',
  nameEn: '',
  descriptionAr: '',
  descriptionEn: '',
  contactEmail: '',
  displayOrder: '0',
};

const fromDetail = (c: CommitteeDetail): CommitteeInput => ({
  slug: c.slug,
  nameAr: c.nameAr,
  nameEn: c.nameEn ?? '',
  descriptionAr: c.descriptionAr ?? '',
  descriptionEn: c.descriptionEn ?? '',
  contactEmail: c.contactEmail ?? '',
  displayOrder: String(c.displayOrder),
});

/** Create (no `committee`) or edit one committee in a dialog. The slug is chosen once and then fixed (CM-1). */
export function CommitteeForm({
  committee,
  trigger,
}: {
  committee?: CommitteeDetail;
  trigger: 'create' | 'edit';
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<CommitteeInput>(committee ? fromDetail(committee) : EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const set = (patch: Partial<CommitteeInput>) => {
    setValues((v) => ({ ...v, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(patch)) delete next[k];
      return next;
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const r = await saveCommittee(
        { id: committee?.id, values: committee ? { ...values, slug: undefined } : values },
        { lang },
      );
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        toast.error(r.message);
        return;
      }
      toast.success(
        committee
          ? L('تم حفظ اللجنة.', 'Committee saved.')
          : L('أُنشئت اللجنة.', 'Committee created.'),
      );
      setOpen(false);
      if (!committee) {
        setValues(EMPTY);
        router.push(`/dashboard/committees/${r.data.id}`);
      } else router.refresh();
    });
  };

  return (
    <>
      {trigger === 'create' ? (
        <Button onClick={() => setOpen(true)}>{L('+ لجنة جديدة', '+ New committee')}</Button>
      ) : (
        <Button variant="secondary" onClick={() => setOpen(true)}>
          {L('تعديل', 'Edit')}
        </Button>
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={committee ? L('تعديل اللجنة', 'Edit committee') : L('لجنة جديدة', 'New committee')}
        className="w-[min(40rem,calc(100vw-2rem))]"
      >
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={L('الاسم بالعربية *', 'Name (Arabic) *')}
              value={values.nameAr}
              maxLength={100}
              dir="rtl"
              onChange={(e) => set({ nameAr: e.target.value })}
              error={errors.nameAr}
              required
            />
            <Field
              label="Name (English)"
              value={values.nameEn}
              maxLength={100}
              dir="ltr"
              onChange={(e) => set({ nameEn: e.target.value })}
              error={errors.nameEn}
            />
          </div>
          <Field
            label={L('الرابط المختصر *', 'Slug *')}
            value={values.slug ?? ''}
            dir="ltr"
            disabled={!!committee}
            placeholder="data-science"
            onChange={(e) => set({ slug: e.target.value.toLowerCase() })}
            error={errors.slug}
            hint={
              committee
                ? L('ثابت بعد الإنشاء.', 'Fixed after creation.')
                : L(
                    'حروف إنجليزية صغيرة وأرقام وشرطات. لا يتغير لاحقًا.',
                    'Lowercase letters, numbers and dashes. It cannot change later.',
                  )
            }
            required={!committee}
          />
          <Textarea
            label={L('الوصف بالعربية', 'Description (Arabic)')}
            value={values.descriptionAr}
            maxLength={2000}
            counter
            dir="rtl"
            onChange={(e) => set({ descriptionAr: e.target.value })}
            error={errors.descriptionAr}
          />
          <Textarea
            label="Description (English)"
            value={values.descriptionEn}
            maxLength={2000}
            counter
            dir="ltr"
            onChange={(e) => set({ descriptionEn: e.target.value })}
            error={errors.descriptionEn}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={L('بريد اللجنة', 'Committee e-mail')}
              type="email"
              value={values.contactEmail}
              dir="ltr"
              onChange={(e) => set({ contactEmail: e.target.value })}
              error={errors.contactEmail}
            />
            <Field
              label={L('الترتيب', 'Order')}
              type="number"
              min={0}
              max={999}
              value={values.displayOrder}
              onChange={(e) => set({ displayOrder: e.target.value })}
              error={errors.displayOrder}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              {L('إلغاء', 'Cancel')}
            </Button>
            <Button type="submit" loading={pending}>
              {committee ? L('حفظ', 'Save') : L('إنشاء', 'Create')}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
