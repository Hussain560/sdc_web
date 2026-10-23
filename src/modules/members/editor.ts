import { createClient } from '@/lib/supabase/server';
import { memberPhotoUrl } from './photo-url';
import type { EditorData } from './editor-shared';

const s = (v: string | null | undefined) => v ?? '';
const n = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v));

export async function getMyEditorData(): Promise<EditorData | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: m } = await supabase
    .from('members')
    .select('*')
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (!m) return null;
  const [skills, projects] = await Promise.all([
    supabase
      .from('member_skills')
      .select('position, skills(slug)')
      .eq('member_id', m.id)
      .order('position'),
    supabase
      .from('member_projects')
      .select('id, title_ar, title_en, description_ar, description_en, url')
      .eq('member_id', m.id)
      .order('position'),
  ]);
  return {
    id: m.id,
    status: m.status,
    joinedAt: m.joined_at,
    photoUrl: memberPhotoUrl(m.photo_path),
    values: {
      first_name_ar: m.first_name_ar,
      middle_name_ar: s(m.middle_name_ar),
      last_name_ar: m.last_name_ar,
      first_name_en: s(m.first_name_en),
      middle_name_en: s(m.middle_name_en),
      last_name_en: s(m.last_name_en),
      phone: s(m.phone),
      headline_ar: s(m.headline_ar),
      headline_en: s(m.headline_en),
      about_ar: s(m.about_ar),
      about_en: s(m.about_en),
      open_to: m.open_to ?? [],
      academic_status: s(m.academic_status),
      study_year: n(m.study_year),
      gender: s(m.gender),
      university_id: n(m.university_id),
      major_id: n(m.major_id),
      sub_major_id: n(m.sub_major_id),
      track_id: n(m.track_id),
      links: {
        linkedin_url: s(m.linkedin_url),
        github_url: s(m.github_url),
        x_url: s(m.x_url),
        portfolio_url: s(m.portfolio_url),
        website_url: s(m.website_url),
        behance_url: s(m.behance_url),
        dribbble_url: s(m.dribbble_url),
        youtube_url: s(m.youtube_url),
      },
      is_directory_visible: m.is_directory_visible,
      show_photo: m.show_photo,
      show_headline: m.show_headline,
      show_about: m.show_about,
      show_skills: m.show_skills,
      show_projects: m.show_projects,
      show_open_to: m.show_open_to,
      show_university: m.show_university,
      show_track: m.show_track,
      show_participation: m.show_participation,
    },
    skills: (skills.data ?? []).flatMap((r) => {
      const slug = (r.skills as { slug: string } | null)?.slug;
      return slug ? [slug] : [];
    }),
    projects: (projects.data ?? []).map((p) => ({
      id: p.id,
      titleAr: p.title_ar,
      titleEn: s(p.title_en),
      descriptionAr: s(p.description_ar),
      descriptionEn: s(p.description_en),
      url: p.url,
    })),
  };
}
