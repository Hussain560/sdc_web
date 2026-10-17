-- Sprint 17 (MEM-011): the richer member profile. What a visitor can see, what a member can write, and the limits.
begin;
select no_plan();

delete from public.role_assignments;
delete from public.members;

insert into auth.users (id, aud, role, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000a101', 'authenticated', 'authenticated', 'sara@example.test', now(), '{"full_name":"Sara Member"}'),
  ('00000000-0000-0000-0000-00000000a102', 'authenticated', 'authenticated', 'omar@example.test', now(), '{"full_name":"Omar Member"}'),
  ('00000000-0000-0000-0000-00000000a103', 'authenticated', 'authenticated', 'hidden@example.test', now(), '{"full_name":"Hidden Member"}'),
  ('00000000-0000-0000-0000-00000000a104', 'authenticated', 'authenticated', 'plain@example.test', now(), '{"full_name":"Plain Person"}'),
  ('00000000-0000-0000-0000-00000000a105', 'authenticated', 'authenticated', 'gone@example.test', now(), '{"full_name":"Gone Member"}');

insert into public.members (id, user_id, status, joined_via, first_name_ar, last_name_ar, first_name_en, last_name_en, is_directory_visible) values
  ('00000000-0000-0000-0000-00000000b101', '00000000-0000-0000-0000-00000000a101', 'active', 'manual', 'سارة', 'العتيبي', 'Sara', 'Alotaibi', true),
  ('00000000-0000-0000-0000-00000000b102', '00000000-0000-0000-0000-00000000a102', 'active', 'manual', 'عمر', 'الحربي', 'Omar', 'Alharbi', true),
  ('00000000-0000-0000-0000-00000000b103', '00000000-0000-0000-0000-00000000a103', 'active', 'manual', 'مخفي', 'العضو', 'Hidden', 'Member', false),
  ('00000000-0000-0000-0000-00000000b105', '00000000-0000-0000-0000-00000000a105', 'inactive', 'manual', 'سابق', 'العضو', 'Gone', 'Member', true);

-- ------------------------------------------------------------------------------------------ 1. shape and defaults
select has_column('public', 'members', 'headline_ar', 'headline exists');
select has_column('public', 'members', 'about_ar', 'about exists');
select has_column('public', 'members', 'middle_name_ar', 'middle name exists');
select has_column('public', 'members', 'phone', 'the private phone exists');
select col_default_is('public', 'members', 'show_headline', 'false', 'the headline is hidden by default');
select col_default_is('public', 'members', 'show_about', 'false', 'the about text is hidden by default');
select col_default_is('public', 'members', 'show_skills', 'false', 'skills are hidden by default');
select col_default_is('public', 'members', 'show_projects', 'false', 'projects are hidden by default');
select col_default_is('public', 'members', 'show_open_to', 'false', 'open to is hidden by default');
select hasnt_column('public', 'member_directory', 'phone', 'the public directory has no phone');
select hasnt_column('public', 'member_directory', 'email', 'the public directory has no e-mail');
select cmp_ok((select count(*)::int from public.skills where is_active), '>=', 40, 'the curated skill list is seeded');

-- ------------------------------------------------------------------------------------------ 2. the member writes (as the member)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a101","role":"authenticated"}', true);

select lives_ok($$select public.update_my_member_profile('{"headline_ar":"مطوّرة واجهات","headline_en":"Frontend developer","about_ar":"أبني واجهات سريعة.","open_to":["internship","mentoring"],"middle_name_ar":"عبدالله","middle_name_en":"Abdullah"}'::jsonb)$$, 'a member saves one section of the profile');
select is((select headline_en from public.members where id = '00000000-0000-0000-0000-00000000b101'), 'Frontend developer', 'the headline is saved');
select is((select first_name_ar from public.members where id = '00000000-0000-0000-0000-00000000b101'), 'سارة', 'a key that was not sent is left as it was');
select is((select open_to from public.members where id = '00000000-0000-0000-0000-00000000b101'), array['internship', 'mentoring'], 'open to is saved');

select throws_ok($$select public.update_my_member_profile('{"open_to":["fishing"]}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED', 'an unknown open-to value is refused');
select throws_ok($$select public.update_my_member_profile('{"first_name_ar":"  "}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED', 'an empty first name is refused');
select throws_ok($$select public.update_my_member_profile('{"last_name_ar":""}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED', 'an empty last name is refused');
select throws_ok($$select public.update_my_member_profile('{"github_url":"http://insecure.example"}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED', 'a link must start with https');
select throws_ok($$select public.update_my_member_profile(('{"headline_ar":"' || repeat('x', 121) || '"}')::jsonb)$$, 'P0001', 'VALIDATION_FAILED', 'a headline over 120 characters is refused');

-- Filling a link is the consent to show it.
select lives_ok($$select public.update_my_member_profile('{"github_url":"https://github.com/sara"}'::jsonb)$$, 'a link is saved');
select is((select show_links from public.members where id = '00000000-0000-0000-0000-00000000b101'), true, 'saving a link turns the links on');
select lives_ok($$select public.update_my_member_profile('{"github_url":""}'::jsonb)$$, 'a link is removed');
select is((select show_links from public.members where id = '00000000-0000-0000-0000-00000000b101'), false, 'with no links left they are off');

-- The account name follows the name parts.
reset role;
select is((select full_name_ar from public.profiles where id = '00000000-0000-0000-0000-00000000a101'), 'سارة عبدالله العتيبي', 'the account name is built from first, middle and last');
select is((select full_name_en from public.profiles where id = '00000000-0000-0000-0000-00000000a101'), 'Sara Abdullah Alotaibi', 'the English account name follows too');

-- ------------------------------------------------------------------------------------------ 3. who may write
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a104","role":"authenticated"}', true);
select throws_ok($$select public.update_my_member_profile('{"headline_ar":"x"}'::jsonb)$$, 'P0001', 'NOT_A_MEMBER', 'a person who is not a member cannot write a profile');
select throws_ok($$select public.set_my_skills(array['react'])$$, 'P0001', 'NOT_A_MEMBER', 'nor skills');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a105","role":"authenticated"}', true);
select throws_ok($$select public.update_my_member_profile('{"headline_ar":"x"}'::jsonb)$$, 'P0001', 'NOT_A_MEMBER', 'an inactive member cannot write either');
select set_config('request.jwt.claims', '{}', true);
reset role;
set local role anon;
select throws_ok($$select public.update_my_member_profile('{"headline_ar":"x"}'::jsonb)$$, '42501', null, 'anon cannot call the profile function');
reset role;

-- ------------------------------------------------------------------------------------------ 4. skills
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a101","role":"authenticated"}', true);
select lives_ok($$select public.set_my_skills(array['react', 'typescript', 'nextjs', 'figma'])$$, 'a member picks skills');
select is((select array_agg(s.slug order by ms.position) from public.member_skills ms join public.skills s on s.id = ms.skill_id where ms.member_id = '00000000-0000-0000-0000-00000000b101'), array['react', 'typescript', 'nextjs', 'figma'], 'the order is kept');
select lives_ok($$select public.set_my_skills(array['figma', 'react'])$$, 'the list is replaced');
select is((select count(*)::int from public.member_skills where member_id = '00000000-0000-0000-0000-00000000b101'), 2, 'only the new list remains');
select throws_ok($$select public.set_my_skills(array['react', 'react'])$$, 'P0001', 'VALIDATION_FAILED', 'a duplicate is refused');
select throws_ok($$select public.set_my_skills(array['no-such-skill'])$$, 'P0001', 'VALIDATION_FAILED', 'an unknown skill is refused');
select throws_ok($$select public.set_my_skills(array['react','nextjs','typescript','figma','python','sql','docker','git','linux','aws','supabase','vercel','flutter'])$$, 'P0001', 'LIMIT_REACHED', 'more than 12 skills are refused');
select lives_ok($$select public.set_my_skills(array['react','nextjs','typescript','figma','python','sql','docker','git','linux','aws','supabase','vercel'])$$, 'exactly 12 skills are fine');
select lives_ok($$select public.set_my_skills(array['react', 'figma', 'python'])$$, 'back to three');

-- Another member cannot touch them, and cannot read them through the table.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a102","role":"authenticated"}', true);
select lives_ok($$select public.set_my_skills(array['python'])$$, 'another member sets their own skills');
select is((select count(*)::int from public.member_skills), 1, 'a member reads only their own skills through the table');
reset role;
select is((select count(*)::int from public.member_skills where member_id = '00000000-0000-0000-0000-00000000b101'), 3, 'the first member skills are untouched');

-- ------------------------------------------------------------------------------------------ 5. projects
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a101","role":"authenticated"}', true);
select lives_ok($$select public.save_my_project('{"title_ar":"موقع المجتمع","title_en":"Community site","url":"https://github.com/sara/site"}'::jsonb)$$, 'a project is saved');
select throws_ok($$select public.save_my_project('{"title_ar":"x","url":"http://insecure.example"}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED', 'a project link must be https');
select throws_ok($$select public.save_my_project('{"title_ar":"","url":"https://a.example"}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED', 'a project needs a title');
select throws_ok($$select public.save_my_project('{"title_ar":"x","url":"https://a.example","cover_path":"someone-else/pic.webp"}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED', 'a cover must live in the member own folder');
select lives_ok($$select public.save_my_project('{"title_ar":"مشروع ثان","url":"https://a.example","cover_path":"00000000-0000-0000-0000-00000000a101/cover.webp"}'::jsonb)$$, 'a cover in the own folder is fine');
select lives_ok($$select public.save_my_project('{"title_ar":"3","url":"https://a.example"}'::jsonb)$$, 'third project');
select lives_ok($$select public.save_my_project('{"title_ar":"4","url":"https://a.example"}'::jsonb)$$, 'fourth project');
select lives_ok($$select public.save_my_project('{"title_ar":"5","url":"https://a.example"}'::jsonb)$$, 'fifth project');
select lives_ok($$select public.save_my_project('{"title_ar":"6","url":"https://a.example"}'::jsonb)$$, 'sixth project');
select throws_ok($$select public.save_my_project('{"title_ar":"7","url":"https://a.example"}'::jsonb)$$, 'P0001', 'LIMIT_REACHED', 'a seventh project is refused');

select lives_ok($$select public.reorder_my_projects((select array_agg(id order by position desc) from public.member_projects where member_id = '00000000-0000-0000-0000-00000000b101'))$$, 'projects are reordered');
select is((select title_ar from public.member_projects where member_id = '00000000-0000-0000-0000-00000000b101' order by position limit 1), '6', 'the last one is now first');
select throws_ok($$select public.reorder_my_projects(array[gen_random_uuid()])$$, 'P0001', 'VALIDATION_FAILED', 'an incomplete or foreign order is refused');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a102","role":"authenticated"}', true);
select throws_ok($$select public.delete_my_project((select id from public.member_projects where title_ar = 'موقع المجتمع'))$$, 'P0001', 'NOT_FOUND', 'a member cannot delete a project that is not theirs');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a101","role":"authenticated"}', true);
select lives_ok($$select public.delete_my_project((select id from public.member_projects where title_ar = 'موقع المجتمع'))$$, 'the owner deletes a project');
reset role;

-- ------------------------------------------------------------------------------------------ 6. privacy: flags off, only the name
-- Sara has a headline, about text, skills, projects and open-to; none is public until she turns it on.
update public.members set show_university = false, show_track = false, show_links = false, show_photo = false,
  photo_path = '00000000-0000-0000-0000-00000000a101/p.webp', github_url = 'https://github.com/sara'
  where id = '00000000-0000-0000-0000-00000000b101';
set local role anon;
select is((select headline from public.member_directory where id = '00000000-0000-0000-0000-00000000b101'), null, 'headline hidden');
select is((select bio from public.member_directory where id = '00000000-0000-0000-0000-00000000b101'), null, 'about hidden');
select is((select skill_slugs from public.member_directory where id = '00000000-0000-0000-0000-00000000b101'), '{}'::text[], 'skills hidden');
select is((select open_to from public.member_directory where id = '00000000-0000-0000-0000-00000000b101'), '{}'::text[], 'open to hidden');
select is((select github_url from public.member_directory where id = '00000000-0000-0000-0000-00000000b101'), null, 'links hidden');
select is((select photo_path from public.member_directory where id = '00000000-0000-0000-0000-00000000b101'), null, 'photo hidden');
select is((select major from public.member_directory where id = '00000000-0000-0000-0000-00000000b101'), null, 'major hidden with the university flag');
select is((select first_name from public.member_directory where id = '00000000-0000-0000-0000-00000000b101'), 'سارة', 'the name is still there');
select is((select middle_name from public.member_directory where id = '00000000-0000-0000-0000-00000000b101'), 'عبدالله', 'including the middle name');
select is((select count(*)::int from public.member_public_skills where member_id = '00000000-0000-0000-0000-00000000b101'), 0, 'the skills view is empty');
select is((select count(*)::int from public.member_public_projects where member_id = '00000000-0000-0000-0000-00000000b101'), 0, 'the projects view is empty');
select throws_ok($$select * from public.member_skills$$, '42501', null, 'anon cannot read the skills table');
select throws_ok($$select * from public.member_projects$$, '42501', null, 'anon cannot read the projects table');
select lives_ok($$select * from public.skills$$, 'anon can read the curated skill list');
reset role;

-- Turn the flags on one by one.
update public.members set show_headline = true, show_about = true, show_skills = true, show_projects = true,
  show_open_to = true, show_photo = true, show_links = true where id = '00000000-0000-0000-0000-00000000b101';
set local role anon;
select is((select headline_en from public.member_directory where id = '00000000-0000-0000-0000-00000000b101'), 'Frontend developer', 'headline shows once on');
select is((select bio from public.member_directory where id = '00000000-0000-0000-0000-00000000b101'), 'أبني واجهات سريعة.', 'about shows once on');
select is((select skill_slugs from public.member_directory where id = '00000000-0000-0000-0000-00000000b101'), array['react', 'figma', 'python'], 'skills show in order once on');
select is((select open_to from public.member_directory where id = '00000000-0000-0000-0000-00000000b101'), array['internship', 'mentoring'], 'open to shows once on');
select is((select count(*)::int from public.member_public_skills where member_id = '00000000-0000-0000-0000-00000000b101'), 3, 'the skills view lists them');
select is((select count(*)::int from public.member_public_projects where member_id = '00000000-0000-0000-0000-00000000b101'), 5, 'the projects view lists them');
select is((select photo_path from public.member_directory where id = '00000000-0000-0000-0000-00000000b101'), '00000000-0000-0000-0000-00000000a101/p.webp', 'photo shows once on');
reset role;

-- An unlisted member and an inactive member are in no public view.
update public.members set show_skills = true, show_projects = true, show_headline = true where id = '00000000-0000-0000-0000-00000000b102';
insert into public.member_skills (member_id, skill_id, position)
  select '00000000-0000-0000-0000-00000000b103', id, 0 from public.skills where slug = 'react';
update public.members set show_skills = true where id = '00000000-0000-0000-0000-00000000b103';
set local role anon;
select is((select count(*)::int from public.member_directory where id in ('00000000-0000-0000-0000-00000000b103', '00000000-0000-0000-0000-00000000b105')), 0, 'unlisted and inactive members are not in the directory');
select is((select count(*)::int from public.member_public_skills where member_id = '00000000-0000-0000-0000-00000000b103'), 0, 'an unlisted member skills are not public');
select is((select count(*)::int from public.member_public_participation where member_id = '00000000-0000-0000-0000-00000000b101'), 0, 'participation is empty without the opt-in');
reset role;

-- ------------------------------------------------------------------------------------------ 7. leadership photo
insert into public.role_assignments (user_id, role_key) values ('00000000-0000-0000-0000-00000000a101', 'community_leader');
set local role anon;
select is((select member_photo_path from public.current_positions where role_key = 'community_leader'), '00000000-0000-0000-0000-00000000a101/p.webp', 'a listed leader with the photo on shows it on the leadership card');
select is((select member_id from public.current_positions where role_key = 'community_leader'), '00000000-0000-0000-0000-00000000b101'::uuid, 'and the card can link to the profile');
reset role;
update public.members set show_photo = false where id = '00000000-0000-0000-0000-00000000b101';
set local role anon;
select is((select member_photo_path from public.current_positions where role_key = 'community_leader'), null, 'photo off: no photo on the leadership card');
reset role;
update public.members set is_directory_visible = false where id = '00000000-0000-0000-0000-00000000b101';
set local role anon;
select is((select member_id from public.current_positions where role_key = 'community_leader'), null, 'unlisted: no profile link on the leadership card');
reset role;

select * from finish();
rollback;
