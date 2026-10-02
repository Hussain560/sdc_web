// Fictional members used to make public-page screenshots deterministic.
// No real personal data (docs/06-security/privacy-and-data-protection.md).
const base = {
  bio: 'مطوّر يحب بناء المنتجات المفيدة للمجتمع.',
  bio_en: 'A developer who loves building useful products for the community.',
  created_at: '2026-01-01T00:00:00Z',
  github_url: null,
  linkedin_url: null,
  portfolio_url: null,
  x_url: null,
  status: 'طالب',
  status_en: 'Student',
};

const names = [
  ['سارة', 'العتيبي', 'Sara', 'Alotaibi'],
  ['خالد', 'الزهراني', 'Khalid', 'Alzahrani'],
  ['نورة', 'القحطاني', 'Noura', 'Alqahtani'],
  ['فهد', 'الدوسري', 'Fahad', 'Aldosari'],
  ['ليان', 'الغامدي', 'Layan', 'Alghamdi'],
  ['عمر', 'الشهري', 'Omar', 'Alshehri'],
  ['هند', 'المطيري', 'Hind', 'Almutairi'],
  ['تركي', 'السبيعي', 'Turki', 'Alsubaie'],
] as const;

export const members = names.map(([fa, la, fe, le], i) => ({
  ...base,
  id: 100 + i,
  first_name: fa,
  last_name: la,
  first_name_en: fe,
  last_name_en: le,
  university: 'جامعة الملك سعود',
  university_en: 'King Saud University',
  major: 'علوم الحاسب',
  major_en: 'Computer Science',
  sub_major: 'هندسة البرمجيات',
  sub_major_en: 'Software Engineering',
  track: i % 2 ? 'الذكاء الاصطناعي' : 'تطوير الويب',
  track_en: i % 2 ? 'Artificial Intelligence' : 'Web Development',
}));
