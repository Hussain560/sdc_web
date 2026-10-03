'use client';

import { useState, useTransition } from 'react';
import { Button, Field, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import { deleteTag, saveTag } from '../actions';
import type { TagRow } from '../queries';

/** Tag vocabulary for threads. Tags are created while writing a thread; here they are renamed or, when unused, removed. */
export function TagsTable({ rows }: { rows: TagRow[] }) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();
  const toast = useToast();
  const [busy, startTransition] = useTransition();
  const [editId, setEditId] = useState<string | null>(null);
  const [labelAr, setLabelAr] = useState('');
  const [labelEn, setLabelEn] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const save = (id: string) =>
    startTransition(async () => {
      const r = await saveTag({ id, labelAr, labelEn }, { lang });
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        toast.error(r.message);
        return;
      }
      toast.success(ar ? 'تم الحفظ.' : 'Saved.');
      setEditId(null);
      router.refresh();
    });

  const remove = (id: string) =>
    startTransition(async () => {
      const r = await deleteTag(id, { lang });
      setConfirmId(null);
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      toast.success(ar ? 'تم حذف الوسم.' : 'Tag deleted.');
      router.refresh();
    });

  if (rows.length === 0)
    return (
      <p className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">
        {ar
          ? 'لا توجد وسوم بعد. تُنشأ الوسوم عند كتابة المقالات.'
          : 'No tags yet. Tags are created while writing threads.'}
      </p>
    );

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="border-b border-line text-xs text-muted">
          <tr>
            <th scope="col" className="px-4 py-3 text-start font-medium">
              {ar ? 'الوسم' : 'Tag'}
            </th>
            <th scope="col" className="px-4 py-3 text-start font-medium">
              {ar ? 'الاستخدام' : 'Uses'}
            </th>
            <th scope="col" className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((t) =>
            editId === t.id ? (
              <tr key={t.id} className="border-b border-line bg-surface-raised">
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-end gap-3">
                    <Field
                      label={ar ? 'الاسم (عربي)' : 'Name (Arabic)'}
                      value={labelAr}
                      onChange={(e) => setLabelAr(e.target.value)}
                      error={errors.labelAr}
                    />
                    <Field
                      label={ar ? 'الاسم (إنجليزي)' : 'Name (English)'}
                      value={labelEn}
                      onChange={(e) => setLabelEn(e.target.value)}
                      error={errors.labelEn}
                      dir="ltr"
                    />
                  </div>
                </td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button onClick={() => save(t.id)} loading={busy}>
                      {ar ? 'حفظ' : 'Save'}
                    </Button>
                    <Button variant="ghost" onClick={() => setEditId(null)} disabled={busy}>
                      {ar ? 'إلغاء' : 'Cancel'}
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={t.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{t.labelAr}</p>
                  <p className="text-xs text-muted" dir="ltr">
                    {t.labelEn ? `${t.labelEn} · ` : ''}
                    {t.slug}
                  </p>
                </td>
                <td className="px-4 py-3 tabular-nums">{t.uses}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      className="min-h-9 px-3 text-xs"
                      onClick={() => {
                        setEditId(t.id);
                        setLabelAr(t.labelAr);
                        setLabelEn(t.labelEn ?? '');
                        setErrors({});
                      }}
                      disabled={editId !== null || busy}
                    >
                      {ar ? 'تعديل' : 'Edit'}
                    </Button>
                    {confirmId === t.id ? (
                      <Button
                        variant="danger"
                        className="min-h-9 px-3 text-xs"
                        onClick={() => remove(t.id)}
                        loading={busy}
                      >
                        {ar ? 'تأكيد الحذف' : 'Confirm delete'}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        className="min-h-9 px-3 text-xs"
                        onClick={() => setConfirmId(t.id)}
                        disabled={t.uses > 0 || editId !== null || busy}
                        disabledReason={
                          t.uses > 0
                            ? ar
                              ? 'الوسم مستخدم في مقالات'
                              : 'The tag is used by threads'
                            : undefined
                        }
                      >
                        {ar ? 'حذف' : 'Delete'}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}
