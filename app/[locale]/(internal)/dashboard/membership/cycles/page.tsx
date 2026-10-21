import { CalendarCheck, CalendarRange, Hourglass, KeyRound, Plus, Star, Users } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Badge, EmptyState, LinkButton } from '@/components/ui';
import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { Link } from '@/i18n/navigation';
import { canGlobal } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { getAccess } from '@/modules/access/queries';
import { CycleActions } from '@/modules/membership/components/CycleActions';
import { FunnelBars } from '@/modules/membership/components/FunnelBars';
import { listCycles, type CycleRow } from '@/modules/membership/queries';
import { PHASE_LABEL } from '@/modules/membership/types';

// MBR-001 (screen 17), Sprint 18: the intake, one cycle at a time, with its funnel. Permission: membership.manage_cycles.
export default async function CyclesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  await requireUser('/dashboard/membership/cycles');
  const access = await getAccess();
  if (!access || !canGlobal(access, 'membership.manage_cycles')) return <Forbidden />;

  const cycles = await listCycles();
  const hero =
    cycles.find((c) => c.phase === 'open') ??
    cycles.find((c) => c.phase === 'scheduled') ??
    cycles.find((c) => c.phase === 'closed');
  const others = cycles.filter((c) => c.id !== hero?.id);
  const undecided = (c: CycleRow) => (c.counts.submitted ?? 0) + (c.counts.under_review ?? 0);
  const name = (c: CycleRow) => (ar ? c.nameAr : c.nameEn || c.nameAr);
  const range = (c: CycleRow) =>
    `${formatDate(c.opensAt, lang)} ${ar ? '←' : '→'} ${formatDate(c.closeEffective, lang)}`;
  const arrow = ar ? '←' : '→';

  const meta = (c: CycleRow) => {
    const items: Array<{ icon: typeof Users; label: string }> = [];
    if (c.termEndsAt)
      items.push({
        icon: CalendarCheck,
        label: ar
          ? `العضوية حتى ${formatDate(c.termEndsAt, lang)}`
          : `Membership until ${formatDate(c.termEndsAt, lang)}`,
      });
    items.push({
      icon: KeyRound,
      label: ar
        ? `مهلة التفعيل ${c.activationDeadlineDays} أيام`
        : `Activation period ${c.activationDeadlineDays} days`,
    });
    items.push({
      icon: Star,
      label:
        c.rubric.length > 0
          ? ar
            ? `${c.rubric.length} معايير تقييم`
            : `${c.rubric.length} scoring criteria`
          : ar
            ? 'بلا معايير'
            : 'No rubric',
    });
    if (c.funnel.waitlisted > 0)
      items.push({
        icon: Hourglass,
        label: ar ? `${c.funnel.waitlisted} في الانتظار` : `${c.funnel.waitlisted} waiting`,
      });
    return items;
  };

  return (
    <>
      <PageHeader
        title={ar ? 'دورات العضوية' : 'Membership cycles'}
        description={
          ar
            ? 'دورة واحدة مفتوحة في كل وقت. لكل دورة مدة عضوية ومهلة تفعيل ومعايير تقييم.'
            : 'One cycle is open at a time. Each cycle has a membership term, an activation period and scoring criteria.'
        }
        action={
          <LinkButton
            href="/dashboard/membership/cycles/new"
            iconStart={<Plus size={16} aria-hidden="true" />}
          >
            {ar ? 'دورة جديدة' : 'New cycle'}
          </LinkButton>
        }
      />

      {cycles.length === 0 ? (
        <EmptyState
          icon={<CalendarRange size={36} aria-hidden="true" />}
          title={ar ? 'لم تُنشأ أي دورة بعد' : 'No cycle has been created yet'}
          description={ar ? 'صفحة الانضمام تعرض «مغلق» حاليًا.' : '/join currently shows "closed".'}
        />
      ) : (
        <div className="flex flex-col gap-5">
          {hero && (
            <section
              className="m-reveal rounded-shape-xl border border-line-accent bg-surface p-5 md:p-6"
              aria-label={ar ? 'الدورة الحالية' : 'Current cycle'}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="t-h3">{name(hero)}</h2>
                    <Badge tone={PHASE_LABEL[hero.phase].tone}>
                      {PHASE_LABEL[hero.phase].label[lang]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm tabular-nums text-muted">
                    {range(hero)}
                    {hero.capacity
                      ? ar
                        ? ` · ${hero.capacity} مقعداً`
                        : ` · ${hero.capacity} places`
                      : ''}
                    {hero.reviewEndsAt
                      ? ar
                        ? ` · القرار ${formatDate(hero.reviewEndsAt, lang)}`
                        : ` · decision ${formatDate(hero.reviewEndsAt, lang)}`
                      : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/membership/cycles/${hero.id}/edit`}
                    className="inline-flex min-h-9 items-center rounded-full border-[1.5px] border-line-strong px-4 text-sm font-semibold hover:border-accent hover:bg-surface-raised"
                  >
                    {ar ? 'تعديل' : 'Edit'}
                  </Link>
                  <Link
                    href={`/dashboard/membership/applications?cycle=${hero.id}`}
                    className="inline-flex min-h-9 items-center rounded-full px-4 text-sm font-semibold text-accent-text hover:bg-surface-raised"
                  >
                    {ar ? 'الطلبات' : 'Applications'} {arrow}
                  </Link>
                </div>
              </div>

              <div className="mt-6">
                <FunnelBars funnel={hero.funnel} ar={ar} />
              </div>

              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-sm text-muted">
                {meta(hero).map((m) => (
                  <li key={m.label} className="flex items-center gap-1.5">
                    <m.icon size={15} aria-hidden="true" />
                    <span className="tabular-nums">{m.label}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4">
                <CycleActions
                  id={hero.id}
                  status={hero.status}
                  phase={hero.phase}
                  undecided={undecided(hero)}
                />
              </div>
            </section>
          )}

          {others.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2">
              {others.map((c, i) => (
                <section
                  key={c.id}
                  className="m-reveal flex flex-col gap-4 rounded-shape-xl border border-line bg-surface p-5"
                  style={{ '--i': i } as CSSProperties}
                  aria-label={name(c)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold">{name(c)}</h2>
                        <Badge tone={PHASE_LABEL[c.phase].tone}>
                          {PHASE_LABEL[c.phase].label[lang]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm tabular-nums text-muted">
                        {c.phase === 'scheduled'
                          ? ar
                            ? `يفتح ${formatDate(c.opensAt, lang)}`
                            : `Opens ${formatDate(c.opensAt, lang)}`
                          : range(c)}
                        {c.capacity
                          ? ar
                            ? ` · ${c.capacity} مقعداً`
                            : ` · ${c.capacity} places`
                          : ''}
                      </p>
                    </div>
                    {c.status !== 'completed' && (
                      <Link
                        href={`/dashboard/membership/cycles/${c.id}/edit`}
                        className="inline-flex min-h-9 items-center rounded-full border-[1.5px] border-line-strong px-4 text-sm font-semibold hover:border-accent hover:bg-surface-raised"
                      >
                        {ar ? 'تعديل' : 'Edit'}
                      </Link>
                    )}
                  </div>
                  <FunnelBars funnel={c.funnel} ar={ar} compact />
                  <p className="flex items-center gap-1.5 text-sm text-muted">
                    {c.phase === 'completed' ? (
                      <>
                        <Users size={15} aria-hidden="true" />
                        <span className="tabular-nums">
                          {ar
                            ? `${c.funnel.activated} عضواً، ${c.stillActive} ما زالوا نشطين`
                            : `${c.funnel.activated} members, ${c.stillActive} still active`}
                        </span>
                      </>
                    ) : (
                      <>
                        <CalendarCheck size={15} aria-hidden="true" />
                        <span className="tabular-nums">
                          {c.termEndsAt
                            ? ar
                              ? `العضوية حتى ${formatDate(c.termEndsAt, lang)}`
                              : `Membership until ${formatDate(c.termEndsAt, lang)}`
                            : ar
                              ? 'بلا تاريخ نهاية محدد'
                              : 'No fixed end date'}
                          {c.rubric.length === 0 ? (ar ? ' · بلا معايير' : ' · no rubric') : ''}
                        </span>
                      </>
                    )}
                  </p>
                  {c.status !== 'completed' && (
                    <CycleActions
                      id={c.id}
                      status={c.status}
                      phase={c.phase}
                      undecided={undecided(c)}
                    />
                  )}
                </section>
              ))}
            </div>
          )}

          <p className="rounded-shape-lg bg-surface-raised p-3 text-sm text-muted">
            <strong className="text-text">{ar ? 'القمع: ' : 'The funnel: '}</strong>
            {ar
              ? '«سقط التفعيل» هم المقبولون الذين لم يفعّلوا خلال المهلة، وعُرضت مقاعدهم على قائمة الانتظار تلقائياً.'
              : '“Lapsed” are accepted people who did not activate in time; their places were offered to the waiting list automatically.'}
          </p>
        </div>
      )}
    </>
  );
}
