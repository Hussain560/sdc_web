-- LOCAL ONLY: gives the fake (non-leadership) listed members a headline, about text, skills, open-to and track so the
-- directory and profile cards can be seen filled. Two members are left name-only on purpose (the sparse card).
--   docker exec -i supabase_db_sdc_web psql -U postgres -v ON_ERROR_STOP=1 < supabase/dev-fill-fake-members.sql
begin;
create temp table fake on commit drop as
select m.id, row_number() over (order by m.created_at, m.id) as n
from public.members m
left join auth.users u on u.id = m.user_id
where m.is_directory_visible
  and m.headline_ar is null
  and (u.id is null or (u.email not like 'dev.%@example.test' and u.email not like 'lead.%@example.test' and u.email not like 'team.%@example.test'));

create temp table skill_pick on commit drop as
select f.id, f.n, s.slug, s.id as skill_id, row_number() over (partition by f.id order by md5(s.slug || f.n::text)) as pos
from fake f
join public.skills s on s.is_active
where f.n not in (1, 2)
  and (
    (case f.n % 10 when 0 then 'web' when 1 then 'data' when 2 then 'cyber' when 3 then 'design' when 4 then 'mobile'
                    when 5 then 'cloud' when 6 then 'ai' when 7 then 'games' when 8 then 'web' else 'cyber' end) = s.category
    or s.slug in ('git', 'typescript', 'docker', 'linux', 'figma', 'python')
  );
delete from public.member_skills where member_id in (select id from fake where n not in (1, 2));
insert into public.member_skills (member_id, skill_id, position)
select id, skill_id, (pos - 1)::smallint from skill_pick where pos <= 3 + (n % 3);

update public.members m set
  headline_ar = (array['مطوّر واجهات أمامية','مهندسة بيانات','باحث أمن سيبراني','مصمّمة تجربة مستخدم','مطوّر تطبيقات جوال',
                       'مهندس سحابة DevOps','مطوّر ذكاء اصطناعي','مطوّرة ألعاب','طالب علوم حاسب','مختبِر اختراق'])[1 + (f.n::int % 10)],
  headline_en = (array['Front-end developer','Data engineer','Security researcher','UX designer','Mobile developer',
                       'Cloud and DevOps engineer','AI developer','Game developer','Computer science student','Penetration tester'])[1 + (f.n::int % 10)],
  about_ar = 'مهتم ببناء أدوات عملية تخدم المجتمع، وأحب تعلّم الجديد كل يوم مع زملائي في المجتمع.',
  about_en = 'I enjoy building practical tools that help the community, and I learn something new with my peers every day.',
  open_to = case when f.n % 3 = 0 then array['internship','mentoring']
                 when f.n % 3 = 1 then array['job'] else array['freelance','collaboration'] end,
  track_id = (select id from public.tracks where is_active order by display_order offset (f.n::int % 8) limit 1),
  university_id = (select id from public.universities where is_active order by display_order offset (f.n::int % 5) limit 1),
  show_headline = true, show_about = true, show_skills = true, show_open_to = true,
  show_track = true, show_university = true, show_photo = true
from fake f
where m.id = f.id and f.n not in (1, 2);
commit;
