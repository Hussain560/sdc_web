'use client';

import { useState, useTransition } from 'react';
import { Badge, Button, Card, Field, Switch, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import { deletePartner, savePartner, type PartnerInput } from '../actions';
import type { PartnerRow } from '../queries';

const empty: PartnerInput = {
  nameAr: '',
  nameEn: '',
  logoUrl: '',
  websiteUrl: '',
  displayOrder: '0',
  isActive: true,
};

/** Partners strip on the home page (PUB-001). The strip is hidden while no partner is active. */
export function PartnersManager({ rows }: { rows: PartnerRow[] }) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();
  const toast = useToast();
  const [busy, startTransition] = useTransition();
  const [editId, setEditId] = useState<string | 'new' | null>(null);
  const [v, setV] = useState<PartnerInput>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const open = (r?: PartnerRow) => {
    setEditId(r ? r.id : 'new');
    setErrors({});
    setV(
      r
        ? {
            nameAr: r.nameAr,
            nameEn: r.nameEn ?? '',
            logoUrl: r.logoUrl ?? '',
            websiteUrl: r.websiteUrl ?? '',
            displayOrder: String(r.displayOrder),
            isActive: r.isActive,
          }
        : empty,
    );
  };
  const set = <K extends keyof PartnerInput>(k: K, value: PartnerInput[K]) => {
    setV((p) => ({ ...p, [k]: value }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const save = () =>
    startTransition(async () => {
      const r = await savePartner(
        { id: editId === 'new' ? undefined : (editId ?? undefined), values: v },
        { lang },
      );
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        toast.error(r.message);
        return;
      }
      toast.success(ar ? 'تم حفظ الشريك.' : 'Partner saved.');
      setEditId(null);
      router.refresh();
    });

  const remove = (id: string) =>
    startTransition(async () => {
      const r = await deletePartner(id, { lang });
      setConfirmId(null);
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      toast.success(ar ? 'تم حذف الشريك.' : 'Partner deleted.');
      router.refresh();
    });

  const active = rows.filter((r) => r.isActive).length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        {active === 0
          ? ar
            ? 'لا يوجد شركاء فعّالون: قسم الشركاء مخفي في الصفحة الرئيسية.'
            : 'No active partners: the partners section is hidden on the home page.'
          : ar
            ? `${active} شريك ظاهر في الصفحة الرئيسية.`
            : `${active} partners shown on the home page.`}
      </p>

      {editId && (
        <Card className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label={ar ? 'الاسم (عربي)' : 'Name (Arabic)'}
              value={v.nameAr}
              onChange={(e) => set('nameAr', e.target.value)}
              error={errors.nameAr}
            />
            <Field
              label={ar ? 'الاسم (إنجليزي)' : 'Name (English)'}
              value={v.nameEn}
              onChange={(e) => set('nameEn', e.target.value)}
              error={errors.nameEn}
              dir="ltr"
            />
            <Field
              label={ar ? 'رابط الشعار' : 'Logo link'}
              value={v.logoUrl}
              onChange={(e) => set('logoUrl', e.target.value)}
              error={errors.logoUrl}
              hint={ar ? 'https:// — اختياري.' : 'https:// — optional.'}
              dir="ltr"
            />
            <Field
              label={ar ? 'رابط الموقع' : 'Website link'}
              value={v.websiteUrl}
              onChange={(e) => set('websiteUrl', e.target.value)}
              error={errors.websiteUrl}
              hint={ar ? 'https:// — اختياري.' : 'https:// — optional.'}
              dir="ltr"
            />
            <Field
              label={ar ? 'الترتيب' : 'Order'}
              value={v.displayOrder}
              onChange={(e) => set('displayOrder', e.target.value)}
              error={errors.displayOrder}
              inputMode="numeric"
              dir="ltr"
            />
          </div>
          <Switch
            checked={v.isActive}
            onChange={(c) => set('isActive', c)}
            label={ar ? 'ظاهر في الصفحة الرئيسية' : 'Shown on the home page'}
          />
          <div className="flex gap-2">
            <Button onClick={save} loading={busy}>
              {ar ? 'حفظ' : 'Save'}
            </Button>
            <Button variant="ghost" onClick={() => setEditId(null)} disabled={busy}>
              {ar ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>
        </Card>
      )}

      <div>
        <Button variant="secondary" onClick={() => open()} disabled={editId !== null}>
          {ar ? '+ إضافة شريك' : '+ Add partner'}
        </Button>
      </div>

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-shape-xl border border-line bg-surface">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 text-start font-medium">
                  {ar ? 'الشريك' : 'Partner'}
                </th>
                <th scope="col" className="px-4 py-3 text-start font-medium">
                  {ar ? 'الترتيب' : 'Order'}
                </th>
                <th scope="col" className="px-4 py-3 text-start font-medium">
                  {ar ? 'الحالة' : 'Status'}
                </th>
                <th scope="col" className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.nameAr}</p>
                    {r.nameEn && (
                      <p className="text-xs text-muted" dir="ltr">
                        {r.nameEn}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{r.displayOrder}</td>
                  <td className="px-4 py-3">
                    <Badge tone={r.isActive ? 'accent' : 'neutral'}>
                      {r.isActive ? (ar ? 'ظاهر' : 'Shown') : ar ? 'مخفي' : 'Hidden'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        className="min-h-9 px-3 text-xs"
                        onClick={() => open(r)}
                        disabled={editId !== null || busy}
                      >
                        {ar ? 'تعديل' : 'Edit'}
                      </Button>
                      {confirmId === r.id ? (
                        <>
                          <Button
                            variant="danger"
                            className="min-h-9 px-3 text-xs"
                            onClick={() => remove(r.id)}
                            loading={busy}
                          >
                            {ar ? 'تأكيد الحذف' : 'Confirm delete'}
                          </Button>
                          <Button
                            variant="ghost"
                            className="min-h-9 px-3 text-xs"
                            onClick={() => setConfirmId(null)}
                            disabled={busy}
                          >
                            {ar ? 'إلغاء' : 'Cancel'}
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          className="min-h-9 px-3 text-xs"
                          onClick={() => setConfirmId(r.id)}
                          disabled={editId !== null || busy}
                        >
                          {ar ? 'حذف' : 'Delete'}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
