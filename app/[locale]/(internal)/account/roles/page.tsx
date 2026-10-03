import { Badge, Card } from '@/components/ui';
import { requireUser } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { getAccess } from '@/modules/access/queries';

// ACC-006: my positions and terms, read-only. Ownership rule — no permission key needed.
export default async function AccountRolesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const ar = lang === 'ar';
  await requireUser('/account/roles');
  const access = await getAccess();
  const positions = access?.positions ?? [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">{ar ? 'مناصبي' : 'My positions'}</h1>
      {positions.length === 0 ? (
        <Card>
          <p className="text-muted">
            {ar
              ? 'ليس لديك مناصب حاليًا. تُمنح المناصب من قيادة المجتمع.'
              : 'You hold no positions right now. Positions are granted by the community leadership.'}
          </p>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {positions.map((p) => (
            <li key={p.assignmentId}>
              <Card className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Badge tone="accent">{p.title?.[lang] ?? p.roleName[lang]}</Badge>
                  <span className="ms-3">{p.committeeName?.[lang] ?? (ar ? 'عام' : 'Global')}</span>
                </div>
                <span className="text-sm tabular-nums text-muted">
                  {formatDate(p.startsAt, lang)} →{' '}
                  {p.endsAt ? formatDate(p.endsAt, lang) : ar ? 'مفتوح' : 'open'}
                </span>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
