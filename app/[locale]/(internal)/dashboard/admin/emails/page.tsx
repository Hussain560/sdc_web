import { MailCheck } from 'lucide-react';
import { Badge, EmptyState, Pagination, Tabs, type TabItem } from '@/components/ui';
import { Forbidden } from '@/components/layout/Forbidden';
import { PageHeader } from '@/components/layout/PageHeader';
import { Link } from '@/i18n/navigation';
import { can } from '@/lib/auth/permissions';
import { requireUser } from '@/lib/auth/session';
import { formatRelative } from '@/lib/format';
import { pageMeta, parsePage } from '@/lib/pagination';
import { getAccess } from '@/modules/access/queries';
import { RetryAllButton, RetryEmailButton } from '@/modules/notifications/components/RetryButtons';
import {
  EMAIL_DAILY_LIMIT,
  getEmailCounts,
  listEmailLogs,
  listTemplateKeys,
  type EmailFilters,
  type EmailState,
} from '@/modules/notifications/queries';

type Search = { group?: string; template?: string; q?: string; page?: string; size?: string };

const STATE_LABEL: Record<
  EmailState,
  { ar: string; en: string; tone: 'neutral' | 'accent' | 'warning' | 'danger' }
> = {
  sent: { ar: 'أُرسلت', en: 'Sent', tone: 'accent' },
  sending: { ar: 'جارٍ الإرسال', en: 'Sending', tone: 'warning' },
  skipped: { ar: 'تُخطّيت', en: 'Skipped', tone: 'neutral' },
  retrying: { ar: 'ستُعاد', en: 'Will retry', tone: 'warning' },
  abandoned: { ar: 'فشلت', en: 'Failed', tone: 'danger' },
  recovered: { ar: 'نجحت لاحقًا', en: 'Recovered', tone: 'accent' },
  superseded: { ar: 'حلّت محلها محاولة', en: 'Superseded', tone: 'neutral' },
};

// ACC-005 / NOT-003 (screen 24 §2): the global e-mail log with the daily quota and retry. Permission: email_logs.view.
export default async function EmailLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Search>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  await requireUser('/dashboard/admin/emails');
  const access = await getAccess();
  if (!access || !can(access, 'email_logs.view')) return <Forbidden />;

  const sp = await searchParams;
  const group = (['failed', 'sent', 'recovered'] as const).find((g) => g === sp.group);
  const filters: EmailFilters = { group, template: sp.template, q: sp.q };
  const request = parsePage(sp);

  const [{ rows, total }, counts, templates] = await Promise.all([
    listEmailLogs(filters, request),
    getEmailCounts(),
    listTemplateKeys(),
  ]);
  const meta = pageMeta(total, request);
  const quota = Math.min(100, Math.round((counts.sentToday / EMAIL_DAILY_LIMIT) * 100));

  const keep = (extra: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ template: sp.template, q: sp.q, ...extra }))
      if (v) q.set(k, v);
    const s = q.toString();
    return s ? `?${s}` : '?';
  };
  const tabs: TabItem[] = [
    {
      key: 'failed',
      label: ar ? 'الفاشلة' : 'Failed',
      href: keep({ group: 'failed' }),
      count: counts.failed,
      tone: 'warning',
    },
    { key: 'all', label: ar ? 'الكل' : 'All', href: keep({}), count: counts.all },
    {
      key: 'sent',
      label: ar ? 'المُرسلة' : 'Sent',
      href: keep({ group: 'sent' }),
      count: counts.sent,
    },
    {
      key: 'recovered',
      label: ar ? 'نجحت لاحقًا' : 'Recovered',
      href: keep({ group: 'recovered' }),
      count: counts.recovered,
    },
  ];
  const filtersActive = Boolean(sp.q || sp.template);

  return (
    <>
      <PageHeader
        title={ar ? 'سجل البريد' : 'E-mail log'}
        description={
          ar
            ? 'كل محاولة إرسال، مع حالتها وإمكانية إعادة المحاولة.'
            : 'Every sending attempt, with its state and a way to retry.'
        }
        action={<RetryAllButton count={counts.failed} />}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
        <span className="text-muted">{ar ? 'اليوم' : 'Today'}</span>
        <span className="tabular-nums">
          {ar
            ? `${counts.sentToday} مُرسلة من ${EMAIL_DAILY_LIMIT} (الحد اليومي)`
            : `${counts.sentToday} sent of ${EMAIL_DAILY_LIMIT} (daily limit)`}
        </span>
        <div
          role="progressbar"
          aria-valuenow={quota}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={ar ? 'استهلاك الحد اليومي' : 'Daily quota used'}
          className="h-2 min-w-32 flex-1 overflow-hidden rounded-full bg-surface-raised"
        >
          <div
            className={`h-full rounded-full ${quota >= 80 ? 'bg-warning' : 'bg-accent'}`}
            style={{ width: `${quota}%` }}
          />
        </div>
        {quota >= 80 && (
          <span className="text-warning">
            {ar ? 'اقترب الحد اليومي' : 'Close to the daily limit'}
          </span>
        )}
      </div>

      <Tabs items={tabs} active={group ?? 'all'} label={ar ? 'حالة الرسالة' : 'E-mail state'} />

      <form method="get" className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {group && <input type="hidden" name="group" value={group} />}
        <label className="flex items-center gap-2 text-xs text-muted">
          {ar ? 'المستلم' : 'Recipient'}
          <input
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="name@example.com"
            dir="ltr"
            className="h-9 w-56 rounded-lg border border-line bg-surface px-3 text-sm text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-muted">
          {ar ? 'القالب' : 'Template'}
          <select
            name="template"
            defaultValue={sp.template ?? ''}
            dir="ltr"
            className="h-9 rounded-lg border border-line bg-surface px-3 text-sm text-text focus-visible:outline-2 focus-visible:outline-accent"
          >
            <option value="">{ar ? 'الكل' : 'All'}</option>
            {templates.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-full border border-line-accent px-4 text-sm font-semibold text-accent hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-accent"
        >
          {ar ? 'تطبيق' : 'Apply'}
        </button>
        {filtersActive && (
          <Link
            href={group ? `?group=${group}` : '?'}
            className="inline-flex h-9 items-center text-sm text-muted hover:text-text"
          >
            {ar ? 'مسح التصفية' : 'Reset filters'}
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={<MailCheck size={36} aria-hidden="true" />}
          title={
            group === 'failed' && !filtersActive
              ? ar
                ? 'لا توجد رسائل فاشلة ✓'
                : 'No failed e-mails ✓'
              : ar
                ? 'لا توجد رسائل مطابقة'
                : 'No matching e-mails'
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-line bg-surface-raised text-xs text-muted">
              <tr>
                {[
                  ar ? 'الوقت' : 'Time',
                  ar ? 'المستلم' : 'Recipient',
                  ar ? 'القالب' : 'Template',
                  ar ? 'الحالة' : 'State',
                  ar ? 'المحاولة' : 'Attempt',
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
                const st = STATE_LABEL[r.state];
                const failed = r.state === 'retrying' || r.state === 'abandoned';
                return (
                  <tr
                    key={r.id}
                    className="border-b border-line align-middle transition-colors last:border-0 hover:bg-surface-raised"
                  >
                    <td className="px-4 py-3 tabular-nums text-muted">
                      {formatRelative(r.createdAt, lang)}
                    </td>
                    <td className="px-4 py-3">
                      <span dir="ltr" className="inline-block" style={{ textAlign: 'start' }}>
                        {r.recipientEmail}
                      </span>
                      <div className="text-xs text-muted">
                        {r.locale === 'ar' ? 'العربية' : 'English'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <code dir="ltr" className="text-xs">
                        {r.templateKey}
                      </code>
                      {r.entityType && <div className="text-xs text-muted">{r.entityType}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={st.tone}>{st[lang]}</Badge>
                      {failed && r.errorCode && (
                        <p
                          className="mt-1 max-w-xs truncate text-xs text-danger"
                          title={r.errorMessage ?? undefined}
                        >
                          ↳ {r.errorCode}
                          {r.state === 'retrying'
                            ? ar
                              ? ' — ستُعاد تلقائيًا'
                              : ' — will retry automatically'
                            : ar
                              ? ' — توقفت المحاولات'
                              : ' — no more automatic attempts'}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{r.attempt}</td>
                    <td className="px-4 py-3 text-end">
                      {failed && <RetryEmailButton id={r.id} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination meta={meta} searchParams={sp} lang={lang} />
    </>
  );
}
