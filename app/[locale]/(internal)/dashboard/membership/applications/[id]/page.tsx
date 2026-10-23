import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  ClockAlert,
  FileText,
  History,
  Hourglass,
  Inbox,
  ListChecks,
  Lock,
  Mail,
  PenLine,
  RotateCcw,
  Search,
  Send,
  Undo2,
  UserRound,
  XCircle,
  ExternalLink,
  TriangleAlert,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Avatar, Badge } from '@/components/ui';
import { SetCrumbs } from '@/components/layout/DashboardShell/Crumbs';
import { Forbidden } from '@/components/layout/Forbidden';
import { CopyButton } from '@/components/patterns/CopyButton';
import { Timeline, type TimelineItem } from '@/components/patterns/Timeline';
import { Link } from '@/i18n/navigation';
import { canGlobal } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { getAccess } from '@/modules/access/queries';
import { ReviewPanel } from '@/modules/membership/components/ReviewPanel';
import { getApplicationDetail, getQueueNeighbours } from '@/modules/membership/review-queries';
import {
  ACADEMIC_LABEL,
  APPLICATION_STATUS_LABEL,
  GENDER_LABEL,
  STUDY_YEAR_LABEL,
  type AcademicStatus,
} from '@/modules/membership/types';

const dateTime = (iso: string, lang: 'ar' | 'en') =>
  new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Riyadh',
  }).format(new Date(iso));

// MBR-011 (screen 18): everything the applicant submitted on one calm page, the history, the scoring and the decision.
export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  const user = await requireUser(`/dashboard/membership/applications/${id}`);
  const access = await getAccess();
  if (!access || !canGlobal(access, 'membership.review')) return <Forbidden />;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const a = await getApplicationDetail(id, user.id);
  if (!a) notFound();
  const nb = await getQueueNeighbours({
    id: a.id,
    cycleId: a.cycleId,
    status: a.status,
    submittedAt: a.submittedAt,
  });

  const name = ar ? a.fullNameAr : a.fullNameEn || a.fullNameAr;
  const st = APPLICATION_STATUS_LABEL[a.status];
  const isOwn = access.email.toLowerCase() === a.email.toLowerCase();
  const NextIcon = ar ? ChevronLeft : ChevronRight;
  const PrevIcon = ar ? ChevronRight : ChevronLeft;
  const BackIcon = ar ? ArrowRight : ArrowLeft;

  const fixable = [
    { key: 'github_url', label: 'GitHub' },
    { key: 'portfolio_url', label: ar ? 'رابط المعرض' : 'Portfolio link' },
    { key: 'linkedin_url', label: 'LinkedIn' },
    { key: 'x_url', label: 'X' },
    { key: 'bio_ar', label: ar ? 'النبذة بالعربية' : 'Bio in Arabic' },
    { key: 'bio_en', label: ar ? 'النبذة بالإنجليزية' : 'Bio in English' },
    ...a.questions.map((q) => ({
      key: `q:${q.key}`,
      label: ar ? q.label_ar : q.label_en || q.label_ar,
    })),
  ];

  const kinds: Record<
    string,
    { icon: ReactNode; ar: string; en: string; tone?: TimelineItem['tone'] }
  > = {
    submitted: { icon: <Send />, ar: 'أرسل الطلب', en: 'Submitted the application' },
    claimed: { icon: <UserRound />, ar: 'استلمه للمراجعة', en: 'Claimed it for review' },
    released: {
      icon: <Undo2 />,
      ar: 'أفلت الطلب',
      en: 'Released the application',
      tone: 'pending',
    },
    info_requested: {
      icon: <PenLine />,
      ar: 'طلب تعديلاً من المتقدّم',
      en: 'Asked the applicant to edit',
      tone: 'warn',
    },
    resubmitted: {
      icon: <RotateCcw />,
      ar: 'أعاد المتقدّم الإرسال',
      en: 'The applicant resubmitted',
    },
    scored: { icon: <ListChecks />, ar: 'قيّمه', en: 'Scored it' },
    accepted: { icon: <CircleCheck />, ar: 'قبل الطلب', en: 'Accepted the application' },
    rejected: {
      icon: <XCircle />,
      ar: 'لم يقبل الطلب',
      en: 'Did not accept the application',
      tone: 'pending',
    },
    waitlisted: {
      icon: <Hourglass />,
      ar: 'نقله إلى الانتظار',
      en: 'Moved it to the waiting list',
      tone: 'warn',
    },
    withdrawn: {
      icon: <Undo2 />,
      ar: 'سحب المتقدّم الطلب',
      en: 'The applicant withdrew',
      tone: 'pending',
    },
    decision_undone: {
      icon: <Undo2 />,
      ar: 'تراجع عن القرار',
      en: 'Undid the decision',
      tone: 'pending',
    },
    lapsed: { icon: <ClockAlert />, ar: 'سقط التفعيل', en: 'Activation lapsed', tone: 'danger' },
    restored: { icon: <RotateCcw />, ar: 'أُعيد المقعد', en: 'The place was restored' },
  };
  const history: TimelineItem[] = a.history.map((h) => {
    const k: { icon: ReactNode; ar: string; en: string; tone?: TimelineItem['tone'] } = kinds[
      h.kind
    ] ?? { icon: <FileText />, ar: h.kind, en: h.kind };
    const avg =
      typeof h.data.average === 'number' ? ` ${(h.data.average as number).toFixed(1)}` : '';
    return {
      key: h.id,
      icon: k.icon,
      tone: k.tone ?? 'done',
      title: `${h.actorName ? `${h.actorName} · ` : ''}${ar ? k.ar : k.en}${avg}`,
      detail: dateTime(h.at, lang),
    };
  });

  const card = 'm-reveal rounded-shape-2xl border border-line bg-surface p-5 md:p-6';
  const h2 = 'mb-3 flex items-center gap-2 font-bold';
  const row = 'grid grid-cols-[7.5rem_1fr] items-start gap-3 py-2 text-sm sm:grid-cols-[9rem_1fr]';

  const warnings: string[] = [];
  if (a.earlierCount > 0)
    warnings.push(
      ar
        ? `قدّم بالبريد نفسه من قبل (${a.earlierCount}${a.earlierRejected ? `، رُفض منها ${a.earlierRejected}` : ''}).`
        : `Applied with the same e-mail before (${a.earlierCount}${a.earlierRejected ? `, ${a.earlierRejected} rejected` : ''}).`,
    );
  if (a.isMember)
    warnings.push(
      ar ? 'هذا البريد لعضو في المجتمع بالفعل.' : 'This e-mail already belongs to a member.',
    );
  if (a.isBlocked)
    warnings.push(ar ? 'حساب مرتبط بهذا البريد محظور.' : 'An account with this e-mail is blocked.');

  return (
    <>
      <SetCrumbs items={[{ label: name }]} />

      {/* Top bar: back, position in the queue, previous / next, the shortcuts */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/membership/applications"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-text"
        >
          <BackIcon size={16} aria-hidden="true" />
          {ar ? 'الطلبات' : 'Applications'}
        </Link>
        <ul
          aria-label={ar ? 'اختصارات لوحة المفاتيح' : 'Keyboard shortcuts'}
          className="order-last hidden flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted lg:order-none lg:flex"
        >
          {(
            [
              ['A', ar ? 'قبول' : 'Accept'],
              ['W', ar ? 'انتظار' : 'Waitlist'],
              ['I', ar ? 'تعديل' : 'Edit'],
              ['R', ar ? 'عدم قبول' : 'Reject'],
              ['J', ar ? 'السابق' : 'Prev'],
              ['K', ar ? 'التالي' : 'Next'],
            ] as const
          ).map(([k, l]) => (
            <li key={k} className="inline-flex items-center gap-1.5">
              <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-line-strong px-1 font-mono text-xs">
                {k}
              </kbd>
              {l}
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted tabular-nums">
            {ar
              ? `${nb.position} من ${nb.total} في «${st.label.ar}»`
              : `${nb.position} of ${nb.total} in “${st.label.en}”`}
          </span>
          {nb.prevId ? (
            <Link
              href={`/dashboard/membership/applications/${nb.prevId}`}
              aria-label={ar ? 'الطلب السابق' : 'Previous application'}
              className="flex size-11 items-center justify-center rounded-full border-[1.5px] border-line-strong hover:border-accent"
            >
              <PrevIcon size={16} aria-hidden="true" />
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className="flex size-11 items-center justify-center rounded-full border-[1.5px] border-line text-muted opacity-45"
            >
              <PrevIcon size={16} />
            </span>
          )}
          {nb.nextId ? (
            <Link
              href={`/dashboard/membership/applications/${nb.nextId}`}
              aria-label={ar ? 'الطلب التالي' : 'Next application'}
              className="flex size-11 items-center justify-center rounded-full border-[1.5px] border-line-strong hover:border-accent"
            >
              <NextIcon size={16} aria-hidden="true" />
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className="flex size-11 items-center justify-center rounded-full border-[1.5px] border-line text-muted opacity-45"
            >
              <NextIcon size={16} />
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <header className="mb-5 flex flex-wrap items-center gap-4">
        <Avatar name={name} size={72} />
        <div className="min-w-0 flex-1">
          <h1 className="t-h2 break-words">{name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <Badge tone={st.tone}>{st.label[lang]}</Badge>
            <span dir="ltr" className="inline-flex items-center font-mono">
              {a.reference}
              <CopyButton
                value={a.reference}
                label={ar ? 'نسخ الرقم المرجعي' : 'Copy the reference'}
              />
            </span>
            <span>
              {ar ? 'قُدّم ' : 'Submitted '}
              {formatDate(a.submittedAt, lang)} · {ar ? a.cycleName : a.cycleNameEn || a.cycleName}
            </span>
          </p>
        </div>
      </header>

      {warnings.length > 0 && (
        <div role="alert" className="mb-5 flex gap-3 rounded-shape-xl bg-warning-soft p-4 text-sm">
          <TriangleAlert size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-warning" />
          <ul className="flex flex-col gap-1">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {a.status === 'info_requested' && a.infoRequest && (
        <div className="mb-5 flex gap-3 rounded-shape-xl bg-warning-soft p-4 text-sm">
          <PenLine size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-warning" />
          <div>
            <p className="font-semibold">
              {ar ? 'بانتظار تعديل المتقدّم' : 'Waiting for the applicant to edit'}
            </p>
            <p className="mt-1">«{a.infoRequest}»</p>
          </div>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-5">
          {/* Identity and contact */}
          <section className={card} aria-labelledby="rv-identity">
            <h2 id="rv-identity" className={h2}>
              <UserRound size={17} aria-hidden="true" />
              {ar ? 'الهوية والتواصل' : 'Identity & contact'}
            </h2>
            <div className="flex flex-col gap-5">
              {(
                [
                  {
                    dir: 'rtl',
                    label: 'عربي',
                    heads: ['الأول', 'الأوسط', 'العائلة'],
                    values: [a.firstNameAr ?? a.fullNameAr, a.middleNameAr, a.lastNameAr],
                  },
                  {
                    dir: 'ltr',
                    label: 'English',
                    heads: ['First', 'Middle', 'Last'],
                    values: [a.firstNameEn ?? a.fullNameEn, a.middleNameEn, a.lastNameEn],
                  },
                ] as const
              ).map((r) => (
                <div
                  key={r.label}
                  dir={r.dir}
                  className="grid grid-cols-[4.5rem_repeat(3,minmax(0,1fr))] gap-x-4 gap-y-1 border-t border-line pt-3 text-start text-sm"
                >
                  <span aria-hidden="true" />
                  {r.heads.map((h) => (
                    <span key={h} className="text-xs font-medium text-muted">
                      {h}
                    </span>
                  ))}
                  <span className="font-semibold text-muted">{r.label}</span>
                  {r.values.map((v, i) => (
                    <span key={i} className="break-words">
                      {v || '—'}
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <dl className="mt-2 divide-y divide-line border-t border-line">
              <div className={row}>
                <dt className="flex items-center gap-1.5 text-muted">
                  <Mail size={14} aria-hidden="true" />
                  {ar ? 'البريد' : 'E-mail'}
                </dt>
                <dd
                  className="flex items-center gap-1 break-all"
                  dir="ltr"
                  style={{ textAlign: 'start' }}
                >
                  {a.email}
                  <CopyButton value={a.email} label={ar ? 'نسخ البريد' : 'Copy the e-mail'} />
                </dd>
              </div>
              <div className={row}>
                <dt className="text-muted">{ar ? 'الجنس' : 'Gender'}</dt>
                <dd>
                  {a.gender ? GENDER_LABEL[a.gender as keyof typeof GENDER_LABEL]?.[lang] : '—'}
                </dd>
              </div>
              <div className={row}>
                <dt className="text-muted">{ar ? 'الجوال' : 'Phone'}</dt>
                <dd className="flex items-center gap-1" dir="ltr" style={{ textAlign: 'start' }}>
                  {a.phone ?? '—'}
                  {a.phone && (
                    <CopyButton value={a.phone} label={ar ? 'نسخ الجوال' : 'Copy the phone'} />
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {/* Study */}
          <section className={card} aria-labelledby="rv-study">
            <h2 id="rv-study" className={h2}>
              <BadgeCheck size={17} aria-hidden="true" />
              {ar ? 'الدراسة' : 'Study & work'}
            </h2>
            <dl className="divide-y divide-line">
              {(
                [
                  [
                    ar ? 'الوضع' : 'Status',
                    ACADEMIC_LABEL[a.academicStatus as AcademicStatus]?.[lang] ?? a.academicStatus,
                  ],
                  ...(a.studyYear
                    ? ([
                        [
                          ar ? 'السنة الدراسية' : 'Year of study',
                          STUDY_YEAR_LABEL[String(a.studyYear) as keyof typeof STUDY_YEAR_LABEL]?.[
                            lang
                          ] ?? String(a.studyYear),
                        ],
                      ] as Array<[string, string]>)
                    : []),
                  [
                    ar ? 'الجامعة' : 'University',
                    a.university ??
                      (a.otherUniversity
                        ? `${a.otherUniversity} (${ar ? 'مكتوبة' : 'typed'})`
                        : '—'),
                  ],
                  [
                    ar ? 'التخصص' : 'Major',
                    a.major ?? (a.otherMajor ? `${a.otherMajor} (${ar ? 'مكتوب' : 'typed'})` : '—'),
                  ],
                  [ar ? 'التخصص الدقيق' : 'Sub-major', a.subMajor ?? '—'],
                  [ar ? 'المسار' : 'Track', a.track ?? '—'],
                  [ar ? 'اللجنة المفضلة' : 'Preferred committee', a.preferredCommittee ?? '—'],
                  [
                    ar ? 'الدليل' : 'Directory',
                    a.wantsDirectoryListing
                      ? ar
                        ? 'يرغب بالظهور'
                        : 'Wants to be listed'
                      : ar
                        ? 'لا'
                        : 'No',
                  ],
                ] as Array<[string, string]>
              ).map(([k, v]) => (
                <div key={k} className={row}>
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Links and bio */}
          {(a.links.length > 0 || a.bioAr || a.bioEn) && (
            <section className={card} aria-labelledby="rv-links">
              <h2 id="rv-links" className={h2}>
                <ExternalLink size={17} aria-hidden="true" />
                {ar ? 'الروابط والنبذة' : 'Links & bio'}
              </h2>
              {a.links.length > 0 && (
                <ul className="mb-3 flex flex-wrap gap-2">
                  {a.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        dir="ltr"
                        className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full border-[1.5px] border-line-strong px-3 text-sm hover:border-accent"
                      >
                        <span className="truncate">{l.url.replace(/^https:\/\//, '')}</span>
                        <ExternalLink
                          size={13}
                          aria-hidden="true"
                          className="shrink-0 rtl:-scale-x-100"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {[a.bioAr, a.bioEn].filter(Boolean).map((b, i) => (
                <div
                  key={i}
                  dir={i === 0 && a.bioAr ? 'rtl' : 'ltr'}
                  className="mt-2 rounded-shape-lg bg-surface-raised p-4 text-sm leading-7"
                >
                  <p>{b}</p>
                  <p className="mt-2 text-xs text-muted">
                    {(b ?? '').length} {ar ? 'حرفاً' : 'characters'}
                  </p>
                </div>
              ))}
            </section>
          )}

          {/* Cycle answers */}
          {a.questions.length > 0 && (
            <section className={card} aria-labelledby="rv-answers">
              <h2 id="rv-answers" className={h2}>
                <Inbox size={17} aria-hidden="true" />
                {ar ? 'إجابات أسئلة الدورة' : 'Answers to the cycle questions'}
              </h2>
              <dl className="flex flex-col gap-4">
                {a.questions.map((q) => {
                  const v = a.answers[q.key];
                  return (
                    <div key={q.key}>
                      <dt className="text-sm font-semibold">
                        {ar ? q.label_ar : q.label_en || q.label_ar}
                      </dt>
                      <dd className="mt-1 rounded-shape-lg bg-surface-raised p-3 text-sm leading-7">
                        {Array.isArray(v) ? v.join(ar ? '، ' : ', ') : v || '—'}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          )}

          {a.decisionNote && (
            <section className={card}>
              <h2 className={h2}>
                <Lock size={16} aria-hidden="true" />
                {ar ? 'ملاحظة داخلية' : 'Internal note'}
              </h2>
              <p className="text-sm">{a.decisionNote}</p>
              <p className="mt-2 text-xs text-muted">
                {ar ? 'لا يراها المتقدّم أبداً.' : 'The applicant never sees it.'}
              </p>
            </section>
          )}

          {/* History */}
          <section className={card} aria-labelledby="rv-history">
            <h2 id="rv-history" className={h2}>
              <History size={17} aria-hidden="true" />
              {ar ? 'سجل الطلب' : 'Application history'}
            </h2>
            <Timeline items={history} label={ar ? 'سجل الطلب' : 'Application history'} />
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted">
              <Search size={12} aria-hidden="true" />
              {ar
                ? `الموافقة على الخصوصية: ${a.consentVersion} · ${formatDate(a.consentAt, lang)}`
                : `Privacy consent: ${a.consentVersion} · ${formatDate(a.consentAt, lang)}`}
            </p>
          </section>
        </div>

        <ReviewPanel
          id={a.id}
          status={a.status}
          reviewerId={a.reviewerId}
          reviewerName={a.reviewerName}
          userId={user.id}
          isAdmin={access.positions.some((p) => p.role === 'system_admin')}
          isOwn={isOwn}
          rubric={a.rubric}
          scores={a.scores}
          capacity={
            a.cycleCapacity ? { accepted: a.cycleAccepted, capacity: a.cycleCapacity } : null
          }
          nextId={nb.nextId}
          prevId={nb.prevId}
          fixable={fixable}
        />
      </div>
      <div className="h-24 md:hidden" aria-hidden="true" />
    </>
  );
}
