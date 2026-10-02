'use client';

import { Fragment, useState, useTransition } from 'react';
import { Alert, Badge, Button, Field } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import { saveReference, type ReferenceTable as Table } from '../actions';

export type ReferenceRow = {
  id: number;
  nameAr: string;
  nameEn: string | null;
  isActive: boolean;
  parentId: number | null;
  parentName?: string;
};

/** Inline add / rename / (de)activate. No delete: a value in use is deactivated, never removed. */
export function ReferenceTable({
  table,
  rows,
  parents,
}: {
  table: Table;
  rows: ReferenceRow[];
  /** Only for majors: the top-level majors a sub-major can belong to. */
  parents?: Array<{ id: number; name: string }>;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();
  const [editId, setEditId] = useState<number | 'new' | null>(null);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [parentId, setParentId] = useState('');
  const [error, setError] = useState('');
  const [busy, startTransition] = useTransition();

  const open = (r?: ReferenceRow) => {
    setEditId(r ? r.id : 'new');
    setNameAr(r?.nameAr ?? '');
    setNameEn(r?.nameEn ?? '');
    setParentId(r?.parentId ? String(r.parentId) : '');
    setError('');
  };

  const persist = (id: number | undefined, extra: { isActive?: boolean } = {}) => {
    setError('');
    startTransition(async () => {
      const r = await saveReference(
        {
          table,
          id,
          nameAr: id && editId !== id ? rows.find((x) => x.id === id)!.nameAr : nameAr,
          nameEn: id && editId !== id ? (rows.find((x) => x.id === id)!.nameEn ?? '') : nameEn,
          parentId: table === 'majors' ? (parentId ? Number(parentId) : null) : undefined,
          ...extra,
        },
        { lang },
      );
      if (!r.ok) {
        setError(r.message);
        return;
      }
      setEditId(null);
      router.refresh();
    });
  };

  const form = (
    <tr className="border-b border-line bg-surface-raised">
      <td className="px-4 py-3" colSpan={table === 'majors' ? 2 : 1}>
        <div className="flex flex-wrap items-end gap-3">
          <Field
            label={ar ? 'الاسم (عربي)' : 'Name (Arabic)'}
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
          />
          <Field
            label={ar ? 'الاسم (إنجليزي)' : 'Name (English)'}
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            dir="ltr"
          />
          {table === 'majors' && parents && (
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {ar ? 'تخصص رئيسي (للتخصص الدقيق)' : 'Parent major (for a sub-major)'}
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="min-h-11 rounded-xl border border-line bg-surface-raised px-3"
              >
                <option value="">{ar ? '— تخصص رئيسي —' : '— top-level major —'}</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </td>
      <td className="px-4 py-3" colSpan={2}>
        <div className="flex gap-2">
          <Button
            onClick={() => persist(editId === 'new' ? undefined : (editId as number))}
            loading={busy}
          >
            {ar ? 'حفظ' : 'Save'}
          </Button>
          <Button variant="ghost" onClick={() => setEditId(null)} disabled={busy}>
            {ar ? 'إلغاء' : 'Cancel'}
          </Button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="flex flex-col gap-3">
      {error && <Alert tone="danger">{error}</Alert>}
      <div>
        <Button variant="secondary" onClick={() => open()} disabled={editId !== null}>
          {ar ? '+ إضافة' : '+ Add'}
        </Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-line text-xs text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                {ar ? 'الاسم' : 'Name'}
              </th>
              {table === 'majors' && (
                <th scope="col" className="px-4 py-3 text-start font-medium">
                  {ar ? 'تخصص رئيسي' : 'Parent'}
                </th>
              )}
              <th scope="col" className="px-4 py-3 text-start font-medium">
                {ar ? 'الحالة' : 'Status'}
              </th>
              <th scope="col" className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {editId === 'new' && form}
            {rows.map((r) =>
              editId === r.id ? (
                <Fragment key={r.id}>{form}</Fragment>
              ) : (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.nameAr}</p>
                    {r.nameEn && (
                      <p className="text-xs text-muted" dir="ltr">
                        {r.nameEn}
                      </p>
                    )}
                  </td>
                  {table === 'majors' && (
                    <td className="px-4 py-3 text-muted">{r.parentName ?? '—'}</td>
                  )}
                  <td className="px-4 py-3">
                    <Badge tone={r.isActive ? 'accent' : 'neutral'}>
                      {r.isActive ? (ar ? 'فعّال' : 'Active') : ar ? 'معطّل' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        className="min-h-9 px-3 text-xs"
                        onClick={() => open(r)}
                        disabled={editId !== null || busy}
                      >
                        {ar ? 'تعديل' : 'Edit'}
                      </Button>
                      <Button
                        variant="ghost"
                        className="min-h-9 px-3 text-xs"
                        onClick={() => persist(r.id, { isActive: !r.isActive })}
                        disabled={editId !== null || busy}
                      >
                        {r.isActive ? (ar ? 'تعطيل' : 'Deactivate') : ar ? 'تفعيل' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
