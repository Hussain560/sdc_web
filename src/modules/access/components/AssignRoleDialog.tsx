'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Alert, Button, Dialog, Field, Select, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { assignRole, handoverHead, searchUsers } from '../actions';
import type { CommitteeOption, RoleOption } from '../admin-queries';
import type { Localized } from '../types';

type Picked = { id: string; name: string; email: string };

const empty = {
  roleKey: '',
  committeeId: '',
  startsAt: '',
  endsAt: '',
  titleAr: '',
  titleEn: '',
  bioAr: '',
  bioEn: '',
  tagsAr: '',
  tagsEn: '',
};

/**
 * "Assign position" dialog (INTERNAL-SCREENS/23 §1.3). The role list is already limited to what the actor may
 * grant; the permission preview shows the consequence of the choice. The database re-checks everything.
 */
export function AssignRoleDialog({
  roles,
  committees,
  permissionLabels,
  canHandover,
  fixedCommitteeId,
}: {
  roles: RoleOption[];
  committees: CommitteeOption[];
  permissionLabels: Record<string, Localized>;
  canHandover: boolean;
  /** On a committee page the position is always for that committee. */
  fixedCommitteeId?: string;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState({ ...empty, committeeId: fixedCommitteeId ?? '' });
  const [user, setUser] = useState<Picked | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Picked[]>([]);
  const toast = useToast();
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const role = roles.find((r) => r.key === values.roleKey);
  const isPublicRole =
    role &&
    ['founder', 'community_leader', 'advisor', 'committee_head', 'committee_deputy'].includes(
      role.key,
    );

  useEffect(() => {
    if (query.trim().length < 2 || user) return;
    timer.current = setTimeout(async () => setResults(await searchUsers(query)), 250);
    return () => clearTimeout(timer.current);
  }, [query, user]);
  const visibleResults = query.trim().length < 2 || user ? [] : results;

  const reset = () => {
    setValues({ ...empty, committeeId: fixedCommitteeId ?? '' });
    setUser(null);
    setQuery('');
    setResults([]);
    setError(null);
    setFieldErrors({});
  };

  const payload = () => ({ userId: user?.id ?? '', ...values });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await assignRole(payload(), { lang });
      if (!result.ok) {
        // The head conflict keeps an inline panel instead: it carries the "hand over" action.
        if (result.code === 'HEAD_ALREADY_ACTIVE')
          setError({ code: result.code, message: result.message });
        else toast.error(result.message);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      toast.success(ar ? 'تم تعيين المنصب.' : 'Position assigned.');
      setOpen(false);
      reset();
      router.refresh();
    });
  };

  const handover = () => {
    setError(null);
    startTransition(async () => {
      const result = await handoverHead(
        {
          committeeId: values.committeeId,
          newHeadUserId: user?.id ?? '',
          handoverAt: values.startsAt,
        },
        { lang },
      );
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(ar ? 'تم تسليم القيادة.' : 'Leadership handed over.');
      setOpen(false);
      reset();
      router.refresh();
    });
  };

  const set =
    (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues({ ...values, [key]: e.target.value });

  return (
    <>
      <Button onClick={() => setOpen(true)}>{ar ? '+ تعيين منصب' : '+ Assign position'}</Button>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title={ar ? 'تعيين منصب' : 'Assign position'}
        className="max-h-[90dvh] overflow-y-auto"
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="assign-user" className="text-sm font-medium">
              {ar ? 'المستخدم' : 'User'} *
            </label>
            {user ? (
              <div className="flex items-center justify-between rounded-xl border border-line bg-surface-raised px-3 py-2">
                <span>
                  {user.name}{' '}
                  <span dir="ltr" className="text-xs text-muted">
                    {user.email}
                  </span>
                </span>
                <button type="button" className="text-sm text-accent" onClick={() => setUser(null)}>
                  {ar ? 'تغيير' : 'Change'}
                </button>
              </div>
            ) : (
              <>
                <input
                  id="assign-user"
                  role="combobox"
                  aria-expanded={visibleResults.length > 0}
                  aria-controls="assign-user-results"
                  autoComplete="off"
                  className="min-h-11 rounded-xl border border-line bg-surface-raised px-3 text-text"
                  placeholder={ar ? 'ابحث بالاسم أو البريد…' : 'Search by name or e-mail…'}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {visibleResults.length > 0 && (
                  <ul
                    id="assign-user-results"
                    role="listbox"
                    className="rounded-xl border border-line bg-surface"
                  >
                    {visibleResults.map((r) => (
                      <li key={r.id} role="option" aria-selected="false">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between px-3 py-2 text-start hover:bg-surface-raised"
                          onClick={() => {
                            setUser(r);
                            setResults([]);
                          }}
                        >
                          <span>{r.name}</span>
                          <span dir="ltr" className="text-xs text-muted">
                            {r.email}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
            {fieldErrors.userId && (
              <p role="alert" className="text-xs text-danger">
                {ar ? 'اختر مستخدمًا.' : 'Pick a user.'}
              </p>
            )}
          </div>

          <Select
            label={`${ar ? 'الدور' : 'Role'} *`}
            value={values.roleKey}
            onChange={set('roleKey')}
            required
          >
            <option value="">{ar ? 'اختر…' : 'Choose…'}</option>
            {roles.map((r) => (
              <option key={r.key} value={r.key}>
                {r.name[lang]}
              </option>
            ))}
          </Select>

          {role?.scope === 'committee' && (
            <Select
              label={`${ar ? 'اللجنة' : 'Committee'} *`}
              value={values.committeeId}
              onChange={set('committeeId')}
              disabled={!!fixedCommitteeId}
              required
            >
              <option value="">{ar ? 'اختر…' : 'Choose…'}</option>
              {committees
                .filter((c) => c.status === 'active')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name[lang]}
                  </option>
                ))}
            </Select>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field
              type="date"
              label={ar ? 'من' : 'From'}
              value={values.startsAt}
              onChange={set('startsAt')}
            />
            <Field
              type="date"
              label={ar ? 'إلى' : 'To'}
              value={values.endsAt}
              onChange={set('endsAt')}
            />
          </div>

          {isPublicRole && (
            <fieldset className="flex flex-col gap-3 rounded-xl border border-line p-3">
              <legend className="px-1 text-sm font-medium">
                {ar ? 'العرض في صفحة القيادة (اختياري)' : 'Public leadership card (optional)'}
              </legend>
              <Field
                label={ar ? 'اللقب (عربي)' : 'Title (Arabic)'}
                value={values.titleAr}
                onChange={set('titleAr')}
              />
              <Field
                label={ar ? 'اللقب (إنجليزي)' : 'Title (English)'}
                dir="ltr"
                value={values.titleEn}
                onChange={set('titleEn')}
              />
              <Field
                label={ar ? 'نبذة (عربي)' : 'Short bio (Arabic)'}
                value={values.bioAr}
                onChange={set('bioAr')}
              />
              <Field
                label={ar ? 'نبذة (إنجليزي)' : 'Short bio (English)'}
                dir="ltr"
                value={values.bioEn}
                onChange={set('bioEn')}
              />
              <Field
                label={ar ? 'وسوم (حتى 3، مفصولة بفاصلة)' : 'Tags (up to 3, comma-separated)'}
                value={values.tagsAr}
                onChange={set('tagsAr')}
              />
              <Field
                label={ar ? 'وسوم إنجليزية' : 'English tags'}
                dir="ltr"
                value={values.tagsEn}
                onChange={set('tagsEn')}
              />
            </fieldset>
          )}

          {role && (
            <div className="rounded-xl border border-line p-3">
              <p className="mb-2 text-sm font-medium">
                {ar ? 'الصلاحيات التي سيحصل عليها' : 'Permissions it grants'}
              </p>
              <ul className="flex flex-wrap gap-2 text-xs text-muted">
                {role.permissions.map((p) => (
                  <li key={p} className="rounded-full border border-line px-2 py-0.5">
                    {permissionLabels[p]?.[lang] ?? p}
                  </li>
                ))}
                {role.permissions.length === 0 && <li>—</li>}
              </ul>
            </div>
          )}

          {error && (
            <Alert tone="danger">
              {error.message}
              {error.code === 'HEAD_ALREADY_ACTIVE' &&
                canHandover &&
                user &&
                values.committeeId && (
                  <div className="mt-2">
                    <Button type="button" variant="secondary" loading={pending} onClick={handover}>
                      {ar ? 'تسليم القيادة لهذا الشخص' : 'Hand over to this person'}
                    </Button>
                  </div>
                )}
            </Alert>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              {ar ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              loading={pending}
              disabledReason={
                !user ? (ar ? 'اختر مستخدمًا أولًا' : 'Pick a user first') : undefined
              }
            >
              {ar ? 'تعيين' : 'Assign'}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
