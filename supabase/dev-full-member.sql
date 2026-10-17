-- LOCAL ONLY: fills the test member dev.regular@example.test with every public field (photo, names, headline, about,
-- skills, projects, links, open-to, committee, events and articles) so the profile page can be seen complete.
--   docker exec -i supabase_db_sdc_web psql -U postgres -v ON_ERROR_STOP=1 < supabase/dev-full-member.sql
begin;
create temp table me on commit drop as
select m.id, m.user_id from public.members m join auth.users u on u.id = m.user_id
where u.email = 'dev.regular@example.test';

update public.members m set
  first_name_ar = 'نورة', middle_name_ar = 'عبدالله', last_name_ar = 'القحطاني',
  first_name_en = 'Noura', middle_name_en = 'Abdullah', last_name_en = 'Al-Qahtani',
  headline_ar = 'مصمّمة تجربة مستخدم وواجهات • React وNext.js',
  headline_en = 'UX and UI designer • React and Next.js',
  about_ar = 'أحب تحويل الفكرة المعقدة إلى تجربة بسيطة يفهمها الجميع. أعمل مع فرق صغيرة على منتجات عربية، وأشارك ما أتعلمه في فعاليات المجتمع وفي مقالات قصيرة.' || E'\n\n' || 'أبدأ كل مشروع بالاستماع إلى المستخدمين، ثم أرسم التدفق قبل الألوان.',
  about_en = 'I turn complex ideas into simple experiences anyone can use. I work with small teams on Arabic products and share what I learn at community events and in short articles.',
  open_to = array['internship','freelance','collaboration'],
  is_directory_visible = true,
  show_photo = true, show_headline = true, show_about = true, show_skills = true,
  show_projects = true, show_open_to = true, show_university = true, show_track = true,
  show_participation = true,
  university_id = (select id from public.universities where name_ar = 'جامعة الملك فيصل' limit 1),
  track_id = (select id from public.tracks where is_active order by display_order limit 1),
  academic_status = 'student',
  portfolio_url = 'https://noura.example.test',
  github_url = 'https://github.com/example',
  linkedin_url = 'https://www.linkedin.com/in/example',
  x_url = 'https://x.com/example',
  behance_url = 'https://www.behance.net/example',
  show_links = true,
  joined_at = now() - interval '2 years'
from me where m.id = me.id;

-- skills (in this order)
delete from public.member_skills where member_id = (select id from me);
insert into public.member_skills (member_id, skill_id, position)
select (select id from me), s.id, (row_number() over (order by ord) - 1)::smallint
from unnest(array['react','typescript','figma','user-research','nextjs','accessibility']) with ordinality as w(slug, ord)
join public.skills s on s.slug = w.slug;

-- projects
delete from public.member_projects where member_id = (select id from me);
insert into public.member_projects (member_id, position, title_ar, title_en, description_ar, description_en, url) values
  ((select id from me), 0, 'موقع المجتمع السعودي للمطورين', 'Saudi Developers Community site',
   'تصميم وتطوير الموقع الرئيسي بالعربية أولاً مع دعم كامل للإنجليزية.', 'Design and build of the main site, Arabic first with full English support.',
   'https://developers.example.test'),
  ((select id from me), 1, 'منيو: قائمة طعام رقمية', 'Menu: a digital restaurant menu',
   'قائمة طعام تفاعلية للمطاعم الصغيرة تُحدَّث من لوحة بسيطة.', 'An interactive menu for small restaurants, updated from a simple dashboard.',
   'https://github.com/example/menu');

-- committee position (AI committee, member)
insert into public.role_assignments (user_id, role_key, committee_id, display_title_ar)
select user_id, 'committee_member', (select id from public.committees where slug = 'ai'), 'عضو لجنة الذكاء الاصطناعي'
from me
where not exists (select 1 from public.role_assignments r where r.user_id = (select user_id from me) and r.ends_at is null and r.role_key = 'committee_member');

-- events she took part in (presenter of one, attended two)
insert into public.event_presenters (event_id, profile_id)
select 'a3fa7f3f-b824-4521-831f-3a5b571ffd2c', user_id from me on conflict do nothing;
commit;

-- one published article she wrote (the profile lists it)
begin;
insert into public.article_authors (article_id, position, user_id)
select a.id, 0, (select user_id from me)
from public.articles a where a.status = 'published' order by a.published_at desc nulls last limit 1
on conflict do nothing;
commit;
