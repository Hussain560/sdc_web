import { ScrollText } from 'lucide-react';
import { EmptyState, ExportButton, Pagination } from '@/components/ui';
import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { Link } from '@/i18n/navigation';
import { can } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { pageMeta, parsePage } from '@/lib/pagination';
import { getAccess } from '@/modules/access/queries';
import { cleanAuditFilter, getAuditFacets, listAuditLogs } from '@/modules/admin/queries';

type Search = Record<string, string | undefined>;

const when = (iso: string, lang: 'ar' | 'en') =>
  new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Riyadh',
  }).format(new Date(iso));

const show = (v: unknown): string => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

// ACC-005 (screen 24 §1): the append-only audit log. Permission: audit.view (system administrator only by default).
export default async function AuditLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Search>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  await requireUser('/dashboard/admin/audit');
  const access = await getAccess();
  if (!access || !can(access, 'audit.view')) return <Forbidden />;

  const sp = await searchParams;
  const filter = cleanAuditFilter(sp);
  const request = parsePage(sp);
  const [result, facets] = await Promise.all([
    listAuditLogs(filter, request.page, request.size),
    getAuditFacets(),
  ]);
  const rows = result?.rows ?? [];
  const meta = pageMeta(result?.total ?? 0, request);
  const filtersActive = Object.values(filter).some(Boolean);
  const exportQuery = new URLSearchParams(
    Object.entries(filter).filter(([, v]) => v) as Array<[string, string]>,
  ).toString();

  const input =
    'h-9 rounded-lg border border-line bg-surface px-3 text-sm text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-focus-ring';

  return (
    <>
      <PageHeader
        title={ar ? 'سجل التدقيق' : 'Audit log'}
        description={
          ar
            ? 'سجل للقراءة فقط لكل إجراء حساس. لا يمكن تعديله أو حذفه.'
            : 'A read-only record of every sensitive action. It cannot be edited or deleted.'
        }
        action={
          <ExportButton
            href={`/api/admin/audit/export${exportQuery ? `?${exportQuery}` : ''}`}
            filename="audit-log.csv"
          />
        }
      />

      <form method="get" className="mb-4 flex flex-wrap items-end gap-x-4 gap-y-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          {ar ? 'المنفّذ' : 'Actor'}
          <input
            name="actor"
            defaultValue={filter.actor ?? ''}
            placeholder={ar ? 'الاسم أو البريد' : 'Name or e-mail'}
            className={`${input} w-52`}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          {ar ? 'الإجراء' : 'Action'}
          <select name="action" defaultValue={filter.action ?? ''} dir="ltr" className={input}>
            <option value="">{ar ? 'الكل' : 'All'}</option>
            {facets.actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          {ar ? 'الكيان' : 'Entity'}
          <select name="entity" defaultValue={filter.entity ?? ''} dir="ltr" className={input}>
            <option value="">{ar ? 'الكل' : 'All'}</option>
            {facets.entities.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          {ar ? 'من' : 'From'}
          <input type="date" name="from" defaultValue={filter.from ?? ''} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          {ar ? 'إلى' : 'To'}
          <input type="date" name="to" defaultValue={filter.to ?? ''} className={input} />
        </label>
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-full border border-line-accent px-4 text-sm font-semibold text-accent hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-focus-ring"
        >
          {ar ? 'تطبيق' : 'Apply'}
        </button>
        {filtersActive && (
          <Link
            href="?"
            className="inline-flex h-9 items-center text-sm text-muted hover:text-text"
          >
            {ar ? 'مسح التصفية' : 'Reset filters'}
          </Link>
        )}
      </form>

      {!result ? (
        <EmptyState
          icon={<ScrollText size={36} aria-hidden="true" />}
          title={ar ? 'تعذّر تحميل السجل' : 'The log could not be loaded'}
          description={ar ? 'تحقق من التصفية ثم أعد المحاولة.' : 'Check the filters and try again.'}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<ScrollText size={36} aria-hidden="true" />}
          title={ar ? 'لا توجد سجلات مطابقة' : 'No matching entries'}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                {[
                  ar ? 'الوقت' : 'Time',
                  ar ? 'المنفّذ' : 'Actor',
                  ar ? 'الإجراء' : 'Action',
                  ar ? 'الكيان' : 'Entity',
                  ar ? 'التفاصيل' : 'Details',
                ].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 text-start font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const entries = Object.entries(r.summary);
                return (
                  <tr key={r.id} className="border-b border-line align-top last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{when(r.at, lang)}</td>
                    <td className="px-4 py-3">
                      {r.actor
                        ? ar
                          ? (r.actor.nameAr ?? r.actor.nameEn)
                          : (r.actor.nameEn ?? r.actor.nameAr)
                        : ar
                          ? 'النظام'
                          : 'System'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                      {r.action}
                    </td>
                    <td className="px-4 py-3 text-xs" dir="ltr">
                      <span className="text-muted">{r.entityType}</span>
                      <br />
                      <span className="break-all">{r.entityId}</span>
                    </td>
                    <td className="px-4 py-3">
                      {entries.length === 0 ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <details>
                          <summary className="cursor-pointer text-xs font-semibold text-accent">
                            {ar ? `${entries.length} حقول` : `${entries.length} fields`}
                          </summary>
                          <dl
                            className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs"
                            dir="ltr"
                          >
                            {entries.map(([k, v]) => (
                              <div key={k} className="contents">
                                <dt className="text-muted">{k}</dt>
                                <dd className="break-all">{show(v)}</dd>
                              </div>
                            ))}
                          </dl>
                        </details>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination meta={meta} searchParams={sp} lang={lang} className="mt-4" />
    </>
  );
}
