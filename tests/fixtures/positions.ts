// Fictional-or-public leadership rows returned by the `current_positions` view in the visual suite.
// They reproduce exactly what the public /members page showed when the list was hardcoded, so the
// Sprint 01 baselines prove the database-driven page looks identical (D-009).
type Row = {
  assignment_id: string;
  role_key: string;
  role_order: number;
  role_name_ar: string;
  role_name_en: string;
  display_title_ar: string | null;
  display_title_en: string | null;
  public_bio_ar: string | null;
  public_bio_en: string | null;
  public_tags_ar: string[] | null;
  public_tags_en: string[] | null;
  committee_id: string | null;
  committee_slug: string | null;
  committee_name_ar: string | null;
  committee_name_en: string | null;
  committee_order: number | null;
  person_name_ar: string;
  person_name_en: string;
};

const row = (
  r: Partial<Row> & Pick<Row, 'assignment_id' | 'role_key' | 'person_name_ar' | 'person_name_en'>,
): Row => ({
  role_order: 0,
  role_name_ar: '',
  role_name_en: '',
  display_title_ar: null,
  display_title_en: null,
  public_bio_ar: null,
  public_bio_en: null,
  public_tags_ar: null,
  public_tags_en: null,
  committee_id: null,
  committee_slug: null,
  committee_name_ar: null,
  committee_name_en: null,
  committee_order: null,
  ...r,
});

const founderBio = {
  public_bio_ar: 'أسّست المجتمع السعودي للمطورين قبل أربع سنوات',
  public_bio_en: 'Co-founded the Saudi Developers Community four years ago',
  public_tags_ar: ['تأسيس', 'رؤية'],
  public_tags_en: ['Founding', 'Vision'],
};

export const positions: Row[] = [
  row({
    assignment_id: 'p-f1',
    role_key: 'founder',
    role_order: 10,
    person_name_ar: 'لينا الإسماعيل',
    person_name_en: 'Lina Alismail',
    ...founderBio,
  }),
  row({
    assignment_id: 'p-f2',
    role_key: 'founder',
    role_order: 10,
    person_name_ar: 'مريم الفضلي',
    person_name_en: 'Mariam Alfadhli',
    ...founderBio,
  }),
  row({
    assignment_id: 'p-l',
    role_key: 'community_leader',
    role_order: 20,
    person_name_ar: 'مهند الحربي',
    person_name_en: 'Mohannad Alharbi',
    display_title_ar: 'قائد المجتمع',
    display_title_en: 'Community Leader',
    public_bio_ar: 'قائد المجتمع الحالي، يقود الرؤية ويشرف على التنفيذ',
    public_bio_en: 'Current community leader, leading the vision and overseeing execution',
    public_tags_ar: ['قيادة', 'استراتيجية'],
    public_tags_en: ['Leadership', 'Strategy'],
  }),
  row({
    assignment_id: 'p-a',
    role_key: 'advisor',
    role_order: 30,
    person_name_ar: 'ألين الزهراني',
    person_name_en: 'Aleen Alzahrani',
    display_title_ar: 'المستشار',
    display_title_en: 'Advisor',
    public_bio_ar: 'قائدة المجتمع سابقًا، واليوم مستشارة تقدم الدعم الاستراتيجي',
    public_bio_en: 'Former community leader, now advisor providing strategic support',
    public_tags_ar: ['استشارة', 'خبرات'],
    public_tags_en: ['Advisory', 'Expertise'],
  }),
  row({
    assignment_id: 'p-h-ai',
    role_key: 'committee_head',
    role_order: 40,
    committee_order: 10,
    person_name_ar: 'جود الشهري',
    person_name_en: 'Joud Alshehri',
    display_title_ar: 'قائدة لجنة الذكاء الاصطناعي',
    display_title_en: 'Head of the AI Committee',
  }),
  row({
    assignment_id: 'p-h-cyber',
    role_key: 'committee_head',
    role_order: 40,
    committee_order: 20,
    person_name_ar: 'العنود المحلبدي',
    person_name_en: 'Al-Anoud Almuhalbdi',
    display_title_ar: 'قائدة لجنة الأمن السيبراني',
    display_title_en: 'Head of the Cybersecurity Committee',
  }),
  row({
    assignment_id: 'p-h-tech',
    role_key: 'committee_head',
    role_order: 40,
    committee_order: 30,
    person_name_ar: 'ريم الشمري',
    person_name_en: 'Reem Alshammari',
    display_title_ar: 'قائدة لجنة التقنية والتطوير',
    display_title_en: 'Head of the Technology & Development Committee',
  }),
  row({
    assignment_id: 'p-d-tech',
    role_key: 'committee_deputy',
    role_order: 50,
    committee_order: 30,
    person_name_ar: 'جواهر',
    person_name_en: 'Jawaher',
    display_title_ar: 'نائبة قائدة لجنة التقنية والتطوير',
    display_title_en: 'Deputy Head of the Technology & Development Committee',
  }),
  row({
    assignment_id: 'p-h-projects',
    role_key: 'committee_head',
    role_order: 40,
    committee_order: 40,
    person_name_ar: 'رنا الحربي',
    person_name_en: 'Rana Alharbi',
    display_title_ar: 'قائدة المشاريع',
    display_title_en: 'Head of Projects',
  }),
  row({
    assignment_id: 'p-h-design',
    role_key: 'committee_head',
    role_order: 40,
    committee_order: 50,
    person_name_ar: 'فداء',
    person_name_en: 'Fida',
    display_title_ar: 'قائدة التصميم والهوية',
    display_title_en: 'Head of Design & Brand Identity',
  }),
];
