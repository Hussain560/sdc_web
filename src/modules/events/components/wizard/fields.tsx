'use client';

import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button, Field, Select, Textarea, cn } from '@/components/ui';
import type { Lang } from '@/modules/auth/messages';
import { searchPresenterCandidates } from '../../actions';
import {
  DETAIL_KEYS,
  DETAIL_LABEL,
  PRESENTER_ROLES,
  PRESENTER_ROLE_LABEL,
  type FormDetails,
  type FormFaq,
  type FormGoal,
  type FormPresenter,
} from '../../types';

export type StepProps<V> = {
  values: V;
  errors: Record<string, string>;
  lang: Lang;
  readOnly: boolean;
};

const iconBtn =
  'flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface-raised hover:text-text disabled:opacity-30';

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item as T);
  return next;
}

/** Write / Preview tabs; the preview is sanitized by react-markdown (no raw HTML is rendered). */
export function MarkdownField({
  label,
  value,
  onChange,
  maxLength,
  error,
  lang,
  dir,
  disabled,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  error?: string;
  lang: Lang;
  dir?: 'ltr' | 'rtl';
  disabled?: boolean;
  id?: string;
}) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const ar = lang === 'ar';
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <div role="tablist" className="flex gap-1 text-xs">
          {(['write', 'preview'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                'rounded-full px-3 py-1',
                tab === t ? 'bg-surface-raised font-semibold text-accent' : 'text-muted',
              )}
            >
              {t === 'write' ? (ar ? 'كتابة' : 'Write') : ar ? 'معاينة' : 'Preview'}
            </button>
          ))}
        </div>
      </div>
      {tab === 'write' ? (
        <Textarea
          id={id}
          label={label}
          hideLabel
          dir={dir}
          value={value}
          maxLength={maxLength}
          counter
          disabled={disabled}
          error={error}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-40 font-mono text-sm"
        />
      ) : (
        <div
          dir={dir}
          className="prose-sm min-h-40 rounded-xl border border-line bg-surface-raised p-3 [&_a]:text-accent [&_a]:underline [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_li]:ms-5 [&_li]:list-disc [&_p]:mb-2"
        >
          {value.trim() ? (
            <ReactMarkdown>{value}</ReactMarkdown>
          ) : (
            <p className="text-muted">{ar ? 'لا يوجد محتوى بعد.' : 'Nothing to preview yet.'}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function GoalsEditor({
  goals,
  onChange,
  lang,
  readOnly,
  error,
}: {
  goals: FormGoal[];
  onChange: (g: FormGoal[]) => void;
  lang: Lang;
  readOnly: boolean;
  error?: string;
}) {
  const ar = lang === 'ar';
  const update = (i: number, patch: Partial<FormGoal>) =>
    onChange(goals.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));
  return (
    <fieldset className="flex flex-col gap-3" id="field-goals" disabled={readOnly}>
      <legend className="mb-1 text-sm font-medium">
        {ar ? 'الأهداف *' : 'Goals *'}{' '}
        <span className="font-normal text-muted">
          {ar ? '(عربي ≥ 1، حتى 15)' : '(Arabic ≥ 1, up to 15)'}
        </span>
      </legend>
      {goals.map((g, i) => (
        <div key={i} className="flex items-start gap-2 rounded-xl border border-line p-3">
          <span className="mt-2.5 w-5 text-sm tabular-nums text-muted">{i + 1}.</span>
          <div className="grid flex-1 gap-3 md:grid-cols-2">
            <Field
              id={i === 0 ? 'field-goals-first' : undefined}
              label={ar ? 'الهدف (عربي)' : 'Goal (Arabic)'}
              value={g.ar}
              maxLength={300}
              onChange={(e) => update(i, { ar: e.target.value })}
            />
            <Field
              label={ar ? 'الهدف (إنجليزي)' : 'Goal (English)'}
              dir="ltr"
              value={g.en}
              maxLength={300}
              onChange={(e) => update(i, { en: e.target.value })}
            />
          </div>
          {!readOnly && (
            <div className="mt-5 flex">
              <button
                type="button"
                className={iconBtn}
                aria-label={ar ? 'نقل لأعلى' : 'Move up'}
                disabled={i === 0}
                onClick={() => onChange(move(goals, i, i - 1))}
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                className={iconBtn}
                aria-label={ar ? 'نقل لأسفل' : 'Move down'}
                disabled={i === goals.length - 1}
                onClick={() => onChange(move(goals, i, i + 1))}
              >
                <ArrowDown size={16} />
              </button>
              <button
                type="button"
                className={iconBtn}
                aria-label={ar ? 'حذف' : 'Remove'}
                onClick={() => onChange(goals.filter((_, idx) => idx !== i))}
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      ))}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      {!readOnly && goals.length < 15 && (
        <div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onChange([...goals, { ar: '', en: '' }])}
          >
            <Plus size={16} aria-hidden="true" /> {ar ? 'هدف' : 'Goal'}
          </Button>
        </div>
      )}
    </fieldset>
  );
}

export function FaqEditor({
  faq,
  onChange,
  lang,
  readOnly,
  error,
}: {
  faq: FormFaq[];
  onChange: (f: FormFaq[]) => void;
  lang: Lang;
  readOnly: boolean;
  error?: string;
}) {
  const ar = lang === 'ar';
  const update = (i: number, patch: Partial<FormFaq>) =>
    onChange(faq.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  return (
    <fieldset className="flex flex-col gap-3" id="field-faq" disabled={readOnly}>
      <legend className="mb-1 text-sm font-medium">
        {ar ? 'الأسئلة الشائعة' : 'FAQ'}{' '}
        <span className="font-normal text-muted">{ar ? '(حتى 15)' : '(up to 15)'}</span>
      </legend>
      {faq.map((f, i) => (
        <div key={i} className="flex items-start gap-2 rounded-xl border border-line p-3">
          <div className="grid flex-1 gap-3 md:grid-cols-2">
            <Field
              label={ar ? 'السؤال (عربي)' : 'Question (Arabic)'}
              value={f.qAr}
              onChange={(e) => update(i, { qAr: e.target.value })}
            />
            <Field
              label={ar ? 'السؤال (إنجليزي)' : 'Question (English)'}
              dir="ltr"
              value={f.qEn}
              onChange={(e) => update(i, { qEn: e.target.value })}
            />
            <Field
              label={ar ? 'الجواب (عربي)' : 'Answer (Arabic)'}
              value={f.aAr}
              onChange={(e) => update(i, { aAr: e.target.value })}
            />
            <Field
              label={ar ? 'الجواب (إنجليزي)' : 'Answer (English)'}
              dir="ltr"
              value={f.aEn}
              onChange={(e) => update(i, { aEn: e.target.value })}
            />
          </div>
          {!readOnly && (
            <div className="mt-5 flex">
              <button
                type="button"
                className={iconBtn}
                aria-label={ar ? 'نقل لأعلى' : 'Move up'}
                disabled={i === 0}
                onClick={() => onChange(move(faq, i, i - 1))}
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                className={iconBtn}
                aria-label={ar ? 'نقل لأسفل' : 'Move down'}
                disabled={i === faq.length - 1}
                onClick={() => onChange(move(faq, i, i + 1))}
              >
                <ArrowDown size={16} />
              </button>
              <button
                type="button"
                className={iconBtn}
                aria-label={ar ? 'حذف' : 'Remove'}
                onClick={() => onChange(faq.filter((_, idx) => idx !== i))}
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      ))}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      {!readOnly && faq.length < 15 && (
        <div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onChange([...faq, { qAr: '', qEn: '', aAr: '', aEn: '' }])}
          >
            <Plus size={16} aria-hidden="true" /> {ar ? 'سؤال' : 'Question'}
          </Button>
        </div>
      )}
    </fieldset>
  );
}

/** The five SDC detail lists (target audience, requirements, …), collapsed by default. */
export function DetailsEditor({
  details,
  onChange,
  lang,
  readOnly,
}: {
  details: FormDetails;
  onChange: (d: FormDetails) => void;
  lang: Lang;
  readOnly: boolean;
}) {
  const ar = lang === 'ar';
  const setList = (key: (typeof DETAIL_KEYS)[number], side: 'ar' | 'en', list: string[]) =>
    onChange({ ...details, [key]: { ...details[key], [side]: list } });

  return (
    <details className="rounded-xl border border-line p-3">
      <summary className="cursor-pointer text-sm font-medium">
        {ar ? 'تفاصيل إضافية (اختياري)' : 'Extra details (optional)'}
      </summary>
      <div className="mt-4 flex flex-col gap-5" aria-disabled={readOnly}>
        {DETAIL_KEYS.map((key) => (
          <fieldset key={key} disabled={readOnly} className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">{DETAIL_LABEL[key][lang]}</legend>
            {(['ar', 'en'] as const).map((side) => (
              <div key={side} className="flex flex-col gap-2">
                {details[key][side].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      aria-label={`${DETAIL_LABEL[key][lang]} (${side.toUpperCase()}) ${i + 1}`}
                      dir={side === 'en' ? 'ltr' : undefined}
                      value={item}
                      maxLength={300}
                      onChange={(e) =>
                        setList(
                          key,
                          side,
                          details[key][side].map((x, idx) => (idx === i ? e.target.value : x)),
                        )
                      }
                      className="min-h-10 flex-1 rounded-xl border border-line bg-surface-raised px-3 text-sm text-text"
                    />
                    <button
                      type="button"
                      className={iconBtn}
                      aria-label={ar ? 'حذف' : 'Remove'}
                      onClick={() =>
                        setList(
                          key,
                          side,
                          details[key][side].filter((_, idx) => idx !== i),
                        )
                      }
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {details[key][side].length < 20 && !readOnly && (
                  <button
                    type="button"
                    className="self-start text-sm text-accent underline"
                    onClick={() => setList(key, side, [...details[key][side], ''])}
                  >
                    +{' '}
                    {side === 'ar'
                      ? ar
                        ? 'بند عربي'
                        : 'Arabic item'
                      : ar
                        ? 'بند إنجليزي'
                        : 'English item'}
                  </button>
                )}
              </div>
            ))}
          </fieldset>
        ))}
      </div>
    </details>
  );
}

/** Specific-dates picker: add a date, see sorted chips, remove one. */
export function DatesEditor({
  dates,
  onChange,
  lang,
  readOnly,
  error,
}: {
  dates: string[];
  onChange: (d: string[]) => void;
  lang: Lang;
  readOnly: boolean;
  error?: string;
}) {
  const ar = lang === 'ar';
  const [draft, setDraft] = useState('');
  const fmt = (d: string) =>
    new Intl.DateTimeFormat(ar ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
      dateStyle: 'medium',
      timeZone: 'UTC',
    }).format(new Date(`${d}T00:00:00Z`));
  const add = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft)) return;
    onChange([...new Set([...dates, draft])].sort());
    setDraft('');
  };
  return (
    <div className="flex flex-col gap-2" id="field-dates">
      <div className="flex items-end gap-2">
        <Field
          type="date"
          label={ar ? 'إضافة تاريخ' : 'Add a date'}
          value={draft}
          disabled={readOnly}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="button" variant="secondary" disabled={readOnly || !draft} onClick={add}>
          <Plus size={16} aria-hidden="true" /> {ar ? 'إضافة' : 'Add'}
        </Button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {dates.map((d) => (
          <li
            key={d}
            className="flex items-center gap-1 rounded-full border border-line-accent bg-surface-raised px-3 py-1 text-sm"
          >
            {fmt(d)}
            {!readOnly && (
              <button
                type="button"
                aria-label={ar ? `حذف ${fmt(d)}` : `Remove ${fmt(d)}`}
                onClick={() => onChange(dates.filter((x) => x !== d))}
              >
                <X size={14} />
              </button>
            )}
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

const emptyGuest = (): FormPresenter => ({
  profileId: '',
  profileName: '',
  guestNameAr: '',
  guestNameEn: '',
  guestTitleAr: '',
  guestTitleEn: '',
  guestLink: '',
  role: 'presenter',
});

export function PresentersEditor({
  presenters,
  onChange,
  lang,
  readOnly,
  error,
}: {
  presenters: FormPresenter[];
  onChange: (p: FormPresenter[]) => void;
  lang: Lang;
  readOnly: boolean;
  error?: string;
}) {
  const ar = lang === 'ar';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; name: string }>>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (query.trim().length < 2) return;
    timer.current = setTimeout(async () => setResults(await searchPresenterCandidates(query)), 250);
    return () => clearTimeout(timer.current);
  }, [query]);
  const visible = query.trim().length < 2 ? [] : results;

  const update = (i: number, patch: Partial<FormPresenter>) =>
    onChange(presenters.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  return (
    <fieldset className="flex flex-col gap-3" id="field-presenters" disabled={readOnly}>
      <legend className="mb-1 text-sm font-medium">
        {ar ? 'المقدّمون' : 'Presenters'}{' '}
        <span className="font-normal text-muted">{ar ? '(حتى 10)' : '(up to 10)'}</span>
      </legend>

      {!readOnly && presenters.length < 10 && (
        <div className="flex flex-col gap-2 rounded-xl border border-line p-3">
          <label htmlFor="presenter-search" className="text-sm">
            {ar ? 'ابحث عن عضو بحساب' : 'Find a member with an account'}
          </label>
          <input
            id="presenter-search"
            role="combobox"
            aria-expanded={visible.length > 0}
            aria-controls="presenter-results"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ar ? 'اكتب حرفين على الأقل…' : 'Type at least 2 characters…'}
            className="min-h-10 rounded-xl border border-line bg-surface-raised px-3 text-sm text-text"
          />
          {visible.length > 0 && (
            <ul
              id="presenter-results"
              role="listbox"
              className="rounded-xl border border-line bg-surface"
            >
              {visible.map((r) => (
                <li key={r.id} role="option" aria-selected="false">
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-start text-sm hover:bg-surface-raised"
                    onClick={() => {
                      onChange([
                        ...presenters,
                        { ...emptyGuest(), profileId: r.id, profileName: r.name },
                      ]);
                      setQuery('');
                      setResults([]);
                    }}
                  >
                    {r.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onChange([...presenters, emptyGuest()])}
            >
              <Plus size={16} aria-hidden="true" /> {ar ? 'ضيف (بدون حساب)' : 'Guest (no account)'}
            </Button>
          </div>
        </div>
      )}

      {presenters.map((p, i) => (
        <div key={i} className="flex items-start gap-2 rounded-xl border border-line p-3">
          <div className="grid flex-1 gap-3 md:grid-cols-2">
            {p.profileId ? (
              <p className="text-sm font-medium md:col-span-2">
                {p.profileName || (ar ? 'عضو' : 'Member')}
                <span className="ms-2 text-xs font-normal text-muted">
                  {ar ? 'حساب' : 'account'}
                </span>
              </p>
            ) : (
              <>
                <Field
                  label={ar ? 'الاسم (عربي) *' : 'Name (Arabic) *'}
                  value={p.guestNameAr}
                  onChange={(e) => update(i, { guestNameAr: e.target.value })}
                />
                <Field
                  label={ar ? 'الاسم (إنجليزي)' : 'Name (English)'}
                  dir="ltr"
                  value={p.guestNameEn}
                  onChange={(e) => update(i, { guestNameEn: e.target.value })}
                />
                <Field
                  label={ar ? 'المسمى (عربي)' : 'Title (Arabic)'}
                  value={p.guestTitleAr}
                  onChange={(e) => update(i, { guestTitleAr: e.target.value })}
                />
                <Field
                  label={ar ? 'المسمى (إنجليزي)' : 'Title (English)'}
                  dir="ltr"
                  value={p.guestTitleEn}
                  onChange={(e) => update(i, { guestTitleEn: e.target.value })}
                />
                <Field
                  label={ar ? 'رابط (https)' : 'Link (https)'}
                  dir="ltr"
                  value={p.guestLink}
                  onChange={(e) => update(i, { guestLink: e.target.value })}
                />
              </>
            )}
            <Select
              label={ar ? 'الدور' : 'Role'}
              value={p.role}
              onChange={(e) => update(i, { role: e.target.value as FormPresenter['role'] })}
            >
              {PRESENTER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {PRESENTER_ROLE_LABEL[r][lang]}
                </option>
              ))}
            </Select>
          </div>
          {!readOnly && (
            <div className="mt-5 flex">
              <button
                type="button"
                className={iconBtn}
                aria-label={ar ? 'نقل لأعلى' : 'Move up'}
                disabled={i === 0}
                onClick={() => onChange(move(presenters, i, i - 1))}
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                className={iconBtn}
                aria-label={ar ? 'نقل لأسفل' : 'Move down'}
                disabled={i === presenters.length - 1}
                onClick={() => onChange(move(presenters, i, i + 1))}
              >
                <ArrowDown size={16} />
              </button>
              <button
                type="button"
                className={iconBtn}
                aria-label={ar ? 'حذف' : 'Remove'}
                onClick={() => onChange(presenters.filter((_, idx) => idx !== i))}
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      ))}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
