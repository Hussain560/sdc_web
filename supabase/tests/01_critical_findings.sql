-- Regression tests for the critical findings (docs/01-project/current-system-audit.md §3).
-- Sprint 01 documented them as `todo`; Sprint 04 (SEC-001) closed them locally, so they are hard assertions now.
begin;
select plan(9);

insert into auth.users (id, aud, role, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000d1', 'authenticated', 'authenticated', 'owner@example.test', '{"full_name":"Owner Of Registration"}'),
  ('00000000-0000-0000-0000-0000000000d2', 'authenticated', 'authenticated', 'other@example.test', '{"full_name":"Some Other Person"}');
insert into public.event_registrations (user_id, event_id, full_name, email)
values ('00000000-0000-0000-0000-0000000000d1', 1, 'Owner Of Registration', 'owner@example.test');

-- anonymous visitor
set local role anon;
select throws_ok($$insert into public.members (first_name) values ('probe')$$, '42501', null,
  'F-01: anon cannot insert into members');
select throws_ok($$update public.members set first_name = 'probe'$$, '42501', null,
  'F-01: anon cannot update members');
select throws_ok($$delete from public.members$$, '42501', null,
  'F-01: anon cannot delete members');
select throws_ok($$select count(*) from public.event_registrations$$, '42501', null,
  'F-02: anon cannot read registrations');
select throws_ok(
  $$insert into public.event_registrations (user_id, event_id, full_name, email) values (null, 1, 'x', 'x@example.test')$$,
  '42501', null, 'F-02: anon cannot create registrations');
select lives_ok($$select count(*) from public.members$$, 'the public directory stays readable');
reset role;

-- a signed-in user who is not a reviewer
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated"}', true);
select is((select count(*)::int from public.event_registrations), 0,
  'F-02: a signed-in user does not see other people''s registrations');
select throws_ok($$insert into public.members (first_name) values ('probe')$$, '42501', null,
  'F-01: a signed-in user without members.manage cannot insert members');
select throws_ok(
  $$insert into public.event_registrations (user_id, event_id, full_name, email)
    values ('00000000-0000-0000-0000-0000000000d1', 1, 'forged', 'forged@example.test')$$,
  '42501', null, 'a user cannot create a registration in someone else''s name');
reset role;

select * from finish();
rollback;
