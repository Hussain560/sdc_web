import { NextResponse } from 'next/server';
import { can } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { getAccess } from '@/modules/access/queries';
import { ADMIN_MEMBER_TABS, listAdminMembers } from '@/modules/members/admin-queries';

export const dynamic = 'force-dynamic';

const esc = (v: string | number | boolean | null | undefined) => {
  let s = String(v ?? '');
  // Spreadsheet formula injection: values that start with = + - @ are prefixed so they stay text.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

/** MEM-018: CSV of the members list for leadership (members.manage). E-mail only with members.view_contact. Audited. */
export async function GET(request: Request) {
  const access = await getAccess();
  if (!access) return new NextResponse('Unauthorized', { status: 401 });
  if (!can(access, 'members.manage')) return new NextResponse('Forbidden', { status: 403 });

  const status = new URL(request.url).searchParams.get('status') ?? 'all';
  const tab = (ADMIN_MEMBER_TABS as readonly string[]).includes(status) ? status : 'all';
  const list = await listAdminMembers({ status: tab }, { from: 0, to: 4999 });

  const header = [
    'member_no',
    'name_ar',
    'name_en',
    ...(list.canContact ? ['email'] : []),
    'status',
    'end_reason',
    'term_ends_at',
    'committee',
    'position',
    'activated',
    'joined_at',
  ];
  const lines = [
    header.join(','),
    ...list.rows.map((r) =>
      [
        r.memberNo,
        r.nameAr,
        r.nameEn,
        ...(list.canContact ? [r.email] : []),
        r.status,
        r.endReason,
        r.termEndsAt,
        r.committeeAr,
        r.roleAr,
        r.activated,
        r.joinedAt,
      ]
        .map(esc)
        .join(','),
    ),
  ];

  const supabase = await createClient();
  await supabase.rpc('record_export', {
    p_kind: 'members',
    p_count: list.rows.length,
    p_filter: { status: tab },
  });

  return new NextResponse('﻿' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="members.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
