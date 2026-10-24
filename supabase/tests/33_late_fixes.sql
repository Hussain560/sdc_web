-- Sprint 18 · late fixes: an edit request from the waiting list (migration 1200) and the finite auth ban (1300).
begin;
select no_plan();

delete from public.role_assignments;
delete from public.members;
delete from public.membership_applications;
delete from public.membership_cycles;

insert into auth.users (id, aud, role, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000f301', 'authenticated', 'authenticated', 'lf-leader@example.test', now(), '{"full_name":"Leader"}'),
  ('00000000-0000-0000-0000-00000000f302', 'authenticated', 'authenticated', 'lf-blocked@example.test', now(), '{"full_name":"Blocked"}'),
  ('00000000-0000-0000-0000-00000000f303', 'authenticated', 'authenticated', 'lf-plain@example.test', now(), '{"full_name":"Plain"}');
insert into public.role_assignments (user_id, role_key) values ('00000000-0000-0000-0000-00000000f301', 'community_leader');

insert into public.membership_cycles (id, name_ar, opens_at, closes_at, status, capacity, questions, rubric, term_ends_at) values
  ('00000000-0000-0000-0000-00000000f3c1', 'دورة التعديل', now() - interval '3 days', now() + interval '3 days', 'published', 5, '[]', '[]', '2027-06-30');

insert into public.membership_applications (id, cycle_id, email, first_name_ar, last_name_ar, first_name_en, last_name_en, full_name_ar, phone, academic_status, consent_version, wants_directory_listing, status) values
  ('00000000-0000-0000-0000-00000000f3a1', '00000000-0000-0000-0000-00000000f3c1', 'wait@example.test', 'منتظر', 'أول', 'Waiting', 'One', 'x x', '+966504100001', 'student', 'v1', false, 'waitlisted'),
  ('00000000-0000-0000-0000-00000000f3a2', '00000000-0000-0000-0000-00000000f3c1', 'acc@example.test', 'مقبول', 'ثان', 'Accepted', 'Two', 'x x', '+966504100002', 'student', 'v1', false, 'accepted'),
  ('00000000-0000-0000-0000-00000000f3a3', '00000000-0000-0000-0000-00000000f3c1', 'rej@example.test', 'مرفوض', 'ثالث', 'Rejected', 'Three', 'x x', '+966504100003', 'student', 'v1', false, 'rejected');

-- ------------------------------------------------------------------------------------------ edit request from the waiting list
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f303","role":"authenticated"}', true);
select throws_ok($$select public.request_application_info('00000000-0000-0000-0000-00000000f3a1', 'x', '{}')$$, 'P0001', 'FORBIDDEN', 'a plain user cannot ask for an edit');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f301","role":"authenticated"}', true);
select lives_ok($$select public.request_application_info('00000000-0000-0000-0000-00000000f3a1', 'أضف رابط عمل', array['x_url'])$$, 'a reviewer asks someone on the waiting list to improve the application');
select is((select status from public.membership_applications where id = '00000000-0000-0000-0000-00000000f3a1'), 'info_requested', 'it moves to "info requested"');
select ok(exists (select 1 from public.application_events where application_id = '00000000-0000-0000-0000-00000000f3a1' and kind = 'info_requested'), 'and the history records it');
select throws_ok($$select public.request_application_info('00000000-0000-0000-0000-00000000f3a2', 'x', '{}')$$, 'P0001', 'INVALID_TRANSITION', 'an accepted application cannot be asked for an edit');
select throws_ok($$select public.request_application_info('00000000-0000-0000-0000-00000000f3a3', 'x', '{}')$$, 'P0001', 'INVALID_TRANSITION', 'nor a rejected one');

-- ------------------------------------------------------------------------------------------ the ban is finite
select is((public.block_accounts(array['00000000-0000-0000-0000-00000000f302']::uuid[], 'سبب'))->0->>'ok', 'true', 'leadership blocks an account');
reset role;
select ok((select banned_until from auth.users where id = '00000000-0000-0000-0000-00000000f302') < 'infinity'::timestamptz, 'the ban is not infinite (the auth service cannot read an infinite ban)');
select ok((select banned_until from auth.users where id = '00000000-0000-0000-0000-00000000f302') > now() + interval '99 years', 'but it lasts a very long time');

select * from finish();
rollback;
