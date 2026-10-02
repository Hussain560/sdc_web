import { notFound } from 'next/navigation';
import { Badge, Card } from '@/components/ui';
import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { Link } from '@/i18n/navigation';
import { canGlobal } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { getAccess } from '@/modules/access/queries';
import { ApplicationsTable } from '@/modules/membership/components/ApplicationsTable';
import { getApplicationDetail } from '@/modules/membership/review-queries';
import {
  ACADEMIC_LABEL,
  APPLICATION_STATUS_LABEL,
  type AcademicStatus,
} from '@/modules/membership/types';

// Application drawer as a page (screen 18): everything the applicant submitted, answers, consent, and decisions.
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
  const a = await getApplicationDetail(id);
  if (!a) notFound();

  const st = APPLICATION_STATUS_LABEL[a.status];
  const rows: Array<[string, string]> = [
    [ar ? 'البريد' : 'E-mail', a.email],
    [ar ? 'الجوال' : 'Mobile', a.phone ?? '—'],
    [
      ar ? 'الحالة' : 'Status',
      ACADEMIC_LABEL[a.academicStatus as AcademicStatus]?.[lang] ?? a.academicStatus,
    ],
    [
      ar ? 'الجامعة' : 'University',
      a.university ??
        (a.otherUniversity ? `${a.otherUniversity} (${ar ? 'مكتوبة' : 'typed'})` : '—'),
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
      a.wantsDirectoryListing ? (ar ? 'يرغب بالظهور' : 'Wants to be listed') : ar ? 'لا' : 'No',
    ],
    [ar ? 'الموافقة' : 'Consent', `${a.consentVersion} · ${formatDate(a.consentAt, lang)}`],
  ];

  return (
    <>
      <PageHeader
        title={ar ? a.fullNameAr : a.fullNameEn || a.fullNameAr}
        description={`${a.cycleName} · ${formatDate(a.submittedAt, lang)}`}
        action={<Badge tone={st.tone}>{st.label[lang]}</Badge>}
      />
      <div className="flex flex-col gap-4">
        <Card>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {rows.map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
        {(a.bioAr || a.bioEn || a.links.length > 0) && (
          <Card className="flex flex-col gap-3 text-sm">
            {a.bioAr && <p>{a.bioAr}</p>}
            {a.bioEn && <p dir="ltr">{a.bioEn}</p>}
            {a.links.length > 0 && (
              <ul className="flex flex-wrap gap-4">
                {a.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
        {a.questions.length > 0 && (
          <Card className="flex flex-col gap-3 text-sm">
            <h2 className="font-bold">{ar ? 'إجابات الأسئلة' : 'Answers'}</h2>
            {a.questions.map((q) => {
              const v = a.answers[q.key];
              return (
                <div key={q.key}>
                  <p className="text-muted">{ar ? q.label_ar : q.label_en || q.label_ar}</p>
                  <p>{Array.isArray(v) ? v.join('، ') : v || '—'}</p>
                </div>
              );
            })}
          </Card>
        )}
        {a.decisionNote && (
          <Card className="text-sm">
            <p className="text-muted">{ar ? 'ملاحظة داخلية' : 'Internal note'}</p>
            <p>{a.decisionNote}</p>
          </Card>
        )}
        <ApplicationsTable
          rows={[a]}
          userId={user.id}
          isAdmin={access.positions.some((p) => p.role === 'system_admin')}
        />
        <p>
          <Link href="/dashboard/membership/applications" className="text-sm text-accent underline">
            {ar ? '← كل الطلبات' : '← All applications'}
          </Link>
        </p>
      </div>
    </>
  );
}
