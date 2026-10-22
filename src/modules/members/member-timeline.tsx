import {
  CalendarClock,
  CircleCheck,
  ClipboardList,
  FileText,
  IdCard,
  KeyRound,
  LogOut,
  Pause,
  Play,
  RefreshCw,
  Send,
  ShieldBan,
  ShieldCheck,
  ClipboardCheck,
  Undo2,
  UsersRound,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { TimelineItem } from '@/components/patterns/Timeline';
import { formatDate } from '@/lib/format';
import type { AdminMemberDetail } from './admin-queries';
import { END_REASON_LABEL } from './schemas';

export type TimelineFilter = 'all' | 'decisions' | 'positions';
type Group = 'decisions' | 'positions' | 'account' | 'application';
type Ev = { at: string; group: Group; item: TimelineItem };

const str = (v: unknown) => (typeof v === 'string' && v ? v : null);
// Reasons the system writes itself are not "internal reasons" a leader typed.
const SYSTEM_REASONS = [
  'term_end',
  'suspension ended',
  'leave request approved',
  'activation_lapsed',
];

/**
 * One timeline for a member (MEM-019): the application, the decision, the account, the positions, the renewals, the
 * suspensions and the end, newest first, with the term end ahead as a pending step. Internal reasons are shown to
 * leadership only (this page is for leadership) and are marked as internal.
 */
export function buildMemberTimeline(
  detail: AdminMemberDetail,
  lang: 'ar' | 'en',
  filter: TimelineFilter,
): TimelineItem[] {
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const m = detail.member;
  const day = (iso: string) => formatDate(iso, lang);
  const dateTime = (iso: string) =>
    new Intl.DateTimeFormat(ar ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Asia/Riyadh',
    }).format(new Date(iso));
  const lock = (text: string) => (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-raised px-3 py-1 text-xs text-muted">
      {L('السبب الداخلي: ', 'Internal reason: ')}
      {text}
    </span>
  );

  const events: Ev[] = [];
  for (const t of detail.timeline) {
    const d = t.data;
    const who = t.actorAr ? ` · ${t.actorAr}` : '';
    const add = (
      group: Group,
      icon: ReactNode,
      title: string,
      opts: { detail?: ReactNode; tone?: TimelineItem['tone']; note?: ReactNode } = {},
    ) =>
      events.push({
        at: t.at,
        group,
        item: {
          key: `e${t.id}`,
          icon,
          title,
          detail: opts.detail ?? (
            <>
              {dateTime(t.at)}
              {who}
            </>
          ),
          tone: opts.tone ?? 'done',
          note: opts.note,
        },
      });
    const reason = str(d.reason);
    const internal = reason && !SYSTEM_REASONS.includes(reason) ? reason : null;
    switch (t.kind) {
      case 'joined':
        add('account', <IdCard />, L('انضم إلى المجتمع', 'Joined the community'));
        break;
      case 'renewed':
        add(
          'decisions',
          <RefreshCw />,
          d.term_ends_at
            ? L(
                `جُدّدت المدة حتى ${day(String(d.term_ends_at))}`,
                `Term renewed until ${day(String(d.term_ends_at))}`,
              )
            : L('جُدّدت العضوية', 'Membership renewed'),
          { note: str(d.message) ? `«${str(d.message)}»` : undefined },
        );
        break;
      case 'suspended':
        add('decisions', <Pause />, L('أُوقفت العضوية مؤقتاً', 'Membership suspended'), {
          tone: 'warn',
          detail: (
            <>
              {dateTime(t.at)}
              {who}
              {str(d.until) ? ` · ${L('حتى', 'until')} ${day(String(d.until))}` : ''}
            </>
          ),
          note: internal ? lock(internal) : undefined,
        });
        break;
      case 'reinstated':
        add('decisions', <Play />, L('أُعيدت العضوية', 'Membership reinstated'));
        break;
      case 'expired':
        add('decisions', <CalendarClock />, L('انتهت مدة العضوية', 'The term ended'), {
          tone: 'pending',
        });
        break;
      case 'ended':
        add(
          'decisions',
          <LogOut />,
          L(
            `انتهت العضوية: ${END_REASON_LABEL[String(d.end_reason)]?.ar ?? ''}`,
            `Membership ended: ${END_REASON_LABEL[String(d.end_reason)]?.en ?? ''}`,
          ),
          { tone: 'danger', note: internal ? lock(internal) : undefined },
        );
        break;
      case 'leave_requested':
        add('decisions', <Send />, L('أرسل طلب مغادرة', 'Asked to leave'), { tone: 'now' });
        break;
      case 'leave_withdrawn':
        add('decisions', <Undo2 />, L('سحب طلب المغادرة', 'Withdrew the leave request'), {
          tone: 'pending',
        });
        break;
      case 'leave_approved':
        add(
          'decisions',
          <CircleCheck />,
          L('وافقت القيادة على المغادرة', 'Leadership approved the leave'),
          { note: str(d.note) ? lock(String(d.note)) : undefined },
        );
        break;
      case 'leave_declined':
        add('decisions', <ShieldBan />, L('رُفض طلب المغادرة', 'The leave request was declined'), {
          tone: 'pending',
          note: str(d.note) ? lock(String(d.note)) : undefined,
        });
        break;
      case 'card_rotated':
        add('account', <IdCard />, L('غيّر رمز بطاقته', 'Changed the card code'), {
          tone: 'pending',
        });
        break;
      case 'renewal_requested':
        add('account', <Send />, L('طلب التجديد', 'Asked for a renewal'), { tone: 'now' });
        break;
      case 'onboarded':
        add('account', <ClipboardCheck />, L('أكمل التهيئة', 'Finished the welcome steps'));
        break;
      case 'blocked':
        add('account', <ShieldBan />, L('حُظر الحساب', 'The account was blocked'), {
          tone: 'danger',
          note: internal ? lock(internal) : undefined,
        });
        break;
      case 'unblocked':
        add('account', <ShieldCheck />, L('رُفع الحظر عن الحساب', 'The account was unblocked'));
        break;
      case 'restored':
        add(
          'decisions',
          <RefreshCw />,
          L('أُعيد مقعده بعد سقوط التفعيل', 'The place was restored after the activation lapsed'),
        );
        break;
      case 'status_note':
        add('decisions', <ClipboardList />, L('ملاحظة سابقة', 'Earlier note'), {
          tone: 'pending',
          note: reason ? lock(reason) : undefined,
        });
        break;
      case 'note':
        add('decisions', <ClipboardList />, L('ملاحظة داخلية', 'Internal note'), {
          tone: 'pending',
          note: str(d.note) ? lock(String(d.note)) : undefined,
        });
        break;
      default:
        break;
    }
  }
  if (m.activatedAt)
    events.push({
      at: m.activatedAt,
      group: 'account',
      item: {
        key: 'activated',
        icon: <KeyRound />,
        title: L('فعّل حسابه', 'Activated the account'),
        detail: day(m.activatedAt),
        tone: 'done',
      },
    });
  for (const a of detail.applications) {
    if (a.submittedAt)
      events.push({
        at: a.submittedAt,
        group: 'application',
        item: {
          key: `as${a.id}`,
          icon: <FileText />,
          title: L('قدّم طلب العضوية', 'Applied for membership'),
          detail: day(a.submittedAt),
          tone: 'done',
          note: a.reference ? (
            <span dir="ltr" className="font-mono text-xs text-muted">
              {a.reference}
            </span>
          ) : undefined,
        },
      });
    if (a.decidedAt && a.status === 'accepted')
      events.push({
        at: a.decidedAt,
        group: 'application',
        item: {
          key: `ad${a.id}`,
          icon: <CircleCheck />,
          title: L(`قُبل في ${a.cycleAr}`, `Accepted in ${a.cycleEn ?? a.cycleAr}`),
          detail: day(a.decidedAt),
          tone: 'done',
          note:
            a.scoreAverage !== null ? (
              <span className="text-sm text-muted">
                {L(
                  `متوسط الدرجة ${a.scoreAverage.toFixed(1)} من 5`,
                  `Average score ${a.scoreAverage.toFixed(1)} of 5`,
                )}
              </span>
            ) : undefined,
        },
      });
  }
  for (const p of detail.positions) {
    events.push({
      at: p.startsAt,
      group: 'positions',
      item: {
        key: `ps${p.id}`,
        icon: <UsersRound />,
        title: L(
          `عُيّن ${p.roleAr}${p.committeeAr ? ` في ${p.committeeAr}` : ''}`,
          `Assigned ${p.roleEn}${p.committeeEn ? ` in ${p.committeeEn}` : ''}`,
        ),
        detail: (
          <>
            {day(p.startsAt)}
            {p.assignedByAr ? ` · ${p.assignedByAr}` : ''}
          </>
        ),
        tone: 'done',
      },
    });
    if (p.endsAt && !p.active)
      events.push({
        at: p.endsAt,
        group: 'positions',
        item: {
          key: `pe${p.id}`,
          icon: <LogOut />,
          title: L('انتهى المنصب', 'Position ended'),
          detail: day(p.endsAt),
          tone: 'pending',
          note: p.endReason ? <span className="text-sm text-muted">{p.endReason}</span> : undefined,
        },
      });
  }
  events.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const shown = events.filter(
    (e) =>
      filter === 'all' ||
      e.group === filter ||
      (filter === 'decisions' && e.group === 'application'),
  );

  const upcoming: TimelineItem[] = [];
  if (m.status === 'active' && m.termEndsAt) {
    const left = Math.ceil((Date.parse(m.termEndsAt) - Date.now()) / 86_400_000);
    upcoming.push({
      key: 'term-end',
      icon: <CalendarClock />,
      title: L('تنتهي المدة', 'The term ends'),
      detail: L(
        `${day(m.termEndsAt)} · بعد ${Math.max(0, left)} يوماً. تذكير قبلها بـ 7 أيام.`,
        `${day(m.termEndsAt)} · in ${Math.max(0, left)} days. A reminder goes 7 days before.`,
      ),
      tone: 'pending',
    });
  }
  return [...upcoming, ...shown.map((e) => e.item)];
}
