import { createClient } from '@/lib/supabase/server';
import type { PageRequest } from '@/lib/pagination';
import type { ProfileValues, MemberStatus } from './schemas';
import type { AcademicStatus } from '@/modules/membership/types';

const s = (v: string | null | undefined) => v ?? '';
const n = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v));

export type MyMember = {
  id: string;
  status: MemberStatus;
  joinedAt: string;
  values: ProfileValues;
};

/** The signed-in person's member record (RLS: own row only). Null for non-members. */
export async function getMyMember(): Promise<MyMember | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase
    .from('members')
    .select('*')
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    status: data.status as MemberStatus,
    joinedAt: data.joined_at,
    values: {
      firstNameAr: data.first_name_ar,
      lastNameAr: data.last_name_ar,
      firstNameEn: s(data.first_name_en),
      lastNameEn: s(data.last_name_en),
      academicStatus: (data.academic_status ?? '') as AcademicStatus | '',
      universityId: n(data.university_id),
      majorId: n(data.major_id),
      subMajorId: n(data.sub_major_id),
      trackId: n(data.track_id),
      bioAr: s(data.bio_ar),
      bioEn: s(data.bio_en),
      portfolioUrl: s(data.portfolio_url),
      githubUrl: s(data.github_url),
      linkedinUrl: s(data.linkedin_url),
      xUrl: s(data.x_url),
      isDirectoryVisible: data.is_directory_visible,
      showUniversity: data.show_university,
      showTrack: data.show_track,
      showLinks: data.show_links,
      showPhoto: data.show_photo,
      showParticipation: data.show_participation,
    },
  };
}

export type MemberRow = {
  id: string;
  nameAr: string;
  nameEn: string | null;
  status: MemberStatus;
  statusReason: string | null;
  joinedVia: 'application' | 'legacy' | 'manual';
  joinedAt: string;
  visible: boolean;
  linked: boolean;
  legacy: boolean;
  claimEmail: string | null;
  university: string | null;
  track: string | null;
};

export type MemberFilters = { status?: string; q?: string; unclaimed?: boolean };

/** Leadership list (members.view / members.manage through RLS), including private fields. */
export async function listMembers(
  filters: MemberFilters,
  page: Pick<PageRequest, 'from' | 'to'>,
): Promise<{ rows: MemberRow[]; total: number }> {
  const supabase = await createClient();
  let q = supabase
    .from('members')
    .select(
      'id, first_name_ar, last_name_ar, first_name_en, last_name_en, status, status_reason, joined_via, joined_at, is_directory_visible, user_id, legacy_id, legacy_claim_email, universities(name_ar), tracks(name_ar)',
      { count: 'exact' },
    )
    .order('first_name_ar')
    .order('id');
  if (filters.status) q = q.eq('status', filters.status);
  if (filters.unclaimed) q = q.is('user_id', null);
  const term = filters.q?.trim().replace(/[%,()]/g, ' ');
  if (term)
    q = q.or(
      `first_name_ar.ilike.%${term}%,last_name_ar.ilike.%${term}%,first_name_en.ilike.%${term}%,last_name_en.ilike.%${term}%`,
    );
  const { data, count } = await q.range(page.from, page.to);
  return {
    total: count ?? 0,
    rows: (data ?? []).map((m) => ({
      id: m.id,
      nameAr: `${m.first_name_ar} ${m.last_name_ar}`.trim(),
      nameEn: [m.first_name_en, m.last_name_en].filter(Boolean).join(' ') || null,
      status: m.status as MemberStatus,
      statusReason: m.status_reason,
      joinedVia: m.joined_via as MemberRow['joinedVia'],
      joinedAt: m.joined_at,
      visible: m.is_directory_visible,
      linked: m.user_id !== null,
      legacy: m.legacy_id !== null,
      claimEmail: m.legacy_claim_email,
      university: m.universities?.name_ar ?? null,
      track: m.tracks?.name_ar ?? null,
    })),
  };
}

export async function getMemberCounts(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase.from('members').select('status, user_id');
  const out: Record<string, number> = { active: 0, inactive: 0, suspended: 0, unclaimed: 0 };
  for (const r of data ?? []) {
    out[r.status] = (out[r.status] ?? 0) + 1;
    if (r.user_id === null) out.unclaimed = (out.unclaimed ?? 0) + 1;
  }
  return out;
}
