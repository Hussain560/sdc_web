import { nowMs } from '@/lib/now';
import { Send } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { AdminMemberDetail } from '../admin-queries';
import { SUSPENSION_CATEGORY_LABEL } from '../schemas';

/** The cards at the top of the member record: the current term, a suspension, a pending leave request. */
export function MemberTermCards({
  detail,
  lang,
}: {
  detail: AdminMemberDetail;
  lang: 'ar' | 'en';
}) {
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const m = detail.member;
  const day = (iso: string) => formatDate(iso, lang);
  const now = nowMs();
  const daysLeft = m.termEndsAt ? Math.ceil((Date.parse(m.termEndsAt) - now) / 86_400_000) : null;
  const endingSoon = m.status === 'active' && daysLeft !== null && daysLeft <= 30;
  const progress =
    m.termStartsAt && m.termEndsAt
      ? Math.min(
          100,
          Math.max(
            4,
            ((now - Date.parse(m.termStartsAt)) /
              Math.max(1, Date.parse(m.termEndsAt) - Date.parse(m.termStartsAt))) *
              100,
          ),
        )
      : null;
  const category = m.suspensionCategory as keyof typeof SUSPENSION_CATEGORY_LABEL | null;

  return (
    <>
      {m.termEndsAt && (
        <section
          className={`rounded-xl border p-5 ${endingSoon ? 'border-warning bg-warning-soft' : 'border-line bg-surface'}`}
          aria-labelledby="term"
        >
          <h2 id="term" className="t-h4 mb-3">
            {L('المدة الحالية', 'Current term')}
          </h2>
          <div className="flex items-center justify-between text-sm tabular-nums">
            <span>{m.termStartsAt ? day(m.termStartsAt) : ''}</span>
            <span className="font-bold">{day(m.termEndsAt)}</span>
          </div>
          {progress !== null && (
            <div
              aria-hidden="true"
              className="mt-2 h-2 overflow-hidden rounded-full bg-surface-raised"
            >
              <div
                className={`h-full rounded-full ${endingSoon ? 'bg-warning' : 'bg-accent'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <p className="mt-2 text-sm text-muted">
            {m.status === 'expired'
              ? L(
                  'انتهت المدة. جدّد لتعود العضوية نشطة.',
                  'The term ended. Renew to make the membership active again.',
                )
              : daysLeft !== null
                ? L(`${Math.max(0, daysLeft)} يوماً متبقياً`, `${Math.max(0, daysLeft)} days left`)
                : ''}
          </p>
          {m.renewalRequestedAt && (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-medium">
              <Send size={14} aria-hidden="true" />
              {L('طلب العضو التجديد', 'The member asked for a renewal')}
            </p>
          )}
        </section>
      )}
      {m.status === 'suspended' && (
        <section
          className="rounded-xl border border-warning bg-warning-soft p-5"
          aria-labelledby="susp"
        >
          <h2 id="susp" className="t-h4 mb-1">
            {L('العضوية موقوفة', 'Membership suspended')}
          </h2>
          <p className="text-sm">
            {category ? SUSPENSION_CATEGORY_LABEL[category]?.[lang] : ''}
            {m.suspendedUntil ? ` · ${L('حتى', 'until')} ${day(m.suspendedUntil)}` : ''}
          </p>
        </section>
      )}
      {detail.leaveRequest && (
        <section className="rounded-xl border border-info bg-info-soft p-5" aria-labelledby="lreq">
          <h2 id="lreq" className="t-h4 mb-1">
            {L('طلب مغادرة معلّق', 'Leave request pending')}
          </h2>
          <p className="text-sm">
            {detail.leaveRequest.reason
              ? `«${detail.leaveRequest.reason}»`
              : L('لم يذكر سبباً.', 'No reason given.')}
          </p>
          {detail.leaveRequest.preferredLastDay && (
            <p className="mt-1 text-sm text-muted">
              {L('يفضّل آخر يوم:', 'Preferred last day:')}{' '}
              {day(detail.leaveRequest.preferredLastDay)}
            </p>
          )}
        </section>
      )}
    </>
  );
}
