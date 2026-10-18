-- LOCAL ONLY: an accepted membership application for dev.regular@example.test, with answers, so "My data" shows it.
--   docker exec -i supabase_db_sdc_web psql -U postgres -v ON_ERROR_STOP=1 < supabase/dev-demo-application.sql
begin;
insert into public.membership_cycles (name_ar, opens_at, closes_at, status, questions)
select 'دورة الربيع التجريبية', now() - interval '2 years', now() - interval '2 years' + interval '14 days', 'published',
       '[{"key":"why","type":"text","required":true,"label_ar":"لماذا تريد الانضمام إلى المجتمع؟","label_en":"Why do you want to join the community?"},
         {"key":"skills","type":"text","required":false,"label_ar":"ما أبرز مهاراتك؟","label_en":"What are your main skills?"}]'::jsonb
where not exists (select 1 from public.membership_cycles where name_ar = 'دورة الربيع التجريبية');

insert into public.membership_applications
  (cycle_id, user_id, status, full_name_ar, full_name_en, phone, academic_status, university_id, track_id, bio_ar,
   github_url, linkedin_url, answers, wants_directory_listing, consent_version, consent_at, submitted_at, decided_at)
select c.id, u.id, 'accepted', 'نورة عبدالله القحطاني', 'Noura Abdullah Al-Qahtani', '+966555000111', 'student',
       (select id from public.universities where name_ar = 'جامعة الملك فيصل' limit 1),
       (select id from public.tracks where is_active order by display_order limit 1),
       'طالبة مهتمة بتصميم الواجهات وتجربة المستخدم.',
       'https://github.com/example', 'https://www.linkedin.com/in/example',
       '{"why":"أريد أن أتعلم وأبني مع مجتمع يشاركني الاهتمام.","skills":"Figma, React, TypeScript"}'::jsonb,
       true, '2027-03-draft', now() - interval '2 years', now() - interval '2 years', now() - interval '2 years' + interval '10 days'
from public.membership_cycles c, auth.users u
where c.name_ar = 'دورة الربيع التجريبية' and u.email = 'dev.regular@example.test'
  and not exists (select 1 from public.membership_applications a where a.cycle_id = c.id and a.user_id = u.id);
commit;
