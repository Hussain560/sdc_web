import { CalendarRange } from 'lucide-react';
import { Badge, EmptyState } from '@/components/ui';
import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { Link } from '@/i18n/navigation';
import { canGlobal } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { getAccess } from '@/modules/access/queries';
import { CycleActions } from '@/modules/membership/components/CycleActions';
import { listCycles, type CycleRow } from '@/modules/membership/queries';
import { PHASE_LABEL } from '@/modules/membership/types';

// MBR-001 (screen 17): leadership schedules the periodic intake. Permission: membership.manage_cycles (global).
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
  const undecided = (c: CycleRow) => (c.counts.submitted ?? 0) + (c.counts.under_review ?? 0);
  const name = (c: CycleRow) => (ar ? c.nameAr : c.nameEn || c.nameAr);
  const range = (c: CycleRow) =>
    `${formatDate(c.opensAt, lang)} → ${formatDate(c.closeEffective, lang)}`;

  return (
    <>
      <PageHeader
        title={ar ? 'دورات استقبال العضوية' : 'Membership intake cycles'}
        description={
          ar
            ? 'صفحة الانضمام تقبل الطلبات فقط أثناء دورة مفتوحة.'
            : 'The join page accepts applications only while a cycle is open.'
        }
        action={
          <Link
            href="/dashboard/membership/cycles/new"
            className="inline-flex min-h-10 items-center rounded-full bg-accent px-5 text-sm font-semibold text-on-accent hover:bg-accent-hover"
          >
            {ar ? '+ دورة جديدة' : '+ New cycle'}
          </Link>
        }
      />

      {cycles.length === 0 ? (
        <EmptyState
          icon={<CalendarRange size={36} aria-hidden="true" />}
          title={ar ? 'لم تُنشأ أي دورة بعد' : 'No cycle has been created yet'}
          description={ar ? 'صفحة الانضمام تعرض «مغلق» حاليًا.' : '/join currently shows "closed".'}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {hero && (
            <section
              className="rounded-2xl border border-line-accent bg-surface p-5"
              aria-label={ar ? 'الدورة الحالية' : 'Current cycle'}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold">✦ {name(hero)}</h2>
                <Badge tone={PHASE_LABEL[hero.phase].tone}>
                  {PHASE_LABEL[hero.phase].label[lang]}
                </Badge>
              </div>
              <p className="mt-1 text-sm tabular-nums text-muted">{range(hero)}</p>
              <p className="mt-3 text-sm tabular-nums">
                {ar
                  ? `طلبات: ${hero.total} · جديدة ${hero.counts.submitted ?? 0} · قيد المراجعة ${hero.counts.under_review ?? 0} · مقبولة ${hero.counts.accepted ?? 0}`
                  : `Applications: ${hero.total} · new ${hero.counts.submitted ?? 0} · under review ${hero.counts.under_review ?? 0} · accepted ${hero.counts.accepted ?? 0}`}
              </p>
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

          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-line bg-surface-raised text-xs text-muted">
                <tr>
                  {[
                    ar ? 'الدورة' : 'Cycle',
                    ar ? 'الفترة' : 'Window',
                    ar ? 'المرحلة' : 'Phase',
                    ar ? 'الطلبات' : 'Applications',
                    '',
                  ].map((h, i) => (
                    <th key={i} scope="col" className="px-4 py-2.5 text-start text-xs font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cycles.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-line align-middle transition-colors last:border-0 hover:bg-surface-raised"
                  >
                    <td className="px-4 py-3 font-medium">{name(c)}</td>
                    <td className="px-4 py-3 tabular-nums text-muted">{range(c)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={PHASE_LABEL[c.phase].tone}>
                        {PHASE_LABEL[c.phase].label[lang]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{c.total}</td>
                    <td className="px-4 py-3">
                      {c.id !== hero?.id && (
                        <CycleActions
                          id={c.id}
                          status={c.status}
                          phase={c.phase}
                          undecided={undecided(c)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
