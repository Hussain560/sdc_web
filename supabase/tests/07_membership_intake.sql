-- Sprint 07 · MEM-001, MBR-001…005, TEST — reference data, cycles (phase, overlap, transitions), applications (MB-1…MB-5, MB-9, MB-10).
begin;
select no_plan();

delete from public.role_assignments; -- isolate from dev personas / E2E leftovers (rolled back)
delete from public.membership_applications;
delete from public.membership_cycles;

create temp table _k (k text primary key, id uuid);
grant select, insert, update on _k to authenticated, anon;

insert into auth.users (id, aud, role, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000e001', 'authenticated', 'authenticated', 'leader@example.test', now(), '{"full_name":"Leader Person One"}'),
  ('00000000-0000-0000-0000-00000000e002', 'authenticated', 'authenticated', 'admin@example.test',  now(), '{"full_name":"Admin Person Two"}'),
  ('00000000-0000-0000-0000-00000000e003', 'authenticated', 'authenticated', 'app1@example.test',   now(), '{"full_name":"Applicant One"}'),
  ('00000000-0000-0000-0000-00000000e004', 'authenticated', 'authenticated', 'app2@example.test',   now(), '{"full_name":"Applicant Two"}'),
  ('00000000-0000-0000-0000-00000000e005', 'authenticated', 'authenticated', 'head@example.test',   now(), '{"full_name":"Head Person Five"}'),
  ('00000000-0000-0000-0000-00000000e006', 'authenticated', 'authenticated', 'nomail@example.test', null,  '{"full_name":"Unconfirmed Six"}');
insert into public.role_assignments (user_id, role_key) values
  ('00000000-0000-0000-0000-00000000e001', 'community_leader'),
  ('00000000-0000-0000-0000-00000000e002', 'system_admin');
insert into public.role_assignments (user_id, role_key, committee_id)
select '00000000-0000-0000-0000-00000000e005'::uuid, 'committee_head', id from public.committees where slug = 'ai';

-- =============================================================================== reference data
select cmp_ok((select count(*)::int from public.universities), '>=', 10, 'universities are seeded');
select cmp_ok((select count(*)::int from public.tracks), '>=', 8, 'tracks are seeded');
select cmp_ok((select count(*)::int from public.majors where parent_id is null), '>=', 8, 'majors are seeded');

set local role anon;
select cmp_ok((select count(*)::int from public.tracks), '>', 0, 'anon reads reference data');
select throws_ok($$insert into public.tracks (name_ar) values ('مسار جديد')$$, '42501', null, 'anon cannot write reference data');
select throws_ok($$select count(*) from public.membership_applications$$, '42501', null, 'anon has no access to applications');
select throws_ok($$select count(*) from public.membership_cycles$$, '42501', null, 'anon cannot read the cycles table directly');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000e005","role":"authenticated"}', true);
select throws_ok($$insert into public.tracks (name_ar) values ('مسار رئيس')$$, '42501', null, 'a committee head cannot edit reference data');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000e002","role":"authenticated"}', true);
select lives_ok($$insert into public.tracks (name_ar, name_en) values ('مسار اختبار', 'Test track')$$, 'an admin edits reference data');
select lives_ok($$update public.tracks set is_active = false where name_ar = 'مسار اختبار'$$, 'an admin deactivates a value');
reset role;

-- =============================================================================== phase function at boundary instants
select is(private.cycle_phase('draft', '2027-02-01 00:00+00', '2027-02-10 00:00+00', null, '2027-02-05 00:00+00'), 'draft', 'phase: draft stays draft');
select is(private.cycle_phase('published', '2027-02-01 00:00+00', '2027-02-10 00:00+00', null, '2027-01-31 23:59:59+00'), 'scheduled', 'phase: scheduled before opens_at');
select is(private.cycle_phase('published', '2027-02-01 00:00+00', '2027-02-10 00:00+00', null, '2027-02-01 00:00+00'), 'open', 'phase: open at opens_at');
select is(private.cycle_phase('published', '2027-02-01 00:00+00', '2027-02-10 00:00+00', null, '2027-02-09 23:59:59+00'), 'open', 'phase: open just before closes_at');
select is(private.cycle_phase('published', '2027-02-01 00:00+00', '2027-02-10 00:00+00', null, '2027-02-10 00:00+00'), 'closed', 'phase: closed at closes_at');
select is(private.cycle_phase('published', '2027-02-01 00:00+00', '2027-02-10 00:00+00', '2027-02-05 00:00+00', '2027-02-06 00:00+00'), 'closed', 'phase: closed early');
select is(private.cycle_phase('completed', '2027-02-01 00:00+00', '2027-02-10 00:00+00', null, '2027-02-06 00:00+00'), 'completed', 'phase: completed');

-- =============================================================================== cycles: permissions, validation, lifecycle
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000e005","role":"authenticated"}', true);
select throws_ok($$select public.save_membership_cycle(null, '{"name_ar":"دورة","opens_at":"2027-02-01T00:00:00Z","closes_at":"2027-02-10T00:00:00Z"}')$$, 'P0001', 'FORBIDDEN', 'a committee head cannot create a cycle');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000e001","role":"authenticated"}', true);
select throws_ok($$select public.save_membership_cycle(null, '{"name_ar":"دورة معكوسة","opens_at":"2027-02-10T00:00:00Z","closes_at":"2027-02-01T00:00:00Z"}')$$, 'P0001', 'INVALID_DATES', 'closing before opening is refused');
select throws_ok($$select public.save_membership_cycle(null, '{"name_ar":"دورة أسئلة","opens_at":"2027-02-01T00:00:00Z","closes_at":"2027-02-10T00:00:00Z","questions":[{"key":"Bad Key","type":"text","label_ar":"سؤال"}]}')$$, 'P0001', 'VALIDATION_FAILED', 'a malformed question is refused');
insert into _k select 'a', (public.save_membership_cycle(null, jsonb_build_object(
  'name_ar', 'استقبال تجريبي أ', 'name_en', 'Trial A', 'opens_at', now() - interval '1 day', 'closes_at', now() + interval '10 days',
  'questions', jsonb_build_array(
    jsonb_build_object('key', 'why', 'type', 'long_text', 'required', true, 'label_ar', 'لماذا تريد الانضمام؟', 'label_en', 'Why join?'),
    jsonb_build_object('key', 'lang', 'type', 'single_choice', 'required', false, 'label_ar', 'اللغة', 'options', jsonb_build_array('ar', 'en'))
  ))) ->> 'id')::uuid;
select is((select status from public.membership_cycles where id = (select id from _k where k = 'a')), 'draft', 'a new cycle is a draft');
select is((select count(*)::int from public.membership_cycle_phase), 0, 'drafts are not public');
select is(public.transition_membership_cycle((select id from _k where k = 'a'), 'publish'), 'open', 'publishing a window that already started is open');

-- overlap with a second published cycle is refused
insert into _k select 'b', (public.save_membership_cycle(null, jsonb_build_object(
  'name_ar', 'استقبال تجريبي ب', 'opens_at', now() + interval '5 days', 'closes_at', now() + interval '20 days')) ->> 'id')::uuid;
select throws_ok($$select public.transition_membership_cycle((select id from _k where k = 'b'), 'publish')$$, 'P0001', 'CYCLE_OVERLAP', 'overlapping published cycles are refused (MB-2)');

-- =============================================================================== public view
reset role;
set local role anon;
select is((select count(*)::int from public.membership_cycle_phase), 1, 'anon sees the published cycle through the view');
select is((select phase from public.membership_cycle_phase), 'open', 'the view derives the phase');
reset role;

-- =============================================================================== applications
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000e006","role":"authenticated"}', true);
select throws_ok($$select public.submit_membership_application((select id from _k where k = 'a'), '{}')$$, 'P0001', 'EMAIL_NOT_CONFIRMED', 'unconfirmed e-mail cannot apply');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000e003","role":"authenticated"}', true);
select throws_ok($$select public.submit_membership_application((select id from _k where k = 'a'), '{"full_name_ar":"متقدم اختبار","academic_status":"student","consent":true,"consent_version":"v1","answers":{}}')$$, 'P0001', 'VALIDATION_FAILED', 'a missing required answer is refused (MB-9)');
select throws_ok($$select public.submit_membership_application((select id from _k where k = 'a'), '{"full_name_ar":"متقدم اختبار","academic_status":"student","consent_version":"v1","answers":{"why":"x"}}')$$, 'P0001', 'CONSENT_REQUIRED', 'consent is required (MB-10)');
select throws_ok($$select public.submit_membership_application((select id from _k where k = 'a'), '{"full_name_ar":"متقدم اختبار","academic_status":"student","consent":true,"consent_version":"v1","github_url":"http://insecure.test","answers":{"why":"x"}}')$$, 'P0001', 'VALIDATION_FAILED', 'links must be https');
insert into _k select 'app', (public.submit_membership_application((select id from _k where k = 'a'), jsonb_build_object(
  'full_name_ar', 'متقدم اختبار', 'academic_status', 'student', 'consent', true, 'consent_version', 'v1',
  'university_id', (select id from public.universities order by id limit 1), 'track_id', (select id from public.tracks order by id limit 1),
  'answers', jsonb_build_object('why', 'أحب المجتمع'))) ->> 'id')::uuid;
select is((select status from public.my_membership_application where id = (select id from _k where k = 'app')), 'submitted', 'the application is submitted');
select throws_ok($$select public.submit_membership_application((select id from _k where k = 'a'), '{"full_name_ar":"متقدم اختبار","academic_status":"student","consent":true,"consent_version":"v1","answers":{"why":"x"}}')$$, 'P0001', 'ALREADY_APPLIED', 'one application per cycle (MB-3)');
select throws_ok($$insert into public.membership_applications (cycle_id, user_id, full_name_ar, academic_status, consent_version) values ((select id from _k where k = 'a'), '00000000-0000-0000-0000-00000000e003', 'مباشر', 'student', 'v1')$$, '42501', null, 'no direct inserts');
select throws_ok($$update public.membership_applications set status = 'accepted'$$, '42501', null, 'no direct updates');
select lives_ok($$select public.update_membership_application((select id from _k where k = 'app'), '{"full_name_ar":"متقدم معدّل","academic_status":"graduate","answers":{"why":"سبب جديد"}}')$$, 'the applicant edits while submitted and open');
select is((select academic_status from public.my_membership_application where id = (select id from _k where k = 'app')), 'graduate', 'the edit is stored');

-- another applicant cannot read or touch it
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000e004","role":"authenticated"}', true);
select is((select count(*)::int from public.my_membership_application), 0, 'applicants see only their own application');
select is((select count(*)::int from public.membership_applications), 0, 'RLS hides other applications');
select throws_ok($$select public.withdraw_membership_application((select id from _k where k = 'app'))$$, 'P0001', 'NOT_FOUND', 'cannot withdraw someone else''s application');

-- reviewers (leader) read all; heads do not
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000e001","role":"authenticated"}', true);
select is((select count(*)::int from public.membership_applications), 1, 'the leader reviews all applications');
select is((select count(*)::int from public.membership_cycle_counts where status = 'submitted'), 1, 'counts are visible to reviewers');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000e005","role":"authenticated"}', true);
select is((select count(*)::int from public.membership_applications), 0, 'a committee head cannot read applications');

-- withdraw and re-apply in the same cycle reuses the row
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000e003","role":"authenticated"}', true);
select lives_ok($$select public.withdraw_membership_application((select id from _k where k = 'app'))$$, 'the applicant withdraws');
select is((select status from public.my_membership_application where id = (select id from _k where k = 'app')), 'withdrawn', 'status is withdrawn');
select throws_ok($$select public.update_membership_application((select id from _k where k = 'app'), '{"full_name_ar":"متقدم معدّل","academic_status":"graduate","answers":{"why":"x"}}')$$, 'P0001', 'NOT_EDITABLE', 'a withdrawn application cannot be edited');
select lives_ok($$select public.submit_membership_application((select id from _k where k = 'a'), '{"full_name_ar":"متقدم اختبار","academic_status":"student","consent":true,"consent_version":"v1","answers":{"why":"مرة أخرى"}}')$$, 're-applying after withdrawal reuses the row');
select is((select count(*)::int from public.my_membership_application), 1, 'still one application');

-- =============================================================================== lifecycle after applications
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000e001","role":"authenticated"}', true);
select throws_ok($$select public.save_membership_cycle((select id from _k where k = 'a'), jsonb_build_object('name_ar', 'استقبال تجريبي أ', 'opens_at', now() - interval '1 day', 'closes_at', now() + interval '10 days', 'questions', '[]'::jsonb))$$, 'P0001', 'QUESTIONS_LOCKED', 'questions lock once an application exists');
select throws_ok($$select public.transition_membership_cycle((select id from _k where k = 'a'), 'complete')$$, 'P0001', 'INVALID_TRANSITION', 'an open cycle cannot be completed');
select is(public.transition_membership_cycle((select id from _k where k = 'a'), 'close_early'), 'closed', 'close early closes the window');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000e004","role":"authenticated"}', true);
select throws_ok($$select public.submit_membership_application((select id from _k where k = 'a'), '{"full_name_ar":"متقدم متأخر","academic_status":"student","consent":true,"consent_version":"v1","answers":{"why":"x"}}')$$, 'P0001', 'CYCLE_CLOSED', 'applying outside the window is rejected by the database (MB-1)');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000e003","role":"authenticated"}', true);
select throws_ok($$select public.withdraw_membership_application((select id from _k where k = 'app'))$$, 'P0001', 'NOT_EDITABLE', 'withdrawing after the window closes is refused (MB-5)');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000e001","role":"authenticated"}', true);
select throws_ok($$select public.transition_membership_cycle((select id from _k where k = 'a'), 'complete')$$, 'P0001', 'PENDING_APPLICATIONS', 'completing with undecided applications is refused');
select is(public.transition_membership_cycle((select id from _k where k = 'a'), 'extend', now() + interval '12 days'), 'open', 'extending a closed window reopens it');
select throws_ok($$select public.transition_membership_cycle((select id from _k where k = 'a'), 'extend', now() + interval '1 day')$$, 'P0001', 'INVALID_DATES', 'extending to an earlier date is refused');
select is(public.transition_membership_cycle((select id from _k where k = 'b'), 'delete'), 'deleted', 'a draft cycle without applications is deleted');

reset role;
select cmp_ok((select count(*)::int from public.audit_logs where action like 'membership_%'), '>=', 6, 'cycle and application actions are audited');

select * from finish();
rollback;
