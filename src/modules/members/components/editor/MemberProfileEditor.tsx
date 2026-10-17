'use client';

import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useMemo, useState, useTransition, type ReactNode } from 'react';
import {
  Button,
  Chips,
  Field,
  FilterChip,
  Select,
  Switch,
  Textarea,
  useToast,
} from '@/components/ui';
import { Link, useRouter } from '@/i18n/navigation';
import {
  ACADEMIC_LABEL,
  ACADEMIC_STATUSES,
  type ReferenceOption,
} from '@/modules/membership/types';
import { setMemberStatus } from '../../actions';
import {
  LINK_KEYS,
  OPEN_TO_KEYS,
  type EditorData,
  type EditorProject,
  type EditorValues,
  type LinkKey,
} from '../../editor-shared';
import { completenessOf, type CompletenessCheck } from '../../completeness';
import {
  deleteMyProject,
  reorderMyProjects,
  saveMyProfilePart,
  saveMyProject,
  saveMySkills,
} from '../../profile-actions';
import type { DirectoryMember, PublicSkill } from '../../public';
import { PhotoUploader } from '../PhotoUploader';
import { CompletenessBar } from '../CompletenessBar';
import { DirectoryCard } from '../public/DirectoryCard';
import { SKILL_CATEGORY_LABEL } from '../public/members-copy';
import { EDITOR_COPY } from './editor-copy';

type Lang = 'ar' | 'en';
type Errors = Record<string, string>;

const LINK_LABEL: Record<LinkKey, string> = {
  linkedin_url: 'LinkedIn',
  github_url: 'GitHub',
  x_url: 'X',
  portfolio_url: 'Portfolio',
  website_url: 'Website',
  behance_url: 'Behance',
  dribbble_url: 'Dribbble',
  youtube_url: 'YouTube',
};

function Section({
  id,
  title,
  lede,
  children,
  footer,
}: {
  id: string;
  title: string;
  lede?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-4 rounded-shape-xl border border-line bg-surface p-5 md:p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 id={id} className="t-h3">
          {title}
        </h2>
        {lede && <p className="t-body-sm text-muted">{lede}</p>}
      </div>
      {children}
      {footer && (
        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">{footer}</div>
      )}
    </section>
  );
}

/**
 * The member's own profile editor (MEM-013): sections that each save on their own, a completeness meter and a live
 * preview of the directory card beside them. The database is the authority (every save goes through one function that
 * checks ownership and limits); this form only shapes what is sent and shows what came back.
 */
export function MemberProfileEditor({
  data,
  reference,
  catalog,
  lang,
}: {
  data: EditorData;
  reference: {
    universities: ReferenceOption[];
    majors: ReferenceOption[];
    tracks: ReferenceOption[];
  };
  catalog: PublicSkill[];
  lang: Lang;
}) {
  const t = EDITOR_COPY[lang];
  const en = lang === 'en';
  const toast = useToast();
  const router = useRouter();
  const [v, setV] = useState<EditorValues>(data.values);
  const [skills, setSkills] = useState<string[]>(data.skills);
  const [projects, setProjects] = useState<EditorProject[]>(data.projects);
  const [photoUrl, setPhotoUrl] = useState<string | null>(data.photoUrl);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [leaving, setLeaving] = useState(false);

  const set = <K extends keyof EditorValues>(k: K, value: EditorValues[K]) => {
    setV((x) => ({ ...x, [k]: value }));
    setErrors((e) => {
      const { [k as string]: _gone, ...rest } = e;
      return rest;
    });
  };
  const setLink = (k: LinkKey, value: string) => {
    setV((x) => ({ ...x, links: { ...x.links, [k]: value } }));
    setErrors((e) => {
      const { [k]: _gone, ...rest } = e;
      return rest;
    });
  };

  const run = (
    section: string,
    job: () => Promise<{ ok: boolean; message?: string; fieldErrors?: Errors }>,
  ) => {
    setBusy(section);
    startTransition(async () => {
      const r = await job();
      setBusy(null);
      if (!r.ok) {
        toast.error(r.message ?? '');
        if (r.fieldErrors) setErrors(r.fieldErrors);
        return;
      }
      toast.success(t.saved);
      router.refresh();
    });
  };

  const savePart = (section: string, keys: Array<keyof EditorValues | LinkKey>) => {
    const payload: Record<string, unknown> = {};
    for (const k of keys) {
      payload[k] = (LINK_KEYS as readonly string[]).includes(k)
        ? v.links[k as LinkKey]
        : v[k as keyof EditorValues];
    }
    run(section, () => saveMyProfilePart(payload, { lang }));
  };

  const name = (o: ReferenceOption) => (en ? o.nameEn || o.nameAr : o.nameAr);
  const bySlug = useMemo(() => new Map(catalog.map((s) => [s.slug, s])), [catalog]);
  const skillName = (slug: string) => {
    const s = bySlug.get(slug);
    return s ? (en ? s.nameEn : s.nameAr) : slug;
  };

  // ------------------------------------------------------------------------------------------ skills
  const toggleSkill = (slug: string) => {
    setSkills((cur) => {
      if (cur.includes(slug)) return cur.filter((s) => s !== slug);
      if (cur.length >= 12) {
        toast.error(t.skillsLimit);
        return cur;
      }
      return [...cur, slug];
    });
  };
  const move = <T,>(list: T[], i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return list;
    const next = [...list];
    [next[i], next[j]] = [next[j]!, next[i]!];
    return next;
  };
  const q = query.trim().toLowerCase();
  const groups = useMemo(() => {
    const out = new Map<string, PublicSkill[]>();
    for (const s of catalog) {
      if (q && !`${s.nameAr} ${s.nameEn}`.toLowerCase().includes(q)) continue;
      out.set(s.category, [...(out.get(s.category) ?? []), s]);
    }
    return [...out.entries()];
  }, [catalog, q]);

  // ------------------------------------------------------------------------------------------ projects
  const [form, setForm] = useState<(Omit<EditorProject, 'id'> & { id?: string }) | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const blank = { titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '', url: '' };

  const submitProject = () => {
    if (!form) return;
    setBusy('project');
    startTransition(async () => {
      const r = await saveMyProject(
        {
          id: form.id,
          title_ar: form.titleAr,
          title_en: form.titleEn,
          description_ar: form.descriptionAr,
          description_en: form.descriptionEn,
          url: form.url,
        },
        { lang },
      );
      setBusy(null);
      if (!r.ok) {
        toast.error(r.message);
        if (r.fieldErrors)
          setErrors({
            projectTitleAr: r.fieldErrors.title_ar ?? '',
            projectUrl: r.fieldErrors.url ?? '',
          });
        return;
      }
      const saved: EditorProject = { ...form, id: r.data.id };
      setProjects((cur) =>
        form.id ? cur.map((p) => (p.id === form.id ? saved : p)) : [...cur, saved],
      );
      setForm(null);
      setErrors({});
      toast.success(t.saved);
      router.refresh();
    });
  };
  const removeProject = (id: string) => {
    setBusy('project');
    startTransition(async () => {
      const r = await deleteMyProject(id, { lang });
      setBusy(null);
      setConfirmDelete(null);
      if (!r.ok) return void toast.error(r.message);
      setProjects((cur) => cur.filter((p) => p.id !== id));
      router.refresh();
    });
  };
  const moveProject = (i: number, d: -1 | 1) => {
    const next = move(projects, i, d);
    if (next === projects) return;
    const before = projects;
    setProjects(next);
    startTransition(async () => {
      const r = await reorderMyProjects(
        next.map((p) => p.id),
        { lang },
      );
      if (!r.ok) {
        setProjects(before);
        toast.error(r.message);
      }
    });
  };

  // ------------------------------------------------------------------------------------------ preview and meter
  const fullAr = [v.first_name_ar, v.middle_name_ar, v.last_name_ar].filter(Boolean).join(' ');
  const fullEn =
    [v.first_name_en, v.middle_name_en, v.last_name_en].filter(Boolean).join(' ') || fullAr;
  const links = Object.values(v.links).filter((x) => x.trim());
  const done = completenessOf({
    photoPath: photoUrl,
    headlineAr: v.headline_ar,
    headlineEn: v.headline_en,
    aboutAr: v.about_ar,
    aboutEn: v.about_en,
    skillCount: skills.length,
    links,
  });
  const preview: DirectoryMember = {
    id: data.id,
    nameAr: fullAr,
    nameEn: fullEn,
    headlineAr: v.show_headline ? v.headline_ar || null : null,
    headlineEn: v.show_headline ? v.headline_en || null : null,
    skillSlugs: v.show_skills ? skills : [],
    openTo: v.show_open_to ? v.open_to : [],
    committees: [],
    trackAr: null,
    trackEn: null,
    universityAr: null,
    universityEn: null,
    statusAr: null,
    statusEn: null,
    majorAr: null,
    majorEn: null,
    bioAr: null,
    bioEn: null,
    photo: v.show_photo ? photoUrl : null,
    thumb: v.show_photo ? photoUrl : null,
    links: {},
    joinedAt: data.joinedAt,
    legacyId: null,
  };
  const skillMap = bySlug;

  const parents = reference.majors.filter((m) => !m.parentId);
  const subs = reference.majors.filter((m) => m.parentId && String(m.parentId) === v.major_id);
  const saveBtn = (section: string, onClick: () => void) => (
    <Button type="button" loading={busy === section} onClick={onClick}>
      {t.save}
    </Button>
  );

  const toggles: Array<[keyof EditorValues, string]> = [
    ['show_photo', t.showPhoto],
    ['show_headline', t.showHeadline],
    ['show_about', t.showAbout],
    ['show_skills', t.showSkills],
    ['show_projects', t.showProjects],
    ['show_open_to', t.showOpenTo],
    ['show_university', t.showUniversity],
    ['show_track', t.showTrack],
    ['show_participation', t.showParticipation],
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <aside className="order-first flex flex-col gap-4 lg:order-last lg:sticky lg:top-24 lg:self-start">
        <div className="flex flex-col gap-3 rounded-shape-xl border border-line bg-surface p-5">
          <h2 className="t-h4">{t.completeness}</h2>
          <CompletenessBar percent={done.percent} label={t.completeness} />
          <p className="t-body-sm text-muted" aria-live="polite">
            {done.next ? `${t.nextStep}: ${t.checks[done.next as CompletenessCheck]}` : t.complete}
          </p>
        </div>
        <div className="flex flex-col gap-3 rounded-shape-xl border border-line bg-surface p-5">
          <h2 className="t-h4">{t.preview}</h2>
          {v.is_directory_visible ? (
            <div aria-hidden="true" className="pointer-events-none">
              <DirectoryCard member={preview} skills={skillMap} lang={lang} />
            </div>
          ) : (
            <p className="t-body-sm text-muted">{t.notListed}</p>
          )}
          <p className="t-body-sm text-muted">{t.previewNote}</p>
          <Link
            href={`/members/${data.id}`}
            className="t-body-sm font-semibold text-accent-text underline-offset-4 hover:underline"
          >
            {t.viewPublic}
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col gap-6">
        <p className="t-body text-muted">{t.lede}</p>

        <Section id="ed-photo" title={t.photoTitle}>
          <PhotoUploader
            lang={lang}
            name={en ? fullEn : fullAr}
            photoUrl={photoUrl}
            onSaved={(url, shown) => {
              setPhotoUrl(url);
              if (shown !== undefined) set('show_photo', shown);
              router.refresh();
            }}
            savedText={t.photoSaved}
            removedText={t.photoRemoved}
          />
        </Section>

        <Section
          id="ed-names"
          title={t.namesTitle}
          lede={t.namesLede}
          footer={saveBtn('names', () =>
            savePart('names', [
              'first_name_ar',
              'middle_name_ar',
              'last_name_ar',
              'first_name_en',
              'middle_name_en',
              'last_name_en',
            ]),
          )}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label={t.firstAr}
              value={v.first_name_ar}
              error={errors.first_name_ar}
              onChange={(e) => set('first_name_ar', e.target.value)}
              maxLength={60}
            />
            <Field
              label={t.middleAr}
              value={v.middle_name_ar}
              error={errors.middle_name_ar}
              onChange={(e) => set('middle_name_ar', e.target.value)}
              maxLength={60}
            />
            <Field
              label={t.lastAr}
              value={v.last_name_ar}
              error={errors.last_name_ar}
              onChange={(e) => set('last_name_ar', e.target.value)}
              maxLength={60}
            />
            <Field
              label={t.firstEn}
              value={v.first_name_en}
              dir="ltr"
              error={errors.first_name_en}
              onChange={(e) => set('first_name_en', e.target.value)}
              maxLength={60}
            />
            <Field
              label={t.middleEn}
              value={v.middle_name_en}
              dir="ltr"
              error={errors.middle_name_en}
              onChange={(e) => set('middle_name_en', e.target.value)}
              maxLength={60}
            />
            <Field
              label={t.lastEn}
              value={v.last_name_en}
              dir="ltr"
              error={errors.last_name_en}
              onChange={(e) => set('last_name_en', e.target.value)}
              maxLength={60}
            />
          </div>
        </Section>

        <Section
          id="ed-about"
          title={t.aboutTitle}
          footer={saveBtn('about', () =>
            savePart('about', ['headline_ar', 'headline_en', 'about_ar', 'about_en']),
          )}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t.headlineAr}
              value={v.headline_ar}
              hint={t.headlineHint}
              maxLength={80}
              error={errors.headline_ar}
              onChange={(e) => set('headline_ar', e.target.value)}
            />
            <Field
              label={t.headlineEn}
              value={v.headline_en}
              dir="ltr"
              maxLength={80}
              error={errors.headline_en}
              onChange={(e) => set('headline_en', e.target.value)}
            />
          </div>
          <Textarea
            label={t.aboutAr}
            value={v.about_ar}
            maxLength={1000}
            counter
            rows={4}
            error={errors.about_ar}
            onChange={(e) => set('about_ar', e.target.value)}
          />
          <Textarea
            label={t.aboutEn}
            value={v.about_en}
            maxLength={1000}
            counter
            rows={4}
            dir="ltr"
            error={errors.about_en}
            onChange={(e) => set('about_en', e.target.value)}
          />
        </Section>

        <Section
          id="ed-skills"
          title={t.skillsTitle}
          lede={t.skillsLede}
          footer={
            <>
              {saveBtn('skills', () => run('skills', () => saveMySkills(skills, { lang })))}
              <span className="t-body-sm tabular-nums text-muted" aria-live="polite">
                {t.skillsCount(skills.length)}
              </span>
            </>
          }
        >
          <div>
            <h3 className="t-h4 mb-2">{t.skillsChosen}</h3>
            {skills.length === 0 ? (
              <p className="t-body-sm text-muted">{t.skillsNone}</p>
            ) : (
              <ol className="flex flex-col gap-2">
                {skills.map((slug, i) => (
                  <li
                    key={slug}
                    className="flex items-center gap-2 rounded-shape-md bg-surface-raised px-3 py-1"
                  >
                    <span className="t-body-sm w-6 tabular-nums text-muted">{i + 1}</span>
                    <span className="t-body flex-1">{skillName(slug)}</span>
                    <button
                      type="button"
                      aria-label={`${t.moveUp}: ${skillName(slug)}`}
                      disabled={i === 0}
                      onClick={() => setSkills((c) => move(c, i, -1))}
                      className="flex size-11 items-center justify-center rounded-full disabled:opacity-40"
                    >
                      <ArrowUp aria-hidden="true" className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`${t.moveDown}: ${skillName(slug)}`}
                      disabled={i === skills.length - 1}
                      onClick={() => setSkills((c) => move(c, i, 1))}
                      className="flex size-11 items-center justify-center rounded-full disabled:opacity-40"
                    >
                      <ArrowDown aria-hidden="true" className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`${t.remove}: ${skillName(slug)}`}
                      onClick={() => toggleSkill(slug)}
                      className="flex size-11 items-center justify-center rounded-full"
                    >
                      <X aria-hidden="true" className="size-4" />
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <Field
            label={t.skillsSearch}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {groups.map(([cat, list]) => (
            <div key={cat}>
              <h3 className="t-body-sm mb-2 font-semibold text-muted">
                {SKILL_CATEGORY_LABEL[cat]?.[lang] ?? cat}
              </h3>
              <div className="flex flex-wrap gap-2">
                {list.map((s) => (
                  <FilterChip
                    key={s.slug}
                    pressed={skills.includes(s.slug)}
                    onClick={() => toggleSkill(s.slug)}
                  >
                    {en ? s.nameEn : s.nameAr}
                  </FilterChip>
                ))}
              </div>
            </div>
          ))}
        </Section>

        <Section
          id="ed-projects"
          title={t.projectsTitle}
          lede={t.projectsLede}
          footer={
            projects.length >= 6 ? (
              <p className="t-body-sm text-muted">{t.projectsFull}</p>
            ) : form ? null : (
              <Button type="button" variant="secondary" onClick={() => setForm({ ...blank })}>
                <Plus aria-hidden="true" className="size-4" />
                {t.projectAdd}
              </Button>
            )
          }
        >
          {projects.length === 0 && !form && (
            <p className="t-body-sm text-muted">{t.projectsNone}</p>
          )}
          <ul className="flex flex-col gap-2">
            {projects.map((p, i) => (
              <li
                key={p.id}
                className="flex items-center gap-2 rounded-shape-md bg-surface-raised px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="t-body truncate font-semibold">
                    {en ? p.titleEn || p.titleAr : p.titleAr}
                  </p>
                  <p className="t-body-sm truncate text-muted" dir="ltr">
                    {p.url}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`${t.moveUp}: ${p.titleAr}`}
                  disabled={i === 0}
                  onClick={() => moveProject(i, -1)}
                  className="flex size-11 items-center justify-center rounded-full disabled:opacity-40"
                >
                  <ArrowUp aria-hidden="true" className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={`${t.moveDown}: ${p.titleAr}`}
                  disabled={i === projects.length - 1}
                  onClick={() => moveProject(i, 1)}
                  className="flex size-11 items-center justify-center rounded-full disabled:opacity-40"
                >
                  <ArrowDown aria-hidden="true" className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={`${t.projectEdit}: ${p.titleAr}`}
                  onClick={() => setForm({ ...p })}
                  className="flex size-11 items-center justify-center rounded-full"
                >
                  <Pencil aria-hidden="true" className="size-4" />
                </button>
                {confirmDelete === p.id ? (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    loading={busy === 'project'}
                    onClick={() => removeProject(p.id)}
                  >
                    {t.projectDeleteSure}
                  </Button>
                ) : (
                  <button
                    type="button"
                    aria-label={`${t.projectDelete}: ${p.titleAr}`}
                    onClick={() => setConfirmDelete(p.id)}
                    className="flex size-11 items-center justify-center rounded-full"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {form && (
            <div className="flex flex-col gap-4 rounded-shape-lg border border-line-strong p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={t.projectTitleAr}
                  value={form.titleAr}
                  maxLength={80}
                  error={errors.projectTitleAr}
                  onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                />
                <Field
                  label={t.projectTitleEn}
                  value={form.titleEn}
                  maxLength={80}
                  dir="ltr"
                  onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                />
                <Field
                  label={t.projectDescAr}
                  value={form.descriptionAr}
                  maxLength={300}
                  onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })}
                />
                <Field
                  label={t.projectDescEn}
                  value={form.descriptionEn}
                  maxLength={300}
                  dir="ltr"
                  onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
                />
              </div>
              <Field
                label={t.projectUrl}
                value={form.url}
                type="url"
                placeholder="https://"
                error={errors.projectUrl}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
              <div className="flex gap-3">
                <Button type="button" loading={busy === 'project'} onClick={submitProject}>
                  {t.save}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setForm(null);
                    setErrors({});
                  }}
                >
                  {t.projectCancel}
                </Button>
              </div>
            </div>
          )}
        </Section>

        <Section
          id="ed-links"
          title={t.linksTitle}
          lede={t.linksLede}
          footer={saveBtn('links', () => savePart('links', [...LINK_KEYS]))}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {LINK_KEYS.map((k) => (
              <Field
                key={k}
                label={LINK_LABEL[k]}
                value={v.links[k]}
                dir="ltr"
                type="url"
                placeholder="https://"
                error={errors[k]}
                onChange={(e) => setLink(k, e.target.value)}
              />
            ))}
          </div>
        </Section>

        <Section
          id="ed-open"
          title={t.openTitle}
          lede={t.openLede}
          footer={saveBtn('open', () => savePart('open', ['open_to']))}
        >
          <div className="flex flex-wrap gap-2">
            {OPEN_TO_KEYS.map((k) => (
              <FilterChip
                key={k}
                pressed={v.open_to.includes(k)}
                onClick={() =>
                  set(
                    'open_to',
                    v.open_to.includes(k) ? v.open_to.filter((x) => x !== k) : [...v.open_to, k],
                  )
                }
              >
                {t.openToLabels[k]}
              </FilterChip>
            ))}
          </div>
        </Section>

        <Section
          id="ed-study"
          title={t.studyTitle}
          footer={saveBtn('study', () =>
            savePart('study', [
              'academic_status',
              'university_id',
              'major_id',
              'sub_major_id',
              'track_id',
            ]),
          )}
        >
          <Chips
            label={t.status}
            value={v.academic_status}
            options={ACADEMIC_STATUSES.map((s) => ({ value: s, label: ACADEMIC_LABEL[s][lang] }))}
            onChange={(x) => set('academic_status', x as string)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label={t.university}
              value={v.university_id}
              onChange={(e) => set('university_id', e.target.value)}
            >
              <option value="">—</option>
              {reference.universities.map((o) => (
                <option key={o.id} value={o.id}>
                  {name(o)}
                </option>
              ))}
            </Select>
            <Select
              label={t.track}
              value={v.track_id}
              onChange={(e) => set('track_id', e.target.value)}
            >
              <option value="">—</option>
              {reference.tracks.map((o) => (
                <option key={o.id} value={o.id}>
                  {name(o)}
                </option>
              ))}
            </Select>
            <Select
              label={t.major}
              value={v.major_id}
              onChange={(e) => setV((x) => ({ ...x, major_id: e.target.value, sub_major_id: '' }))}
            >
              <option value="">—</option>
              {parents.map((o) => (
                <option key={o.id} value={o.id}>
                  {name(o)}
                </option>
              ))}
            </Select>
            {subs.length > 0 && (
              <Select
                label={t.subMajor}
                value={v.sub_major_id}
                onChange={(e) => set('sub_major_id', e.target.value)}
              >
                <option value="">—</option>
                {subs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {name(o)}
                  </option>
                ))}
              </Select>
            )}
          </div>
        </Section>

        <Section
          id="ed-visibility"
          title={t.visibilityTitle}
          footer={saveBtn('visibility', () =>
            savePart('visibility', ['is_directory_visible', ...toggles.map(([k]) => k)]),
          )}
        >
          <Switch
            label={t.directory}
            hint={t.directoryHint}
            checked={v.is_directory_visible}
            onChange={(c) => set('is_directory_visible', c)}
          />
          {v.is_directory_visible && (
            <div className="flex flex-col gap-1 border-t border-line pt-3">
              {toggles.map(([k, label]) => (
                <Switch
                  key={k}
                  label={label}
                  checked={v[k] as boolean}
                  onChange={(c) => set(k, c as never)}
                />
              ))}
              <p className="t-body-sm text-muted">{t.showLinksNote}</p>
            </div>
          )}
        </Section>

        <div className="flex flex-wrap items-center gap-3">
          {leaving ? (
            <span className="flex items-center gap-2 text-sm">
              {t.leaveSure}
              <Button
                type="button"
                variant="danger"
                size="sm"
                loading={busy === 'leave'}
                onClick={() => {
                  setBusy('leave');
                  startTransition(async () => {
                    const r = await setMemberStatus({ id: data.id, status: 'inactive' }, { lang });
                    setBusy(null);
                    if (!r.ok) return void toast.error(r.message);
                    setLeaving(false);
                    router.refresh();
                  });
                }}
              >
                {t.leaveYes}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setLeaving(false)}>
                {t.back}
              </Button>
            </span>
          ) : (
            <Button type="button" variant="ghost" onClick={() => setLeaving(true)}>
              {t.leave}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
