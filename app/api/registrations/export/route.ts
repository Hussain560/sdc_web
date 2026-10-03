import { NextResponse } from 'next/server';
import { canAny } from '@/lib/auth/permissions';
import { getAccess } from '@/modules/access/queries';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const esc = (v: string | number | null | undefined) => {
  let s = String(v ?? '');
  // Spreadsheet formula injection: values that start with = + - @ are prefixed so they stay text.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

/** REG-007: CSV of the registrations the caller may see, limited to the committees where they hold export. */
export async function GET(request: Request) {
  const access = await getAccess();
  if (!access) return new NextResponse('Unauthorized', { status: 401 });
  if (!canAny(access, ['registrations.export']))
    return new NextResponse('Forbidden', { status: 403 });

  const url = new URL(request.url);
  const supabase = await createClient();
  let query = supabase
    .from('event_registrations')
    .select(
      'status, full_name_snapshot, email_snapshot, was_member, created_at, decided_at, event_id, events(title_ar, title_en, committee_id)',
    )
    .order('created_at', { ascending: true })
    .limit(5000);
  const event = url.searchParams.get('event');
  const status = url.searchParams.get('status');
  if (event && /^[0-9a-f-]{36}$/i.test(event)) query = query.eq('event_id', event);
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) return new NextResponse('Error', { status: 500 });

  const allowed = (committeeId: string) => {
    const g = access.grants['registrations.export'];
    return g === 'global' || (Array.isArray(g) && g.includes(committeeId));
  };
  const rows = (data ?? []).filter((r) => r.events && allowed(r.events.committee_id));

  const header = ['event', 'name', 'email', 'status', 'member', 'registered_at', 'decided_at'];
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [
        r.events?.title_en || r.events?.title_ar,
        r.full_name_snapshot,
        r.email_snapshot,
        r.status,
        r.was_member ? 'yes' : 'no',
        r.created_at,
        r.decided_at,
      ]
        .map(esc)
        .join(','),
    ),
  ];
  // The export itself is recorded in the audit log (only a row count, never the data).
  await supabase.rpc('record_export', {
    p_kind: 'registrations',
    p_count: rows.length,
    p_filter: { ...(event ? { event } : {}), ...(status ? { status } : {}) },
  });

  // BOM so Excel opens the Arabic text correctly.
  return new NextResponse('﻿' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="registrations.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
