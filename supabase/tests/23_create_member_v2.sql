-- Sprint 17 (MEM-014): add a member with name parts, phone and a committee position, all or nothing.
begin;
select no_plan();

delete from public.role_assignments;
delete from public.members;

insert into auth.users (id, aud, role, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000002a01', 'authenticated', 'authenticated', 'lead2@example.test', now(), '{"full_name":"Leader Person"}'),
  ('00000000-0000-0000-0000-000000002a02', 'authenticated', 'authenticated', 'oldh@example.test', now(), '{"full_name":"Old Head"}'),
  ('00000000-0000-0000-0000-000000002a03', 'authenticated', 'authenticated', 'n1@example.test', now(), '{"full_name":"New One"}'),
  ('00000000-0000-0000-0000-000000002a04', 'authenticated', 'authenticated', 'n2@example.test', now(), '{"full_name":"New Two"}'),
  ('00000000-0000-0000-0000-000000002a05', 'authenticated', 'authenticated', 'n3@example.test', now(), '{"full_name":"New Three"}'),
  ('00000000-0000-0000-0000-000000002a06', 'authenticated', 'authenticated', 'n4@example.test', now(), '{"full_name":"New Four"}'),
  ('00000000-0000-0000-0000-000000002a07', 'authenticated', 'authenticated', 'headx2@example.test', now(), '{"full_name":"Head Other"}'),
  ('00000000-0000-0000-0000-000000002a08', 'authenticated', 'authenticated', 'n5@example.test', now(), '{"full_name":"New Five"}'),
  ('00000000-0000-0000-0000-000000002a09', 'authenticated', 'authenticated', 'acct@example.test', now(), '{"full_name":"Account Only"}');
insert into public.members (user_id, status, joined_via, first_name_ar, last_name_ar) values
  ('00000000-0000-0000-0000-000000002a02', 'active', 'manual', 'قائد', 'قديم');
insert into public.role_assignments (user_id, role_key) values ('00000000-0000-0000-0000-000000002a01', 'community_leader');
insert into public.role_assignments (user_id, role_key, committee_id)
  select '00000000-0000-0000-0000-000000002a02'::uuid, 'committee_head', id from public.committees where slug = 'ai';
insert into public.role_assignments (user_id, role_key, committee_id)
  select '00000000-0000-0000-0000-000000002a07'::uuid, 'committee_head', id from public.committees where slug = 'cybersecurity';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000002a01","role":"authenticated"}', true);

-- ------------------------------------------------------------------------------------------ name parts and phone
select lives_ok($$select public.create_member('00000000-0000-0000-0000-000000002a03', '{"first_name_ar":"خالد","middle_name_ar":"يوسف","last_name_ar":"الهاجري","first_name_en":"Khalid","middle_name_en":"Yousef","last_name_en":"Alhajri","phone":"+966559876543","academic_status":"student"}'::jsonb)$$, 'a member is added with name parts and a phone');
select is((select middle_name_ar || '|' || last_name_en || '|' || phone from public.members where user_id = '00000000-0000-0000-0000-000000002a03'), 'يوسف|Alhajri|+966559876543', 'the parts and the phone are saved');
select is((select full_name_ar from public.profiles where id = '00000000-0000-0000-0000-000000002a03'), 'خالد يوسف الهاجري', 'the account name follows the parts');
select is((select full_name_en from public.profiles where id = '00000000-0000-0000-0000-000000002a03'), 'Khalid Yousef Alhajri', 'in English too');
select is((select count(*)::int from public.role_assignments where user_id = '00000000-0000-0000-0000-000000002a03'), 0, 'no position when none was asked for');
select throws_ok($$select public.create_member('00000000-0000-0000-0000-000000002a04', '{"first_name_ar":"أول","last_name_ar":"","academic_status":"student"}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED', 'a last name is required');
select throws_ok($$select public.create_member('00000000-0000-0000-0000-000000002a04', '{"first_name_ar":"","last_name_ar":"آخر","academic_status":"student"}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED', 'so is a first name');
select throws_ok($$select public.create_member('00000000-0000-0000-0000-000000002a04', '{"first_name_ar":"أول","last_name_ar":"آخر","phone":"0559876543","academic_status":"student"}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED', 'a phone must be international');
select is((select count(*)::int from public.members where user_id = '00000000-0000-0000-0000-000000002a04'), 0, 'a refused member leaves nothing behind');
select lives_ok($$select public.create_member('00000000-0000-0000-0000-000000002a04', '{"full_name_ar":"عضو بالاسم الكامل","full_name_en":"Full Name","academic_status":"employee"}'::jsonb)$$, 'the old one-name payload still works');
select is((select first_name_ar || '|' || last_name_ar from public.members where user_id = '00000000-0000-0000-0000-000000002a04'), 'عضو|بالاسم الكامل', 'and splits the name as before');

-- ------------------------------------------------------------------------------------------ position, same transaction
select lives_ok($$select public.create_member('00000000-0000-0000-0000-000000002a05', jsonb_build_object('first_name_ar','هند','last_name_ar','العلي','academic_status','student','role_key','committee_member','committee_id',(select id from public.committees where slug = 'ai'),'starts_at','2026-10-17T00:00:00+03:00'))$$, 'a member is added with a committee position');
select is((select count(*)::int from public.role_assignments where user_id = '00000000-0000-0000-0000-000000002a05' and role_key = 'committee_member'), 1, 'the position exists');

-- A head conflict refuses everything: no member, no position.
select throws_ok($$select public.create_member('00000000-0000-0000-0000-000000002a06', jsonb_build_object('first_name_ar','نورة','last_name_ar','الدوسري','academic_status','student','role_key','committee_head','committee_id',(select id from public.committees where slug = 'ai')))$$, 'P0001', 'HEAD_ALREADY_ACTIVE', 'a second head is refused');
select is((select count(*)::int from public.members where user_id = '00000000-0000-0000-0000-000000002a06'), 0, 'and the member was not created either');

-- The same with a handover, keeping the old head as deputy.
select lives_ok($$select public.create_member('00000000-0000-0000-0000-000000002a06', jsonb_build_object('first_name_ar','نورة','last_name_ar','الدوسري','academic_status','student','role_key','committee_head','committee_id',(select id from public.committees where slug = 'ai'),'handover',true,'keep_as_deputy',true))$$, 'with a handover the new head takes over');
select is((select count(*)::int from public.role_assignments where user_id = '00000000-0000-0000-0000-000000002a06' and role_key = 'committee_head' and (ends_at is null or ends_at > now())), 1, 'the new member is head');
select is((select count(*)::int from public.role_assignments where user_id = '00000000-0000-0000-0000-000000002a02' and role_key = 'committee_deputy' and (ends_at is null or ends_at > now())), 1, 'and the old head is deputy');

-- Anti-escalation still applies: a leader cannot create a system administrator.
select throws_ok($$select public.create_member('00000000-0000-0000-0000-000000002a08', '{"first_name_ar":"مدير","last_name_ar":"جديد","academic_status":"student","role_key":"system_admin"}'::jsonb)$$, 'P0001', null, 'a leader cannot grant system_admin through the wizard');
select is((select count(*)::int from public.members where user_id = '00000000-0000-0000-0000-000000002a08'), 0, 'and nothing is created');

-- ------------------------------------------------------------------------------------------ who may
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000002a07","role":"authenticated"}', true);
select throws_ok($$select public.create_member('00000000-0000-0000-0000-000000002a08', '{"first_name_ar":"أول","last_name_ar":"آخر","academic_status":"student"}'::jsonb)$$, 'P0001', 'FORBIDDEN', 'a committee head cannot add members');
select throws_ok($$select public.find_member_by_email('n1@example.test')$$, 'P0001', 'FORBIDDEN', 'nor look up an e-mail');

-- ------------------------------------------------------------------------------------------ duplicate e-mail
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000002a01","role":"authenticated"}', true);
select is((public.find_member_by_email('N1@Example.Test'))->'member'->>'name_ar', 'خالد يوسف الهاجري', 'an e-mail that belongs to a member names the member, ignoring case');
select is((public.find_member_by_email('acct@example.test'))->>'account', 'true', 'an account with no member is reported as an account');
select is((public.find_member_by_email('acct@example.test'))->'member', 'null'::jsonb, 'with no member');
select is((public.find_member_by_email('nobody@example.test'))->>'account', 'false', 'an unknown e-mail is free');
select is((public.find_member_by_email('not an email'))->>'account', 'false', 'and so is nonsense');
reset role;
set local role anon;
select throws_ok($$select public.find_member_by_email('n1@example.test')$$, '42501', null, 'anon cannot look up e-mails');
reset role;

select is((select count(*)::int from public.audit_logs where action = 'role.assigned' and (summary ->> 'user_id') is not distinct from '00000000-0000-0000-0000-000000002a05'), 1, 'the position was audited by the normal path (read as the owner: leaders cannot read the audit log)');
select * from finish();
rollback;
