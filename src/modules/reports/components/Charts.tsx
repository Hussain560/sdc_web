import { Card } from '@/components/ui';

export type BarDatum = { label: string; value: number | null };

const summary = 'cursor-pointer text-xs font-semibold text-muted hover:text-text';

/**
 * Horizontal bars built from plain CSS (no chart library; the accent token only). A table with the same numbers
 * sits behind a native disclosure, for screen readers and for copying.
 */
export function BarList({
  title,
  data,
  unit = '',
  tableLabel,
  columnLabels,
  empty,
}: {
  title: string;
  data: BarDatum[];
  unit?: string;
  tableLabel: string;
  columnLabels: [string, string];
  empty: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value ?? 0));
  const show = (v: number | null) => (v === null ? '<5' : `${v}${unit}`);
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-lg font-bold">{title}</h2>
      {data.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <>
          <ul className="flex flex-col gap-3" aria-hidden="true">
            {data.map((d) => (
              <li
                key={d.label}
                className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm"
              >
                <span className="truncate text-muted">{d.label}</span>
                <span className="h-2 overflow-hidden rounded-full bg-surface-raised">
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${d.value === null ? 0 : (d.value / max) * 100}%` }}
                  />
                </span>
                <span className="w-12 text-end tabular-nums">{show(d.value)}</span>
              </li>
            ))}
          </ul>
          <details>
            <summary className={summary}>{tableLabel}</summary>
            <table className="mt-2 w-full text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th scope="col" className="py-1 text-start font-medium">
                    {columnLabels[0]}
                  </th>
                  <th scope="col" className="py-1 text-end font-medium">
                    {columnLabels[1]}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.label} className="border-t border-line">
                    <td className="py-1.5">{d.label}</td>
                    <td className="py-1.5 text-end tabular-nums">{show(d.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </Card>
  );
}

/** Registrations per month as vertical columns; the attendance rate is in the table behind the disclosure. */
export function MonthlyColumns({
  title,
  data,
  tableLabel,
  columnLabels,
  empty,
}: {
  title: string;
  data: Array<{ label: string; registrations: number; attendance: number | null }>;
  tableLabel: string;
  columnLabels: [string, string, string];
  empty: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.registrations));
  const any = data.some((d) => d.registrations > 0);
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-lg font-bold">{title}</h2>
      {!any ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <>
          <div className="flex h-40 items-end gap-1.5" aria-hidden="true">
            {data.map((d) => (
              <div
                key={d.label}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
              >
                <span className="text-[10px] tabular-nums text-muted">{d.registrations || ''}</span>
                <span
                  className="w-full rounded-t-md bg-accent"
                  style={{
                    height: `${Math.max(2, (d.registrations / max) * 100)}%`,
                    opacity: d.registrations ? 1 : 0.25,
                  }}
                />
                <span className="w-full truncate text-center text-[10px] text-muted">
                  {d.label}
                </span>
              </div>
            ))}
          </div>
          <details>
            <summary className={summary}>{tableLabel}</summary>
            <table className="mt-2 w-full text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  {columnLabels.map((c, i) => (
                    <th
                      key={c}
                      scope="col"
                      className={`py-1 font-medium ${i === 0 ? 'text-start' : 'text-end'}`}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.label} className="border-t border-line">
                    <td className="py-1.5">{d.label}</td>
                    <td className="py-1.5 text-end tabular-nums">{d.registrations}</td>
                    <td className="py-1.5 text-end tabular-nums">
                      {d.attendance === null ? '—' : `${Math.round(d.attendance)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </Card>
  );
}
