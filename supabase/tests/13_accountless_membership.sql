-- Membership without an account: apply_for_membership (cycle window, validation, duplicates, anti-spam) and the
-- reviewer's view of an application that has no user yet.
begin;
select no_plan();

delete from public.role_assignments;
delete from public.membership_applications;
delete from public.membership_cycles;

insert into auth.users (id, aud, role, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000f101', 'authenticated', 'authenticated', 'rev@example.test', now(), '{"full_name":"Reviewer Person"}'),
  ('00000000-0000-0000-0000-00000000f102', 'authenticated', 'authenticated', 'oldmember@example.test', now(), '{"full_name":"Old Member Person"}'),
  ('00000000-0000-0000-0000-00000000f103', 'authenticated', 'authenticated', 'plain@example.test', now(), '{"full_name":"Plain Person"}');
insert into public.role_assignments (user_id, role_key) values ('00000000-0000-0000-0000-00000000f101', 'community_leader');
insert into public.members (user_id, joined_via, first_name_ar, status) values ('00000000-0000-0000-0000-00000000f102', 'manual', 'عضو', 'active');

create temp table _cy (k text primary key, id uuid);
grant select on _cy to anon, authenticated;
with a as (
  insert into public.membership_cycles (name_ar, opens_at, closes_at, status, questions)
  values ('دورة مفتوحة', now() - interval '1 day', now() + interval '10 days', 'published',
          '[{"key":"why","label_ar":"لماذا؟","type":"text","required":true}]'::jsonb)
  returning id),
b as (
  insert into public.membership_cycles (name_ar, opens_at, closes_at, status)
  values ('دورة قادمة', now() + interval '20 days', now() + interval '30 days', 'published')
  returning id)
insert into _cy select 'open', id from a union all select 'later', id from b;

set local role anon;

-- a valid application
select is((public.apply_for_membership((select id from _cy where k = 'open'),
  '{"email":"New.Applicant@Example.test","full_name_ar":"متقدم جديد","academic_status":"student","consent":true,"consent_version":"v1","answers":{"why":"to grow"},"lang":"en"}'::jsonb,
  'ip-1', null, 8000) ->> 'ok'), 'true', 'an applicant without an account applies');
reset role;
select is((select user_id from public.membership_applications where email = 'new.applicant@example.test'), null, 'the application has no account');
select is((select locale from public.membership_applications where email = 'new.applicant@example.test'), 'en', 'it remembers the language');
select is((select summary ->> 'guest' from public.audit_logs where action = 'membership_application.submitted' order by id desc limit 1), 'true', 'it is audited as a public application');

set local role anon;
-- rules
select is((public.apply_for_membership((select id from _cy where k = 'open'),
  '{"email":"new.applicant@example.test","full_name_ar":"متقدم جديد","academic_status":"student","consent":true,"consent_version":"v1","answers":{"why":"x"}}'::jsonb, 'ip-2', null, 8000) ->> 'code'),
  'ALREADY_APPLIED', 'one application per e-mail and cycle (case-insensitive)');
select is((public.apply_for_membership((select id from _cy where k = 'later'),
  '{"email":"later@example.test","full_name_ar":"متقدم لاحق","academic_status":"student","consent":true,"consent_version":"v1"}'::jsonb, 'ip-3', null, 8000) ->> 'code'),
  'CYCLE_CLOSED', 'a scheduled cycle is not open yet');
select is((public.apply_for_membership(gen_random_uuid(), '{}'::jsonb, 'ip-4', null, 8000) ->> 'code'), 'NOT_FOUND', 'an unknown cycle is refused');
select is((public.apply_for_membership((select id from _cy where k = 'open'),
  '{"email":"old@example.test","full_name_ar":"متقدم","academic_status":"student","consent":false,"consent_version":"v1","answers":{"why":"x"}}'::jsonb, 'ip-5', null, 8000) ->> 'code'),
  'CONSENT_REQUIRED', 'consent is required');
select is((public.apply_for_membership((select id from _cy where k = 'open'),
  '{"email":"bad-email","full_name_ar":"متقدم","academic_status":"student","consent":true,"consent_version":"v1","answers":{"why":"x"}}'::jsonb, 'ip-6', null, 8000) ->> 'field'),
  'email', 'a malformed e-mail is refused');
select is((public.apply_for_membership((select id from _cy where k = 'open'),
  '{"email":"noanswer@example.test","full_name_ar":"متقدم","academic_status":"student","consent":true,"consent_version":"v1","answers":{}}'::jsonb, 'ip-7', null, 8000) ->> 'code'),
  'VALIDATION_FAILED', 'a required question must be answered');
select is((public.apply_for_membership((select id from _cy where k = 'open'),
  '{"email":"oldmember@example.test","full_name_ar":"عضو قديم","academic_status":"student","consent":true,"consent_version":"v1","answers":{"why":"x"}}'::jsonb, 'ip-8', null, 8000) ->> 'code'),
  'ALREADY_MEMBER', 'an e-mail that belongs to an active member is told to sign in');

-- anti-spam
select is((public.apply_for_membership((select id from _cy where k = 'open'),
  '{"email":"bot@example.test","full_name_ar":"روبوت","academic_status":"student","consent":true,"consent_version":"v1","answers":{"why":"x"}}'::jsonb, 'ip-9', 'http://spam.test', 8000) ->> 'ok'),
  'true', 'a filled honeypot looks like success');
select is((public.apply_for_membership((select id from _cy where k = 'open'),
  '{"email":"fast@example.test","full_name_ar":"سريع","academic_status":"student","consent":true,"consent_version":"v1","answers":{"why":"x"}}'::jsonb, 'ip-10', null, 1200) ->> 'code'),
  'TOO_FAST', 'a form sent in under five seconds is refused');
reset role;
select is((select count(*)::int from public.membership_applications where email in ('bot@example.test', 'fast@example.test')), 0, 'neither stored an application');

set local role anon;
select public.apply_for_membership((select id from _cy where k = 'open'), '{"email":"spam@example.test"}'::jsonb, 'ip-11', null, 8000);
select public.apply_for_membership((select id from _cy where k = 'open'), '{"email":"spam@example.test"}'::jsonb, 'ip-12', null, 8000);
select public.apply_for_membership((select id from _cy where k = 'open'), '{"email":"spam@example.test"}'::jsonb, 'ip-13', null, 8000);
select is((public.apply_for_membership((select id from _cy where k = 'open'), '{"email":"spam@example.test"}'::jsonb, 'ip-14', null, 8000) ->> 'code'),
  'RATE_LIMITED', 'the fourth attempt for one e-mail in three minutes is throttled');
select is((select count(*)::int from (select public.apply_for_membership((select id from _cy where k = 'open'), jsonb_build_object('email', 'many' || g || '@example.test'), 'same-ip', null, 8000) from generate_series(1, 6) g) x), 6, 'six attempts from one address are answered');
select is((public.apply_for_membership((select id from _cy where k = 'open'), '{"email":"many7@example.test"}'::jsonb, 'same-ip', null, 8000) ->> 'code'), 'RATE_LIMITED', 'the seventh from the same address is throttled');
select throws_ok($$select * from public.application_attempts$$, '42501', null, 'the attempt log is not readable by visitors');
select throws_ok($$select * from public.membership_applications$$, '42501', null, 'applications are not readable by visitors');
reset role;

-- the reviewer sees the e-mail of an application without an account
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f101","role":"authenticated"}', true);
select is((select email from public.membership_review_queue where full_name_ar = 'متقدم جديد'), 'new.applicant@example.test', 'reviewers read the e-mail from the application');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f103","role":"authenticated"}', true);
select is((select count(*)::int from public.membership_review_queue), 0, 'other signed-in people see no applications');

select * from finish();
rollback;
