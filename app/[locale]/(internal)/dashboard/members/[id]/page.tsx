import { nowMs } from '@/lib/now';
import { CalendarClock, ExternalLink, Eye, EyeOff, Mail, Phone } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Avatar, Badge, EmptyState, Tabs, type TabItem } from '@/components/ui';
import { Timeline } from '@/components/patterns/Timeline';
import { SetCrumbs } from '@/components/layout/DashboardShell/Crumbs';
import { Forbidden } from '@/components/layout/Forbidden';
import { Link } from '@/i18n/navigation';
import { can, canGlobal } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { splitInternational, DEFAULT_PHONE_COUNTRY } from '@/lib/phone';
import { listCommittees, listPermissionLabels, listRoles } from '@/modules/access/admin-queries';
import { AssignRoleDialog } from '@/modules/access/components/AssignRoleDialog';
import { getAccess } from '@/modules/access/queries';
import { PROTECTED_GLOBAL_ROLES } from '@/modules/access/types';
import { getAdminMember } from '@/modules/members/admin-queries';
import { COMPLETENESS_CHECKS, MIN_SKILLS, completenessOf } from '@/modules/members/completeness';
import { CompletenessBar } from '@/modules/members/components/CompletenessBar';
import { EditMemberDialog } from '@/modules/members/components/EditMemberDialog';
import { MemberActions } from '@/modules/members/components/MemberActions';
import { memberPhotoUrl, memberThumbUrl } from '@/modules/members/photo-url';
import { END_REASON_LABEL, MEMBER_STATUS_LABEL } from '@/modules/members/schemas';
import { MemberTermCards } from '@/modules/members/components/MemberTermCards';
import { MemberNoteForm } from '@/modules/members/components/MemberNoteForm';
import { buildMemberTimeline, type TimelineFilter } from '@/modules/members/member-timeline';
import { ACADEMIC_LABEL, type AcademicStatus } from '@/modules/membership/types';
import { getReferenceData } from '@/modules/membership/queries';

type Search = { tab?: string; f?: string };
const TABS = ['timeline', 'profile', 'positions', 'participation', 'requests', 'log'] as const;
type TabKey = (typeof TABS)[number];

const VIA = {
  application: { ar: 'طلب عضوية', en: 'Application' },
  legacy: { ar: 'نُقل من الموقع السابق', en: 'Moved from the old site' },
  manual: { ar: 'أضافه فريق القيادة', en: 'Added by leadership' },
} as const;

const SHOW_LABEL: Record<string, { ar: string; en: string }> = {
  photo: { ar: 'الصورة', en: 'Photo' },
  headline: { ar: 'العنوان', en: 'Headline' },
  about: { ar: 'النبذة', en: 'About' },
  skills: { ar: 'المهارات', en: 'Skills' },
  projects: { ar: 'المشاريع', en: 'Projects' },
  open_to: { ar: 'متاح لـ', en: 'Open to' },
  university: { ar: 'الجامعة والتخصص', en: 'University and major' },
  track: { ar: 'المسار', en: 'Track' },
  links: { ar: 'الروابط', en: 'Links' },
  participation: { ar: 'الفعاليات', en: 'Events' },
};

const OPEN_TO_LABEL: Record<string, { ar: string; en: string }> = {
  internship: { ar: 'تدريب', en: 'Internship' },
  job: { ar: 'وظيفة', en: 'Job' },
  freelance: { ar: 'عمل حر', en: 'Freelance' },
  mentoring: { ar: 'إرشاد', en: 'Mentoring' },
  speaking: { ar: 'التحدث في الفعاليات', en: 'Speaking' },
  collaboration: { ar: 'تعاون في مشروع', en: 'Collaboration' },
};

const ACTION_LABEL: Record<string, { ar: string; en: string }> = {
  'member.created': { ar: 'أُنشئ العضو', en: 'Member created' },
  'member.profile_updated': { ar: 'حدّث العضو ملفه', en: 'Member updated their profile' },
  'member.updated_by_staff': { ar: 'صحّحت القيادة البيانات', en: 'Leadership corrected the data' },
  'member.photo_updated': { ar: 'غيّر العضو صورته', en: 'Member changed the photo' },
  'member.photo_removed': { ar: 'حذف العضو صورته', en: 'Member removed the photo' },
  'member.skills_updated': { ar: 'حدّث العضو مهاراته', en: 'Member updated their skills' },
  'role.assigned': { ar: 'عُيّن في منصب', en: 'Position assigned' },
  'role.ended': { ar: 'انتهى منصب', en: 'Position ended' },
};

const REG_STATUS: Record<string, { ar: string; en: string }> = {
  pending: { ar: 'قيد المراجعة', en: 'Pending' },
  accepted: { ar: 'مقبول', en: 'Accepted' },
  rejected: { ar: 'مرفوض', en: 'Rejected' },
  waitlisted: { ar: 'قائمة الانتظار', en: 'Waiting list' },
  cancelled: { ar: 'ملغى', en: 'Cancelled' },
};

// MEM-015 (Sprint 17): everything leadership knows about one member, in one place.
export default async function MemberAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Search>;
}) {
  const { locale, id } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  await requireUser(`/dashboard/members/${id}`);
  const access = await getAccess();
  if (!access || !(canGlobal(access, 'members.view') || canGlobal(access, 'members.manage')))
    return <Forbidden />;
  const sp = await searchParams;
  const tab: TabKey = (TABS as readonly string[]).includes(sp.tab ?? '')
    ? (sp.tab as TabKey)
    : 'timeline';

  const detail = await getAdminMember(id);
  if (!detail) notFound();
  const { member: m, account } = detail;

  const canManage = can(access, 'members.manage');
  const canBlock = can(access, 'users.block');
  const canCreate = can(access, 'members.create');
  const canAssign = can(access, 'roles.assign');
  const isAdmin = access.positions.some((p) => p.role === 'system_admin');
  const [reference, committees, roles, labels] = await Promise.all([
    getReferenceData(),
    canAssign ? listCommittees() : Promise.resolve([]),
    canAssign ? listRoles() : Promise.resolve([]),
    canAssign ? listPermissionLabels() : Promise.resolve({}),
  ]);
  const grantable = roles.filter((r) => isAdmin || !PROTECTED_GLOBAL_ROLES.includes(r.key));

  const nameAr = [m.firstNameAr, m.middleNameAr, m.lastNameAr].filter(Boolean).join(' ');
  const nameEn = [m.firstNameEn, m.middleNameEn, m.lastNameEn].filter(Boolean).join(' ') || null;
  const name = ar ? nameAr : (nameEn ?? nameAr);
  const headline = ar ? m.headlineAr || m.headlineEn : m.headlineEn || m.headlineAr;
  const about = ar ? m.aboutAr || m.aboutEn : m.aboutEn || m.aboutAr;
  const photo = memberPhotoUrl(m.photoPath);
  const active = detail.positions.filter((p) => p.active);
  const top = active[0];
  const daysLeft = m.termEndsAt
    ? Math.ceil((Date.parse(m.termEndsAt) - nowMs()) / 86_400_000)
    : null;
  const endingSoon = m.status === 'active' && daysLeft !== null && daysLeft <= 30;
  const st = !account
    ? { tone: 'warning' as const, text: L('لم يُربط بحساب', 'Not linked') }
    : account.blocked
      ? { tone: 'danger' as const, text: L('الحساب محظور', 'Account blocked') }
      : m.status === 'active' && !account.activated
        ? { tone: 'info' as const, text: L('بانتظار التفعيل', 'Waiting to activate') }
        : { tone: MEMBER_STATUS_LABEL[m.status].tone, text: MEMBER_STATUS_LABEL[m.status][lang] };
  const filter: TimelineFilter = sp.f === 'decisions' || sp.f === 'positions' ? sp.f : 'all';
  const timelineItems = buildMemberTimeline(detail, lang, filter);
  const filterHref = (f: string) => (f === 'all' ? '?' : `?f=${f}`);

  const completeness = completenessOf({
    photoPath: m.photoPath,
    headlineAr: m.headlineAr,
    headlineEn: m.headlineEn,
    aboutAr: m.aboutAr,
    aboutEn: m.aboutEn,
    skillCount: detail.skills.length,
    links: Object.values(m.links),
  });
  const missingLabel: Record<(typeof COMPLETENESS_CHECKS)[number], string> = {
    photo: L('صورة', 'a photo'),
    headline: L('عنوان مهني', 'a headline'),
    about: L('نبذة', 'an about text'),
    skills: L(`${MIN_SKILLS} مهارات على الأقل`, `at least ${MIN_SKILLS} skills`),
    links: L('رابط واحد', 'one link'),
  };

  const tabHref = (k: TabKey) => (k === 'timeline' ? '?' : `?tab=${k}`);
  const tabs: TabItem[] = [
    { key: 'timeline', label: L('السجل الكامل', 'Full history'), href: tabHref('timeline') },
    { key: 'profile', label: L('الملف', 'Profile'), href: tabHref('profile') },
    {
      key: 'positions',
      label: L('اللجان والمناصب', 'Committees and positions'),
      href: tabHref('positions'),
      count: detail.positions.length,
    },
    {
      key: 'participation',
      label: L('المشاركة', 'Participation'),
      href: tabHref('participation'),
      count: detail.registrations.length,
    },
    {
      key: 'requests',
      label: L('الطلبات', 'Requests'),
      href: tabHref('requests'),
      count: detail.applications.length,
    },
    { key: 'log', label: L('سجل التدقيق', 'Audit log'), href: tabHref('log') },
  ];

  const card = 'rounded-xl border border-line bg-surface p-5';
  const row = (label: string, value: React.ReactNode) => (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-end text-sm">{value || '—'}</dd>
    </div>
  );
  const linkEntries = Object.entries(m.links).filter(([, v]) => !!v) as Array<[string, string]>;
  const phoneParts = splitInternational(account?.phone);

  return (
    <>
      <SetCrumbs items={[{ label: name }]} />

      <header className={`${card} mb-5 flex flex-wrap items-start justify-between gap-5`}>
        <div className="flex min-w-0 items-start gap-5">
          <Avatar name={name} src={photo} size={72} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="t-h3">{name}</h1>
              <Badge tone={st.tone}>{st.text}</Badge>
              {endingSoon && daysLeft !== null && (
                <Badge tone="warning" icon={<CalendarClock />}>
                  {L(
                    `تنتهي بعد ${Math.max(0, daysLeft)} يوماً`,
                    `Ends in ${Math.max(0, daysLeft)} days`,
                  )}
                </Badge>
              )}
              {m.status === 'ended' && m.endReason && (
                <Badge>{END_REASON_LABEL[m.endReason]?.[lang] ?? m.endReason}</Badge>
              )}
              {detail.leaveRequest && (
                <Badge tone="info">{L('طلب مغادرة معلّق', 'Leave request pending')}</Badge>
              )}
              <Badge tone="neutral" icon={m.listed ? <Eye /> : <EyeOff />}>
                {m.listed
                  ? L('ظاهر في الدليل', 'Visible in the directory')
                  : L('مخفي من الدليل', 'Hidden from the directory')}
              </Badge>
            </div>
            {ar && nameEn && (
              <p dir="ltr" className="mt-1 text-start text-sm text-muted">
                {nameEn}
              </p>
            )}
            <p className="mt-1 text-sm text-muted">
              {[
                top
                  ? [ar ? top.committeeAr : top.committeeEn, ar ? top.roleAr : top.roleEn]
                      .filter(Boolean)
                      .join(' · ')
                  : L('بلا لجنة', 'No committee'),
                m.memberNo,
                `${L('عضو منذ', 'Member since')} ${formatDate(m.joinedAt, lang)}`,
                m.cycleNameAr ? m.cycleNameAr : '',
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canAssign && account && m.status === 'active' && (
            <AssignRoleDialog
              roles={grantable}
              committees={committees}
              permissionLabels={labels}
              canHandover={canAssign}
              presetUser={{
                memberId: m.id,
                userId: account.userId,
                nameAr,
                nameEn,
                email: account.email,
                photoPath: m.photoPath,
                activated: account.activated,
                inCommittee: false,
                roleAr: null,
                roleEn: null,
              }}
            />
          )}
          {canManage && (
            <EditMemberDialog
              memberId={m.id}
              reference={reference}
              canEditPhone={detail.canContact}
              initial={{
                firstNameAr: m.firstNameAr,
                middleNameAr: m.middleNameAr ?? '',
                lastNameAr: m.lastNameAr,
                firstNameEn: m.firstNameEn ?? '',
                middleNameEn: m.middleNameEn ?? '',
                lastNameEn: m.lastNameEn ?? '',
                phoneCountry: phoneParts?.country ?? DEFAULT_PHONE_COUNTRY,
                phone: phoneParts?.national ?? '',
                academicStatus: (m.academicStatus ?? '') as AcademicStatus | '',
                universityId: String(
                  reference.universities.find((u) => u.nameAr === m.universityAr)?.id ?? '',
                ),
                majorId: String(
                  reference.majors.find((x) => !x.parentId && x.nameAr === m.majorAr)?.id ?? '',
                ),
                subMajorId: '',
                trackId: String(reference.tracks.find((t) => t.nameAr === m.trackAr)?.id ?? ''),
              }}
            />
          )}
          <MemberActions
            subject={{
              id: m.id,
              userId: account?.userId ?? null,
              nameAr,
              nameEn,
              status: m.status,
              termEndsAt: m.termEndsAt,
              blocked: account?.blocked,
              activated: account?.activated,
              leave: detail.leaveRequest,
            }}
            linked={!!account}
            claimEmail={null}
            canManage={canManage}
            canBlock={canBlock}
            canCreate={canCreate}
          />
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <Tabs items={tabs} active={tab} label={L('أقسام العضو', 'Member sections')} />

          {tab === 'timeline' && (
            <section className={card} aria-labelledby="mem-timeline">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 id="mem-timeline" className="t-h4">
                  {L('السجل الكامل', 'Full history')}
                </h2>
                <nav
                  aria-label={L('تصفية السجل', 'Filter the history')}
                  className="inline-flex rounded-full bg-surface-raised p-1 text-sm"
                >
                  {(['all', 'decisions', 'positions'] as const).map((f) => (
                    <Link
                      key={f}
                      href={filterHref(f)}
                      aria-current={filter === f ? 'true' : undefined}
                      className={
                        filter === f
                          ? 'rounded-full bg-accent px-4 py-1.5 font-semibold text-on-accent'
                          : 'rounded-full px-4 py-1.5 text-muted hover:text-text'
                      }
                    >
                      {f === 'all'
                        ? L('الكل', 'All')
                        : f === 'decisions'
                          ? L('القرارات', 'Decisions')
                          : L('المناصب', 'Positions')}
                    </Link>
                  ))}
                </nav>
              </div>
              {canManage && <MemberNoteForm id={id} />}
              {timelineItems.length === 0 ? (
                <EmptyState title={L('لا أحداث بعد', 'No events yet')} variant="no-data" />
              ) : (
                <Timeline items={timelineItems} label={L('السجل الكامل', 'Full history')} />
              )}
            </section>
          )}

          {tab === 'profile' && (
            <div className="flex flex-col gap-5">
              <section className={card}>
                <dl>
                  {row(L('العنوان المهني', 'Headline'), headline)}
                  {row(
                    L('النبذة', 'About'),
                    about ? <span className="whitespace-pre-line">{about}</span> : null,
                  )}
                  {row(
                    `${L('المهارات', 'Skills')} (${detail.skills.length})`,
                    detail.skills.length > 0 ? (
                      <span className="flex flex-wrap justify-end gap-1.5">
                        {detail.skills.map((s) => (
                          <Badge key={s.slug}>{ar ? s.nameAr : s.nameEn}</Badge>
                        ))}
                      </span>
                    ) : null,
                  )}
                  {row(
                    L('متاح لـ', 'Open to'),
                    m.openTo.length > 0 ? (
                      <span className="flex flex-wrap justify-end gap-1.5">
                        {m.openTo.map((o) => (
                          <Badge key={o} tone="accent">
                            {OPEN_TO_LABEL[o]?.[lang] ?? o}
                          </Badge>
                        ))}
                      </span>
                    ) : null,
                  )}
                  {row(
                    L('الروابط', 'Links'),
                    linkEntries.length > 0 ? (
                      <span className="flex flex-col items-end gap-1">
                        {linkEntries.map(([k, v]) => (
                          <a
                            key={k}
                            href={v}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-accent-text underline"
                          >
                            {k}
                            <ExternalLink aria-hidden="true" className="size-3.5" />
                          </a>
                        ))}
                      </span>
                    ) : null,
                  )}
                  {row(
                    `${L('المشاريع', 'Projects')} (${detail.projects.length})`,
                    detail.projects.length > 0 ? (
                      <span className="flex flex-col items-end gap-1">
                        {detail.projects.map((p) => (
                          <a
                            key={p.id}
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent-text underline"
                          >
                            {ar ? p.titleAr : (p.titleEn ?? p.titleAr)}
                          </a>
                        ))}
                      </span>
                    ) : null,
                  )}
                </dl>
              </section>

              <section className={card}>
                <h2 className="t-h4 mb-3">{L('ما يظهر للزوار', 'What visitors see')}</h2>
                <ul className="flex flex-wrap gap-2">
                  {Object.entries(SHOW_LABEL).map(([k, label]) => {
                    const on = !!m.show[k];
                    return (
                      <li key={k}>
                        <Badge tone={on ? 'accent' : 'neutral'}>
                          {label[lang]}: {on ? L('ظاهر', 'shown') : L('مخفي', 'hidden')}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 text-sm text-muted">
                  {L(
                    'العضو وحده يعدّل أقسام ملفه العام. يمكنك تعديل الاسم والبيانات الأكاديمية، ويُسجَّل كل تعديل في السجل.',
                    'The member alone edits the public sections of the profile. You can correct the name and the academic data, and every change is logged.',
                  )}
                </p>
                {m.listed && (
                  <Link
                    href={`/members/${m.id}`}
                    className="mt-3 inline-block text-sm font-semibold text-accent-text underline"
                  >
                    {L('فتح الملف العام', 'Open the public profile')}
                  </Link>
                )}
              </section>
            </div>
          )}

          {tab === 'positions' &&
            (detail.positions.length === 0 ? (
              <EmptyState title={L('لا مناصب بعد', 'No positions yet')} />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-line bg-surface">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="border-b border-line bg-surface-raised text-xs text-muted">
                    <tr>
                      {[
                        L('المنصب', 'Position'),
                        L('اللجنة', 'Committee'),
                        L('من', 'From'),
                        L('إلى', 'Until'),
                        L('الحالة', 'State'),
                      ].map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="px-4 py-2.5 text-start text-xs font-medium"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.positions.map((p) => (
                      <tr key={p.id} className="border-b border-line last:border-0">
                        <td className="px-4 py-3 font-medium">{ar ? p.roleAr : p.roleEn}</td>
                        <td className="px-4 py-3 text-muted">
                          {(ar ? p.committeeAr : p.committeeEn) ?? '—'}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-muted">
                          {formatDate(p.startsAt, lang)}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-muted">
                          {p.endsAt ? formatDate(p.endsAt, lang) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={p.active ? 'accent' : 'neutral'}>
                            {p.active ? L('فعّال', 'Active') : L('منتهٍ', 'Ended')}
                          </Badge>
                          {p.endReason && <p className="mt-1 text-xs text-muted">{p.endReason}</p>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {tab === 'participation' &&
            (detail.registrations.length === 0 ? (
              <EmptyState title={L('لا تسجيلات في الفعاليات', 'No event registrations')} />
            ) : (
              <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
                {detail.registrations.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {ar ? r.titleAr : (r.titleEn ?? r.titleAr)}
                      </p>
                      <p className="text-xs tabular-nums text-muted">
                        {formatDate(r.startDate, lang)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{REG_STATUS[r.status]?.[lang] ?? r.status}</Badge>
                      {r.attendance && (
                        <Badge tone={r.attendance === 'attended' ? 'accent' : 'warning'}>
                          {r.attendance === 'attended'
                            ? L('حضر', 'Attended')
                            : L('لم يحضر', 'Absent')}
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ))}

          {tab === 'requests' &&
            (detail.applications.length === 0 ? (
              <EmptyState title={L('لا طلبات عضوية', 'No membership applications')} />
            ) : (
              <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
                {detail.applications.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{ar ? a.cycleAr : (a.cycleEn ?? a.cycleAr)}</p>
                      <p className="text-xs tabular-nums text-muted">
                        {L('قُدّم', 'Submitted')} {formatDate(a.submittedAt, lang)}
                        {a.decidedAt
                          ? ` · ${L('قُرّر', 'Decided')} ${formatDate(a.decidedAt, lang)}`
                          : ''}
                      </p>
                    </div>
                    <Badge>{a.status}</Badge>
                  </li>
                ))}
              </ul>
            ))}

          {tab === 'log' &&
            (detail.log.length === 0 ? (
              <EmptyState title={L('لا سجل بعد', 'No log entries yet')} />
            ) : (
              <ol className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
                {detail.log.map((l, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <span className="font-medium">
                      {ACTION_LABEL[l.action]?.[lang] ?? l.action}
                    </span>
                    <span className="tabular-nums text-muted">
                      {l.actorAr ? `${l.actorAr} · ` : ''}
                      {formatDate(l.at, lang)}
                    </span>
                  </li>
                ))}
              </ol>
            ))}
        </div>

        <aside className="flex flex-col gap-5">
          <MemberTermCards detail={detail} lang={lang} />
          <section className={card} aria-labelledby="acct">
            <h2 id="acct" className="t-h4 mb-2">
              {L('الحساب والاتصال', 'Account and contact')}
            </h2>
            {!account ? (
              <p className="text-sm text-muted">
                {L(
                  'هذا السجل غير مرتبط بحساب بعد. أرسل رابط مطالبة من قائمة الإجراءات.',
                  'This record is not linked to an account yet. Send a claim link from the actions.',
                )}
              </p>
            ) : (
              <dl>
                {detail.canContact &&
                  row(
                    L('البريد', 'E-mail'),
                    account.email ? (
                      <span dir="ltr" className="inline-flex items-center gap-1">
                        <Mail aria-hidden="true" className="size-3.5" />
                        {account.email}
                      </span>
                    ) : null,
                  )}
                {detail.canContact &&
                  row(
                    L('الجوال', 'Phone'),
                    account.phone ? (
                      <span dir="ltr" className="inline-flex items-center gap-1">
                        <Phone aria-hidden="true" className="size-3.5" />
                        {account.phone}
                      </span>
                    ) : null,
                  )}
                {row(
                  L('البطاقة', 'Card'),
                  m.cardActive ? L('صالحة', 'Valid') : L('غير فعّالة', 'Not active'),
                )}
                {account.blocked &&
                  row(L('الحظر', 'Block'), <Badge tone="danger">{L('محظور', 'Blocked')}</Badge>)}
                {row(
                  L('الحساب', 'Account'),
                  account.activated ? (
                    <Badge tone="accent">{L('مفعّل', 'Activated')}</Badge>
                  ) : (
                    <Badge tone="info">{L('لم يُفعَّل', 'Not activated')}</Badge>
                  ),
                )}
                {detail.canContact &&
                  row(
                    L('آخر دخول', 'Last sign-in'),
                    account.lastSignInAt
                      ? formatDate(account.lastSignInAt, lang)
                      : L('لم يدخل بعد', 'Never'),
                  )}
              </dl>
            )}
            {!detail.canContact && (
              <p className="mt-2 text-xs text-muted">
                {L(
                  'لا تملك صلاحية members.view_contact، فلا يظهر البريد ولا الجوال.',
                  'You do not hold members.view_contact, so e-mail and phone are not shown.',
                )}
              </p>
            )}
          </section>

          <section className={card} aria-labelledby="mship">
            <h2 id="mship" className="t-h4 mb-2">
              {L('العضوية', 'Membership')}
            </h2>
            <dl>
              {row(L('انضم عبر', 'Joined through'), VIA[m.joinedVia][lang])}
              {row(
                L('الحالة', 'Status'),
                m.academicStatus
                  ? ACADEMIC_LABEL[m.academicStatus as AcademicStatus]?.[lang]
                  : null,
              )}
              {row(
                L('الجامعة', 'University'),
                ar ? m.universityAr : (m.universityEn ?? m.universityAr),
              )}
              {row(L('التخصص', 'Major'), ar ? m.majorAr : (m.majorEn ?? m.majorAr))}
              {row(L('المسار', 'Track'), ar ? m.trackAr : (m.trackEn ?? m.trackAr))}
            </dl>
          </section>

          <section className={card} aria-labelledby="compl">
            <h2 id="compl" className="t-h4 mb-3">
              {L('اكتمال الملف', 'Profile completeness')}
            </h2>
            <p className="mb-2 text-3xl font-extrabold tabular-nums">{detail.completeness}%</p>
            <CompletenessBar
              percent={detail.completeness}
              label={L('اكتمال الملف', 'Profile completeness')}
              showNumber={false}
            />
            <p className="mt-3 text-sm text-muted">
              {completeness.missing.length === 0
                ? L('الملف مكتمل.', 'The profile is complete.')
                : `${L('ينقصه', 'Missing')}: ${completeness.missing.map((c) => missingLabel[c]).join('، ')}.`}
            </p>
          </section>

          {m.photoPath && !m.show.photo && (
            <p className="flex items-center gap-2 text-xs text-muted">
              <Avatar name={name} src={memberThumbUrl(m.photoPath)} size={24} />
              {L(
                'الصورة مخفية عن الزوار وتظهر لك هنا فقط.',
                'The photo is hidden from visitors and shown to you only.',
              )}
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
