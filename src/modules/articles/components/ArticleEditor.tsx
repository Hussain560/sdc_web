'use client';

import {
  ArrowDown,
  ArrowUp,
  Check,
  ExternalLink,
  Plus,
  Search,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Badge, Button, Dialog, Field, Select, Textarea, cn, useToast } from '@/components/ui';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';
import { useLanguage } from '@/context/LanguageContext';
import { Link, useRouter } from '@/i18n/navigation';
import { clientEnv } from '@/lib/env';
import { formatRelative } from '@/lib/format';
import {
  deleteArticleDraft,
  saveArticle,
  searchArticleAuthors,
  transitionArticle,
  uploadArticleCover,
} from '../actions';
import type { ArticlePerms } from '../permissions';
import { tagSlug, validateArticle } from '../schemas';
import {
  ARTICLE_STATUS_LABEL as STATUS_LABEL,
  readingMinutesOf,
  wordCount,
  type ArticleAction,
  type ArticleFormValues,
  type ArticleStatus,
  type AuthorInput,
  type TagInput,
} from '../types';

type Committee = { id: string; name: { ar: string; en: string } };

const coverSrc = (path: string) =>
  path.startsWith('/') || /^https?:\/\//.test(path)
    ? path
    : `${clientEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${path}`;

const hashSlug = (label: string) => {
  let h = 0;
  for (const c of label) h = (h * 31 + c.codePointAt(0)!) >>> 0;
  return `t-${h.toString(36)}`;
};

type Props = {
  articleId: string | null;
  initial: ArticleFormValues;
  initialUpdatedAt: string | null;
  status: ArticleStatus;
  reviewNote: string | null;
  submittedAt: string | null;
  publishedAt: string | null;
  committees: Committee[];
  tagSuggestions: TagInput[];
  perms: ArticlePerms;
  me: { id: string; name: string };
  justSaved?: boolean;
};

/**
 * Bilingual Markdown editor and review view in one (screen 21 §1.2–1.3). Editing is for authors and editors of
 * an open draft, and for publishers on a published article; everyone else with access sees the review view:
 * the rendered article exactly as it publishes, a checklist and the decision buttons.
 */
export function ArticleEditor({
  articleId,
  initial,
  initialUpdatedAt,
  status,
  reviewNote,
  submittedAt,
  committees,
  tagSuggestions,
  perms,
  me,
  justSaved,
}: Props) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const [values, setValues] = useState<ArticleFormValues>(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<'ar' | 'en'>('ar');
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [coverUrl, setCoverUrl] = useState(
    initial.coverImagePath ? coverSrc(initial.coverImagePath) : '',
  );
  const [dialog, setDialog] = useState<null | 'changes' | 'archive' | 'delete'>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (justSaved) toast.success(ar ? 'تم حفظ المسودة' : 'Draft saved');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on arrival from the first save
  }, []);

  const editable = perms.edit;
  const dirty = JSON.stringify(values) !== baseline;
  useEffect(() => {
    if (!dirty) return;
    const guard = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);

  const set = (patch: Partial<ArticleFormValues>) => {
    setValues((v) => ({ ...v, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(patch)) delete next[k];
      return next;
    });
  };

  const words = wordCount(values.bodyAr);
  const minutes = readingMinutesOf(values.bodyAr);
  const body = tab === 'ar' ? values.bodyAr : values.bodyEn;
  const L = (a: string, e: string) => (ar ? a : e);

  const checklist = useMemo(
    () => [
      { ok: values.titleAr.trim().length >= 3, label: L('عنوان عربي', 'Arabic title') },
      { ok: !!values.excerptAr.trim(), label: L('مقتطف', 'Excerpt') },
      { ok: !!values.bodyAr.trim(), label: L('نص عربي', 'Arabic body') },
      { ok: !!values.bodyEn.trim(), label: L('نسخة إنجليزية', 'English version'), soft: true },
      { ok: values.tags.length > 0, label: L('وسوم', 'Tags'), soft: true },
      { ok: values.authors.length > 0, label: L('كاتب', 'Author') },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recomputed from the values and language only
    [values, ar],
  );

  const focusField = (errs: Record<string, string>) => {
    const first = Object.keys(errs)[0];
    if (!first) return;
    if (first.endsWith('En')) setTab('en');
    else if (first.endsWith('Ar')) setTab('ar');
    requestAnimationFrame(() => document.getElementById(`art-${first}`)?.focus());
  };

  /** Saves the form; resolves with the new updatedAt, or null when it failed (toast shown). */
  const persist = async (): Promise<{ id: string; updatedAt: string; slug: string } | null> => {
    const check = validateArticle(values, lang);
    if (!check.ok) {
      setErrors(check.errors);
      toast.error(L('يرجى مراجعة الحقول المحددة.', 'Please review the highlighted fields.'));
      focusField(check.errors);
      return null;
    }
    const r = await saveArticle(
      { id: articleId ?? undefined, values, expectedUpdatedAt: updatedAt ?? undefined },
      { lang },
    );
    if (!r.ok) {
      setErrors(r.fieldErrors ?? {});
      toast.error(r.message);
      focusField(r.fieldErrors ?? {});
      return null;
    }
    setUpdatedAt(r.data.updatedAt);
    setBaseline(JSON.stringify(values));
    return r.data;
  };

  const save = () =>
    startTransition(async () => {
      const saved = await persist();
      if (!saved) return;
      toast.success(L('تم الحفظ', 'Saved'));
      if (!articleId) router.replace(`/dashboard/articles/${saved.id}?saved=1`);
      else router.refresh();
    });

  const transition = (action: ArticleAction, withNote?: string, done?: string) =>
    startTransition(async () => {
      // Authors and publishers send their latest edits along (a published article is edited in place).
      if (editable && dirty) {
        const saved = await persist();
        if (!saved) return;
      }
      const id = articleId;
      if (!id) return;
      const r = await transitionArticle({ id, action, note: withNote }, { lang });
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        toast.error(r.message);
        focusField(r.fieldErrors ?? {});
        return;
      }
      if (done) toast.success(done);
      setDialog(null);
      setNote('');
      router.refresh();
      if (action === 'submit' || action === 'withdraw') router.push('/dashboard/articles');
    });

  const submit = () => {
    const check = validateArticle(values, lang, { forSubmit: true });
    if (!check.ok) {
      setErrors(check.errors);
      toast.error(
        L('أكمل الحقول المطلوبة قبل الإرسال.', 'Complete the required fields before submitting.'),
      );
      focusField(check.errors);
      return;
    }
    if (!articleId) {
      startTransition(async () => {
        const saved = await persist();
        if (!saved) return;
        const r = await transitionArticle({ id: saved.id, action: 'submit' }, { lang });
        if (!r.ok) {
          toast.error(r.message);
          router.replace(`/dashboard/articles/${saved.id}`);
          return;
        }
        toast.success(L('أُرسل المقال للمراجعة.', 'Article sent for review.'));
        router.push('/dashboard/articles');
      });
      return;
    }
    transition('submit', undefined, L('أُرسل المقال للمراجعة.', 'Article sent for review.'));
  };

  const remove = () =>
    startTransition(async () => {
      if (!articleId) return;
      const r = await deleteArticleDraft(articleId, { lang });
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      toast.success(L('حُذفت المسودة.', 'Draft deleted.'));
      router.replace('/dashboard/articles');
    });

  // ------------------------------------------------------------------ cover upload
  const fileRef = useRef<HTMLInputElement>(null);
  const onCover = (file: File | undefined) => {
    if (!file) return;
    const form = new FormData();
    form.set('file', file);
    form.set('articleId', articleId ?? '');
    startTransition(async () => {
      const r = await uploadArticleCover(form, { lang });
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      set({ coverImagePath: r.data.path });
      setCoverUrl(r.data.url);
      toast.success(L('تم رفع الغلاف.', 'Cover uploaded.'));
    });
  };

  const publicHref = status === 'published' ? `/articles/${values.slug}` : null;

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      {publicHref && (
        <Link
          href={publicHref}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line px-4 text-sm font-semibold text-muted hover:text-text"
        >
          <ExternalLink size={15} aria-hidden="true" />
          {L('عرض الصفحة العامة', 'View public page')}
        </Link>
      )}
      {editable && (
        <Button
          variant="secondary"
          loading={pending}
          onClick={save}
          disabled={!dirty && !!articleId}
        >
          {L('حفظ', 'Save')}
        </Button>
      )}
      {(perms.submit || !articleId) && status !== 'published' && (
        <Button
          loading={pending}
          onClick={submit}
          variant={perms.publish ? 'secondary' : 'primary'}
        >
          {L('إرسال للمراجعة', 'Submit for review')}
        </Button>
      )}
      {status === 'in_review' && (perms.submit || perms.remove) && (
        <Button
          variant="ghost"
          loading={pending}
          onClick={() => transition('withdraw', undefined, L('سُحب الطلب.', 'Request withdrawn.'))}
        >
          {L('سحب الطلب', 'Withdraw')}
        </Button>
      )}
      {perms.publish && articleId && status === 'in_review' && (
        <Button variant="secondary" onClick={() => setDialog('changes')} disabled={pending}>
          {L('طلب تعديلات', 'Request changes')}
        </Button>
      )}
      {perms.publish &&
        articleId &&
        ['in_review', 'draft', 'changes_requested'].includes(status) && (
          <Button
            loading={pending}
            onClick={() =>
              transition('publish', undefined, L('نُشر المقال.', 'Article published.'))
            }
          >
            {L('نشر', 'Publish')}
          </Button>
        )}
      {perms.publish && status === 'published' && (
        <Button variant="ghost" onClick={() => setDialog('archive')} disabled={pending}>
          {L('أرشفة', 'Archive')}
        </Button>
      )}
      {perms.publish && status === 'archived' && (
        <Button
          loading={pending}
          onClick={() =>
            transition('restore', undefined, L('استُعيد المقال.', 'Article restored.'))
          }
        >
          {L('استعادة', 'Restore')}
        </Button>
      )}
      {perms.remove && articleId && (
        <Button variant="ghost" onClick={() => setDialog('delete')} disabled={pending}>
          {L('حذف', 'Delete')}
        </Button>
      )}
    </div>
  );

  // ------------------------------------------------------------------ read-only review view
  if (!editable) {
    return (
      <div className="flex flex-col gap-5">
        <Header ar={ar} status={status} title={values.titleAr} actions={actions} />
        <Banner status={status} reviewNote={reviewNote} submittedAt={submittedAt} lang={lang} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="mb-4 flex gap-2" role="tablist">
              <TabButton active={tab === 'ar'} onClick={() => setTab('ar')}>
                العربية
              </TabButton>
              <TabButton active={tab === 'en'} onClick={() => setTab('en')}>
                English
              </TabButton>
            </div>
            <h2 className="mb-3 text-xl font-bold" dir={tab === 'ar' ? 'rtl' : 'ltr'}>
              {tab === 'ar' ? values.titleAr : values.titleEn || values.titleAr}
            </h2>
            <div dir={tab === 'ar' ? 'rtl' : 'ltr'} lang={tab}>
              <MarkdownRenderer
                source={tab === 'ar' ? values.bodyAr : values.bodyEn || values.bodyAr}
              />
            </div>
          </div>
          <Sidebar>
            <Checklist items={checklist} title={L('قائمة التحقق', 'Checklist')} />
            <p className="text-xs text-muted tabular-nums">
              {L(`${words} كلمة · ~${minutes} د قراءة`, `${words} words · ~${minutes} min read`)}
            </p>
          </Sidebar>
        </div>
        <Dialogs
          dialog={dialog}
          setDialog={setDialog}
          note={note}
          setNote={setNote}
          busy={pending}
          ar={ar}
          onChanges={() =>
            transition('request_changes', note, L('أُرسلت الملاحظات.', 'Notes sent to the author.'))
          }
          onArchive={() =>
            transition('archive', undefined, L('أُرشف المقال.', 'Article archived.'))
          }
          onDelete={remove}
        />
      </div>
    );
  }

  // ------------------------------------------------------------------ editor
  const f = (key: keyof ArticleFormValues) => `art-${key}`;
  return (
    <div className="flex flex-col gap-5">
      <Header
        ar={ar}
        status={status}
        title={values.titleAr}
        actions={actions}
        dirty={dirty}
        isNew={!articleId}
      />
      <Banner status={status} reviewNote={reviewNote} submittedAt={submittedAt} lang={lang} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex items-center gap-2" role="tablist">
            <TabButton active={tab === 'ar'} onClick={() => setTab('ar')}>
              العربية
            </TabButton>
            <TabButton active={tab === 'en'} onClick={() => setTab('en')}>
              English
            </TabButton>
            {tab === 'en' && (
              <span className="text-xs text-muted">
                {L(
                  'اختياري — يظهر النص العربي عند غيابه.',
                  'Optional — readers get the Arabic text without it.',
                )}
              </span>
            )}
          </div>

          {tab === 'ar' ? (
            <>
              <Field
                id={f('titleAr')}
                label={L('العنوان *', 'Title (Arabic) *')}
                value={values.titleAr}
                maxLength={200}
                dir="rtl"
                onChange={(e) => set({ titleAr: e.target.value })}
                error={errors.titleAr}
              />
              <Textarea
                id={f('excerptAr')}
                label={L('المقتطف', 'Excerpt (Arabic)')}
                value={values.excerptAr}
                maxLength={500}
                counter
                dir="rtl"
                className="min-h-20"
                onChange={(e) => set({ excerptAr: e.target.value })}
                error={errors.excerptAr}
              />
            </>
          ) : (
            <>
              <Field
                id={f('titleEn')}
                label="Title (English)"
                value={values.titleEn}
                maxLength={200}
                dir="ltr"
                onChange={(e) => set({ titleEn: e.target.value })}
                error={errors.titleEn}
                hint={L(
                  'يُستخدم لتوليد رابط المقال عند الإنشاء.',
                  'Used to generate the article link when it is created.',
                )}
              />
              <Textarea
                id={f('excerptEn')}
                label="Excerpt (English)"
                value={values.excerptEn}
                maxLength={500}
                counter
                dir="ltr"
                className="min-h-20"
                onChange={(e) => set({ excerptEn: e.target.value })}
                error={errors.excerptEn}
              />
            </>
          )}

          <div className="flex items-center justify-between gap-2 lg:hidden" role="tablist">
            <TabButton active={mode === 'write'} onClick={() => setMode('write')}>
              {L('كتابة', 'Write')}
            </TabButton>
            <TabButton active={mode === 'preview'} onClick={() => setMode('preview')}>
              {L('معاينة', 'Preview')}
            </TabButton>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={cn(mode === 'preview' && 'hidden lg:block')}>
              <Textarea
                id={f(tab === 'ar' ? 'bodyAr' : 'bodyEn')}
                label={
                  tab === 'ar'
                    ? L('النص (Markdown) *', 'Body (Markdown), Arabic *')
                    : 'Body (Markdown), English'
                }
                value={body}
                maxLength={50000}
                dir={tab === 'ar' ? 'rtl' : 'ltr'}
                className="min-h-[26rem] font-mono text-sm leading-7"
                onChange={(e) =>
                  set(tab === 'ar' ? { bodyAr: e.target.value } : { bodyEn: e.target.value })
                }
                error={errors[tab === 'ar' ? 'bodyAr' : 'bodyEn']}
                hint={L(
                  '## عنوان · **غامق** · - قائمة · [نص](https://…)',
                  '## Heading · **bold** · - list · [text](https://…)',
                )}
              />
            </div>
            <div className={cn(mode === 'write' && 'hidden lg:block')}>
              <p className="mb-1.5 text-sm font-medium">{L('معاينة', 'Preview')}</p>
              <div
                className="min-h-[26rem] rounded-xl border border-line bg-surface p-4"
                dir={tab === 'ar' ? 'rtl' : 'ltr'}
                lang={tab}
              >
                {body.trim() ? (
                  <MarkdownRenderer source={body} />
                ) : (
                  <p className="text-sm text-muted">
                    {L(
                      'ستظهر المعاينة هنا بالشكل نفسه الذي سيُنشر.',
                      'The preview shows exactly what will publish.',
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted tabular-nums">
            {L(
              `${words} كلمة · ~${minutes} د قراءة (محسوبة من النص العربي)`,
              `${words} words · ~${minutes} min read (from the Arabic body)`,
            )}
          </p>
        </div>

        <Sidebar>
          <Select
            id={f('committeeId')}
            label={L('اللجنة', 'Committee')}
            value={values.committeeId}
            disabled={committees.length === 1 && !!values.committeeId}
            onChange={(e) => set({ committeeId: e.target.value })}
          >
            {committees.length !== 1 && <option value="">{L('— اختر —', '— Choose —')}</option>}
            {committees.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name[lang]}
              </option>
            ))}
          </Select>

          <AuthorsField
            ar={ar}
            me={me}
            committees={committees}
            value={values.authors}
            error={errors.authors}
            onChange={(authors) => set({ authors })}
          />

          <TagsField
            ar={ar}
            value={values.tags}
            suggestions={tagSuggestions}
            error={errors.tags}
            onChange={(tags) => set({ tags })}
          />

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{L('الغلاف', 'Cover')}</p>
            {coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- user-uploaded cover from the public bucket
              <img
                src={coverUrl}
                alt=""
                className="aspect-video w-full rounded-xl border border-line object-cover"
              />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              aria-label={L('رفع صورة الغلاف', 'Upload a cover image')}
              onChange={(e) => onCover(e.target.files?.[0])}
            />
            <Button
              variant="secondary"
              type="button"
              disabled={pending}
              onClick={() => fileRef.current?.click()}
            >
              {coverUrl ? L('تغيير الغلاف', 'Change cover') : L('رفع صورة', 'Upload an image')}
            </Button>
          </div>

          <Field
            id={f('resourceUrl')}
            label={L('رابط مصدر أو ملحق', 'Resource link')}
            value={values.resourceUrl}
            dir="ltr"
            placeholder="https://"
            onChange={(e) => set({ resourceUrl: e.target.value })}
            error={errors.resourceUrl}
          />
          {values.resourceUrl.trim() && (
            <>
              <Field
                label={L('نص الرابط (عربي)', 'Link label (Arabic)')}
                value={values.resourceLabelAr}
                dir="rtl"
                onChange={(e) => set({ resourceLabelAr: e.target.value })}
              />
              <Field
                label="Link label (English)"
                value={values.resourceLabelEn}
                dir="ltr"
                onChange={(e) => set({ resourceLabelEn: e.target.value })}
              />
            </>
          )}

          <Field
            id={f('slug')}
            label={L('الرابط', 'Slug')}
            value={values.slug}
            dir="ltr"
            disabled={status === 'published'}
            placeholder={L('يُولَّد تلقائيًا', 'Generated automatically')}
            onChange={(e) => set({ slug: e.target.value.toLowerCase() })}
            error={errors.slug}
            hint={
              status === 'published' ? L('مقفل بعد النشر.', 'Locked after publishing.') : undefined
            }
          />

          <Checklist items={checklist} title={L('قائمة التحقق', 'Checklist')} />
        </Sidebar>
      </div>

      <Dialogs
        dialog={dialog}
        setDialog={setDialog}
        note={note}
        setNote={setNote}
        busy={pending}
        ar={ar}
        onChanges={() =>
          transition('request_changes', note, L('أُرسلت الملاحظات.', 'Notes sent to the author.'))
        }
        onArchive={() => transition('archive', undefined, L('أُرشف المقال.', 'Article archived.'))}
        onDelete={remove}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------------------------- pieces
function Header({
  ar,
  status,
  title,
  actions,
  dirty,
  isNew,
}: {
  ar: boolean;
  status: ArticleStatus;
  title: string;
  actions: React.ReactNode;
  dirty?: boolean;
  isNew?: boolean;
}) {
  const st = STATUS_LABEL[status];
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold lg:text-2xl">
          {title.trim() || (ar ? 'ثريد جديد' : 'New thread')}
        </h1>
        <div className="mt-1.5 flex items-center gap-2">
          <Badge tone={st.tone}>{ar ? st.ar : st.en}</Badge>
          {dirty && !isNew && (
            <span className="text-xs text-muted">
              {ar ? 'تغييرات غير محفوظة' : 'Unsaved changes'}
            </span>
          )}
        </div>
      </div>
      {actions}
    </div>
  );
}

function Banner({
  status,
  reviewNote,
  submittedAt,
  lang,
}: {
  status: ArticleStatus;
  reviewNote: string | null;
  submittedAt: string | null;
  lang: 'ar' | 'en';
}) {
  const ar = lang === 'ar';
  if (status === 'changes_requested' && reviewNote) {
    return (
      <div
        className="flex items-start gap-3 rounded-xl border border-warning bg-surface px-4 py-3 text-sm text-warning"
        role="note"
      >
        <TriangleAlert size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
        <p>
          <strong>{ar ? 'ملاحظات المراجِع: ' : 'Reviewer notes: '}</strong>
          {reviewNote}
        </p>
      </div>
    );
  }
  if (status === 'in_review' && submittedAt) {
    return (
      <p className="text-sm text-muted" role="note">
        {ar ? 'أُرسل للمراجعة ' : 'Submitted for review '}
        {formatRelative(submittedAt, lang)}
      </p>
    );
  }
  return null;
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-surface-raised text-text' : 'text-muted hover:text-text',
      )}
    >
      {children}
    </button>
  );
}

function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <aside className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-20 xl:self-start">
      {children}
    </aside>
  );
}

function Checklist({
  items,
  title,
}: {
  items: Array<{ ok: boolean; label: string; soft?: boolean }>;
  title: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <p className="mb-2 text-sm font-medium">{title}</p>
      <ul className="flex flex-col gap-1.5 text-sm">
        {items.map((i) => (
          <li key={i.label} className="flex items-center gap-2">
            {i.ok ? (
              <Check size={15} aria-hidden="true" className="text-accent" />
            ) : (
              <TriangleAlert
                size={15}
                aria-hidden="true"
                className={i.soft ? 'text-muted' : 'text-warning'}
              />
            )}
            <span className={i.ok ? '' : 'text-muted'}>{i.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AuthorsField({
  ar,
  me,
  committees,
  value,
  error,
  onChange,
}: {
  ar: boolean;
  me: { id: string; name: string };
  committees: Committee[];
  value: AuthorInput[];
  error?: string;
  onChange: (v: AuthorInput[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; name: string }>>([]);
  const [guestAr, setGuestAr] = useState('');
  const [guestEn, setGuestEn] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const L = (a: string, e: string) => (ar ? a : e);

  useEffect(() => {
    clearTimeout(timer.current);
    if (query.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears stale results for a short query
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => setResults(await searchArticleAuthors(query)), 250);
    return () => clearTimeout(timer.current);
  }, [query]);

  const add = (a: AuthorInput) => onChange([...value, a]);
  const move = (i: number, d: number) => {
    const next = [...value];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };
  const hasMe = value.some((a) => a.userId === me.id);

  return (
    <fieldset className="flex flex-col gap-2" id="art-authors" tabIndex={-1}>
      <legend className="mb-1 text-sm font-medium">{L('الكتّاب *', 'Authors *')}</legend>
      <ul className="flex flex-col gap-1.5">
        {value.map((a, i) => (
          <li
            key={i}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface-raised px-2.5 py-1.5 text-sm"
          >
            <span className="min-w-0 flex-1 truncate">
              {a.label || a.displayNameAr || a.displayNameEn || '—'}
              {a.committeeId && (
                <span className="ms-1 text-xs text-muted">({L('لجنة', 'committee')})</span>
              )}
              {!a.userId && !a.committeeId && (
                <span className="ms-1 text-xs text-muted">({L('ضيف', 'guest')})</span>
              )}
            </span>
            <button
              type="button"
              aria-label={L('تحريك لأعلى', 'Move up')}
              className="text-muted hover:text-text"
              onClick={() => move(i, -1)}
            >
              <ArrowUp size={14} />
            </button>
            <button
              type="button"
              aria-label={L('تحريك لأسفل', 'Move down')}
              className="text-muted hover:text-text"
              onClick={() => move(i, 1)}
            >
              <ArrowDown size={14} />
            </button>
            <button
              type="button"
              aria-label={L('إزالة', 'Remove')}
              className="text-muted hover:text-danger"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {!hasMe && (
          <Button
            type="button"
            variant="secondary"
            className="min-h-8 px-3 text-xs"
            onClick={() => add({ userId: me.id, label: me.name })}
          >
            <Plus size={13} aria-hidden="true" />
            {L('أنا', 'Me')}
          </Button>
        )}
        <select
          aria-label={L('إضافة لجنة ككاتب', 'Add a committee byline')}
          className="h-8 rounded-lg border border-line bg-surface-raised px-2 text-xs"
          value=""
          onChange={(e) => {
            const c = committees.find((x) => x.id === e.target.value);
            if (c) add({ committeeId: c.id, label: c.name[ar ? 'ar' : 'en'] });
          }}
        >
          <option value="">{L('+ لجنة', '+ Committee')}</option>
          {committees.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name[ar ? 'ar' : 'en']}
            </option>
          ))}
        </select>
      </div>

      <div className="relative">
        <Search
          size={14}
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 start-2.5 my-auto text-muted"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={L('ابحث عن عضو…', 'Find a member…')}
          aria-label={L('ابحث عن عضو', 'Find a member')}
          className="h-9 w-full rounded-lg border border-line bg-surface-raised ps-8 pe-2 text-sm"
        />
        {results.length > 0 && (
          <ul className="mt-1 rounded-lg border border-line bg-surface-overlay p-1 text-sm">
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="w-full rounded-md px-2 py-1.5 text-start hover:bg-surface-raised"
                  onClick={() => {
                    if (!value.some((a) => a.userId === r.id)) add({ userId: r.id, label: r.name });
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
      </div>

      <div className="flex flex-col gap-1.5 rounded-lg border border-dashed border-line p-2">
        <p className="text-xs text-muted">
          {L('كاتب ضيف (غير مسجّل)', 'Guest author (no account)')}
        </p>
        <input
          value={guestAr}
          onChange={(e) => setGuestAr(e.target.value)}
          placeholder={L('الاسم بالعربية', 'Name in Arabic')}
          aria-label={L('اسم الضيف بالعربية', 'Guest name in Arabic')}
          dir="rtl"
          className="h-8 rounded-md border border-line bg-surface-raised px-2 text-sm"
        />
        <input
          value={guestEn}
          onChange={(e) => setGuestEn(e.target.value)}
          placeholder={L('الاسم بالإنجليزية (اختياري)', 'Name in English (optional)')}
          aria-label={L('اسم الضيف بالإنجليزية', 'Guest name in English')}
          dir="ltr"
          className="h-8 rounded-md border border-line bg-surface-raised px-2 text-sm"
        />
        <Button
          type="button"
          variant="secondary"
          className="min-h-8 px-3 text-xs"
          disabled={!guestAr.trim()}
          onClick={() => {
            add({
              displayNameAr: guestAr.trim(),
              displayNameEn: guestEn.trim() || undefined,
              label: guestAr.trim(),
            });
            setGuestAr('');
            setGuestEn('');
          }}
        >
          {L('إضافة الضيف', 'Add guest')}
        </Button>
      </div>
    </fieldset>
  );
}

function TagsField({
  ar,
  value,
  suggestions,
  error,
  onChange,
}: {
  ar: boolean;
  value: TagInput[];
  suggestions: TagInput[];
  error?: string;
  onChange: (v: TagInput[]) => void;
}) {
  const [labelAr, setLabelAr] = useState('');
  const [labelEn, setLabelEn] = useState('');
  const L = (a: string, e: string) => (ar ? a : e);
  const free = suggestions.filter((s) => !value.some((v) => v.slug === s.slug)).slice(0, 12);

  const addNew = () => {
    const a = labelAr.trim();
    const e = labelEn.trim();
    if (!a && !e) return;
    const slug = tagSlug(e || a) || hashSlug(a || e);
    if (value.some((v) => v.slug === slug)) return;
    onChange([...value, { slug, labelAr: a || e, labelEn: e }]);
    setLabelAr('');
    setLabelEn('');
  };

  return (
    <fieldset className="flex flex-col gap-2" id="art-tags" tabIndex={-1}>
      <legend className="mb-1 text-sm font-medium">{L('الوسوم', 'Tags')}</legend>
      <div className="flex flex-wrap gap-1.5">
        {value.map((t) => (
          <span
            key={t.slug}
            className="inline-flex items-center gap-1 rounded-full border border-line-accent px-2.5 py-0.5 text-xs text-accent"
          >
            {ar ? t.labelAr : t.labelEn || t.labelAr}
            <button
              type="button"
              aria-label={L(`إزالة ${t.labelAr}`, `Remove ${t.labelEn || t.labelAr}`)}
              onClick={() => onChange(value.filter((v) => v.slug !== t.slug))}
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      {free.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label={L('وسوم مقترحة', 'Suggested tags')}>
          {free.map((s) => (
            <button
              key={s.slug}
              type="button"
              className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted hover:text-text"
              onClick={() => onChange([...value, s])}
            >
              + {ar ? s.labelAr : s.labelEn || s.labelAr}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-1.5">
        <input
          value={labelAr}
          onChange={(e) => setLabelAr(e.target.value)}
          placeholder={L('وسم بالعربية', 'Arabic tag')}
          aria-label={L('وسم جديد بالعربية', 'New tag in Arabic')}
          dir="rtl"
          className="h-8 min-w-0 flex-1 rounded-md border border-line bg-surface-raised px-2 text-sm"
        />
        <input
          value={labelEn}
          onChange={(e) => setLabelEn(e.target.value)}
          placeholder="English tag"
          aria-label={L('وسم جديد بالإنجليزية', 'New tag in English')}
          dir="ltr"
          className="h-8 min-w-0 flex-1 rounded-md border border-line bg-surface-raised px-2 text-sm"
        />
        <Button
          type="button"
          variant="secondary"
          className="min-h-8 px-3 text-xs"
          onClick={addNew}
          disabled={!labelAr.trim() && !labelEn.trim()}
        >
          {L('إضافة', 'Add')}
        </Button>
      </div>
    </fieldset>
  );
}

function Dialogs({
  dialog,
  setDialog,
  note,
  setNote,
  busy,
  ar,
  onChanges,
  onArchive,
  onDelete,
}: {
  dialog: null | 'changes' | 'archive' | 'delete';
  setDialog: (d: null | 'changes' | 'archive' | 'delete') => void;
  note: string;
  setNote: (v: string) => void;
  busy: boolean;
  ar: boolean;
  onChanges: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const L = (a: string, e: string) => (ar ? a : e);
  const close = () => setDialog(null);
  return (
    <>
      <Dialog
        open={dialog === 'changes'}
        onClose={close}
        title={L('طلب تعديلات', 'Request changes')}
      >
        <div className="flex flex-col gap-3">
          <Textarea
            label={L('الملاحظات *', 'Notes *')}
            value={note}
            maxLength={1000}
            onChange={(e) => setNote(e.target.value)}
            hint={L(
              '10 أحرف على الأقل. ستظهر للكاتب.',
              'At least 10 characters. The author will read them.',
            )}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close} disabled={busy}>
              {L('تراجع', 'Back')}
            </Button>
            <Button onClick={onChanges} loading={busy}>
              {L('إرسال الملاحظات', 'Send notes')}
            </Button>
          </div>
        </div>
      </Dialog>
      <Dialog
        open={dialog === 'archive'}
        onClose={close}
        title={L('أرشفة المقال', 'Archive the article')}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            {L(
              'سيختفي من الموقع العام وتبقى كل بياناته ورابطه محجوزًا. يمكنك استعادته لاحقًا.',
              'It disappears from the public site; its data and link stay reserved. You can restore it later.',
            )}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close} disabled={busy}>
              {L('تراجع', 'Back')}
            </Button>
            <Button variant="danger" onClick={onArchive} loading={busy}>
              {L('أرشفة', 'Archive')}
            </Button>
          </div>
        </div>
      </Dialog>
      <Dialog
        open={dialog === 'delete'}
        onClose={close}
        title={L('حذف المسودة', 'Delete the draft')}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            {L('ستُحذف هذه المسودة نهائيًا.', 'This draft will be deleted permanently.')}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close} disabled={busy}>
              {L('تراجع', 'Back')}
            </Button>
            <Button variant="danger" onClick={onDelete} loading={busy}>
              {L('حذف', 'Delete')}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
