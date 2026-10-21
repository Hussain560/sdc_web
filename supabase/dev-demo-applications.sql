-- LOCAL ONLY: fills the dashboard "membership applications" table with sample applications.
--   docker exec -i supabase_db_sdc_web psql -U postgres -v ON_ERROR_STOP=1 < supabase/dev-demo-applications.sql
-- Open cycle (the one running now): new and under-review applications. Completed cycle: decided ones.
-- Safe to run twice: an applicant is added to a cycle only once.
begin;

with applicants as (
  select u.id as user_id, u.email, coalesce(p.full_name_ar, split_part(u.email, '@', 1)) as name_ar,
         p.full_name_en as name_en, row_number() over (order by u.email) as n
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.email like 'dev.%@example.test' or u.email like 'lead.%@example.test' or u.email like 'plain.%@example.test'
),
open_cycle as (
  select id from public.membership_cycles
  where status = 'published' and now() between opens_at and closes_at and closed_early_at is null
  order by opens_at desc limit 1
),
done_cycle as (
  select id from public.membership_cycles where status = 'completed' order by opens_at desc limit 1
)
insert into public.membership_applications
  (cycle_id, user_id, status, full_name_ar, full_name_en, email, phone, academic_status, university_id, track_id,
   bio_ar, answers, wants_directory_listing, consent_version, consent_at, submitted_at, decided_at, decision_note)
select c.id, a.user_id,
       case when c.kind = 'open' then (array['submitted', 'under_review', 'submitted'])[1 + (a.n % 3)]
            else (array['accepted', 'rejected', 'accepted', 'accepted'])[1 + (a.n % 4)] end,
       a.name_ar, a.name_en, a.email, '+96655000' || lpad(a.n::text, 4, '0'),
       (array['student', 'graduate', 'employee'])[1 + (a.n % 3)],
       (select id from public.universities order by id offset (a.n % 5) limit 1),
       (select id from public.tracks where is_active order by display_order offset (a.n % 3) limit 1),
       'أحب تطوير الويب وأبحث عن مجتمع أتعلم فيه وأشارك خبرتي.',
       '{"why":"أريد أن أتعلم وأبني مع مجتمع يشاركني الاهتمام."}'::jsonb,
       a.n % 2 = 0, 'v1', now() - interval '12 days',
       now() - (a.n || ' days')::interval,
       case when c.kind = 'done' then now() - interval '5 days' end,
       case when c.kind = 'done' then 'قرار تجريبي' end
from applicants a
cross join lateral (
  select id, 'open' as kind from open_cycle
  union all
  select id, 'done' as kind from done_cycle
) c
where (c.kind = 'open' and a.n <= 10) or (c.kind = 'done' and a.n > 10 and a.n <= 18)
  and not exists (select 1 from public.membership_applications x where x.cycle_id = c.id and x.user_id = a.user_id);

commit;

select c.name_ar, c.status, a.status as application_status, count(*)
from public.membership_applications a join public.membership_cycles c on c.id = a.cycle_id
group by 1, 2, 3 order by 1, 3;
