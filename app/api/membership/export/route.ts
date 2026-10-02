import { NextResponse } from 'next/server';
import { canGlobal } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { getAccess } from '@/modules/access/queries';
import { listApplications } from '@/modules/membership/review-queries';

export const dynamic = 'force-dynamic';

const esc = (v: string | number | boolean | null | undefined) => {
  let s = String(v ?? '');
  // Spreadsheet formula injection: values that start with = + - @ are prefixed so they stay text.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

/** MBR-004: CSV of applications for reviewers holding membership.export (UTF-8 with BOM for Arabic Excel). */
export async function GET(request: Request) {
  const access = await getAccess();
  if (!access) return new NextResponse('Unauthorized', { status: 401 });
  if (!canGlobal(access, 'membership.export') || !canGlobal(access, 'membership.review'))
    return new NextResponse('Forbidden', { status: 403 });

  const url = new URL(request.url);
  const cycle = url.searchParams.get('cycle');
  const status = url.searchParams.get('status');
  const { rows } = await listApplications(
    {
      cycleId: cycle && /^[0-9a-f-]{36}$/i.test(cycle) ? cycle : undefined,
      status: status ?? undefined,
    },
    { from: 0, to: 4999 },
  );

  const header = [
    'name_ar',
    'name_en',
    'email',
    'status',
    'academic_status',
    'university',
    'major',
    'track',
    'submitted_at',
    'decided_at',
  ];
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [
        r.fullNameAr,
        r.fullNameEn,
        r.email,
        r.status,
        r.academicStatus,
        r.university,
        r.major,
        r.track,
        r.submittedAt,
        r.decidedAt,
      ]
        .map(esc)
        .join(','),
    ),
  ];

  // The export is itself sensitive: it is recorded in the audit log (docs/11-modules/membership §10).
  const supabase = await createClient();
  await supabase.rpc('record_export', { p_kind: 'membership_applications', p_count: rows.length });

  return new NextResponse('﻿' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="membership-applications.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
