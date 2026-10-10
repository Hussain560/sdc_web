import type { Lang } from '@/modules/auth/messages';
import { ACADEMIC_STATUSES, type AcademicStatus } from '@/modules/membership/types';

/** Values of the member's own profile form (docs/11-modules/members §8: ME-2, ME-3, ME-4). */
export type ProfileValues = {
  firstNameAr: string;
  lastNameAr: string;
  firstNameEn: string;
  lastNameEn: string;
  academicStatus: AcademicStatus | '';
  universityId: string;
  majorId: string;
  subMajorId: string;
  trackId: string;
  bioAr: string;
  bioEn: string;
  portfolioUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  xUrl: string;
  isDirectoryVisible: boolean;
  showUniversity: boolean;
  showTrack: boolean;
  showLinks: boolean;
  showPhoto: boolean;
  showParticipation: boolean;
};

const m = {
  name: { ar: 'الاسم الأول مطلوب.', en: 'The first name is required.' },
  long: { ar: 'النص طويل جدًا.', en: 'The text is too long.' },
  bio: { ar: 'النبذة طويلة (1000 حرف كحد أقصى).', en: 'The bio is too long (max 1000).' },
  https: { ar: 'يجب أن يبدأ الرابط بـ https://', en: 'The link must start with https://' },
  status: { ar: 'اختر الحالة.', en: 'Choose a status.' },
} as const;

export function validateProfile(v: ProfileValues, lang: Lang): Record<string, string> {
  const e: Record<string, string> = {};
  if (!v.firstNameAr.trim()) e.firstNameAr = m.name[lang];
  if ([v.firstNameAr, v.lastNameAr, v.firstNameEn, v.lastNameEn].some((x) => x.length > 100))
    e.firstNameAr = m.long[lang];
  if (v.academicStatus && !(ACADEMIC_STATUSES as readonly string[]).includes(v.academicStatus))
    e.academicStatus = m.status[lang];
  if (v.bioAr.length > 1000) e.bioAr = m.bio[lang];
  if (v.bioEn.length > 1000) e.bioEn = m.bio[lang];
  for (const [field, value] of [
    ['portfolioUrl', v.portfolioUrl],
    ['githubUrl', v.githubUrl],
    ['linkedinUrl', v.linkedinUrl],
    ['xUrl', v.xUrl],
  ] as const) {
    const t = value.trim();
    if (t && (!/^https:\/\/\S+$/.test(t) || t.length > 500)) e[field] = m.https[lang];
  }
  return e;
}

export function toProfilePayload(v: ProfileValues) {
  return {
    first_name_ar: v.firstNameAr.trim(),
    last_name_ar: v.lastNameAr.trim(),
    first_name_en: v.firstNameEn.trim(),
    last_name_en: v.lastNameEn.trim(),
    academic_status: v.academicStatus,
    university_id: v.universityId,
    major_id: v.majorId,
    sub_major_id: v.subMajorId,
    track_id: v.trackId,
    bio_ar: v.bioAr.trim(),
    bio_en: v.bioEn.trim(),
    portfolio_url: v.portfolioUrl.trim(),
    github_url: v.githubUrl.trim(),
    linkedin_url: v.linkedinUrl.trim(),
    x_url: v.xUrl.trim(),
    is_directory_visible: v.isDirectoryVisible,
    show_university: v.showUniversity,
    show_track: v.showTrack,
    show_links: v.showLinks,
    show_photo: v.showPhoto,
    show_participation: v.showParticipation,
  };
}

export const emptyProfile = (): ProfileValues => ({
  firstNameAr: '',
  lastNameAr: '',
  firstNameEn: '',
  lastNameEn: '',
  academicStatus: '',
  universityId: '',
  majorId: '',
  subMajorId: '',
  trackId: '',
  bioAr: '',
  bioEn: '',
  portfolioUrl: '',
  githubUrl: '',
  linkedinUrl: '',
  xUrl: '',
  isDirectoryVisible: false,
  showUniversity: true,
  showTrack: true,
  showLinks: true,
  showPhoto: false,
  showParticipation: false,
});

export const MEMBER_STATUSES = ['active', 'inactive', 'suspended'] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const MEMBER_STATUS_LABEL: Record<
  MemberStatus,
  { ar: string; en: string; tone: 'accent' | 'neutral' | 'danger' }
> = {
  active: { ar: 'نشط', en: 'Active', tone: 'accent' },
  inactive: { ar: 'غير نشط', en: 'Inactive', tone: 'neutral' },
  suspended: { ar: 'موقوف', en: 'Suspended', tone: 'danger' },
};
