import { NextResponse } from 'next/server';
import { can } from '@/lib/auth/permissions';
import { getAccess } from '@/modules/access/queries';
import { createClient } from '@/lib/supabase/server';
import { cleanAuditFilter, listAuditLogs } from '@/modules/admin/queries';

export const dynamic = 'force-dynamic';

const esc = (v: string | number | null | undefined) => {
  let s = String(v ?? '');
  // Spreadsheet formula injection: values that start with = + - @ are prefixed so they stay text.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

/** ACC-005: CSV of the audit log for the current filter (audit.view). The export itself is audited. */
export async function GET(request: Request) {
  const access = await getAccess();
  if (!access) return new NextResponse('Unauthorized', { status: 401 });
  if (!can(access, 'audit.view')) return new NextResponse('Forbidden', { status: 403 });

  const url = new URL(request.url);
  const filter = cleanAuditFilter(Object.fromEntries(url.searchParams));
  const rows: NonNullable<Awaited<ReturnType<typeof listAuditLogs>>>['rows'] = [];
  const PAGE = 200;
  for (let page = 1; rows.length < 5000; page++) {
    const res = await listAuditLogs(filter, page, PAGE);
    if (!res) return new NextResponse('Error', { status: 500 });
    rows.push(...res.rows);
    if (res.rows.length < PAGE) break;
  }

  const lines = [
    ['time', 'actor', 'action', 'entity_type', 'entity_id', 'summary'].join(','),
    ...rows.map((r) =>
      [
        r.at,
        r.actor ? (r.actor.nameEn ?? r.actor.nameAr) : 'system',
        r.action,
        r.entityType,
        r.entityId,
        JSON.stringify(r.summary),
      ]
        .map(esc)
        .join(','),
    ),
  ];

  const supabase = await createClient();
  await supabase.rpc('record_export', {
    p_kind: 'audit_logs',
    p_count: rows.length,
    p_filter: Object.fromEntries(Object.entries(filter).filter(([, v]) => v)),
  });

  return new NextResponse('﻿' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="audit-log.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
