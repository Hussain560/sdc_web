import { CircleCheck, Download } from 'lucide-react';
import Image from 'next/image';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { buttonClasses } from '@/components/ui/Button';
import { formatDateRange } from '@/lib/format';
import type { CertificateFacts } from '../../queries';

type Lang = 'ar' | 'en';

const COPY = {
  ar: {
    home: 'الرئيسية',
    verify: 'التحقق من شهادة',
    breadcrumb: 'مسار التنقل',
    kicker: 'شهادة حضور',
    valid: 'شهادة صحيحة صادرة من المجتمع السعودي للمطورين',
    event: 'الفعالية',
    dates: 'التاريخ',
    attendance: 'نسبة الحضور',
    number: 'رقم الشهادة',
    download: 'تنزيل الشهادة PDF',
    printUrl: 'للتحقق من هذه الشهادة:',
  },
  en: {
    home: 'Home',
    verify: 'Certificate verification',
    breadcrumb: 'Breadcrumb',
    kicker: 'Certificate of attendance',
    valid: 'Valid certificate issued by the Saudi Developer Community',
    event: 'Event',
    dates: 'Dates',
    attendance: 'Attendance',
    number: 'Certificate number',
    download: 'Download the PDF',
    printUrl: 'To verify this certificate:',
  },
} as const;

/**
 * Certificate verification result (components §3.5, 10-certificate): the frozen facts only, never the e-mail.
 * `@media print` (print.css rules in globals) gives a white page with the id and the verification URL under the card.
 */
export default function CertificateView({
  id,
  facts,
  canDownload,
  lang,
}: {
  id: string;
  facts: CertificateFacts;
  canDownload: boolean;
  lang: Lang;
}) {
  const t = COPY[lang];
  const en = lang === 'en';
  const rows: Array<[string, string]> = [
    [t.event, (en ? facts.titleEn || facts.titleAr : facts.titleAr) ?? ''],
    [t.dates, formatDateRange(facts.startDate, facts.endDate, lang)],
    [t.attendance, `${facts.percent}%`],
  ];
  return (
    <>
      <div className="print:hidden">
        <SiteHeader />
      </div>
      <main id="main" className="mx-auto w-full max-w-(--container-narrow) px-4 pb-8">
        <div className="pt-6 print:hidden">
          <Breadcrumb label={t.breadcrumb} items={[{ label: t.home, href: '/' }, { label: t.verify }]} />
        </div>
        <article className="certificate-card mt-8 flex flex-col gap-6 rounded-shape-xl border border-line-accent bg-surface p-6 md:p-10">
          <div className="flex items-center justify-between gap-4">
            <Image src="/assets/sdc-logo-mark.svg" alt="" width={40} height={40} className="size-10" />
            <p className="t-caption text-muted">{t.kicker}</p>
          </div>
          <div role="status" className="flex items-center gap-3 text-success">
            <CircleCheck aria-hidden="true" className="size-7 shrink-0" />
            <h1 className="t-h3">{t.valid}</h1>
          </div>
          <p className="t-h2">{facts.recipientName}</p>
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {rows.map(([k, v]) => (
              <div key={k}>
                <dt className="t-caption text-muted">{k}</dt>
                <dd className="t-body font-semibold">{v}</dd>
              </div>
            ))}
            <div className="sm:col-span-2">
              <dt className="t-caption text-muted">{t.number}</dt>
              <dd dir="ltr" className="font-mono text-sm text-start break-all">
                {id}
              </dd>
            </div>
          </dl>
          <p className="t-body-sm hidden text-muted print:block">
            {t.printUrl} <span dir="ltr">/certificates/{id}</span>
          </p>
          {canDownload && (
            <a
              href={`/api/certificates/${id}/pdf`}
              className={`${buttonClasses({ size: 'lg' })} w-fit print:hidden`}
            >
              <Download aria-hidden="true" className="size-5" />
              {t.download}
            </a>
          )}
        </article>
      </main>
      <div className="print:hidden">
        <SiteFooter />
      </div>
    </>
  );
}
