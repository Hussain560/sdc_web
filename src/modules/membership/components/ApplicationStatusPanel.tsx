import { Badge } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { APPLICATION_STATUS_LABEL, type ApplicationStatus } from '../types';

/** Timeline: submitted → under review → decision. Never shows the internal decision note (MA-5). */
export function ApplicationStatusPanel({
  status,
  submittedAt,
  decidedAt,
  lang,
}: {
  status: ApplicationStatus;
  submittedAt: string;
  decidedAt: string | null;
  lang: 'ar' | 'en';
}) {
  const ar = lang === 'ar';
  const st = APPLICATION_STATUS_LABEL[status];
  const decided = status === 'accepted' || status === 'rejected' || status === 'waitlisted';
  const items: Array<{ label: string; at: string | null; reached: boolean }> = [
    { label: ar ? 'استلام الطلب' : 'Application received', at: submittedAt, reached: true },
    { label: ar ? 'المراجعة' : 'Review', at: null, reached: status !== 'submitted' },
    { label: ar ? 'القرار' : 'Decision', at: decidedAt, reached: decided },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">{ar ? 'حالة الطلب' : 'Status'}</span>
        <Badge tone={st.tone}>{st.label[lang]}</Badge>
      </div>
      {status !== 'withdrawn' && (
        <ol className="flex flex-col gap-3 border-s border-line ps-5">
          {items.map((i) => (
            <li key={i.label} className="relative">
              <span
                className={`absolute -start-[1.65rem] top-1.5 size-2.5 rounded-full ${i.reached ? 'bg-accent' : 'bg-line'}`}
                aria-hidden="true"
              />
              <p className={i.reached ? 'font-medium' : 'text-muted'}>{i.label}</p>
              {i.at && <p className="text-xs tabular-nums text-muted">{formatDate(i.at, lang)}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
