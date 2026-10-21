-- Sprint 17 follow-up 2: who may edit their own name, and which intake cycles block each other.
begin;
select no_plan();

delete from public.role_assignments;
delete from public.members;
delete from public.membership_cycles;

insert into auth.users (id, aud, role, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000a201', 'authenticated', 'authenticated', 'founder.name@example.test', now(), '{"full_name":"Founder Name"}'),
  ('00000000-0000-0000-0000-00000000a202', 'authenticated', 'authenticated', 'plain.name@example.test', now(), '{"full_name":"Plain Name"}');
insert into public.members (id, user_id, status, joined_via, first_name_ar, last_name_ar, first_name_en, last_name_en, is_directory_visible) values
  ('00000000-0000-0000-0000-00000000b201', '00000000-0000-0000-0000-00000000a201', 'active', 'manual', 'مؤسس', 'الاسم', 'Founder', 'Name', true),
  ('00000000-0000-0000-0000-00000000b202', '00000000-0000-0000-0000-00000000a202', 'active', 'manual', 'عضو', 'عادي', 'Plain', 'Member', true);
insert into public.role_assignments (user_id, role_key) values ('00000000-0000-0000-0000-00000000a201', 'founder');

select ok(exists (select 1 from public.permissions where key = 'members.edit_own_name'), 'the permission exists');
select is((select array_agg(role_key order by role_key) from public.role_permissions where permission_key = 'members.edit_own_name'),
          array['community_leader', 'founder', 'system_admin'], 'the system administrator, the community leader and founders hold it');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a201","role":"authenticated"}', true);
select lives_ok($$select public.update_my_member_profile('{"first_name_ar":"مؤسسة","last_name_en":"Founder-Updated"}'::jsonb)$$, 'a founder corrects their own name');
select is((select first_name_ar from public.members where id = '00000000-0000-0000-0000-00000000b201'), 'مؤسسة', 'the Arabic first name changed');
select is((select last_name_en from public.members where id = '00000000-0000-0000-0000-00000000b201'), 'Founder-Updated', 'the English last name changed');
select throws_ok($$select public.update_my_member_profile('{"first_name_ar":""}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED', 'the Arabic first name cannot be emptied');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a202","role":"authenticated"}', true);
select throws_ok($$select public.update_my_member_profile('{"first_name_ar":"اسم جديد"}'::jsonb)$$, 'P0001', 'NAME_LOCKED', 'a plain member still cannot change their name');
select lives_ok($$select public.update_my_member_profile('{"headline_ar":"مطوّر"}'::jsonb)$$, 'a plain member still saves the rest of the profile');
reset role;

-- ------------------------------------------------------------------------------------------ cycles
insert into public.membership_cycles (name_ar, opens_at, closes_at, status, questions)
  values ('دورة أ تجريبية', '2026-10-04', '2026-10-12', 'published', '[]');
select throws_ok($$insert into public.membership_cycles (name_ar, opens_at, closes_at, status, questions) values ('دورة ب متداخلة', '2026-10-10', '2026-10-28', 'published', '[]')$$,
                 '23P01', null, 'a published cycle that overlaps another published window is refused');
select lives_ok($$insert into public.membership_cycles (name_ar, opens_at, closes_at, status, questions) values ('دورة مسودة', '2026-10-10', '2026-10-28', 'draft', '[]')$$, 'a draft never blocks');
select lives_ok($$insert into public.membership_cycles (name_ar, opens_at, closes_at, status, questions) values ('دورة مكتملة', '2026-10-05', '2026-10-09', 'completed', '[]')$$, 'a completed cycle never blocks');
update public.membership_cycles set closed_early_at = '2026-10-08' where name_ar = 'دورة أ تجريبية';
select lives_ok($$insert into public.membership_cycles (name_ar, opens_at, closes_at, status, questions) values ('دورة ب بعد الإغلاق', '2026-10-10', '2026-10-28', 'published', '[]')$$, 'closing a cycle early frees the rest of its dates');

-- ------------------------------------------------------------------------------------------ a running cycle
delete from public.membership_cycles;
insert into auth.users (id, aud, role, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000a203', 'authenticated', 'authenticated', 'admin.cycle@example.test', now(), '{"full_name":"Admin Cycle"}');
insert into public.role_assignments (user_id, role_key) values ('00000000-0000-0000-0000-00000000a203', 'system_admin');
-- Opened a day ago and closed early an hour ago, with nobody applying yet.
insert into public.membership_cycles (id, name_ar, opens_at, closes_at, closed_early_at, status, questions)
  values ('00000000-0000-0000-0000-00000000c201', 'دورة جارية تجريبية', now() - interval '1 day', now() + interval '5 days', now() - interval '1 hour', 'published', '[]');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a203","role":"authenticated"}', true);
-- No application yet: dates entered by mistake can be fixed, and the early close is cleared.
select lives_ok(format($f$select public.save_membership_cycle('00000000-0000-0000-0000-00000000c201', %L::jsonb)$f$,
  jsonb_build_object('name_ar', 'دورة جارية تجريبية', 'opens_at', now() - interval '3 days', 'closes_at', now() + interval '4 days', 'questions', '[]'::jsonb)::text),
  'with no applications the opening and closing times of a running or closed cycle can be corrected');
select is((select closed_early_at from public.membership_cycles where id = '00000000-0000-0000-0000-00000000c201'), null, 'the early close is cleared by the new dates');
select is((select private.cycle_phase(status, opens_at, closes_at, closed_early_at) from public.membership_cycles where id = '00000000-0000-0000-0000-00000000c201'), 'open', 'the cycle follows its new dates');
reset role;

-- With an application the opening time is history; only the closing time moves.
insert into public.membership_applications (cycle_id, user_id, status, full_name_ar, phone, academic_status, answers, wants_directory_listing, consent_version)
  values ('00000000-0000-0000-0000-00000000c201', '00000000-0000-0000-0000-00000000a201', 'submitted', 'اسم المتقدم', '+966555000333', 'student', '{}'::jsonb, true, 'v1');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a203","role":"authenticated"}', true);
select lives_ok(format($f$select public.save_membership_cycle('00000000-0000-0000-0000-00000000c201', %L::jsonb)$f$,
  jsonb_build_object('name_ar', 'دورة جارية تجريبية', 'opens_at', (select opens_at from public.membership_cycles where id = '00000000-0000-0000-0000-00000000c201'), 'closes_at', now() + interval '2 days', 'questions', '[]'::jsonb)::text),
  'with applications a running cycle can close earlier than planned');
select lives_ok(format($f$select public.save_membership_cycle('00000000-0000-0000-0000-00000000c201', %L::jsonb)$f$,
  jsonb_build_object('name_ar', 'دورة جارية تجريبية', 'opens_at', (select opens_at from public.membership_cycles where id = '00000000-0000-0000-0000-00000000c201'), 'closes_at', now() + interval '9 days', 'questions', '[]'::jsonb)::text),
  'with applications a running cycle can close later than planned');
select throws_ok(format($f$select public.save_membership_cycle('00000000-0000-0000-0000-00000000c201', %L::jsonb)$f$,
  jsonb_build_object('name_ar', 'دورة جارية تجريبية', 'opens_at', now() - interval '9 days', 'closes_at', now() + interval '9 days', 'questions', '[]'::jsonb)::text),
  'P0001', 'NOT_EDITABLE', 'with applications the opening time cannot move');
select throws_ok(format($f$select public.save_membership_cycle('00000000-0000-0000-0000-00000000c201', %L::jsonb)$f$,
  jsonb_build_object('name_ar', 'دورة جارية تجريبية', 'opens_at', (select opens_at from public.membership_cycles where id = '00000000-0000-0000-0000-00000000c201'), 'closes_at', now() - interval '1 hour', 'questions', '[]'::jsonb)::text),
  'P0001', 'NOT_EDITABLE', 'with applications the closing time cannot be moved into the past');
reset role;

select * from finish();
rollback;
