import type { ReactNode } from 'react';
import { Badge, Card } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { ACADEMIC_LABEL, type AcademicStatus } from '@/modules/membership/types';
import { MEMBER_STATUS_LABEL, type MemberStatus } from '@/modules/members/schemas';
import type { MyData, MyDataApplication } from '../my-data';

type Lang = 'ar' | 'en';

const APPLICATION_STATUS: Record<string, { ar: string; en: string }> = {
  draft: { ar: 'مسودة', en: 'Draft' },
  submitted: { ar: 'قُدّم', en: 'Submitted' },
  under_review: { ar: 'قيد المراجعة', en: 'Under review' },
  accepted: { ar: 'مقبول', en: 'Accepted' },
  waitlisted: { ar: 'قائمة الانتظار', en: 'Waitlisted' },
  rejected: { ar: 'غير مقبول', en: 'Not accepted' },
  withdrawn: { ar: 'مسحوب', en: 'Withdrawn' },
};

const JOINED_VIA: Record<string, { ar: string; en: string }> = {
  application: { ar: 'طلب عضوية', en: 'Membership application' },
  legacy: { ar: 'عضو سابق', en: 'Earlier member' },
  manual: { ar: 'أضافته قيادة المجتمع', en: 'Added by the leadership' },
};

/** A list of label/value rows; empty values are shown as a dash so a missing item is visible, not hidden. */
function Rows({ rows, ar }: { rows: Array<[string, ReactNode]>; ar: boolean }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-0.5">
          <dt className="text-sm text-muted">{label}</dt>
          <dd className="font-medium break-words">
            {value || value === 0 ? value : <span className="text-muted">{ar ? '—' : '—'}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Application({ a, lang }: { a: MyDataApplication; lang: Lang }) {
  const ar = lang === 'ar';
  const L = (x: { ar: string; en: string } | null) => (x ? x[lang] : null);
  const st = APPLICATION_STATUS[a.status];
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-bold">
          {ar ? 'طلب العضوية' : 'Membership application'}
          {a.cycleName && <span className="font-normal text-muted"> · {a.cycleName}</span>}
        </h3>
        {st && <Badge tone={a.status === 'accepted' ? 'accent' : 'neutral'}>{st[lang]}</Badge>}
      </div>
      <Rows
        ar={ar}
        rows={[
          [ar ? 'الاسم (عربي)' : 'Name (Arabic)', a.nameAr],
          [ar ? 'الاسم (إنجليزي)' : 'Name (English)', a.nameEn],
          [ar ? 'البريد الإلكتروني' : 'E-mail', a.email && <bdi dir="ltr">{a.email}</bdi>],
          [ar ? 'الجوال' : 'Phone', a.phone && <bdi dir="ltr">{a.phone}</bdi>],
          [
            ar ? 'الحالة' : 'Status',
            a.academicStatus ? ACADEMIC_LABEL[a.academicStatus as AcademicStatus]?.[lang] : null,
          ],
          [ar ? 'الجامعة' : 'University', L(a.university)],
          [ar ? 'التخصص' : 'Major', L(a.major)],
          [ar ? 'التخصص الدقيق' : 'Sub-major', L(a.subMajor)],
          [ar ? 'المسار' : 'Track', L(a.track)],
          [ar ? 'اللجنة المفضلة' : 'Preferred committee', L(a.committee)],
          [ar ? 'تاريخ التقديم' : 'Submitted on', a.submittedAt && formatDate(a.submittedAt, lang)],
          [ar ? 'تاريخ القرار' : 'Decided on', a.decidedAt && formatDate(a.decidedAt, lang)],
          [
            ar ? 'الظهور في الدليل' : 'Directory listing',
            a.wantsDirectoryListing
              ? ar
                ? 'طلبت الظهور'
                : 'Requested'
              : ar
                ? 'لم تطلب'
                : 'Not requested',
          ],
          [
            ar ? 'الموافقة على الخصوصية' : 'Privacy consent',
            `${a.consentVersion} · ${formatDate(a.consentAt, lang)}`,
          ],
        ]}
      />
      {(a.bioAr || a.bioEn) && (
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted">{ar ? 'النبذة' : 'About'}</p>
          <p className="whitespace-pre-line">{(!ar && a.bioEn) || a.bioAr || a.bioEn}</p>
        </div>
      )}
      {a.links.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted">{ar ? 'الروابط' : 'Links'}</p>
          <ul className="flex flex-col gap-1">
            {a.links.map((l) => (
              <li key={l.label} className="flex flex-wrap gap-2">
                <span className="font-medium">{l.label}</span>
                <bdi dir="ltr" className="break-all text-muted">
                  {l.url}
                </bdi>
              </li>
            ))}
          </ul>
        </div>
      )}
      {a.answers.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-line pt-4">
          <p className="text-sm font-semibold">{ar ? 'إجاباتك' : 'Your answers'}</p>
          {a.answers.map((x) => (
            <div key={x.label.ar} className="flex flex-col gap-0.5">
              <p className="text-sm text-muted">{x.label[lang]}</p>
              <p className="whitespace-pre-line">{x.value}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/** "My data" on screen: what the platform holds about the person, section by section. The download below has it all. */
export function MyDataOverview({ data, lang }: { data: MyData; lang: Lang }) {
  const ar = lang === 'ar';
  const L = (x: { ar: string; en: string } | null) => (x ? x[lang] : null);
  const { account, member } = data;
  const st = member ? MEMBER_STATUS_LABEL[member.status as MemberStatus] : null;
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">{ar ? 'الحساب' : 'Account'}</h2>
        <Rows
          ar={ar}
          rows={[
            [ar ? 'الاسم (عربي)' : 'Name (Arabic)', account.nameAr],
            [ar ? 'الاسم (إنجليزي)' : 'Name (English)', account.nameEn],
            [
              ar ? 'البريد الإلكتروني' : 'E-mail',
              <bdi key="e" dir="ltr">
                {account.email}
              </bdi>,
            ],
            [
              ar ? 'لغة الرسائل' : 'Message language',
              account.locale === 'en' ? 'English' : 'العربية',
            ],
            [ar ? 'تاريخ إنشاء الحساب' : 'Account created', formatDate(account.createdAt, lang)],
            [ar ? 'مناصب حالية' : 'Current positions', data.positions],
            [ar ? 'تسجيلات في الفعاليات' : 'Event registrations', data.registrations],
          ]}
        />
      </Card>

      {member && (
        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{ar ? 'سجل العضوية' : 'Member record'}</h2>
            {st && <Badge tone={st.tone === 'danger' ? 'danger' : st.tone}>{st[lang]}</Badge>}
          </div>
          <Rows
            ar={ar}
            rows={[
              [ar ? 'الاسم (عربي)' : 'Name (Arabic)', member.namesAr],
              [ar ? 'الاسم (إنجليزي)' : 'Name (English)', member.namesEn],
              [
                ar ? 'الجوال' : 'Phone',
                member.phone && (
                  <bdi key="p" dir="ltr">
                    {member.phone}
                  </bdi>
                ),
              ],
              [ar ? 'انضممت' : 'Joined', formatDate(member.joinedAt, lang)],
              [ar ? 'طريقة الانضمام' : 'How you joined', JOINED_VIA[member.joinedVia]?.[lang]],
              [
                ar ? 'الحالة' : 'Status',
                member.academicStatus
                  ? ACADEMIC_LABEL[member.academicStatus as AcademicStatus]?.[lang]
                  : null,
              ],
              [ar ? 'الجامعة' : 'University', L(member.university)],
              [ar ? 'التخصص' : 'Major', L(member.major)],
              [ar ? 'التخصص الدقيق' : 'Sub-major', L(member.subMajor)],
              [ar ? 'المسار' : 'Track', L(member.track)],
              [
                ar ? 'الظهور في الدليل' : 'Shown in the directory',
                member.directoryListed ? (ar ? 'نعم' : 'Yes') : ar ? 'لا' : 'No',
              ],
            ]}
          />
          <p className="text-sm text-muted">
            {ar
              ? 'رقم الجوال لا يظهر للزوار أبداً. يراه قادة المجتمع المخوّلون فقط.'
              : 'Your phone number is never shown to visitors. Only authorised community leaders can see it.'}
          </p>
        </Card>
      )}

      {data.applications.map((a) => (
        <Application key={a.id} a={a} lang={lang} />
      ))}
    </div>
  );
}
