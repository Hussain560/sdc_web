import { createClient } from '@/lib/supabase/server';
import type { CycleQuestion } from '@/modules/membership/types';

/**
 * What the platform shows a person about themselves on "My data": the account, the member record (including the
 * private phone number) and every membership application they sent, with the answers they gave. Everything comes
 * through row-level security, so only the person's own rows are readable. Reviewer notes are never included.
 */
export type MyDataAccount = {
  nameAr: string;
  nameEn: string | null;
  email: string;
  locale: string;
  createdAt: string;
};

export type MyDataMember = {
  status: string;
  joinedAt: string;
  joinedVia: string;
  namesAr: string;
  namesEn: string;
  phone: string | null;
  academicStatus: string | null;
  university: { ar: string; en: string } | null;
  major: { ar: string; en: string } | null;
  subMajor: { ar: string; en: string } | null;
  track: { ar: string; en: string } | null;
  directoryListed: boolean;
};

export type MyDataApplication = {
  id: string;
  cycleName: string;
  status: string;
  submittedAt: string | null;
  decidedAt: string | null;
  nameAr: string;
  nameEn: string | null;
  email: string | null;
  phone: string | null;
  academicStatus: string | null;
  university: { ar: string; en: string } | null;
  major: { ar: string; en: string } | null;
  subMajor: { ar: string; en: string } | null;
  track: { ar: string; en: string } | null;
  committee: { ar: string; en: string } | null;
  bioAr: string | null;
  bioEn: string | null;
  links: Array<{ label: string; url: string }>;
  answers: Array<{ label: { ar: string; en: string }; value: string }>;
  wantsDirectoryListing: boolean;
  consentVersion: string;
  consentAt: string;
};

export type MyData = {
  account: MyDataAccount;
  member: MyDataMember | null;
  applications: MyDataApplication[];
  registrations: number;
  positions: number;
};

type Named = { name_ar: string; name_en: string | null } | null;
const loc = (n: Named | undefined): { ar: string; en: string } | null =>
  n ? { ar: n.name_ar, en: n.name_en || n.name_ar } : null;
const join = (...p: Array<string | null | undefined>) =>
  p
    .map((x) => (x ?? '').trim())
    .filter(Boolean)
    .join(' ');

export async function getMyData(userId: string, email: string): Promise<MyData | null> {
  const supabase = await createClient();
  const [{ data: profile }, { data: m }, { data: apps }, regs, roles] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('members').select('*').eq('user_id', userId).maybeSingle(),
    supabase
      .from('membership_applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('role_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('ends_at', null),
  ]);
  if (!profile) return null;

  // Reference names for every id that appears, in one round.
  const ids = (key: 'university_id' | 'major_id' | 'sub_major_id' | 'track_id') => [
    ...new Set(
      [m?.[key], ...(apps ?? []).map((a) => a[key])].filter((x): x is number => x != null),
    ),
  ];
  const [unis, majors, tracks, committees, cycles] = await Promise.all([
    ids('university_id').length
      ? supabase.from('universities').select('id, name_ar, name_en').in('id', ids('university_id'))
      : { data: [] },
    ids('major_id').length || ids('sub_major_id').length
      ? supabase
          .from('majors')
          .select('id, name_ar, name_en')
          .in('id', [...ids('major_id'), ...ids('sub_major_id')])
      : { data: [] },
    ids('track_id').length
      ? supabase.from('tracks').select('id, name_ar, name_en').in('id', ids('track_id'))
      : { data: [] },
    (apps ?? []).some((a) => a.preferred_committee_id)
      ? supabase
          .from('committees')
          .select('id, name_ar, name_en')
          .in(
            'id',
            (apps ?? []).flatMap((a) =>
              a.preferred_committee_id ? [a.preferred_committee_id] : [],
            ),
          )
      : { data: [] },
    (apps ?? []).length
      ? supabase
          .from('membership_cycle_phase')
          .select('id, name_ar, questions')
          .in('id', [...new Set((apps ?? []).map((a) => a.cycle_id))])
      : { data: [] },
  ]);
  const by = <T extends { id: number | string }>(rows: T[] | null | undefined) =>
    new Map((rows ?? []).map((r) => [r.id, r]));
  const uniBy = by(unis.data as Array<{ id: number; name_ar: string; name_en: string | null }>);
  const majorBy = by(majors.data as Array<{ id: number; name_ar: string; name_en: string | null }>);
  const trackBy = by(tracks.data as Array<{ id: number; name_ar: string; name_en: string | null }>);
  const committeeBy = by(
    committees.data as Array<{ id: string; name_ar: string; name_en: string | null }>,
  );
  const cycleBy = by(
    cycles.data as Array<{ id: string; name_ar: string | null; questions: unknown }>,
  );

  const member: MyDataMember | null = m
    ? {
        status: m.status,
        joinedAt: m.joined_at,
        joinedVia: m.joined_via,
        namesAr: join(m.first_name_ar, m.middle_name_ar, m.last_name_ar),
        namesEn: join(m.first_name_en, m.middle_name_en, m.last_name_en),
        phone: m.phone,
        academicStatus: m.academic_status,
        university: loc(m.university_id != null ? uniBy.get(m.university_id) : null),
        major: loc(m.major_id != null ? majorBy.get(m.major_id) : null),
        subMajor: loc(m.sub_major_id != null ? majorBy.get(m.sub_major_id) : null),
        track: loc(m.track_id != null ? trackBy.get(m.track_id) : null),
        directoryListed: m.is_directory_visible,
      }
    : null;

  const applications: MyDataApplication[] = (apps ?? []).map((a) => {
    const cycle = cycleBy.get(a.cycle_id);
    const questions = (Array.isArray(cycle?.questions) ? cycle.questions : []) as CycleQuestion[];
    const raw = (
      a.answers && typeof a.answers === 'object' && !Array.isArray(a.answers) ? a.answers : {}
    ) as Record<string, string | string[]>;
    const answers = Object.entries(raw).flatMap(([key, value]) => {
      if (key === 'other_university' || key === 'other_major') return [];
      const q = questions.find((x) => x.key === key);
      const text = Array.isArray(value) ? value.join('، ') : String(value ?? '');
      if (!text) return [];
      return [
        {
          label: { ar: q?.label_ar ?? key, en: q?.label_en ?? q?.label_ar ?? key },
          value: text,
        },
      ];
    });
    return {
      id: a.id,
      cycleName: cycle?.name_ar ?? '',
      status: a.status,
      submittedAt: a.submitted_at,
      decidedAt: a.decided_at,
      nameAr: a.full_name_ar,
      nameEn: a.full_name_en,
      email: a.email,
      phone: a.phone,
      academicStatus: a.academic_status,
      university: loc(a.university_id != null ? uniBy.get(a.university_id) : null),
      major: loc(a.major_id != null ? majorBy.get(a.major_id) : null),
      subMajor: loc(a.sub_major_id != null ? majorBy.get(a.sub_major_id) : null),
      track: loc(a.track_id != null ? trackBy.get(a.track_id) : null),
      committee: loc(a.preferred_committee_id ? committeeBy.get(a.preferred_committee_id) : null),
      bioAr: a.bio_ar,
      bioEn: a.bio_en,
      links: (
        [
          ['Portfolio', a.portfolio_url],
          ['GitHub', a.github_url],
          ['LinkedIn', a.linkedin_url],
          ['X', a.x_url],
        ] as Array<[string, string | null]>
      )
        .filter((l): l is [string, string] => Boolean(l[1]))
        .map(([label, url]) => ({ label, url })),
      answers,
      wantsDirectoryListing: a.wants_directory_listing,
      consentVersion: a.consent_version,
      consentAt: a.consent_at,
    };
  });

  return {
    account: {
      nameAr: profile.full_name_ar,
      nameEn: profile.full_name_en,
      email: profile.email || email,
      locale: profile.preferred_locale,
      createdAt: profile.created_at,
    },
    member,
    applications,
    registrations: regs.count ?? 0,
    positions: roles.count ?? 0,
  };
}
