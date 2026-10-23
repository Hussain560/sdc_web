'use client';

import { CircleAlert, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  Button,
  Chips,
  Dialog,
  Field,
  FilterChip,
  PhoneField,
  Select,
  Stepper,
  Textarea,
  useToast,
  type StepperStep,
} from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from '@/i18n/navigation';
import { toE164, type PhoneCountry } from '@/lib/phone';
import {
  ACADEMIC_LABEL,
  ACADEMIC_STATUSES,
  GENDERS,
  GENDER_LABEL,
  STUDY_YEARS,
  STUDY_YEAR_LABEL,
  type AcademicStatus,
  type ReferenceOption,
} from '@/modules/membership/types';
import {
  deleteMemberProjectByStaff,
  getMemberProjectsForStaff,
  saveMemberProjectByStaff,
  setMemberSkillsByStaff,
  updateMemberByStaff,
  type StaffProjectInput,
} from '../actions';
import { LINK_KEYS, OPEN_TO_KEYS, type LinkKey } from '../editor-shared';
import type { PublicSkill } from '../public';
import { SKILL_CATEGORY_LABEL } from './public/members-copy';

export type EditMemberValues = {
  firstNameAr: string;
  middleNameAr: string;
  lastNameAr: string;
  firstNameEn: string;
  middleNameEn: string;
  lastNameEn: string;
  phoneCountry: PhoneCountry;
  phone: string;
  academicStatus: AcademicStatus | '';
  /** Private; null when the viewer may not see it. */
  gender: 'male' | 'female' | '';
  studyYear: string;
  universityId: string;
  majorId: string;
  subMajorId: string;
  trackId: string;
  headlineAr: string;
  headlineEn: string;
  aboutAr: string;
  aboutEn: string;
  openTo: string[];
  links: Record<LinkKey, string>;
  /** Skill slugs, in order. */
  skills: string[];
};

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
const OPEN_LABEL: Record<(typeof OPEN_TO_KEYS)[number], { ar: string; en: string }> = {
  internship: { ar: 'تدريب', en: 'Internship' },
  job: { ar: 'وظيفة', en: 'Job' },
  freelance: { ar: 'عمل حر', en: 'Freelance' },
  mentoring: { ar: 'إرشاد', en: 'Mentoring' },
  speaking: { ar: 'تحدث', en: 'Speaking' },
  collaboration: { ar: 'تعاون', en: 'Collaboration' },
};
const MAX_SKILLS = 12;
const MAX_PROJECTS = 6;

type Step = 'identity' | 'study' | 'profile' | 'work';
const STEPS: Step[] = ['identity', 'study', 'profile', 'work'];
type Project = StaffProjectInput & { id?: string };
const blankProject: Project = {
  title_ar: '',
  title_en: '',
  description_ar: '',
  description_en: '',
  url: '',
};

/**
 * Leadership edits a member in four steps (owner decision after Q-M8): identity and phone, study, the public text of
 * the profile (headline, about, open to, links), and skills and projects. The visibility switches and the photo stay
 * with the member. Steps one to three and the skills are saved by "Save"; projects are saved one by one as they are
 * added, so a project is never lost by closing the window. Every change is audited by the database functions.
 */
export function EditMemberDialog({
  memberId,
  initial,
  reference,
  skillCatalog,
  canEditPhone,
}: {
  memberId: string;
  initial: EditMemberValues;
  reference: {
    universities: ReferenceOption[];
    majors: ReferenceOption[];
    tracks: ReferenceOption[];
  };
  skillCatalog: PublicSkill[];
  /** Needs members.view_contact: the phone is contact data. */
  canEditPhone: boolean;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(initial);
  const [step, setStep] = useState(0);
  const [reached, setReached] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const heading = useRef<HTMLHeadingElement>(null);

  const [projects, setProjects] = useState<Project[] | null>(null);
  const [form, setForm] = useState<Project | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const set = <K extends keyof EditMemberValues>(k: K, value: EditMemberValues[K]) => {
    setV((p) => ({ ...p, [k]: value }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };
  const name = (o: ReferenceOption) => (ar ? o.nameAr : o.nameEn || o.nameAr);

  const stepLabel: Record<Step, string> = {
    identity: L('الهوية والتواصل', 'Identity and contact'),
    study: L('الدراسة', 'Study'),
    profile: L('الملف العام', 'Public profile'),
    work: L('المهارات والمشاريع', 'Skills and projects'),
  };
  const stepperSteps: StepperStep[] = STEPS.map((s) => ({
    label: stepLabel[s],
    error: STEPS.indexOf(s) < reached && stepHasError(s, errors),
  }));

  useEffect(() => {
    if (open) heading.current?.focus();
  }, [step, open]);

  // The projects are read when the last step is first opened.
  useEffect(() => {
    if (!open || STEPS[step] !== 'work' || projects !== null) return;
    void getMemberProjectsForStaff(memberId, { lang }).then((r) => setProjects(r.ok ? r.data : []));
  }, [open, step, projects, memberId, lang]);

  const skillName = (slug: string) => {
    const s = skillCatalog.find((x) => x.slug === slug);
    return s ? (ar ? s.nameAr : s.nameEn) : slug;
  };
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = new Map<string, PublicSkill[]>();
    for (const s of skillCatalog) {
      if (q && !`${s.nameAr} ${s.nameEn}`.toLowerCase().includes(q)) continue;
      out.set(s.category, [...(out.get(s.category) ?? []), s]);
    }
    return [...out.entries()];
  }, [skillCatalog, query]);
  const toggleSkill = (slug: string) =>
    setV((p) => {
      if (p.skills.includes(slug)) return { ...p, skills: p.skills.filter((x) => x !== slug) };
      if (p.skills.length >= MAX_SKILLS) {
        toast.error(L(`الحد الأقصى ${MAX_SKILLS} مهارة.`, `At most ${MAX_SKILLS} skills.`));
        return p;
      }
      return { ...p, skills: [...p.skills, slug] };
    });

  function validate(s: Step): Record<string, string> {
    const found: Record<string, string> = {};
    if (s === 'identity') {
      if (!v.firstNameAr.trim())
        found.firstNameAr = L('اكتب الاسم الأول بالعربية.', 'Enter the first name in Arabic.');
      if (!v.lastNameAr.trim())
        found.lastNameAr = L('اكتب الاسم الأخير بالعربية.', 'Enter the last name in Arabic.');
      if (canEditPhone && v.phone && !toE164(v.phoneCountry, v.phone))
        found.phone = L(
          'رقم الجوال غير صحيح لهذه الدولة.',
          'This phone number is not valid for the country.',
        );
    }
    if (s === 'study' && !v.academicStatus)
      found.academicStatus = L('اختر الحالة.', 'Choose the status.');
    if (s === 'profile') {
      for (const k of LINK_KEYS)
        if (v.links[k] && !/^https:\/\/\S+$/.test(v.links[k]))
          found[k] = L('يجب أن يبدأ الرابط بـ https://', 'The link must start with https://');
      if (v.headlineAr.length > 80)
        found.headlineAr = L('النص طويل جدًا.', 'The text is too long.');
      if (v.headlineEn.length > 80)
        found.headlineEn = L('النص طويل جدًا.', 'The text is too long.');
    }
    return found;
  }

  const go = (n: number) => {
    setStep(n);
    setReached((r) => Math.max(r, n));
  };
  const next = () => {
    const found = validate(STEPS[step]!);
    setErrors((e) => ({ ...e, ...found }));
    if (Object.keys(found).length === 0) go(step + 1);
  };

  const save = () => {
    // Check every step again, so a step that was skipped cannot send bad data.
    let all: Record<string, string> = {};
    for (const s of STEPS) all = { ...all, ...validate(s) };
    setErrors(all);
    const firstBad = STEPS.findIndex((s) => Object.keys(validate(s)).length > 0);
    if (firstBad >= 0) return go(firstBad);
    const phone = v.phone ? toE164(v.phoneCountry, v.phone) : '';
    startTransition(async () => {
      const r = await updateMemberByStaff(
        memberId,
        {
          firstNameAr: v.firstNameAr,
          middleNameAr: v.middleNameAr,
          lastNameAr: v.lastNameAr,
          firstNameEn: v.firstNameEn,
          middleNameEn: v.middleNameEn,
          lastNameEn: v.lastNameEn,
          ...(canEditPhone ? { phone: phone ?? '' } : {}),
          academicStatus: v.academicStatus as 'student',
          gender: v.gender,
          studyYear: v.studyYear,
          universityId: v.universityId,
          majorId: v.majorId,
          subMajorId: v.subMajorId,
          trackId: v.trackId,
          headlineAr: v.headlineAr,
          headlineEn: v.headlineEn,
          aboutAr: v.aboutAr,
          aboutEn: v.aboutEn,
          openTo: v.openTo as never,
          links: v.links,
        },
        { lang },
      );
      if (!r.ok) {
        setErrors(r.fieldErrors ?? {});
        toast.error(r.message);
        return;
      }
      if (v.skills.join(',') !== initial.skills.join(',')) {
        const s = await setMemberSkillsByStaff(memberId, v.skills, { lang });
        if (!s.ok) {
          toast.error(s.message);
          return;
        }
      }
      toast.success(
        L('حُفظت البيانات. سُجّل التعديل في السجل.', 'Saved. The change is in the log.'),
      );
      setOpen(false);
      router.refresh();
    });
  };

  const saveProject = () => {
    if (!form) return;
    setProjectError(null);
    startTransition(async () => {
      const r = await saveMemberProjectByStaff(memberId, form, { lang });
      if (!r.ok) {
        setProjectError(
          L(
            'تحقق من العنوان والرابط (يبدأ بـ https://).',
            'Check the title and the link (https://).',
          ),
        );
        return;
      }
      const list = await getMemberProjectsForStaff(memberId, { lang });
      setProjects(list.ok ? list.data : projects);
      setForm(null);
      toast.success(L('حُفظ المشروع.', 'Project saved.'));
      router.refresh();
    });
  };
  const removeProject = (p: Project) =>
    startTransition(async () => {
      if (!p.id) return;
      const r = await deleteMemberProjectByStaff(memberId, p.id, { lang });
      if (!r.ok) return void toast.error(r.message);
      setProjects((cur) => (cur ?? []).filter((x) => x.id !== p.id));
      toast.success(L('حُذف المشروع.', 'Project deleted.'));
      router.refresh();
    });

  const last = step === STEPS.length - 1;

  const body: Record<Step, React.ReactNode> = {
    identity: (
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Field
              label={L('الاسم الأول (بالعربية)', 'First name (Arabic)')}
              value={v.firstNameAr}
              onChange={(e) => set('firstNameAr', e.target.value)}
              error={errors.firstNameAr}
              dir="rtl"
              maxLength={100}
            />
            <Field
              label={L('الاسم الأوسط (بالعربية)', 'Middle name (Arabic)')}
              value={v.middleNameAr}
              onChange={(e) => set('middleNameAr', e.target.value)}
              dir="rtl"
              maxLength={100}
            />
            <Field
              label={L('الاسم الأخير (بالعربية)', 'Last name (Arabic)')}
              value={v.lastNameAr}
              onChange={(e) => set('lastNameAr', e.target.value)}
              error={errors.lastNameAr}
              dir="rtl"
              maxLength={100}
            />
          </div>
          <div className="flex flex-col gap-4">
            <Field
              label="First name (English)"
              value={v.firstNameEn}
              onChange={(e) => set('firstNameEn', e.target.value)}
              dir="ltr"
              maxLength={100}
            />
            <Field
              label="Middle name (English)"
              value={v.middleNameEn}
              onChange={(e) => set('middleNameEn', e.target.value)}
              dir="ltr"
              maxLength={100}
            />
            <Field
              label="Last name (English)"
              value={v.lastNameEn}
              onChange={(e) => set('lastNameEn', e.target.value)}
              dir="ltr"
              maxLength={100}
            />
          </div>
        </div>
        {canEditPhone && (
          <Chips
            label={L('الجنس', 'Gender')}
            value={v.gender}
            options={GENDERS.map((g) => ({ value: g, label: GENDER_LABEL[g][lang] }))}
            onChange={(x) => set('gender', x as 'male' | 'female')}
          />
        )}
        {canEditPhone && (
          <PhoneField
            label={L('الجوال', 'Phone')}
            optionalLabel={L('اختياري', 'optional')}
            country={v.phoneCountry}
            onCountryChange={(c) => set('phoneCountry', c)}
            value={v.phone}
            onChange={(d) => set('phone', d)}
            lang={lang}
            countryLabel={L('رمز الدولة', 'Country calling code')}
            error={errors.phone}
          />
        )}
      </div>
    ),
    study: (
      <div className="flex flex-col gap-5">
        <Chips
          label={L('الحالة', 'Status')}
          value={v.academicStatus}
          options={ACADEMIC_STATUSES.map((s) => ({ value: s, label: ACADEMIC_LABEL[s][lang] }))}
          onChange={(x) => set('academicStatus', x)}
          error={errors.academicStatus}
        />
        {v.academicStatus === 'student' && (
          <Select
            label={L('السنة الدراسية', 'Year of study')}
            value={v.studyYear}
            onChange={(e) => set('studyYear', e.target.value)}
          >
            <option value="">—</option>
            {STUDY_YEARS.map((y) => (
              <option key={y} value={y}>
                {STUDY_YEAR_LABEL[y][lang]}
              </option>
            ))}
          </Select>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label={L('الجامعة', 'University')}
            value={v.universityId}
            onChange={(e) => set('universityId', e.target.value)}
          >
            <option value="">—</option>
            {reference.universities.map((o) => (
              <option key={o.id} value={o.id}>
                {name(o)}
              </option>
            ))}
          </Select>
          <Select
            label={L('المسار', 'Track')}
            value={v.trackId}
            onChange={(e) => set('trackId', e.target.value)}
          >
            <option value="">—</option>
            {reference.tracks.map((o) => (
              <option key={o.id} value={o.id}>
                {name(o)}
              </option>
            ))}
          </Select>
          <Select
            label={L('التخصص', 'Major')}
            value={v.majorId}
            onChange={(e) => {
              set('majorId', e.target.value);
              set('subMajorId', '');
            }}
          >
            <option value="">—</option>
            {reference.majors
              .filter((o) => !o.parentId)
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {name(o)}
                </option>
              ))}
          </Select>
          <Select
            label={L('التخصص الفرعي', 'Sub-major')}
            value={v.subMajorId}
            onChange={(e) => set('subMajorId', e.target.value)}
            disabled={!v.majorId}
          >
            <option value="">—</option>
            {reference.majors
              .filter((o) => o.parentId && String(o.parentId) === v.majorId)
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {name(o)}
                </option>
              ))}
          </Select>
        </div>
      </div>
    ),
    profile: (
      <div className="flex flex-col gap-5">
        <p className="rounded-shape-lg bg-surface-raised p-3 text-sm text-muted">
          {L(
            'تعدّل هنا نص الملف العام. ما يظهر منه في الدليل يقرّره العضو بمفاتيح الظهور، ولا يتغير هنا.',
            'You edit the text of the public profile here. What shows in the directory is the member’s choice and does not change here.',
          )}
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label={L('العنوان المهني (بالعربية)', 'Headline (Arabic)')}
            value={v.headlineAr}
            onChange={(e) => set('headlineAr', e.target.value)}
            error={errors.headlineAr}
            dir="rtl"
            maxLength={80}
          />
          <Field
            label="Headline (English)"
            value={v.headlineEn}
            onChange={(e) => set('headlineEn', e.target.value)}
            error={errors.headlineEn}
            dir="ltr"
            maxLength={80}
          />
          <Textarea
            label={L('النبذة (بالعربية)', 'About (Arabic)')}
            value={v.aboutAr}
            onChange={(e) => set('aboutAr', e.target.value)}
            dir="rtl"
            rows={4}
            maxLength={1000}
            counter
          />
          <Textarea
            label="About (English)"
            value={v.aboutEn}
            onChange={(e) => set('aboutEn', e.target.value)}
            dir="ltr"
            rows={4}
            maxLength={1000}
            counter
          />
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">{L('متاح لـ', 'Open to')}</legend>
          <div className="flex flex-wrap gap-2">
            {OPEN_TO_KEYS.map((k) => (
              <FilterChip
                key={k}
                pressed={v.openTo.includes(k)}
                onClick={() =>
                  set(
                    'openTo',
                    v.openTo.includes(k) ? v.openTo.filter((x) => x !== k) : [...v.openTo, k],
                  )
                }
              >
                {OPEN_LABEL[k][lang]}
              </FilterChip>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 md:grid-cols-2">
          {LINK_KEYS.map((k) => (
            <Field
              key={k}
              label={LINK_LABEL[k]}
              value={v.links[k]}
              onChange={(e) => set('links', { ...v.links, [k]: e.target.value })}
              error={errors[k]}
              dir="ltr"
              type="url"
              placeholder="https://"
            />
          ))}
        </div>
      </div>
    ),
    work: (
      <div className="flex flex-col gap-7">
        <section aria-labelledby="ed-skills" className="flex flex-col gap-3">
          <h4 id="ed-skills" className="font-bold">
            {L(
              `المهارات (${v.skills.length}/${MAX_SKILLS})`,
              `Skills (${v.skills.length}/${MAX_SKILLS})`,
            )}
          </h4>
          {v.skills.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {v.skills.map((slug) => (
                <li
                  key={slug}
                  className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1 text-sm"
                >
                  {skillName(slug)}
                  <button
                    type="button"
                    aria-label={`${L('إزالة', 'Remove')} ${skillName(slug)}`}
                    onClick={() => toggleSkill(slug)}
                    className="flex size-6 items-center justify-center rounded-full hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-focus-ring"
                  >
                    <X size={13} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Field
            label={L('ابحث في المهارات', 'Search skills')}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="max-h-56 overflow-y-auto pe-1">
            {groups.map(([cat, list]) => (
              <div key={cat} className="mb-3">
                <p className="mb-1.5 text-sm font-semibold text-muted">
                  {SKILL_CATEGORY_LABEL[cat]?.[lang] ?? cat}
                </p>
                <div className="flex flex-wrap gap-2">
                  {list.map((s) => (
                    <FilterChip
                      key={s.slug}
                      pressed={v.skills.includes(s.slug)}
                      onClick={() => toggleSkill(s.slug)}
                    >
                      {ar ? s.nameAr : s.nameEn}
                    </FilterChip>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="ed-projects" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h4 id="ed-projects" className="font-bold">
              {L(
                `المشاريع (${projects?.length ?? '…'}/${MAX_PROJECTS})`,
                `Projects (${projects?.length ?? '…'}/${MAX_PROJECTS})`,
              )}
            </h4>
            {!form && (projects?.length ?? 0) < MAX_PROJECTS && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                iconStart={<Plus size={14} aria-hidden="true" />}
                onClick={() => setForm({ ...blankProject })}
              >
                {L('مشروع جديد', 'New project')}
              </Button>
            )}
          </div>
          <p className="text-sm text-muted">
            {L(
              'تُحفظ المشاريع فور إضافتها أو تعديلها، ولا تحتاج إلى «حفظ».',
              'Projects are saved as soon as you add or edit them; they do not wait for “Save”.',
            )}
          </p>
          {projects === null ? (
            <p role="status" className="text-sm text-muted">
              {L('جارٍ التحميل…', 'Loading…')}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {projects.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-shape-lg bg-surface-raised p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {ar ? p.title_ar : p.title_en || p.title_ar}
                    </p>
                    <p dir="ltr" className="truncate text-start text-xs text-muted">
                      {p.url}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`${L('تعديل', 'Edit')} ${p.title_ar}`}
                    onClick={() => setForm({ ...p })}
                  >
                    <Pencil size={15} aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`${L('حذف', 'Delete')} ${p.title_ar}`}
                    disabled={pending}
                    onClick={() => removeProject(p)}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </Button>
                </li>
              ))}
              {projects.length === 0 && !form && (
                <li className="text-sm text-muted">{L('لا مشاريع بعد.', 'No projects yet.')}</li>
              )}
            </ul>
          )}
          {form && (
            <div className="m-pop flex flex-col gap-3 rounded-shape-xl border border-line-accent p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field
                  label={L('العنوان (بالعربية)', 'Title (Arabic)')}
                  value={form.title_ar}
                  onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
                  dir="rtl"
                  maxLength={80}
                />
                <Field
                  label="Title (English)"
                  value={form.title_en}
                  onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                  dir="ltr"
                  maxLength={80}
                />
                <Textarea
                  label={L('الوصف (بالعربية)', 'Description (Arabic)')}
                  value={form.description_ar}
                  onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
                  dir="rtl"
                  rows={2}
                  maxLength={300}
                />
                <Textarea
                  label="Description (English)"
                  value={form.description_en}
                  onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                  dir="ltr"
                  rows={2}
                  maxLength={300}
                />
              </div>
              <Field
                label={L('رابط المشروع', 'Project link')}
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                dir="ltr"
                type="url"
                placeholder="https://"
              />
              {projectError && (
                <p role="alert" className="flex items-center gap-2 text-sm text-danger">
                  <CircleAlert size={15} aria-hidden="true" />
                  {projectError}
                </p>
              )}
              <div className="flex gap-2">
                <Button type="button" size="sm" loading={pending} onClick={saveProject}>
                  {L('حفظ المشروع', 'Save the project')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setForm(null);
                    setProjectError(null);
                  }}
                >
                  {L('إلغاء', 'Cancel')}
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    ),
  };

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          setV(initial);
          setErrors({});
          setStep(0);
          setReached(0);
          setProjects(null);
          setForm(null);
          setOpen(true);
        }}
      >
        <Pencil size={16} aria-hidden="true" />
        {L('تعديل البيانات', 'Edit data')}
      </Button>
      <Dialog
        open={open}
        onClose={() => (pending ? undefined : setOpen(false))}
        title={L('تعديل بيانات العضو', 'Edit member data')}
        description={L(
          'الاسم والدراسة والملف العام والمهارات والمشاريع. يُسجَّل كل تعديل، والصورة ومفاتيح الظهور للعضو وحده.',
          'Name, study, public profile, skills and projects. Every change is logged; the photo and the visibility switches belong to the member.',
        )}
        presentation="sheet"
        size="md"
        closeLabel={L('إغلاق', 'Close')}
        busy={pending}
        className="w-[min(46rem,calc(100vw-2rem))] max-md:min-h-dvh max-md:rounded-none max-h-[90dvh] overflow-y-auto"
        footer={
          <>
            <span className="t-body-sm me-auto text-muted">
              {L(`الخطوة ${step + 1} من ${STEPS.length}`, `Step ${step + 1} of ${STEPS.length}`)}
            </span>
            {step > 0 ? (
              <Button type="button" variant="ghost" onClick={() => go(step - 1)} disabled={pending}>
                {L('السابق', 'Back')}
              </Button>
            ) : (
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                {L('إلغاء', 'Cancel')}
              </Button>
            )}
            {last ? (
              <Button type="button" onClick={save} loading={pending}>
                {L('حفظ', 'Save')}
              </Button>
            ) : (
              <>
                <Button type="button" variant="secondary" onClick={save} loading={pending}>
                  {L('حفظ الآن', 'Save now')}
                </Button>
                <Button type="button" onClick={next}>
                  {L('التالي', 'Next')}
                </Button>
              </>
            )}
          </>
        }
      >
        <div className="flex flex-col gap-6">
          <Stepper
            steps={stepperSteps}
            current={step + 1}
            maxReached={reached + 1}
            onSelect={(n) => go(n - 1)}
            labelOf={(n, total, label) =>
              L(`الخطوة ${n} من ${total}: ${label}`, `Step ${n} of ${total}: ${label}`)
            }
            navLabel={L('خطوات التعديل', 'Edit steps')}
          />
          <div>
            <h3 ref={heading} tabIndex={-1} className="t-h3 mb-4 outline-none">
              {stepLabel[STEPS[step]!]}
            </h3>
            <div key={step} className="m-pop">
              {body[STEPS[step]!]}
            </div>
            {Object.values(errors).some(Boolean) && (
              <p role="alert" className="mt-4 flex items-center gap-2 text-sm text-danger">
                <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
                {L('يرجى مراجعة الحقول المحددة.', 'Please review the highlighted fields.')}
              </p>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
}

/** Which step an error belongs to (for the red mark on the stepper). */
function stepHasError(s: Step, errors: Record<string, string>) {
  const keys: Record<Step, string[]> = {
    identity: ['firstNameAr', 'lastNameAr', 'phone'],
    study: ['academicStatus'],
    profile: ['headlineAr', 'headlineEn', ...LINK_KEYS],
    work: [],
  };
  return keys[s].some((k) => !!errors[k]);
}
