-- Sprint 18 · MBR-007, MBR-009, MBR-011 — applications v2: name parts, reference, tracking token, info requested.
begin;
select no_plan();

delete from public.role_assignments;
delete from public.members;
delete from public.membership_applications;
delete from public.membership_cycles;

insert into auth.users (id, aud, role, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000a271', 'authenticated', 'authenticated', 'leader.v2@example.test', now(), '{"full_name":"Leader V2"}'),
  ('00000000-0000-0000-0000-00000000a272', 'authenticated', 'authenticated', 'plain.v2@example.test', now(), '{"full_name":"Plain V2"}');
insert into public.role_assignments (user_id, role_key) values ('00000000-0000-0000-0000-00000000a271', 'community_leader');
insert into public.membership_cycles (id, name_ar, name_en, opens_at, closes_at, status, capacity, questions, rubric, term_ends_at) values
  ('00000000-0000-0000-0000-00000000c271', 'دورة اختبار 2', 'Test cycle 2', now() - interval '1 day', now() + interval '10 days', 'published', 2,
   '[{"key":"why","type":"long_text","required":true,"label_ar":"لماذا","label_en":"Why"}]'::jsonb,
   '[{"key":"motivation","label_ar":"الدافع","label_en":"Motivation","weight":2},{"key":"links","label_ar":"الأعمال","label_en":"Work","weight":1}]'::jsonb,
   (current_date + interval '1 year')::date);

create temp table _r (k text primary key, v jsonb);
grant select, insert, update on _r to anon, authenticated, service_role;

-- ------------------------------------------------------------------------------------------ apply
set local role anon;
insert into _r select 'a1', public.apply_for_membership('00000000-0000-0000-0000-00000000c271',
  '{"email":"noura@example.test","first_name_ar":"نورة","middle_name_ar":"عبدالرحمن بن سعيد","last_name_ar":"القحطاني","first_name_en":"Noura","last_name_en":"Alqahtani","phone":"+966504127788","academic_status":"student","github_url":"https://github.com/noura","answers":{"why":"أريد أن أتعلم"},"consent":true,"consent_version":"v1","lang":"ar"}'::jsonb);
select is((select v ->> 'ok' from _r where k = 'a1'), 'true', 'an applicant applies with split names and no account');
select ok((select v ->> 'reference' from _r where k = 'a1') ~ '^SDC-[0-9]{2}-[0-9]{4}$', 'the reference looks like SDC-YY-NNNN');
select isnt((select v ->> 'token' from _r where k = 'a1'), null, 'the raw token is returned once');
select is((public.apply_for_membership('00000000-0000-0000-0000-00000000c271',
  '{"email":"noura@example.test","first_name_ar":"نورة","last_name_ar":"القحطاني","first_name_en":"Noura","last_name_en":"Alqahtani","phone":"+966504127788","academic_status":"student","answers":{"why":"x"},"consent":true,"consent_version":"v1"}'::jsonb)) ->> 'code',
  'ALREADY_APPLIED', 'one application per e-mail and cycle');
select is((public.apply_for_membership('00000000-0000-0000-0000-00000000c271',
  '{"email":"x1@example.test","first_name_ar":"أحمد","last_name_ar":"","first_name_en":"Ahmed","last_name_en":"Ali","phone":"+966504127711","academic_status":"student","answers":{"why":"x"},"consent":true,"consent_version":"v1"}'::jsonb)) ->> 'code',
  'VALIDATION_FAILED', 'the last name in Arabic is required');
select is((public.apply_for_membership('00000000-0000-0000-0000-00000000c271',
  '{"email":"x2@example.test","first_name_ar":"أحمد","last_name_ar":"العلي","first_name_en":"Ahmed","phone":"+966504127711","academic_status":"student","answers":{"why":"x"},"consent":true,"consent_version":"v1"}'::jsonb)) ->> 'code',
  'VALIDATION_FAILED', 'the English names are required too');
select is((public.apply_for_membership('00000000-0000-0000-0000-00000000c271',
  '{"email":"x3@example.test","first_name_ar":"أحمد","last_name_ar":"العلي","first_name_en":"Ahmed","last_name_en":"Ali","academic_status":"student","answers":{"why":"x"},"consent":true,"consent_version":"v1"}'::jsonb)) ->> 'code',
  'VALIDATION_FAILED', 'the phone is required');
select is((public.apply_for_membership('00000000-0000-0000-0000-00000000c271',
  '{"email":"x4@example.test","first_name_ar":"أحمد","last_name_ar":"العلي","first_name_en":"Ahmed","last_name_en":"Ali","phone":"+966504127711","academic_status":"student","answers":{},"consent":true,"consent_version":"v1"}'::jsonb)) ->> 'code',
  'VALIDATION_FAILED', 'a required cycle question must be answered');
insert into _r select 'a2', public.apply_for_membership('00000000-0000-0000-0000-00000000c271',
  '{"email":"khalid@example.test","first_name_ar":"خالد","last_name_ar":"الهاجري","first_name_en":"Khalid","last_name_en":"Alhajri","phone":"+966504127722","academic_status":"graduate","answers":{"why":"y"},"consent":true,"consent_version":"v1","lang":"en"}'::jsonb);
reset role;

select is((select full_name_ar from public.membership_applications where email = 'noura@example.test'), 'نورة عبدالرحمن بن سعيد القحطاني', 'the full Arabic name is built from the parts');
select is((select full_name_en from public.membership_applications where email = 'noura@example.test'), 'Noura Alqahtani', 'and the English one, skipping a missing middle name');
select is((select count(distinct reference)::int from public.membership_applications), 2, 'references are unique');
select is((select tracking_token_hash from public.membership_applications where email = 'noura@example.test'),
  encode(sha256(convert_to((select v ->> 'token' from _r where k = 'a1'), 'UTF8')), 'hex'), 'only the hash of the token is stored');
select is((select locale from public.membership_applications where email = 'khalid@example.test'), 'en', 'the language of the form is kept');
select is((select count(*)::int from public.application_events where kind = 'submitted'), 2, 'the history starts with the submission');

-- ------------------------------------------------------------------------------------------ tracking
set local role anon;
select is((public.track_application((select v ->> 'token' from _r where k = 'a1')) ->> 'status'), 'submitted', 'the applicant follows the status with the token only');
select is((public.track_application('nonsense') ->> 'code'), 'TOKEN_INVALID', 'a wrong token is a neutral failure');
select ok(not (public.track_application((select v ->> 'token' from _r where k = 'a1')) ?| array['decision_note', 'reviewer_id', 'email', 'phone', 'score_average', 'position']),
  'the tracking payload never carries notes, reviewer, e-mail, phone, scores or a queue position');
select is((public.track_application((select v ->> 'token' from _r where k = 'a1')) ->> 'email_masked'), 'nou…@example.test', 'the e-mail is masked');
reset role;

-- ------------------------------------------------------------------------------------------ info requested
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a272","role":"authenticated"}', true);
select throws_ok(format($f$select public.request_application_info(%L, 'x', '{}')$f$, (select id from public.membership_applications where email = 'noura@example.test')),
  'P0001', 'FORBIDDEN', 'only reviewers can ask for a correction');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a271","role":"authenticated"}', true);
select throws_ok(format($f$select public.request_application_info(%L, '', '{}')$f$, (select id from public.membership_applications where email = 'noura@example.test')),
  'P0001', 'VALIDATION_FAILED', 'the message is required');
select throws_ok(format($f$select public.request_application_info(%L, 'x', array['full_name_ar'])$f$, (select id from public.membership_applications where email = 'noura@example.test')),
  'P0001', 'VALIDATION_FAILED', 'only link, bio and question fields can be requested');
select lives_ok(format($f$select public.request_application_info(%L, 'أضف رابط عمل', array['x_url', 'q:why'])$f$, (select id from public.membership_applications where email = 'noura@example.test')),
  'a reviewer asks for a correction');
reset role;
select is((select status from public.membership_applications where email = 'noura@example.test'), 'info_requested', 'the application waits for the applicant');

set local role anon;
select is((public.track_application((select v ->> 'token' from _r where k = 'a1')) ->> 'info_request'), 'أضف رابط عمل', 'the applicant reads the request');
select ok((public.track_application((select v ->> 'token' from _r where k = 'a1')) -> 'edit_values') ?& array['x_url', 'q:why'], 'and gets only the requested fields to edit');
select is((public.resubmit_application_by_token((select v ->> 'token' from _r where k = 'a1'), '{"github_url":"https://github.com/other"}'::jsonb) ->> 'code'), 'NOT_EDITABLE', 'a field that was not requested cannot change');
select is((public.resubmit_application_by_token((select v ->> 'token' from _r where k = 'a1'), '{"x_url":"http://insecure.test"}'::jsonb) ->> 'code'), 'VALIDATION_FAILED', 'links must be https');
select is((public.resubmit_application_by_token((select v ->> 'token' from _r where k = 'a1'), '{"x_url":"https://x.com/noura","q:why":"سبب أوضح"}'::jsonb) ->> 'ok'), 'true', 'the applicant fixes what was asked and resubmits');
reset role;
select is((select status from public.membership_applications where email = 'noura@example.test'), 'submitted', 'it is back to the reviewers');
select is((select x_url from public.membership_applications where email = 'noura@example.test'), 'https://x.com/noura', 'the link changed');
select is((select answers ->> 'why' from public.membership_applications where email = 'noura@example.test'), 'سبب أوضح', 'and the answer');
select is((select github_url from public.membership_applications where email = 'noura@example.test'), 'https://github.com/noura', 'while the rest is untouched');
select ok(exists (select 1 from public.application_events where kind = 'resubmitted'), 'the history shows the resubmission');

-- ------------------------------------------------------------------------------------------ privacy of the internal tables
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a272","role":"authenticated"}', true);
select is((select count(*)::int from public.application_events), 0, 'a person without review rights reads no history');
select is((select count(*)::int from public.application_scores), 0, 'and no scores');
select is((select count(*)::int from public.membership_applications), 0, 'and no applications');
reset role;
set local role anon;
select throws_ok($$select count(*) from public.application_events$$, '42501', null, 'anonymous visitors cannot read the history');
select throws_ok($$select count(*) from public.membership_applications$$, '42501', null, 'or the applications');
reset role;

-- ------------------------------------------------------------------------------------------ withdraw and rotate
set local role anon;
select is((public.withdraw_application_by_token((select v ->> 'token' from _r where k = 'a2')) ->> 'ok'), 'true', 'an applicant withdraws before a decision');
select is((public.withdraw_application_by_token((select v ->> 'token' from _r where k = 'a2')) ->> 'code'), 'NOT_EDITABLE', 'twice is refused');
reset role;
set local role service_role;
insert into _r select 'rot', public.rotate_tracking_token((select id from public.membership_applications where email = 'noura@example.test'));
reset role;
set local role anon;
select is((public.track_application((select v ->> 'token' from _r where k = 'a1')) ->> 'code'), 'TOKEN_INVALID', 'the old link stops working after a new one is issued');
select is((public.track_application((select v ->> 'token' from _r where k = 'rot')) ->> 'status'), 'submitted', 'and the new one works');
select throws_ok($$select public.rotate_tracking_token(null, 'noura@example.test')$$, '42501', null, 'visitors cannot mint tokens');
reset role;

select * from finish();
rollback;
