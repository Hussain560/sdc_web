-- Leadership adds a member directly: who may, what is refused, and the audit row.
begin;
select no_plan();

delete from public.role_assignments;
delete from public.members;

insert into auth.users (id, aud, role, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000f201', 'authenticated', 'authenticated', 'lead@example.test', now(), '{"full_name":"Leader Person"}'),
  ('00000000-0000-0000-0000-00000000f202', 'authenticated', 'authenticated', 'found@example.test', now(), '{"full_name":"Founder Person"}'),
  ('00000000-0000-0000-0000-00000000f203', 'authenticated', 'authenticated', 'headx@example.test', now(), '{"full_name":"Head Person"}'),
  ('00000000-0000-0000-0000-00000000f204', 'authenticated', 'authenticated', 'new1@example.test', now(), '{"full_name":"New One"}'),
  ('00000000-0000-0000-0000-00000000f205', 'authenticated', 'authenticated', 'new2@example.test', now(), '{"full_name":"New Two"}');
insert into public.role_assignments (user_id, role_key) values
  ('00000000-0000-0000-0000-00000000f201', 'community_leader'),
  ('00000000-0000-0000-0000-00000000f202', 'founder');
insert into public.role_assignments (user_id, role_key, committee_id)
select '00000000-0000-0000-0000-00000000f203'::uuid, 'committee_head', id from public.committees where slug = 'ai';

select is((select count(*)::int from public.role_permissions where permission_key = 'members.create'), 3, 'administrator, leader and founder hold members.create');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f203","role":"authenticated"}', true);
select throws_ok($$select public.create_member('00000000-0000-0000-0000-00000000f204', '{"full_name_ar":"عضو جديد","academic_status":"student"}'::jsonb)$$, 'P0001', 'FORBIDDEN', 'a committee head cannot add members');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f201","role":"authenticated"}', true);
select lives_ok($$select public.create_member('00000000-0000-0000-0000-00000000f204', '{"full_name_ar":"عضو جديد كامل","full_name_en":"New Member","academic_status":"student"}'::jsonb)$$, 'the leader adds a member');
select is((select joined_via from public.members where user_id = '00000000-0000-0000-0000-00000000f204'), 'manual', 'recorded as a manual member');
select is((select status from public.members where user_id = '00000000-0000-0000-0000-00000000f204'), 'active', 'active at once');
select is((select first_name_ar || '|' || last_name_ar from public.members where user_id = '00000000-0000-0000-0000-00000000f204'), 'عضو|جديد كامل', 'the name is split into first and last');
select throws_ok($$select public.create_member('00000000-0000-0000-0000-00000000f204', '{"full_name_ar":"عضو جديد كامل","academic_status":"student"}'::jsonb)$$, 'P0001', 'ALREADY_MEMBER', 'a second member row for the same account is refused');
select throws_ok($$select public.create_member('00000000-0000-0000-0000-00000000f205', '{"full_name_ar":"ab","academic_status":"student"}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED', 'a short name is refused');
select throws_ok($$select public.create_member('00000000-0000-0000-0000-00000000f205', '{"full_name_ar":"عضو ثان","academic_status":"alien"}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED', 'an unknown status is refused');
select throws_ok($$select public.create_member(gen_random_uuid(), '{"full_name_ar":"عضو ثالث","academic_status":"student"}'::jsonb)$$, 'P0001', 'NOT_FOUND', 'an unknown account is refused');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f202","role":"authenticated"}', true);
select lives_ok($$select public.create_member('00000000-0000-0000-0000-00000000f205', '{"full_name_ar":"عضو ثان بالتأسيس","academic_status":"employee"}'::jsonb)$$, 'a founder adds a member too');
reset role;
select is((select count(*)::int from public.audit_logs where action = 'member.created'), 2, 'each addition is audited');

select * from finish();
rollback;
