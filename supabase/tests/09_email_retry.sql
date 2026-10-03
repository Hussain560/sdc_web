-- Sprint 09 · NOT-003 — e-mail retry rules (backoff, attempt limit, non-retryable codes, delivered keys) and the
-- admin e-mail log read model (derived state, access by permission).
begin;
select no_plan();

delete from public.role_assignments;
delete from public.email_logs;

insert into auth.users (id, aud, role, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000e001', 'authenticated', 'authenticated', 'admin9e@example.test', '{"full_name":"Admin Person Mail"}'),
  ('00000000-0000-0000-0000-00000000e002', 'authenticated', 'authenticated', 'plain9e@example.test', '{"full_name":"Plain Person Mail"}');
insert into public.role_assignments (user_id, role_key) values ('00000000-0000-0000-0000-00000000e001', 'system_admin');

-- k: key · attempt · age · status · error
insert into public.email_logs (template_key, locale, recipient_email, entity_type, entity_id, idempotency_key, attempt, status, error_code, created_at) values
  ('registration.confirmed', 'ar', 'due1@example.test',   'registration', md5('r1')::uuid::text, 'k-due-1',   1, 'failed', 'PROVIDER_ERROR',   now() - interval '10 minutes'),
  ('registration.confirmed', 'ar', 'young@example.test',  'registration', md5('r2')::uuid::text, 'k-young',   1, 'failed', 'PROVIDER_ERROR',   now() - interval '1 minute'),
  ('registration.confirmed', 'ar', 'a2young@example.test','registration', md5('r3')::uuid::text, 'k-a2young', 2, 'failed', 'PROVIDER_ERROR',   now() - interval '20 minutes'),
  ('registration.confirmed', 'ar', 'a2due@example.test',  'registration', md5('r4')::uuid::text, 'k-a2due',   2, 'failed', 'PROVIDER_ERROR',   now() - interval '40 minutes'),
  ('registration.confirmed', 'ar', 'a3due@example.test',  'registration', md5('r5')::uuid::text, 'k-a3due',   3, 'failed', 'PROVIDER_ERROR',   now() - interval '3 hours'),
  ('registration.confirmed', 'ar', 'spent@example.test',  'registration', md5('r6')::uuid::text, 'k-spent',   4, 'failed', 'PROVIDER_ERROR',   now() - interval '5 hours'),
  ('registration.confirmed', 'ar', 'norcpt@example.test', 'registration', md5('r7')::uuid::text, 'k-norcpt',  1, 'failed', 'NO_RECIPIENT',     now() - interval '1 hour'),
  ('registration.confirmed', 'ar', 'bad@example.test',    'registration', md5('r8')::uuid::text, 'k-bad',     1, 'failed', 'INVALID_RECIPIENT', now() - interval '1 hour'),
  ('registration.confirmed', 'ar', 'fixed@example.test',  'registration', md5('r9')::uuid::text, 'k-fixed',   1, 'failed', 'PROVIDER_ERROR',   now() - interval '1 hour'),
  ('registration.confirmed', 'ar', 'fixed@example.test',  'registration', md5('r9')::uuid::text, 'k-fixed',   2, 'sent',   null,               now() - interval '30 minutes'),
  ('registration.confirmed', 'ar', 'later@example.test',  'registration', md5('r10')::uuid::text,'k-later',   1, 'failed', 'PROVIDER_ERROR',   now() - interval '1 hour'),
  ('registration.confirmed', 'ar', 'later@example.test',  'registration', md5('r10')::uuid::text,'k-later',   2, 'failed', 'PROVIDER_ERROR',   now() - interval '50 minutes'),
  ('registration.confirmed', 'ar', 'ok@example.test',     'registration', md5('r11')::uuid::text,'k-ok',      1, 'sent',   null,               now() - interval '1 hour'),
  ('registration.confirmed', 'ar', 'busy@example.test',   'registration', md5('r12')::uuid::text,'k-busy',    1, 'sending', null,              now() - interval '1 hour');

-- =============================================================================== which rows are due
select is(
  (select array_agg(l.recipient_email order by l.recipient_email)
     from public.due_email_retries(100) d join public.email_logs l on l.id = d.id),
  array['a2due@example.test', 'a3due@example.test', 'due1@example.test', 'later@example.test'],
  'due: attempt 1 after 5 min, attempt 2 after 30 min, attempt 3 after 2 h; attempt 2 of a key with a later attempt is superseded');

-- "later" has a failed attempt 2 (50 min old): attempt 1 is superseded, attempt 2 is due.
select is(
  (select d.attempt::int from public.due_email_retries(100) d join public.email_logs l on l.id = d.id where l.recipient_email = 'later@example.test'),
  2, 'only the newest failed attempt of a key is retried');
select is((select count(*)::int from public.due_email_retries(100) d join public.email_logs l on l.id = d.id where l.recipient_email = 'young@example.test'), 0, 'attempt 1 waits 5 minutes');
select is((select count(*)::int from public.due_email_retries(100) d join public.email_logs l on l.id = d.id where l.recipient_email = 'a2young@example.test'), 0, 'attempt 2 waits 30 minutes');
select is((select count(*)::int from public.due_email_retries(100) d join public.email_logs l on l.id = d.id where l.recipient_email = 'spent@example.test'), 0, 'at most 4 attempts');
select is((select count(*)::int from public.due_email_retries(100) d join public.email_logs l on l.id = d.id where l.recipient_email in ('norcpt@example.test', 'bad@example.test')), 0, 'non-retryable codes are never retried');
select is((select count(*)::int from public.due_email_retries(100) d join public.email_logs l on l.id = d.id where l.recipient_email in ('fixed@example.test', 'ok@example.test', 'busy@example.test')), 0, 'delivered or in-flight keys are left alone');
select is((select count(*)::int from public.due_email_retries(2)), 2, 'the limit caps one run');

-- =============================================================================== derived state (as a viewer)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000e001","role":"authenticated"}', true);
select is((select state from public.admin_email_logs where recipient_email = 'due1@example.test'), 'retrying', 'a failed mail with attempts left will retry');
select is((select state from public.admin_email_logs where recipient_email = 'spent@example.test'), 'abandoned', 'attempts exhausted → abandoned');
select is((select state from public.admin_email_logs where recipient_email = 'norcpt@example.test'), 'abandoned', 'a non-retryable error → abandoned');
select is((select state from public.admin_email_logs where recipient_email = 'fixed@example.test' and attempt = 1), 'recovered', 'a failed attempt followed by a sent one → recovered');
select is((select state from public.admin_email_logs where recipient_email = 'later@example.test' and attempt = 1), 'superseded', 'an older failed attempt is superseded by a later one');
select is((select state from public.admin_email_logs where recipient_email = 'ok@example.test'), 'sent', 'sent stays sent');
select is((select count(*)::int from public.admin_email_logs), 14, 'a viewer with email_logs.view reads every attempt');

-- =============================================================================== access
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000e002","role":"authenticated"}', true);
select is((select count(*)::int from public.admin_email_logs), 0, 'a user without email_logs.view sees no row');
select throws_ok($$select * from public.due_email_retries(10)$$, '42501', null, 'the retry job query is not callable by signed-in users');
set local role anon;
select throws_ok($$select * from public.admin_email_logs$$, '42501', null, 'anon has no access to the log view');

select * from finish();
rollback;
