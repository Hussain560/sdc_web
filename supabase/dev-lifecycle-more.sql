-- LOCAL ONLY: more cycles and applications so every list, tab, the funnel and the waiting list have data.
--   docker exec -i supabase_db_sdc_web psql -U postgres -v ON_ERROR_STOP=1 < supabase/dev-lifecycle-more.sql
-- Run AFTER supabase/dev-lifecycle-seed.sql (and before dev-lifecycle-people.sql, which gives the tracking links).
-- Adds: a completed cycle (decided applications), a scheduled cycle, a draft cycle, and in the OPEN cycle 28 more
-- applications: new, in review, info requested, accepted (waiting to activate, at different ages), waitlisted
-- (scored, so the order is by score), lapsed, rejected, withdrawn. Safe to run twice.
begin;

-- Cycles -----------------------------------------------------------------------------------------------------------
insert into public.membership_cycles (id, name_ar, name_en, opens_at, closes_at, review_ends_at, status, capacity, questions, rubric, term_ends_at, activation_deadline_days)
values
  ('00000000-0000-0000-0000-00000000cc00', 'استقبال ربيع 2026', 'Spring 2026 intake',
   now() - interval '170 days', now() - interval '140 days', now() - interval '125 days', 'completed', 20, '[]', '[]',
   (current_date + interval '6 months')::date, 7),
  ('00000000-0000-0000-0000-00000000cc02', 'استقبال شتاء 2027', 'Winter 2027 intake',
   now() + interval '20 days', now() + interval '45 days', now() + interval '60 days', 'published', 25,
   '[{"key":"why","type":"long_text","required":true,"label_ar":"لماذا تريد الانضمام؟","label_en":"Why do you want to join?"}]',
   '[{"key":"motivation","label_ar":"الدافع","label_en":"Motivation","weight":2}]', (current_date + interval '14 months')::date, 7),
  ('00000000-0000-0000-0000-00000000cc03', 'استقبال صيف 2027 (مسودة)', 'Summer 2027 intake (draft)',
   now() + interval '120 days', now() + interval '150 days', null, 'draft', null, '[]', '[]', null, 7)
on conflict (id) do nothing;

-- Completed cycle: 8 decided applications ------------------------------------------------------------------------
insert into public.membership_applications
  (id, cycle_id, email, first_name_ar, last_name_ar, first_name_en, last_name_en, full_name_ar, phone, academic_status,
   consent_version, wants_directory_listing, submitted_at, status, reference, university_id, major_id, track_id, bio_ar,
   answers, decided_at, accepted_at)
select ('00000000-0000-0000-0000-0000000f' || lpad(n::text, 4, '0'))::uuid,
  '00000000-0000-0000-0000-00000000cc00', 'spring.applicant' || n || '@example.test',
  (array['سلمان','منال','بدر','أمل','وليد','غادة','رائد','شهد'])[n], 'الربيعي',
  (array['Salman','Manal','Badr','Amal','Walid','Ghada','Raed','Shahd'])[n], 'Alrabie', 'x x',
  '+9665055000' || lpad(n::text, 2, '0'), 'student', 'v1', true, now() - interval '160 days' + (n || ' hours')::interval,
  case when n in (1, 2, 3, 4, 5) then 'accepted' else 'rejected' end, 'SDC-26-' || lpad((700 + n)::text, 4, '0'),
  1, 1, 1, 'متقدم من دورة سابقة.', '{}'::jsonb, now() - interval '130 days',
  case when n <= 5 then now() - interval '130 days' end
from generate_series(1, 8) n
on conflict (id) do nothing;

-- Open cycle: applications 11..38 --------------------------------------------------------------------------------
-- 11-14 submitted, 15-17 under review, 18 info requested, 19-22 accepted (waiting), 23-30 waitlisted, 31 lapsed,
-- 32-34 rejected, 35-36 withdrawn, 37-38 submitted (second-time applicants with an earlier rejected application).
insert into public.membership_applications
  (id, cycle_id, email, first_name_ar, last_name_ar, first_name_en, last_name_en, full_name_ar, phone, academic_status,
   consent_version, wants_directory_listing, submitted_at, status, reference, university_id, major_id, track_id, bio_ar,
   github_url, answers, accepted_at, lapsed_at, decided_at, reviewer_id)
select ('00000000-0000-0000-0000-0000000e' || lpad(n::text, 4, '0'))::uuid,
  '00000000-0000-0000-0000-00000000cc01',
  case when n >= 37 then 'spring.applicant' || (n - 36) || '@example.test' else 'seed.applicant' || n || '@example.test' end,
  (array['أحمد','مها','يزيد','جواهر','نايف','لمى','سعود','دانة','عمر','أروى','بندر','هيفاء','زياد','رنا','حسام','نجلاء','طلال','ميار','فيصل','سديم','معاذ','شذى','وائل','ديمة','عادل','تالا','صالح','لجين'])[n - 10],
  (array['الحربي','الخالدي','العمري','البلوي','الشهري','الجهني','القرني','المالكي','الحازمي','السلمي','العسيري','الشريف','البقمي','الرشيد','الفهد','العجمي','الثبيتي','الحارثي','الصاعدي','الجبري','الراشد','المنصور','الحمدان','العيسى','الدخيل','السهلي','الغنام','الحسين'])[n - 10],
  'Applicant' || n, 'Seed' || n, 'x x', '+9665060' || lpad(n::text, 4, '0'),
  case when n % 3 = 0 then 'graduate' when n % 5 = 0 then 'employee' else 'student' end, 'v1', n % 2 = 0,
  now() - ((n % 9) * 14 + 2 || ' hours')::interval,
  case when n <= 14 or n >= 37 then 'submitted' when n <= 17 then 'under_review' when n = 18 then 'info_requested'
       when n <= 22 then 'accepted' when n <= 30 then 'waitlisted' when n = 31 then 'lapsed'
       when n <= 34 then 'rejected' else 'withdrawn' end,
  'SDC-26-' || lpad((900 + n)::text, 4, '0'),
  1 + n % 4, 1 + n % 3, 1 + n % 4, 'مهتم بالتقنية وبناء مشاريع مفتوحة المصدر ومشاركة المعرفة.',
  case when n % 2 = 0 then 'https://github.com/seed-' || n end,
  '{"why":"أريد التعلم من المجتمع والمساهمة في فعالياته."}'::jsonb,
  case n when 19 then now() - interval '1 day' when 20 then now() - interval '3 days' when 21 then now() - interval '5 days'
         when 22 then now() - interval '6 days' when 31 then now() - interval '9 days' end,
  case when n = 31 then now() - interval '2 days' end,
  case when n between 32 and 34 then now() - interval '1 day' end,
  case when n between 15 and 17 then (select id from public.profiles where email = 'dev.leader@example.test') end
from generate_series(11, 38) n
on conflict (id) do nothing;

-- The first-time info request for #18 -----------------------------------------------------------------------------
update public.membership_applications
   set info_request = 'أضف رابطاً لأحد أعمالك.', info_fields = array['github_url'], info_requested_at = now() - interval '2 days'
 where id = '00000000-0000-0000-0000-0000000e0018';

-- Scores (two reviewers) so the waiting list is ordered by score and the list shows meters ------------------------
insert into public.application_scores (application_id, reviewer_id, scores)
select a.id, r.id, jsonb_build_object('motivation', 1 + ((n + r.k) % 5), 'work', 1 + ((n * 2 + r.k) % 5))
from (select ('00000000-0000-0000-0000-0000000e' || lpad(n::text, 4, '0'))::uuid as id, n from generate_series(15, 30) n) a
join (select p.id, row_number() over (order by p.email) as k from public.profiles p
       where p.email in ('dev.leader@example.test', 'dev.founder@example.test')) r on true
on conflict do nothing;

commit;
