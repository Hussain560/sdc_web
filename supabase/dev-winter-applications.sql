-- LOCAL ONLY: 18 applications for the open "Winter 2027 intake" (استقبال شتاء 2027) with answers to its questions, a
-- 3-criterion rubric, and scores from two or three reviewers, so the whole review flow can be tested: list, filters,
-- scoring, bulk decisions, waiting list, capacity (25 places) and the e-mails.
--   docker exec -i supabase_db_sdc_web psql -U postgres -v ON_ERROR_STOP=1 < supabase/dev-winter-applications.sql
-- Run after dev-cycle-questions.sql. Safe to run twice (fixed ids; scores replaced).
begin;

-- The rubric as in the review design (only possible while nobody has scored this cycle).
update public.membership_cycles c set rubric = $r$[
  {"key":"motivation","label_ar":"الدافع","label_en":"Motivation","weight":2},
  {"key":"experience","label_ar":"الخبرة أو الرغبة في التعلّم","label_en":"Experience or will to learn","weight":1},
  {"key":"work","label_ar":"الأعمال والروابط","label_en":"Work and links","weight":1}
]$r$::jsonb
where c.name_en = 'Winter 2027 intake'
  and not exists (select 1 from public.application_scores s join public.membership_applications a on a.id = s.application_id where a.cycle_id = c.id);

create temp table _w on commit drop as select id from public.membership_cycles where name_en = 'Winter 2027 intake';

insert into public.membership_applications
  (id, cycle_id, email, first_name_ar, middle_name_ar, last_name_ar, first_name_en, middle_name_en, last_name_en, full_name_ar,
   phone, gender, academic_status, study_year, status, reference, university_id, major_id, track_id, bio_ar, github_url,
   answers, consent_version, wants_directory_listing, submitted_at, reviewer_id, locale, info_request, info_fields, info_requested_at)
select
  ('00000000-0000-0000-0000-0000000e' || (1000 + n)::text)::uuid,
  (select id from _w),
  'winter.applicant' || n || '@example.test',
  (array['ريان','هيفاء','عمر','لمى','فيصل','رغد','تركي','جود','سلطان','ديما','نايف','أسيل','خالد','مها','بدر','شهد','وليد','رنا'])[n],
  case when n % 3 = 0 then 'عبدالله' end,
  (array['العجمي','الدوسري','القرني','الحربي','الشهري','الغامدي','العتيبي','المطيري','الزهراني','السبيعي','الراشد','الحمدان','المالكي','البلوي','الجهني','السلمي','الحازمي','العسيري'])[n],
  (array['Rayan','Haifa','Omar','Lama','Faisal','Raghad','Turki','Joud','Sultan','Dima','Nayef','Aseel','Khaled','Maha','Badr','Shahd','Waleed','Rana'])[n],
  case when n % 3 = 0 then 'Abdullah' end,
  (array['Alajmi','Aldosari','Alqarni','Alharbi','Alshehri','Alghamdi','Alotaibi','Almutairi','Alzahrani','Alsubaie','Alrashed','Alhamdan','Almalki','Albalawi','Aljuhani','Alsulami','Alhazmi','Alasiri'])[n],
  'x x', '+9665070' || lpad(n::text, 4, '0'),
  case when n % 2 = 0 then 'female' else 'male' end,
  (array['student','student','student','graduate','student','employee','student','student','graduate','student','employee','student','student','other','student','student','graduate','student'])[n],
  case when (array['student','student','student','graduate','student','employee','student','student','graduate','student','employee','student','student','other','student','student','graduate','student'])[n] = 'student'
       then 1 + n % 5 end,
  (array['submitted','submitted','submitted','submitted','submitted','submitted','submitted','submitted',
         'under_review','under_review','under_review','info_requested','waitlisted','waitlisted','rejected','submitted','submitted','submitted'])[n],
  'SDC-26-' || (1000 + n)::text,
  1 + n % 6, 1 + n % 4, 1 + n % 5,
  'مهتم بالتقنية وبناء مشاريع مفتوحة المصدر، وأحب مشاركة ما أتعلّمه مع المجتمع.',
  case when n % 2 = 0 then 'https://github.com/winter-' || n end,
  jsonb_build_object(
    'why', (array['أريد أن أنتقل من التعلّم وحدي إلى العمل مع فريق، وأن أشارك ما تعلّمته في ورشة للمبتدئين.',
                  'أبحث عن مجتمع يدعم بناء مشاريع حقيقية ويشجّع على المشاركة في الفعاليات.',
                  'أحب تقديم الورش وأريد منصة أنقل منها خبرتي إلى المبتدئين.'])[1 + n % 3],
    'committee', (array['الذكاء الاصطناعي','التقنية والتطوير','الأمن السيبراني'])[1 + n % 3],
    'interests', case n % 3 when 0 then '["تعلّم الآلة","تحليل البيانات"]'::jsonb when 1 then '["الويب","الجوال","تقديم ورش"]'::jsonb else '["التصميم","كتابة مقالات"]'::jsonb end,
    'monthly', case when n % 4 = 0 then 'ليس دائماً' else 'نعم' end),
  'v1', n % 2 = 0,
  now() - ((n * 5) || ' hours')::interval - interval '20 minutes',
  case when n between 9 and 11 then (select id from public.profiles where email = 'dev.leader@example.test') end,
  'ar',
  case when n = 12 then 'أضف رابطاً لأحد أعمالك (GitHub أو موقعك).' end,
  case when n = 12 then array['github_url'] else '{}'::text[] end,
  case when n = 12 then now() - interval '1 day' end
from generate_series(1, 18) n
on conflict (id) do nothing;

-- Known tracking links: /join/status/<sha256("winter-track-<n>")>.
update public.membership_applications
   set tracking_token_hash = private.token_hash(encode(sha256(convert_to('winter-track-' || (right(id::text, 4)::int - 1000), 'UTF8')), 'hex'))
 where id::text like '00000000-0000-0000-0000-0000000e10%';

-- Scores (1-5 per criterion) from the leader, the founder and, for some, the system admin ---------------------------
delete from public.application_scores where application_id::text like '00000000-0000-0000-0000-0000000e10%';
insert into public.application_scores (application_id, reviewer_id, scores, comment)
select ('00000000-0000-0000-0000-0000000e' || (1000 + n)::text)::uuid, r.id,
       jsonb_build_object('motivation', 1 + ((n + r.k) % 5), 'experience', 1 + ((n * 2 + r.k) % 5), 'work', 1 + ((n * 3 + r.k) % 5)),
       case when (n + r.k) % 4 = 0 then 'دافع واضح وروابط أعمال حقيقية.' when (n + r.k) % 4 = 1 then 'نموذج جيد، يحتاج إلى مشروع أقوى.' end
from generate_series(1, 18) n
join (select p.id, row_number() over (order by p.email) as k from public.profiles p
       where p.email in ('dev.leader@example.test', 'dev.founder@example.test', 'dev.admin@example.test')) r
  on (n % 3 = 0) or (n % 3 = 1 and r.k <= 2) or (n % 3 = 2 and r.k >= 2)
where n not in (15);

-- Events for the timeline of those that moved
insert into public.application_events (application_id, kind, actor_id, data, created_at)
select a.id, 'claimed', a.reviewer_id, '{}', now() - interval '3 hours'
from public.membership_applications a
where a.id::text like '00000000-0000-0000-0000-0000000e10%' and a.status = 'under_review'
  and not exists (select 1 from public.application_events e where e.application_id = a.id and e.kind = 'claimed');

commit;
