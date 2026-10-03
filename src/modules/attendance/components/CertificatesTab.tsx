'use client';

import { Award, Send } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Avatar, Badge, Button, Card, Dialog, StatCard, useToast } from '@/components/ui';
import { useLanguage } from '@/context/LanguageContext';
import { Link, useRouter } from '@/i18n/navigation';
import { issueCertificates, resendFailedCertificates, sendCertificate } from '../actions';
import type { AttendanceOverview, CertificateRow } from '../types';

const STATE: Record<
  'none' | 'pending' | 'generated' | 'sent' | 'failed',
  { ar: string; en: string; tone: 'neutral' | 'accent' | 'warning' | 'danger' }
> = {
  none: { ar: 'لم تصدر', en: 'Not issued', tone: 'neutral' },
  pending: { ar: 'بانتظار الإرسال', en: 'Waiting to send', tone: 'warning' },
  generated: { ar: 'جاهزة للإرسال', en: 'Ready to send', tone: 'warning' },
  sent: { ar: 'أُرسلت', en: 'Sent', tone: 'accent' },
  failed: { ar: 'فشل الإرسال', en: 'Failed', tone: 'danger' },
};

/**
 * Certificates tab (KFUCS parity): available once every session and the event attendance are signed off. It lists
 * each accepted registrant with the final percentage and the certificate state, issues certificates for those who
 * reached the threshold and sends or retries them (e-mail with the verification link and PDF).
 */
export function CertificatesTab({
  eventId,
  overview,
  rows,
  canIssue,
  canManageSettings,
}: {
  eventId: string;
  overview: AttendanceOverview;
  rows: CertificateRow[];
  canIssue: boolean;
  canManageSettings: boolean;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const router = useRouter();
  const toast = useToast();
  const [busy, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  const eligible = rows.filter((r) => r.eligible);
  const toIssue = eligible.filter((r) => !r.certificate).length;
  const sent = rows.filter((r) => r.certificate?.status === 'sent').length;
  const failed = rows.filter((r) => r.certificate?.status === 'failed').length;
  const waiting = rows.filter(
    (r) => r.certificate && ['pending', 'generated'].includes(r.certificate.status),
  ).length;

  const issue = () =>
    startTransition(async () => {
      const r = await issueCertificates(eventId, { lang });
      setConfirm(false);
      if (!r.ok) {
        toast.error(r.message);
        return;
      }
      toast.success(
        r.data.issued > 0
          ? L(
              `صدرت ${r.data.issued} شهادة وجارٍ إرسالها.`,
              `${r.data.issued} certificates issued; sending now.`,
            )
          : L('لا شهادات جديدة لإصدارها.', 'No new certificates to issue.'),
      );
      router.refresh();
    });

  const sendOne = (certificateId: string) =>
    startTransition(async () => {
      const r = await sendCertificate({ certificateId, eventId }, { lang });
      if (!r.ok) toast.error(r.message);
      else if (r.data.outcome === 'sent') toast.success(L('أُرسلت الشهادة.', 'Certificate sent.'));
      else if (r.data.outcome === 'failed')
        toast.warning(L('تعذّر الإرسال، سنحاول لاحقًا.', 'Sending failed; try again later.'));
      router.refresh();
    });

  const resendFailed = () =>
    startTransition(async () => {
      const r = await resendFailedCertificates(eventId, { lang });
      if (!r.ok) toast.error(r.message);
      else if (r.data.failed > 0)
        toast.warning(
          L(
            `أُرسلت ${r.data.sent} وتعذّرت ${r.data.failed}.`,
            `${r.data.sent} sent, ${r.data.failed} failed again.`,
          ),
        );
      else toast.success(L(`أُرسلت ${r.data.sent} شهادة.`, `${r.data.sent} certificates sent.`));
      router.refresh();
    });

  if (!overview.certificatesEnabled)
    return (
      <Card className="flex flex-col items-start gap-3">
        <h2 className="text-lg font-bold">{L('الشهادات غير مفعّلة', 'Certificates are off')}</h2>
        <p className="text-sm text-muted">
          {L(
            'فعّل إصدار الشهادات من إعدادات الموقع لتتمكن من إصدارها لمن بلغ نسبة الحضور المطلوبة.',
            'Turn certificates on in the site settings to issue them to everyone who reached the required attendance.',
          )}
        </p>
        {canManageSettings && (
          <Link
            href="/dashboard/admin/settings"
            className="inline-flex min-h-10 items-center rounded-full border border-line-accent px-4 text-sm font-semibold text-accent hover:bg-surface-raised"
          >
            {L('فتح الإعدادات', 'Open settings')}
          </Link>
        )}
      </Card>
    );

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={L('مؤهلون', 'Eligible')}
          value={eligible.length}
          hint={L(`الحد ${overview.threshold}%`, `Threshold ${overview.threshold}%`)}
        />
        <StatCard label={L('بانتظار الإصدار', 'To issue')} value={toIssue} />
        <StatCard
          label={L('أُرسلت', 'Sent')}
          value={sent}
          hint={waiting ? L(`${waiting} بانتظار الإرسال`, `${waiting} waiting`) : undefined}
        />
        <StatCard label={L('فشلت', 'Failed')} value={failed} />
      </div>

      {canIssue && (
        <div className="flex flex-wrap items-center gap-2">
          <Button disabled={toIssue === 0 || busy} onClick={() => setConfirm(true)}>
            <Award size={16} aria-hidden="true" />
            {L(`إصدار وإرسال الشهادات (${toIssue})`, `Issue and send certificates (${toIssue})`)}
          </Button>
          <Button variant="secondary" disabled={failed === 0 || busy} onClick={resendFailed}>
            {L('إعادة إرسال الفاشلة', 'Resend failed')}
          </Button>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-surface p-8 text-center text-muted">
          {L(
            'لا يوجد مقبولون في هذه الفعالية.',
            'There are no accepted registrants for this event.',
          )}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-line bg-surface-raised text-xs text-muted">
              <tr>
                {[
                  L('المسجّل', 'Registrant'),
                  L('نسبة الحضور', 'Attendance'),
                  L('الأهلية', 'Eligibility'),
                  L('الشهادة', 'Certificate'),
                  '',
                ].map((h, i) => (
                  <th key={i} scope="col" className="px-4 py-2.5 text-start text-xs font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const key = r.certificate ? r.certificate.status : 'none';
                const st = STATE[key];
                return (
                  <tr
                    key={r.registrationId}
                    className="border-b border-line align-middle transition-colors last:border-0 hover:bg-surface-raised"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={r.fullName} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{r.fullName}</p>
                          <p
                            className="truncate text-xs text-muted"
                            dir="ltr"
                            style={{ textAlign: 'start' }}
                          >
                            {r.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {r.percent === null ? '—' : `${r.percent}%`}
                    </td>
                    <td className="px-4 py-3">
                      {r.eligible ? (
                        <Badge tone="accent">{L('مؤهل', 'Eligible')}</Badge>
                      ) : (
                        <Badge>
                          {r.attended ? L('دون الحد', 'Below threshold') : L('غائب', 'Absent')}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={st.tone}>{ar ? st.ar : st.en}</Badge>
                      {r.certificate?.sentAt && (
                        <p className="mt-1 text-xs text-muted">
                          {new Intl.DateTimeFormat(ar ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                            timeZone: 'Asia/Riyadh',
                          }).format(new Date(r.certificate.sentAt))}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="flex justify-end gap-2">
                        {r.certificate && (
                          <Link
                            href={`/certificates/${r.certificate.id}`}
                            className="text-xs text-accent underline"
                          >
                            {L('عرض', 'View')}
                          </Link>
                        )}
                        {canIssue &&
                          r.certificate &&
                          ['pending', 'generated', 'failed'].includes(r.certificate.status) && (
                            <Button
                              variant="ghost"
                              className="min-h-8 px-3 text-xs"
                              disabled={busy}
                              onClick={() => sendOne(r.certificate!.id)}
                            >
                              <Send size={12} aria-hidden="true" />
                              {r.certificate.status === 'failed'
                                ? L('إعادة الإرسال', 'Retry')
                                : L('إرسال', 'Send')}
                            </Button>
                          )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={confirm}
        onClose={() => (busy ? undefined : setConfirm(false))}
        title={L('إصدار الشهادات', 'Issue certificates')}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            {L(
              `ستصدر ${toIssue} شهادة لمن بلغ ${overview.threshold}% فأكثر، ويصل كل منهم بريد فيه رابط الشهادة. تُثبَّت النسب لحظة الإصدار.`,
              `${toIssue} certificates will be issued to everyone at ${overview.threshold}% or more, and each person gets an e-mail with the certificate link. The percentages are frozen at issue.`,
            )}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(false)} disabled={busy}>
              {L('تراجع', 'Back')}
            </Button>
            <Button loading={busy} onClick={issue}>
              {L('إصدار وإرسال', 'Issue and send')}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
