/** Shapes and constants of the profile editor, shared by the server reader and the client form (no server imports). */
export const LINK_KEYS = [
  'linkedin_url',
  'github_url',
  'x_url',
  'portfolio_url',
  'website_url',
  'behance_url',
  'dribbble_url',
  'youtube_url',
] as const;
export type LinkKey = (typeof LINK_KEYS)[number];

export const OPEN_TO_KEYS = [
  'internship',
  'job',
  'freelance',
  'mentoring',
  'speaking',
  'collaboration',
] as const;

export type EditorProject = {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  url: string;
};

export type EditorValues = {
  first_name_ar: string;
  middle_name_ar: string;
  last_name_ar: string;
  first_name_en: string;
  middle_name_en: string;
  last_name_en: string;
  headline_ar: string;
  headline_en: string;
  about_ar: string;
  about_en: string;
  open_to: string[];
  academic_status: string;
  university_id: string;
  major_id: string;
  sub_major_id: string;
  track_id: string;
  links: Record<LinkKey, string>;
  is_directory_visible: boolean;
  show_photo: boolean;
  show_headline: boolean;
  show_about: boolean;
  show_skills: boolean;
  show_projects: boolean;
  show_open_to: boolean;
  show_university: boolean;
  show_track: boolean;
  show_participation: boolean;
};

export type EditorData = {
  id: string;
  status: string;
  joinedAt: string;
  photoUrl: string | null;
  values: EditorValues;
  /** The chosen skills, in the member's order. */
  skills: string[];
  projects: EditorProject[];
};
