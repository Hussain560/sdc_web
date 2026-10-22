-- LOCAL ONLY: complete member records for testing the member page, the members list and "My membership".
--   docker exec -i supabase_db_sdc_web psql -U postgres -v ON_ERROR_STOP=1 < supabase/dev-lifecycle-members.sql
-- Run AFTER dev-lifecycle-people.sql. Gives the lifecycle personas real names, profiles, skills, links, a university and
-- a track, and a believable history (joined, renewed, suspended, leave requests, notes…), and turns eight of the
-- unlinked fake members into ending-soon, expired, suspended and ended people. Safe to run twice.
begin;

create temp table _lead on commit drop as
  select id from public.profiles where email = 'dev.leader@example.test';

-- helper: one persona -> its member id
create temp table _p on commit drop as
select split_part(p.email, '@', 1) as handle, m.id as member_id
from public.profiles p join public.members m on m.user_id = p.id
where p.email like 'dev.%@example.test';

-- Names, profile and links ------------------------------------------------------------------------------------------
with data(handle, fa, ma, la, fe, me, le, hl_ar, hl_en, about_ar, about_en, uni, trk, status, gh, li, port, joined) as (values
  ('dev.newmember', 'ريم', 'سعد', 'الحربي', 'Reem', 'Saad', 'Alharbi', 'مطوّرة واجهات ناشئة', 'Junior front-end developer',
   'بدأت رحلتي مع الويب هذا العام وأحب تعلّم الجديد.', 'I started with the web this year and love learning.',
   'جامعة الملك سعود', 'Web Development', 'student', 'https://github.com/reem-h', null, null, now() - interval '2 days'),
  ('dev.expiring', 'ماجد', 'علي', 'القرني', 'Majed', 'Ali', 'Alqarni', 'مهندس برمجيات • Node.js وPostgreSQL', 'Software engineer • Node.js and PostgreSQL',
   'أبني خدمات خلفية موثوقة، وأحب مشاركة الخبرة في ورش المجتمع. قدّمت ثلاث ورش في السنة الماضية.',
   'I build reliable back-end services and enjoy sharing at community workshops. I gave three workshops last year.',
   'جامعة الملك فهد للبترول والمعادن', 'Web Development', 'employee', 'https://github.com/majed-q', 'https://www.linkedin.com/in/majed-q', 'https://majed.example.test', now() - interval '353 days'),
  ('dev.expired', 'لجين', 'محمد', 'السلمي', 'Lujain', 'Mohammed', 'Alsulami', 'محلّلة بيانات', 'Data analyst',
   'أحلل البيانات وأحوّلها إلى قصص يفهمها الجميع.', 'I analyse data and turn it into stories everyone can follow.',
   'جامعة الأميرة نورة بنت عبدالرحمن', 'Web Development', 'graduate', 'https://github.com/lujain-s', 'https://www.linkedin.com/in/lujain-s', null, now() - interval '366 days'),
  ('dev.suspended', 'بدر', 'خالد', 'العنزي', 'Badr', 'Khaled', 'Alanazi', 'مطوّر تطبيقات جوال', 'Mobile app developer',
   'أطوّر تطبيقات Flutter وأحب التجريب.', 'I build Flutter apps and love experimenting.',
   'جامعة القصيم', 'Web Development', 'student', 'https://github.com/badr-a', null, null, now() - interval '200 days'),
  ('dev.ended', 'سلمى', 'ناصر', 'الدوسري', 'Salma', 'Nasser', 'Aldosari', 'مصمّمة تجربة مستخدم', 'UX designer',
   'غادرت المجتمع بعد انتقالي للعمل في الخارج.', 'I left the community after moving abroad for work.',
   'جامعة الملك عبدالعزيز', 'Web Development', 'employee', null, 'https://www.linkedin.com/in/salma-d', null, now() - interval '500 days'),
  ('dev.leaving', 'عبدالعزيز', 'سعد', 'الحمدان', 'Abdulaziz', 'Saad', 'Alhamdan', 'مهندس أمن سيبراني', 'Cyber security engineer',
   'أعمل في اختبار الاختراق وأدرّب المبتدئين.', 'I work in penetration testing and mentor beginners.',
   'جامعة الإمام محمد بن سعود الإسلامية', 'Web Development', 'employee', 'https://github.com/aziz-h', 'https://www.linkedin.com/in/aziz-h', null, now() - interval '330 days'),
  ('dev.blocked', 'ماهر', 'عبدالله', 'الزهراني', 'Maher', 'Abdullah', 'Alzahrani', 'مطوّر', 'Developer', 'حساب للاختبار.', 'A test account.',
   'جامعة طيبة', 'Web Development', 'student', null, null, null, now() - interval '150 days')
)
update public.members m set
  first_name_ar = d.fa, middle_name_ar = d.ma, last_name_ar = d.la, first_name_en = d.fe, middle_name_en = d.me, last_name_en = d.le,
  headline_ar = d.hl_ar, headline_en = d.hl_en, about_ar = d.about_ar, about_en = d.about_en,
  university_id = (select id from public.universities where name_ar = d.uni limit 1),
  track_id = (select id from public.tracks where is_active order by display_order limit 1),
  academic_status = d.status, github_url = d.gh, linkedin_url = d.li, portfolio_url = d.port,
  open_to = array['collaboration'], is_directory_visible = (m.status = 'active' and d.handle <> 'dev.newmember'),
  show_headline = true, show_about = true, show_skills = true, show_links = true, show_university = true, show_track = true,
  joined_at = d.joined
from data d join _p on _p.handle = d.handle
where m.id = _p.member_id;

-- Skills (3-6 per member, in order) ---------------------------------------------------------------------------------
delete from public.member_skills where member_id in (select member_id from _p where handle in
  ('dev.newmember','dev.expiring','dev.expired','dev.suspended','dev.ended','dev.leaving','dev.blocked'));
insert into public.member_skills (member_id, skill_id, position)
select _p.member_id, s.id, (row_number() over (partition by _p.handle order by w.ord) - 1)::smallint
from (values
  ('dev.newmember', array['html-css','javascript','react']),
  ('dev.expiring', array['nodejs','postgresql','typescript','docker','ci-cd']),
  ('dev.expired', array['python','sql','data-analysis','data-viz']),
  ('dev.suspended', array['flutter','dart','firebase']),
  ('dev.ended', array['figma','user-research','accessibility','design-systems']),
  ('dev.leaving', array['penetration-testing','appsec','network-security','linux']),
  ('dev.blocked', array['javascript','git'])
) as x(handle, slugs)
join _p on _p.handle = x.handle
cross join lateral unnest(x.slugs) with ordinality as w(slug, ord)
join public.skills s on s.slug = w.slug;

-- Histories ---------------------------------------------------------------------------------------------------------
delete from public.member_events where member_id in (select member_id from _p where handle like 'dev.%')
  and kind <> 'joined' and created_at < now() + interval '1 day';

insert into public.member_events (member_id, kind, actor_id, data, created_at)
select _p.member_id, e.kind, (select id from _lead), e.data::jsonb, now() - (e.days_ago || ' days')::interval
from (values
  -- expiring: a full year with one pause
  ('dev.expiring', 'onboarded', 351, '{}'),
  ('dev.expiring', 'card_rotated', 200, '{}'),
  ('dev.expiring', 'suspended', 150, '{"until":"2026-06-01","category":"inactivity","reason":"غياب متكرر عن مهام اللجنة دون إبلاغ"}'),
  ('dev.expiring', 'reinstated', 120, '{}'),
  ('dev.expiring', 'note', 60, '{"note":"قدّم ثلاث ورش ممتازة. مرشّح لقيادة لجنة."}'),
  ('dev.expiring', 'renewal_requested', 3, '{}'),
  -- expired
  ('dev.expired', 'onboarded', 364, '{}'),
  ('dev.expired', 'expired', 1, '{}'),
  -- suspended
  ('dev.suspended', 'onboarded', 198, '{}'),
  ('dev.suspended', 'suspended', 9, '{"until":"2026-11-21","category":"inactivity","reason":"غياب تسعة أشهر عن أي نشاط"}'),
  -- ended (left)
  ('dev.ended', 'onboarded', 498, '{}'),
  ('dev.ended', 'renewed', 130, '{"term_ends_at":"2026-10-01","message":"نسعد بتجديدك"}'),
  ('dev.ended', 'leave_requested', 14, '{}'),
  ('dev.ended', 'leave_approved', 10, '{"note":"وافقنا وتمنينا له التوفيق"}'),
  ('dev.ended', 'ended', 10, '{"end_reason":"left"}'),
  -- leaving
  ('dev.leaving', 'onboarded', 328, '{}'),
  ('dev.leaving', 'leave_requested', 2, '{}'),
  -- blocked
  ('dev.blocked', 'onboarded', 148, '{}'),
  ('dev.blocked', 'blocked', 1, '{"reason":"بلاغات متعددة عن رسائل مزعجة للأعضاء"}')
) as e(handle, kind, days_ago, data)
join _p on _p.handle = e.handle;

-- dev.regular: a rich, healthy history ------------------------------------------------------------------------------
insert into public.member_events (member_id, kind, actor_id, data, created_at)
select _p.member_id, e.kind, (select id from _lead), e.data::jsonb, now() - (e.days_ago || ' days')::interval
from (values
  ('onboarded', 700, '{}'), ('card_rotated', 400, '{}'),
  ('renewed', 340, '{"term_ends_at":"2027-06-30","message":"شكراً لمساهمتك"}'),
  ('note', 90, '{"note":"قدّمت ورشة التصميم وكانت من الأعلى تقييماً."}')
) as e(kind, days_ago, data)
join _p on _p.handle = 'dev.regular'
where not exists (select 1 from public.member_events x where x.member_id = _p.member_id and x.kind = e.kind and x.created_at > now() - interval '800 days' and x.kind <> 'joined');

-- Unlinked fake members -> other states ---------------------------------------------------------------------------
with pick as (
  select id, row_number() over (order by member_no) as n from public.members where user_id is null
)
update public.members m set
  term_starts_at = current_date - 330, term_ends_at = case p.n
      when 1 then current_date + 5 when 2 then current_date + 20 when 3 then current_date + 28
      when 4 then current_date - 3 when 5 then current_date - 40 else m.term_ends_at end,
  status = case p.n when 4 then 'expired' when 5 then 'expired' when 6 then 'suspended' when 7 then 'ended' when 8 then 'ended' else 'active' end,
  suspension_category = case p.n when 6 then 'administrative' end,
  suspended_until = case p.n when 6 then current_date + 45 end,
  end_reason = case p.n when 7 then 'not_renewed' when 8 then 'terminated' end,
  ended_at = case when p.n in (7, 8) then now() - interval '30 days' end,
  is_directory_visible = (p.n <= 3)
from pick p where m.id = p.id and p.n <= 8;

commit;
