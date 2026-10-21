-- LOCAL ONLY: sample data for the Sprint 18 membership lifecycle screens.
--   docker exec -i supabase_db_sdc_web psql -U postgres -v ON_ERROR_STOP=1 < supabase/dev-lifecycle-seed.sql
-- One open cycle with a rubric and capacity, applications in every state, a few leave requests and ending terms.
-- Safe to run twice (fixed ids, on conflict do nothing).
begin;

insert into public.membership_cycles (id, name_ar, name_en, opens_at, closes_at, review_ends_at, status, capacity, questions, rubric, term_ends_at)
values (
  '00000000-0000-0000-0000-00000000cc01', 'استقبال خريف 2026', 'Autumn 2026 intake',
  now() - interval '9 days', now() + interval '12 days', now() + interval '20 days', 'published', 6,
  '[{"key":"why","type":"long_text","required":true,"label_ar":"لماذا تريد الانضمام؟","label_en":"Why do you want to join?"}]',
  '[{"key":"motivation","label_ar":"الدافع","label_en":"Motivation","weight":2},{"key":"work","label_ar":"الأعمال","label_en":"Work","weight":1}]',
  (current_date + interval '1 year')::date
) on conflict (id) do nothing;

insert into public.membership_applications
  (id, cycle_id, email, first_name_ar, middle_name_ar, last_name_ar, first_name_en, last_name_en, full_name_ar, phone,
   academic_status, consent_version, wants_directory_listing, submitted_at, status, reference, university_id, major_id, track_id, bio_ar, github_url, answers, accepted_at)
select
  ('00000000-0000-0000-0000-0000000e' || lpad(n::text, 4, '0'))::uuid,
  '00000000-0000-0000-0000-00000000cc01',
  'seed.applicant' || n || '@example.test',
  (array['نورة','خالد','ليلى','تركي','سارة','فهد','ريم','عبدالله','هند','ماجد'])[n],
  case when n % 3 = 0 then 'محمد' end,
  (array['القحطاني','الهاجري','المطيري','العتيبي','الدوسري','الشمري','الغامدي','الزهراني','العنزي','السبيعي'])[n],
  (array['Noura','Khalid','Layla','Turki','Sara','Fahad','Reem','Abdullah','Hind','Majed'])[n],
  (array['Alqahtani','Alhajri','Almutairi','Alotaibi','Aldosari','Alshammari','Alghamdi','Alzahrani','Alanazi','Alsubaie'])[n],
  'x x', '+9665040000' || lpad(n::text, 2, '0'),
  case when n % 2 = 0 then 'graduate' else 'student' end, 'v1', n % 2 = 0,
  now() - (n || ' hours')::interval,
  (array['submitted','submitted','under_review','submitted','info_requested','accepted','waitlisted','rejected','submitted','withdrawn'])[n],
  'SDC-26-' || lpad((900 + n)::text, 4, '0'),
  1, 1, 1, 'مطوّر مهتم بتقنيات الويب وبناء المجتمعات التقنية.',
  'https://github.com/seed-' || n,
  '{"why":"أحب أن أتعلم وأشارك المعرفة مع المجتمع."}'::jsonb,
  case when n = 6 then now() - interval '2 days' end
from generate_series(1, 10) as n
on conflict (id) do nothing;

commit;
