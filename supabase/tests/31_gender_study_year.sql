-- Sprint 18 · gender and study year: collected on the application, copied to the member on acceptance, never public,
-- shown to the member and to leadership with view_contact, editable by leadership only (the member edits the year).
begin;
select no_plan();

delete from public.role_assignments;
delete from public.members;
delete from public.membership_applications;
delete from public.membership_cycles;

insert into auth.users (id, aud, role, email, email_confirmed_at, last_sign_in_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000f101', 'authenticated', 'authenticated', 'leader-g@example.test', now(), now(), '{"full_name":"Leader G"}'),
  ('00000000-0000-0000-0000-00000000f102', 'authenticated', 'authenticated', 'head-g@example.test', now(), now(), '{"full_name":"Head G"}'),
  ('00000000-0000-0000-0000-00000000f103', 'authenticated', 'authenticated', 'member-g@example.test', now(), now(), '{"full_name":"Member G"}'),
  ('00000000-0000-0000-0000-00000000f104', 'authenticated', 'authenticated', 'applicant-g@example.test', now(), now(), '{"full_name":"Applicant G"}');

insert into public.role_assignments (user_id, role_key) values ('00000000-0000-0000-0000-00000000f101', 'community_leader');
insert into public.role_assignments (user_id, role_key) values ('00000000-0000-0000-0000-00000000f102', 'founder');

insert into public.members (id, user_id, status, joined_via, first_name_ar, last_name_ar, gender, study_year, academic_status) values
  ('00000000-0000-0000-0000-00000000f201', '00000000-0000-0000-0000-00000000f103', 'active', 'manual', 'عضو', 'تجريبي', 'female', 2, 'student');

insert into public.membership_cycles (id, name_ar, opens_at, closes_at, status, capacity, questions, rubric, term_ends_at) values
  ('00000000-0000-0000-0000-00000000f301', 'دورة الجنس', now() - interval '1 day', now() + interval '5 days', 'published', 5, '[]', '[]', '2027-12-31');

-- ------------------------------------------------------------------------------------------ the application (anonymous)
set local role anon;
create temp table _r (k text primary key, v jsonb);
grant all on _r to anon, authenticated;

insert into _r select 'student', public.apply_for_membership('00000000-0000-0000-0000-00000000f301',
  '{"email":"student-g@example.test","first_name_ar":"طالب","last_name_ar":"اختبار","first_name_en":"Student","last_name_en":"Test","phone":"+966501110001","academic_status":"student","gender":"female","study_year":"3","consent":true,"consent_version":"v1","answers":{}}'::jsonb);
select is((select v->>'ok' from _r where k = 'student'), 'true', 'a student applies with a gender and a study year');

select is((public.apply_for_membership('00000000-0000-0000-0000-00000000f301',
  '{"email":"bad-gender@example.test","first_name_ar":"أ","last_name_ar":"ب","first_name_en":"A","last_name_en":"B","phone":"+966501110002","academic_status":"student","gender":"other","study_year":"1","consent":true,"consent_version":"v1","answers":{}}'::jsonb))->>'code',
  'VALIDATION_FAILED', 'only male or female is accepted as a gender');
select is((public.apply_for_membership('00000000-0000-0000-0000-00000000f301',
  '{"email":"grad-year@example.test","first_name_ar":"أ","last_name_ar":"ب","first_name_en":"A","last_name_en":"B","phone":"+966501110003","academic_status":"graduate","gender":"male","study_year":"3","consent":true,"consent_version":"v1","answers":{}}'::jsonb))->>'code',
  'VALIDATION_FAILED', 'a study year belongs to students only');
select is((public.apply_for_membership('00000000-0000-0000-0000-00000000f301',
  '{"email":"year8@example.test","first_name_ar":"أ","last_name_ar":"ب","first_name_en":"A","last_name_en":"B","phone":"+966501110004","academic_status":"student","gender":"male","study_year":"8","consent":true,"consent_version":"v1","answers":{}}'::jsonb))->>'code',
  'VALIDATION_FAILED', 'the study year is 1 to 7');
reset role;

select is((select gender || '|' || study_year from public.membership_applications where lower(email) = 'student-g@example.test'), 'female|3', 'saved on the application');

-- ------------------------------------------------------------------------------------------ never public
set local role anon;
select throws_ok($$select gender from public.members limit 1$$, '42501', null, 'the public cannot read the members table at all');
reset role;

-- ------------------------------------------------------------------------------------------ acceptance copies both to the member
insert into public.membership_applications (id, cycle_id, user_id, email, first_name_ar, last_name_ar, first_name_en, last_name_en, full_name_ar,
  phone, academic_status, gender, study_year, consent_version, wants_directory_listing, status)
values ('00000000-0000-0000-0000-00000000f401', '00000000-0000-0000-0000-00000000f301', '00000000-0000-0000-0000-00000000f104', 'applicant-g@example.test',
  'مقدّم', 'اختبار', 'Applicant', 'Test', 'x x', '+966501110005', 'student', 'male', 4, 'v1', false, 'submitted');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f101","role":"authenticated"}', true);
select is((public.decide_membership_applications(array['00000000-0000-0000-0000-00000000f401']::uuid[], 'accept'))->0->>'ok', 'true', 'the leader accepts the application');
reset role;
select is((select gender || '|' || study_year from public.members where user_id = '00000000-0000-0000-0000-00000000f104'), 'male|4', 'the member keeps the gender and the year of the application');

-- ------------------------------------------------------------------------------------------ leadership edits both
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f101","role":"authenticated"}', true);
select lives_ok($$select public.admin_update_member('00000000-0000-0000-0000-00000000f201', '{"gender":"male","study_year":"5"}'::jsonb)$$, 'the leader edits the gender and the year');
select is((select gender || '|' || study_year from public.members where id = '00000000-0000-0000-0000-00000000f201'), 'male|5', 'saved');
select throws_ok($$select public.admin_update_member('00000000-0000-0000-0000-00000000f201', '{"gender":"x"}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED', 'an invalid gender is refused');
select is((public.admin_member_detail('00000000-0000-0000-0000-00000000f201'))->'member'->>'gender', 'male', 'the leader sees the gender on the member page');
select is((public.admin_member_detail('00000000-0000-0000-0000-00000000f201'))->'member'->>'study_year', '5', 'and the study year');

-- a founder can view members but holds neither view_contact nor manage: no gender, no edit
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f102","role":"authenticated"}', true);
select is((public.admin_member_detail('00000000-0000-0000-0000-00000000f201'))->'member'->'gender', 'null'::jsonb, 'a founder does not see the gender');
select throws_ok($$select public.admin_update_member('00000000-0000-0000-0000-00000000f201', '{"gender":"female"}'::jsonb)$$, 'P0001', 'FORBIDDEN', 'and cannot change it');

-- ------------------------------------------------------------------------------------------ the member
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f103","role":"authenticated"}', true);
select throws_ok($$select public.update_my_member_profile('{"gender":"female"}'::jsonb)$$, 'P0001', 'FORBIDDEN', 'a member cannot change their own gender');
select lives_ok($$select public.update_my_member_profile('{"study_year":"6"}'::jsonb)$$, 'a member can update their year of study');
select is((select study_year::text from public.members where id = '00000000-0000-0000-0000-00000000f201'), '6', 'saved');
select is((select gender from public.members where user_id = '00000000-0000-0000-0000-00000000f103'), 'male', 'the member reads their own gender (RLS: own row)');
reset role;

select * from finish();
rollback;
