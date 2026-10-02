-- Synthetic local data (Sprint 02 · DB-003). Fictional people only — never copy production rows here.
-- Applied by `supabase db reset`.
insert into public.members (
  first_name, last_name, first_name_en, last_name_en,
  major, major_en, sub_major, sub_major_en,
  status, status_en, university, university_en,
  track, track_en, bio, bio_en
) values
  ('سارة', 'العتيبي', 'Sara', 'Alotaibi', 'علوم الحاسب', 'Computer Science', 'هندسة البرمجيات', 'Software Engineering', 'طالب', 'Student', 'جامعة الملك سعود', 'King Saud University', 'تطوير الويب', 'Web Development', 'مطوّر يحب بناء المنتجات المفيدة للمجتمع.', 'A developer who loves building useful products for the community.'),
  ('خالد', 'الزهراني', 'Khalid', 'Alzahrani', 'علوم الحاسب', 'Computer Science', 'هندسة البرمجيات', 'Software Engineering', 'طالب', 'Student', 'جامعة الملك سعود', 'King Saud University', 'الذكاء الاصطناعي', 'Artificial Intelligence', 'مطوّر يحب بناء المنتجات المفيدة للمجتمع.', 'A developer who loves building useful products for the community.'),
  ('نورة', 'القحطاني', 'Noura', 'Alqahtani', 'علوم الحاسب', 'Computer Science', 'هندسة البرمجيات', 'Software Engineering', 'طالب', 'Student', 'جامعة الملك سعود', 'King Saud University', 'تطوير الويب', 'Web Development', 'مطوّر يحب بناء المنتجات المفيدة للمجتمع.', 'A developer who loves building useful products for the community.'),
  ('فهد', 'الدوسري', 'Fahad', 'Aldosari', 'علوم الحاسب', 'Computer Science', 'هندسة البرمجيات', 'Software Engineering', 'طالب', 'Student', 'جامعة الملك سعود', 'King Saud University', 'الذكاء الاصطناعي', 'Artificial Intelligence', 'مطوّر يحب بناء المنتجات المفيدة للمجتمع.', 'A developer who loves building useful products for the community.'),
  ('ليان', 'الغامدي', 'Layan', 'Alghamdi', 'علوم الحاسب', 'Computer Science', 'هندسة البرمجيات', 'Software Engineering', 'طالب', 'Student', 'جامعة الملك سعود', 'King Saud University', 'تطوير الويب', 'Web Development', 'مطوّر يحب بناء المنتجات المفيدة للمجتمع.', 'A developer who loves building useful products for the community.'),
  ('عمر', 'الشهري', 'Omar', 'Alshehri', 'علوم الحاسب', 'Computer Science', 'هندسة البرمجيات', 'Software Engineering', 'طالب', 'Student', 'جامعة الملك سعود', 'King Saud University', 'الذكاء الاصطناعي', 'Artificial Intelligence', 'مطوّر يحب بناء المنتجات المفيدة للمجتمع.', 'A developer who loves building useful products for the community.'),
  ('هند', 'المطيري', 'Hind', 'Almutairi', 'علوم الحاسب', 'Computer Science', 'هندسة البرمجيات', 'Software Engineering', 'طالب', 'Student', 'جامعة الملك سعود', 'King Saud University', 'تطوير الويب', 'Web Development', 'مطوّر يحب بناء المنتجات المفيدة للمجتمع.', 'A developer who loves building useful products for the community.'),
  ('تركي', 'السبيعي', 'Turki', 'Alsubaie', 'علوم الحاسب', 'Computer Science', 'هندسة البرمجيات', 'Software Engineering', 'طالب', 'Student', 'جامعة الملك سعود', 'King Saud University', 'الذكاء الاصطناعي', 'Artificial Intelligence', 'مطوّر يحب بناء المنتجات المفيدة للمجتمع.', 'A developer who loves building useful products for the community.');

insert into public.event_registrations (event_id, full_name_snapshot, email_snapshot, status)
select e.id, v.name, v.email, v.status
from (values
  ('سارة العتيبي', 'sara@example.test', 'pending'),
  ('خالد الزهراني', 'khalid@example.test', 'accepted')
) as v(name, email, status)
join public.events e on e.legacy_id = 1;
