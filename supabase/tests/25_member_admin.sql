-- Sprint 17 (MEM-015): the dashboard list and detail, and who sees contact details.
begin;
select no_plan();

delete from public.role_assignments;
delete from public.members;

insert into auth.users (id, aud, role, email, email_confirmed_at, last_sign_in_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000aa01', 'authenticated', 'authenticated', 'leader3@example.test', now(), now(), '{"full_name":"Leader Three"}'),
  ('00000000-0000-0000-0000-00000000aa02', 'authenticated', 'authenticated', 'founder3@example.test', now(), now(), '{"full_name":"Founder Three"}'),
  ('00000000-0000-0000-0000-00000000aa03', 'authenticated', 'authenticated', 'head3@example.test', now(), now(), '{"full_name":"Head Three"}'),
  ('00000000-0000-0000-0000-00000000aa04', 'authenticated', 'authenticated', 'sara3@example.test', now(), now(), '{"full_name":"Sara Three"}'),
  ('00000000-0000-0000-0000-00000000aa05', 'authenticated', 'authenticated', 'khalid3@example.test', now(), null, '{"full_name":"Khalid Three"}'),
  ('00000000-0000-0000-0000-00000000aa06', 'authenticated', 'authenticated', 'maha3@example.test', now(), now(), '{"full_name":"Maha Three"}'),
  ('00000000-0000-0000-0000-00000000aa07', 'authenticated', 'authenticated', 'old3@example.test', now(), now(), '{"full_name":"Old Three"}'),
  ('00000000-0000-0000-0000-00000000aa08', 'authenticated', 'authenticated', 'plain3@example.test', now(), now(), '{"full_name":"Plain Three"}');

insert into public.members (id, user_id, status, joined_via, first_name_ar, middle_name_ar, last_name_ar, first_name_en, last_name_en, phone, is_directory_visible, track_id, headline_en, about_en, photo_path, github_url) values
  ('00000000-0000-0000-0000-00000000ab01', '00000000-0000-0000-0000-00000000aa04', 'active', 'manual', 'سارة', 'عبدالله', 'العتيبي', 'Sara', 'Alotaibi', '+966551234567', true, (select min(id) from public.tracks), 'Frontend developer', 'About Sara', '00000000-0000-0000-0000-00000000aa04/p.webp', 'https://github.com/sara'),
  ('00000000-0000-0000-0000-00000000ab02', '00000000-0000-0000-0000-00000000aa05', 'active', 'manual', 'خالد', null, 'الهاجري', 'Khalid', 'Alhajri', null, false, null, null, null, null, null),
  ('00000000-0000-0000-0000-00000000ab03', '00000000-0000-0000-0000-00000000aa06', 'active', 'manual', 'مها', null, 'العنزي', 'Maha', 'Alanazi', null, true, null, null, null, null, null),
  ('00000000-0000-0000-0000-00000000ab04', '00000000-0000-0000-0000-00000000aa07', 'active', 'manual', 'سابق', null, 'العضو', 'Former', 'Member', null, false, null, null, null, null, null),
  ('00000000-0000-0000-0000-00000000ab05', null, 'active', 'legacy', 'قديم', null, 'بلا حساب', 'Legacy', 'NoAccount', null, false, null, null, null, null, null);
update public.members set status = 'suspended', suspension_category = 'conduct' where id = '00000000-0000-0000-0000-00000000ab03';
update public.members set status = 'expired' where id = '00000000-0000-0000-0000-00000000ab04';
insert into public.member_skills (member_id, skill_id, position)
  select '00000000-0000-0000-0000-00000000ab01', id, (row_number() over (order by id) - 1)::smallint from public.skills order by id limit 3;

insert into public.role_assignments (user_id, role_key) values
  ('00000000-0000-0000-0000-00000000aa01', 'community_leader'),
  ('00000000-0000-0000-0000-00000000aa02', 'founder');
insert into public.role_assignments (user_id, role_key, committee_id)
  select '00000000-0000-0000-0000-00000000aa03'::uuid, 'committee_head', id from public.committees where slug = 'ai';
insert into public.role_assignments (user_id, role_key, committee_id)
  select '00000000-0000-0000-0000-00000000aa04'::uuid, 'committee_member', id from public.committees where slug = 'ai';

select is((select count(*)::int from public.role_permissions where permission_key = 'members.view_contact'), 2, 'only the administrator and the leader hold members.view_contact');

-- ------------------------------------------------------------------------------------------ the leader
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000aa01","role":"authenticated"}', true);

select is((public.admin_list_members())->>'total', '5', 'the list has every member');
select is((public.admin_list_members())->'counts'->>'all', '5', 'all');
select is((public.admin_list_members())->'counts'->>'active', '3', 'active members');
select is((public.admin_list_members())->'counts'->>'suspended', '1', 'suspended members');
select is((public.admin_list_members())->'counts'->>'not_activated', '1', 'a member whose account never signed in is "not activated"');
select is((public.admin_list_members())->'counts'->>'unclaimed', '1', 'a legacy member with no account is unclaimed');
select is((public.admin_list_members())->'kpis'->>'listed', '1', 'listed in the directory: only active and visible members');
select is((public.admin_list_members())->'kpis'->>'low_completeness', '2', 'two active members are under 40 percent');
select is((public.admin_list_members())->'kpis'->>'avg_completeness', '33', 'the average completeness of active members');
select is((public.admin_list_members())->>'can_contact', 'true', 'the leader may see contact details');
select is((public.admin_list_members('active', 'sara'))->'rows'->0->>'email', 'sara3@example.test', 'the leader sees the e-mail');
select is((public.admin_list_members(null, 'sara3@'))->>'total', '1', 'and can search by e-mail');
select is((public.admin_list_members(null, 'Alotaibi'))->>'total', '1', 'search by the English last name');
select is((public.admin_list_members(null, 'عبدالله'))->>'total', '1', 'search by the Arabic middle name');
select is((public.admin_list_members(null, '%%'))->>'total', '0', 'a wildcard is not a wildcard');
select is((public.admin_list_members('not_activated'))->'rows'->0->>'name_en', 'Khalid Alhajri', 'the tab for not activated accounts');
select is((public.admin_list_members('unclaimed'))->'rows'->0->>'linked', 'false', 'the unclaimed tab lists legacy members');
select is((public.admin_list_members('suspended'))->>'total', '1', 'the suspended tab');
select is((public.admin_list_members(null, null, 'ai'))->>'total', '1', 'filter by committee');
select is((public.admin_list_members(null, null, 'none'))->>'total', '4', 'filter by no committee');
select is((public.admin_list_members(null, null, null, (select min(id)::int from public.tracks)))->>'total', '1', 'filter by track');
select is((public.admin_list_members(null, null, null, null, 'low'))->>'total', '4', 'filter by low completeness (every status, unlike the KPI which counts active members)');
select is((public.admin_list_members(null, null, null, null, 'complete'))->>'total', '1', 'one member is complete');
select is(jsonb_array_length((public.admin_list_members(null, null, null, null, null, 0, 1))->'rows'), 2, 'paging returns the requested window');
select is((public.admin_list_members(null, null, null, null, null, 2, 3))->>'total', '5', 'the total ignores paging');
select is((public.admin_list_members(null, 'Sara'))->'rows'->0->>'completeness', '100', 'a photo, a headline, an about text, three skills and a link make a complete profile');
select is((public.admin_list_members(null, 'Sara'))->'rows'->0->>'committee_en', 'Artificial Intelligence', 'the committee of the member');

-- ------------------------------------------------------------------------------------------ the detail
select is((public.admin_member_detail('00000000-0000-0000-0000-00000000ab01'))->'account'->>'email', 'sara3@example.test', 'the leader sees the e-mail on the detail');
select is((public.admin_member_detail('00000000-0000-0000-0000-00000000ab01'))->'account'->>'phone', '+966551234567', 'and the phone');
select is((public.admin_member_detail('00000000-0000-0000-0000-00000000ab01'))->'account'->>'activated', 'true', 'the account is activated');
select is(jsonb_array_length((public.admin_member_detail('00000000-0000-0000-0000-00000000ab01'))->'positions'), 1, 'the position history');
select is(jsonb_array_length((public.admin_member_detail('00000000-0000-0000-0000-00000000ab01'))->'skills'), 3, 'the skills');
select is((public.admin_member_detail('00000000-0000-0000-0000-00000000ab01'))->'member'->>'headline_en', 'Frontend developer', 'the private data a visitor may not see is here for leadership');
select is((public.admin_member_detail('00000000-0000-0000-0000-00000000ab05'))->'account', 'null'::jsonb, 'a legacy member has no account');
select throws_ok($$select public.admin_member_detail(gen_random_uuid())$$, 'P0001', 'NOT_FOUND', 'an unknown member');

-- ------------------------------------------------------------------------------------------ the founder: sees members, not contact
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000aa02","role":"authenticated"}', true);
select is((public.admin_list_members())->>'can_contact', 'false', 'the founder has no contact permission');
select is((public.admin_list_members('active', 'sara'))->'rows'->0->'email', 'null'::jsonb, 'so the e-mail is absent');
select is((public.admin_list_members(null, 'sara3@'))->>'total', '0', 'and cannot be used to search');
select is((public.admin_member_detail('00000000-0000-0000-0000-00000000ab01'))->'account'->'email', 'null'::jsonb, 'nor on the detail');
select is((public.admin_member_detail('00000000-0000-0000-0000-00000000ab01'))->'account'->'phone', 'null'::jsonb, 'nor the phone');

-- ------------------------------------------------------------------------------------------ everybody else
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000aa03","role":"authenticated"}', true);
select throws_ok($$select public.admin_list_members()$$, 'P0001', 'FORBIDDEN', 'a committee head cannot list all members');
select throws_ok($$select public.admin_member_detail('00000000-0000-0000-0000-00000000ab01')$$, 'P0001', 'FORBIDDEN', 'nor open one');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000aa08","role":"authenticated"}', true);
select throws_ok($$select public.admin_list_members()$$, 'P0001', 'FORBIDDEN', 'a person with no role cannot');
reset role;
set local role anon;
select throws_ok($$select public.admin_list_members()$$, '42501', null, 'anon cannot call it');
reset role;

-- ------------------------------------------------------------------------------------------ leadership corrects data
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000aa01","role":"authenticated"}', true);
select lives_ok($$select public.admin_update_member('00000000-0000-0000-0000-00000000ab02', '{"middle_name_ar":"يوسف","last_name_en":"Alhajri-Fixed","phone":"+966559876543"}'::jsonb)$$, 'the leader corrects names and the phone');
select is((select middle_name_ar || '|' || last_name_en || '|' || phone from public.members where id = '00000000-0000-0000-0000-00000000ab02'), 'يوسف|Alhajri-Fixed|+966559876543', 'saved');
select is((select first_name_ar from public.members where id = '00000000-0000-0000-0000-00000000ab02'), 'خالد', 'a key that was not sent is left as it was');
select throws_ok($$select public.admin_update_member('00000000-0000-0000-0000-00000000ab02', '{"first_name_ar":""}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED', 'an empty Arabic first name is refused');
select throws_ok($$select public.admin_update_member('00000000-0000-0000-0000-00000000ab02', '{"phone":"0559876543"}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED', 'a phone must be international');
select throws_ok($$select public.admin_update_member(gen_random_uuid(), '{}'::jsonb)$$, 'P0001', 'NOT_FOUND', 'an unknown member');
select lives_ok($$select public.admin_update_member('00000000-0000-0000-0000-00000000ab01', '{"headline_en":"Staff headline","about_ar":"نبذة من القيادة","open_to":["mentoring","speaking"],"github_url":"https://github.com/staff-fixed","show_about":true}'::jsonb)$$, 'leadership edits the public text, open-to and links');
select is((select headline_en || '|' || about_ar || '|' || array_to_string(open_to, ',') || '|' || github_url from public.members where id = '00000000-0000-0000-0000-00000000ab01'), 'Staff headline|نبذة من القيادة|mentoring,speaking|https://github.com/staff-fixed', 'saved');
select is((select show_about from public.members where id = '00000000-0000-0000-0000-00000000ab01'), false, 'the visibility switches stay with the member (show_about ignored)');
select is((select show_links from public.members where id = '00000000-0000-0000-0000-00000000ab01'), true, 'a filled link turns the links block on');

-- skills
select lives_ok($$select public.admin_set_member_skills('00000000-0000-0000-0000-00000000ab01', array['react','typescript','figma'])$$, 'leadership sets the skills');
select is((select string_agg(s.slug, ',' order by ms.position) from public.member_skills ms join public.skills s on s.id = ms.skill_id where ms.member_id = '00000000-0000-0000-0000-00000000ab01'), 'react,typescript,figma', 'in the order given');
select throws_ok($$select public.admin_set_member_skills('00000000-0000-0000-0000-00000000ab01', array['react','react'])$$, 'P0001', 'VALIDATION_FAILED', 'duplicates are refused');
select throws_ok($$select public.admin_set_member_skills('00000000-0000-0000-0000-00000000ab01', array['no-such-skill'])$$, 'P0001', 'VALIDATION_FAILED', 'unknown skills are refused');
select throws_ok($$select public.admin_set_member_skills(gen_random_uuid(), array['react'])$$, 'P0001', 'NOT_FOUND', 'an unknown member');

-- projects
select lives_ok($$select public.admin_save_member_project('00000000-0000-0000-0000-00000000ab01', '{"title_ar":"مشروع","title_en":"Project","description_ar":"وصف","url":"https://example.test/p"}'::jsonb)$$, 'leadership adds a project');
select is((select count(*)::int from public.member_projects where member_id = '00000000-0000-0000-0000-00000000ab01'), 1, 'one project');
select is((select jsonb_array_length(public.admin_member_projects('00000000-0000-0000-0000-00000000ab01'))), 1, 'the editor can read it back with its descriptions');
select lives_ok($$select public.admin_save_member_project('00000000-0000-0000-0000-00000000ab01', jsonb_build_object('id', (select id from public.member_projects where member_id = '00000000-0000-0000-0000-00000000ab01'), 'title_ar', 'مشروع معدّل', 'url', 'https://example.test/q'))$$, 'and edits it');
select is((select title_ar from public.member_projects where member_id = '00000000-0000-0000-0000-00000000ab01'), 'مشروع معدّل', 'edited');
select throws_ok($$select public.admin_save_member_project('00000000-0000-0000-0000-00000000ab01', '{"title_ar":"x","url":""}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED', 'a project needs a title and a link');
select lives_ok($$select public.admin_delete_member_project('00000000-0000-0000-0000-00000000ab01', (select id from public.member_projects where member_id = '00000000-0000-0000-0000-00000000ab01'))$$, 'and deletes it');
select is((select count(*)::int from public.member_projects where member_id = '00000000-0000-0000-0000-00000000ab01'), 0, 'gone');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000aa02","role":"authenticated"}', true);
select throws_ok($$select public.admin_update_member('00000000-0000-0000-0000-00000000ab02', '{"middle_name_ar":"x"}'::jsonb)$$, 'P0001', 'FORBIDDEN', 'a founder can view but not edit members');
select throws_ok($$select public.admin_set_member_skills('00000000-0000-0000-0000-00000000ab01', array['react'])$$, 'P0001', 'FORBIDDEN', 'a founder cannot set skills');
select throws_ok($$select public.admin_save_member_project('00000000-0000-0000-0000-00000000ab01', '{"title_ar":"x","url":"https://e.test"}'::jsonb)$$, 'P0001', 'FORBIDDEN', 'a founder cannot add projects');
reset role;
select is((select count(*)::int from public.audit_logs where action = 'member.updated_by_staff'), 2, 'each correction is audited');

select * from finish();
rollback;
