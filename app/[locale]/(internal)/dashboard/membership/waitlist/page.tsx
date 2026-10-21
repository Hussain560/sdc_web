import { nowMs } from '@/lib/now';
import { CalendarClock, Hourglass, Mail, ShieldCheck } from 'lucide-react';
import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterSelect } from '@/components/patterns/FilterControls';
import { canGlobal } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { getAccess } from '@/modules/access/queries';
import { WaitlistBoard } from '@/modules/membership/components/WaitlistBoard';
import {
  getActivationRows,
  getWaitlist,
  listReviewCycles,
} from '@/modules/membership/review-queries';
import { createClient } from '@/lib/supabase/server';

// MBR-013 / ACC-009: the waiting list, the people still to activate, those who lapsed, and the morning digest.
export default async function WaitlistPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cycle?: string }>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  await requireUser('/dashboard/membership/waitlist');
  const access = await getAccess();
  if (!access || !canGlobal(access, 'membership.review')) return <Forbidden />;

  const sp = await searchParams;
  const cycles = await listReviewCycles();
  const current =
    cycles.find((c) => c.id === sp.cycle) ??
    cycles.find((c) => c.phase === 'open') ??
    cycles.find((c) => c.phase === 'closed') ??
    cycles[0];
  const [activation, waitlist] = await Promise.all([
    getActivationRows(current?.id),
    getWaitlist(current?.id),
  ]);
  const free = current?.capacity != null ? Math.max(0, current.capacity - current.accepted) : null;

  // What the morning digest says: read with the viewer's own rights, so it never shows more than the page does.
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const week = new Date(nowMs() + 7 * 86_400_000).toISOString().slice(0, 10);
  const [{ count: ending }, { count: leave }] = await Promise.all([
    supabase
      .from('members')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('term_ends_at', today)
      .lte('term_ends_at', week),
    supabase
      .from('member_leave_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ]);
  const lapsed = activation.filter((r) => r.status === 'lapsed').length;
  const waiting = activation.length - lapsed;
  const digest = [
    {
      icon: Hourglass,
      text: ar
        ? `سقط تفعيل ${lapsed}. يُعرض المقعد على التالي بعد 24 ساعة.`
        : `${lapsed} lapsed. The place is offered on after 24 hours.`,
    },
    {
      icon: Mail,
      text: ar
        ? `${waiting} بانتظار التفعيل، ويُرسل لهم تذكير في اليوم 3 واليوم 6.`
        : `${waiting} waiting to activate; reminders go out on day 3 and day 6.`,
    },
    {
      icon: CalendarClock,
      text: ar
        ? `تنتهي هذا الأسبوع: ${ending ?? 0} عضويات.`
        : `Ending this week: ${ending ?? 0} memberships.`,
    },
    {
      icon: ShieldCheck,
      text: ar ? `طلبات مغادرة معلّقة: ${leave ?? 0}.` : `Pending leave requests: ${leave ?? 0}.`,
    },
  ];

  return (
    <>
      <PageHeader
        title={ar ? 'الانتظار والتفعيل' : 'Waiting & activation'}
        description={
          current
            ? `${ar ? current.nameAr : current.nameEn || current.nameAr}${current.capacity !== null ? (ar ? ` · المقبولون ${current.accepted} من ${current.capacity}` : ` · ${current.accepted} of ${current.capacity} accepted`) : ''}`
            : undefined
        }
        action={
          cycles.length > 1 ? (
            <form method="get">
              <label className="flex items-center gap-2 text-sm text-muted">
                <span className="sr-only">{ar ? 'الدورة' : 'Cycle'}</span>
                <FilterSelect
                  auto
                  name="cycle"
                  defaultValue={current?.id}
                  className="h-11 rounded-shape-md border border-line-strong bg-field px-3 text-sm text-text focus-visible:outline-2 focus-visible:outline-focus-ring"
                >
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {ar ? c.nameAr : c.nameEn || c.nameAr}
                    </option>
                  ))}
                </FilterSelect>
              </label>
            </form>
          ) : undefined
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <WaitlistBoard
          activation={activation}
          waitlist={waitlist}
          freeSeats={free}
          capacity={current?.capacity ?? null}
          ranked={(current?.rubric.length ?? 0) > 0}
        />
        <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
          <section
            className="m-reveal overflow-hidden rounded-shape-xl border border-line bg-surface"
            aria-labelledby="wl-digest"
          >
            <div className="bg-accent-soft p-4">
              <p className="text-xs text-on-accent-soft">
                {ar
                  ? 'بريد إلى القيادة · كل صباح 7:00'
                  : 'E-mail to leadership · every morning at 7:00'}
              </p>
              <h2 id="wl-digest" className="mt-1 font-bold text-on-accent-soft">
                {ar ? 'ملخص العضوية' : 'Membership summary'}
              </h2>
            </div>
            <ul className="divide-y divide-line">
              {digest.map((d) => (
                <li key={d.text} className="flex items-start gap-3 p-4 text-sm">
                  <d.icon
                    size={16}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-accent-text"
                  />
                  <span>{d.text}</span>
                </li>
              ))}
            </ul>
          </section>
          <p className="flex items-start gap-2 rounded-shape-lg bg-surface-raised p-3 text-xs text-muted">
            <ShieldCheck size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
            {ar
              ? 'المهمة اليومية لا تتجاوز سعة الدورة، وتُعاد بأمان، ولها وضع تجربة. كل ترقية تُسجّل بالسبب activation_lapsed.'
              : 'The daily job never exceeds the cycle capacity, is safe to re-run, and has a dry-run mode. Every promotion is logged with the reason activation_lapsed.'}
          </p>
        </aside>
      </div>
    </>
  );
}
