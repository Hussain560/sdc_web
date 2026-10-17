'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Combobox,
  Dialog,
  Field,
  Select,
  useToast,
  type ComboOption,
  type ComboStatus,
} from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { Link, useRouter } from '@/i18n/navigation';
import { memberThumbUrl } from '@/modules/members/photo-url';
import {
  assignRole,
  handoverHead,
  searchAssignableUsers,
  type AssignableSearch,
  type AssignableUser,
} from '../actions';
import type { CommitteeOption, RoleOption } from '../admin-queries';
import type { Localized } from '../types';

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

type Head = { nameAr: string; nameEn: string | null };

/**
 * "Assign position" dialog (INTERNAL-SCREENS/23 §1.3, Sprint 17 design). The person picker searches members by every
 * name part in both languages and always answers: hint, loading, results grouped by committee, nobody found, an error
 * with a retry, or "you can only search your committee". The role list is already limited to what the actor may
 * grant; the permission preview shows the consequence of the choice. The database re-checks everything.
 */
export function AssignRoleDialog({
  roles,
  committees,
  permissionLabels,
  canHandover,
  fixedCommitteeId,
  addMemberHref,
  presetUser,
}: {
  roles: RoleOption[];
  committees: CommitteeOption[];
  permissionLabels: Record<string, Localized>;
  canHandover: boolean;
  /** On a committee page the position is always for that committee. */
  fixedCommitteeId?: string;
  /** Where "add them as a new member" leads, for people who may add members. Omit to hide the link. */
  addMemberHref?: string;
  /** The person is already chosen (the dialog opens from their own page). */
  presetUser?: AssignableUser;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState({ ...empty, committeeId: fixedCommitteeId ?? '' });
  const [picked, setPicked] = useState<AssignableUser | null>(presetUser ?? null);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<{
    status: ComboStatus;
    data: AssignableSearch | null;
  }>({ status: 'idle', data: null });
  const [retries, setRetries] = useState(0);
  const [headState, setHeadState] = useState<{ committeeId: string; head: Head | null } | null>(
    null,
  );
  const [keepAsDeputy, setKeepAsDeputy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const requestId = useRef(0);

  const role = roles.find((r) => r.key === values.roleKey);
  const isPublicRole =
    role &&
    ['founder', 'community_leader', 'advisor', 'committee_head', 'committee_deputy'].includes(
      role.key,
    );
  const committeeId = values.committeeId || undefined;
  const searchCommittee = fixedCommitteeId ?? committeeId;

  // Debounced search. State is only set from the timer and the answer, never synchronously in the effect.
  useEffect(() => {
    if (!open || picked || query.trim().length < 2) return;
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      setSearch((s) => ({ ...s, status: 'loading' }));
      try {
        const r = await searchAssignableUsers(query.trim(), searchCommittee);
        if (id !== requestId.current) return;
        if (!r.ok) setSearch({ status: 'error', data: null });
        else setSearch({ status: r.data.restricted ? 'restricted' : 'ready', data: r.data });
      } catch {
        if (id === requestId.current) setSearch({ status: 'error', data: null });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [open, picked, query, searchCommittee, retries]);

  // Who leads the committee now, so choosing "committee head" can warn before saving.
  useEffect(() => {
    if (!open || role?.key !== 'committee_head' || !committeeId) return;
    let live = true;
    void searchAssignableUsers('', committeeId).then((r) => {
      if (live && r.ok) setHeadState({ committeeId, head: r.data.head });
    });
    return () => {
      live = false;
    };
  }, [open, role?.key, committeeId]);

  const head =
    role?.key === 'committee_head' && committeeId && headState?.committeeId === committeeId
      ? headState.head
      : null;
  const headName = head ? (ar ? head.nameAr : (head.nameEn ?? head.nameAr)) : '';

  const reset = () => {
    setValues({ ...empty, committeeId: fixedCommitteeId ?? '' });
    setPicked(presetUser ?? null);
    setQuery('');
    setSearch({ status: 'idle', data: null });
    setKeepAsDeputy(false);
    setHeadState(null);
    setFieldErrors({});
  };
  const close = () => {
    setOpen(false);
    reset();
  };

  const nameOf = (u: AssignableUser) => (ar ? u.nameAr : (u.nameEn ?? u.nameAr));
  const otherName = (u: AssignableUser) => (ar ? u.nameEn : u.nameAr);

  const options: ComboOption[] = useMemo(
    () =>
      (search.data?.rows ?? []).map((u) => ({
        id: u.userId,
        label: nameOf(u),
        sublabel: u.email ?? otherName(u) ?? undefined,
        avatar: { name: nameOf(u), src: memberThumbUrl(u.photoPath) },
        badge: !u.activated
          ? { text: L('لم يُفعَّل الحساب', 'Not activated'), tone: 'info' as const }
          : u.inCommittee && (u.roleAr || u.roleEn)
            ? { text: (ar ? u.roleAr : u.roleEn) ?? '', tone: 'accent' as const }
            : undefined,
        group: searchCommittee
          ? u.inCommittee
            ? L('أعضاء هذه اللجنة', 'Members of this committee')
            : L('أعضاء آخرون', 'Other members')
          : undefined,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [search.data, ar, searchCommittee],
  );

  const comboStatus: ComboStatus = query.trim().length < 2 ? 'idle' : search.status;
  const selectedOption: ComboOption | null = picked
    ? {
        id: picked.userId,
        label: nameOf(picked),
        sublabel: picked.email ?? otherName(picked) ?? undefined,
        avatar: { name: nameOf(picked), src: memberThumbUrl(picked.photoPath) },
      }
    : null;

  const base = () => ({ userId: picked?.userId ?? '', ...values });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      // A current head and the right to hand over: saving is the handover (the old term ends on the start date).
      const result =
        head && canHandover
          ? await handoverHead(
              {
                committeeId: values.committeeId,
                newHeadUserId: picked?.userId ?? '',
                handoverAt: values.startsAt,
                keepAsDeputy,
              },
              { lang },
            )
          : await assignRole(base(), { lang });
      if (!result.ok) {
        toast.error(result.message);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      toast.success(
        head && canHandover
          ? L('تم تسليم القيادة.', 'Leadership handed over.')
          : L('تم تعيين المنصب.', 'Position assigned.'),
      );
      close();
      router.refresh();
    });
  };

  const set =
    (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues({ ...values, [key]: e.target.value });

  const committeeName = fixedCommitteeId
    ? committees.find((c) => c.id === fixedCommitteeId)?.name[lang]
    : undefined;
  const retry = useCallback(() => setRetries((n) => n + 1), []);

  return (
    <>
      <Button onClick={() => setOpen(true)}>{L('+ تعيين منصب', '+ Assign position')}</Button>
      <Dialog
        open={open}
        onClose={close}
        title={L('تعيين منصب', 'Assign position')}
        description={committeeName}
        presentation="sheet"
        closeLabel={L('إغلاق', 'Close')}
        className="max-h-[90dvh] overflow-y-auto"
      >
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Combobox
            label={L('العضو', 'Member')}
            requiredLabel={L('مطلوب', 'required')}
            placeholder={L('اكتب أي جزء من الاسم أو البريد', 'Type any part of the name or e-mail')}
            query={query}
            onQueryChange={setQuery}
            options={options}
            status={comboStatus}
            selected={selectedOption}
            onSelect={(o) => {
              const u = search.data?.rows.find((r) => r.userId === o.id);
              if (u) setPicked(u);
            }}
            onClear={() => {
              setPicked(null);
              setQuery('');
            }}
            onRetry={retry}
            emptyAction={
              addMemberHref ? (
                <Link
                  href={addMemberHref}
                  className="t-body-sm font-semibold text-accent-text underline"
                >
                  {L('لم تجده؟ أضفه عضواً جديداً', 'Not there? Add them as a new member')}
                </Link>
              ) : undefined
            }
            texts={{
              hint: L(
                'اكتب حرفين على الأقل. نبحث بالاسم الأول والأوسط والأخير باللغتين وبالبريد.',
                'Type at least two letters. We search the first, middle and last name in both languages, and the e-mail.',
              ),
              loading: L('جارٍ البحث…', 'Searching…'),
              noResults: L('لا أحد بهذا الاسم أو البريد', 'Nobody with this name or e-mail'),
              noResultsHint: L(
                'جرّب جزءاً آخر من الاسم، أو اسمه بالإنجليزية.',
                'Try another part of the name, or the name in English.',
              ),
              error: L('تعذّر البحث الآن.', 'Search is unavailable right now.'),
              retry: L('إعادة المحاولة', 'Try again'),
              restricted: L(
                'لا تملك صلاحية البحث في كل المستخدمين (users.view). تستطيع اختيار أعضاء لجنتك فقط.',
                'You cannot search every user (users.view). You can only pick members of your committee.',
              ),
              keys: L(
                '↑ ↓ للتنقل · Enter للاختيار · Esc للإغلاق',
                '↑ ↓ to move · Enter to choose · Esc to close',
              ),
              count: (n) => L(`${n} نتيجة`, `${n} results`),
              change: L('تغيير', 'Change'),
            }}
          />
          {fieldErrors.userId && (
            <p role="alert" className="text-xs text-danger">
              {L('اختر عضواً.', 'Pick a member.')}
            </p>
          )}

          <Select
            label={`${L('المنصب', 'Position')} *`}
            value={values.roleKey}
            onChange={set('roleKey')}
            required
          >
            <option value="">{L('اختر…', 'Choose…')}</option>
            {roles.map((r) => (
              <option key={r.key} value={r.key}>
                {r.name[lang]}
              </option>
            ))}
          </Select>

          {role?.scope === 'committee' && !fixedCommitteeId && (
            <Select
              label={`${L('اللجنة', 'Committee')} *`}
              value={values.committeeId}
              onChange={set('committeeId')}
              required
            >
              <option value="">{L('اختر…', 'Choose…')}</option>
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
              label={L('تاريخ البدء', 'Start date')}
              value={values.startsAt}
              onChange={set('startsAt')}
            />
            <Field
              type="date"
              label={L('تاريخ الانتهاء (اختياري)', 'End date (optional)')}
              value={values.endsAt}
              onChange={set('endsAt')}
            />
          </div>

          {head && (
            <Alert tone="warning">
              <p>
                {L(
                  `للجنة قائد حالي: ${headName}. عند الحفظ ينتهي منصبه في تاريخ البدء.`,
                  `This committee has a head: ${headName}. Saving ends that term on the start date.`,
                )}
              </p>
              {canHandover && (
                <div className="mt-2">
                  <Checkbox
                    label={L(
                      `اجعل ${headName} نائباً للقائد بدلاً من إنهاء منصبه`,
                      `Make ${headName} the deputy head instead of ending the role`,
                    )}
                    checked={keepAsDeputy}
                    onChange={(e) => setKeepAsDeputy(e.target.checked)}
                  />
                </div>
              )}
            </Alert>
          )}

          {isPublicRole && (
            <fieldset className="flex flex-col gap-3 rounded-xl border border-line p-3">
              <legend className="px-1 text-sm font-medium">
                {L('العرض في صفحة القيادة (اختياري)', 'Public leadership card (optional)')}
              </legend>
              <Field
                label={L('اللقب (عربي)', 'Title (Arabic)')}
                value={values.titleAr}
                onChange={set('titleAr')}
              />
              <Field
                label={L('اللقب (إنجليزي)', 'Title (English)')}
                dir="ltr"
                value={values.titleEn}
                onChange={set('titleEn')}
              />
              <Field
                label={L('نبذة (عربي)', 'Short bio (Arabic)')}
                value={values.bioAr}
                onChange={set('bioAr')}
              />
              <Field
                label={L('نبذة (إنجليزي)', 'Short bio (English)')}
                dir="ltr"
                value={values.bioEn}
                onChange={set('bioEn')}
              />
              <Field
                label={L('وسوم (حتى 3، مفصولة بفاصلة)', 'Tags (up to 3, comma-separated)')}
                value={values.tagsAr}
                onChange={set('tagsAr')}
              />
              <Field
                label={L('وسوم إنجليزية', 'English tags')}
                dir="ltr"
                value={values.tagsEn}
                onChange={set('tagsEn')}
              />
            </fieldset>
          )}

          {role && (
            <div className="rounded-xl border border-line p-3">
              <p className="mb-2 text-sm font-medium">
                {L('الصلاحيات التي سيحصل عليها', 'Permissions it grants')}
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

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={close}>
              {L('إلغاء', 'Cancel')}
            </Button>
            <Button
              type="submit"
              loading={pending}
              disabledReason={!picked ? L('اختر عضواً أولًا', 'Pick a member first') : undefined}
            >
              {head && canHandover
                ? L('تسليم القيادة', 'Hand over leadership')
                : L('تعيين', 'Assign')}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
