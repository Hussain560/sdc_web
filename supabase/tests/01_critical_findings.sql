-- Regression tests for the critical findings (docs/01-project/current-system-audit.md §3, DB-004).
-- They describe the REQUIRED behaviour and are marked `todo` until the containment / RBAC
-- migration (Sprint 00 SEC-001 or Sprint 04) lands. Remove the todo wrapper in that migration's PR.
begin;
select plan(3);

select todo_start('containment pending: anon can currently write members (F-01)');
set local role anon;
select throws_ok(
  $$insert into public.members (first_name) values ('probe')$$,
  '42501',
  null,
  'anon cannot insert into members'
);
select throws_ok(
  $$update public.members set first_name = 'probe'$$,
  '42501',
  null,
  'anon cannot update members'
);
reset role;
select todo_end();

select todo_start('containment pending: anon can currently read registrations (F-02)');
set local role anon;
select is(
  (select count(*) from public.event_registrations)::int,
  0,
  'anon cannot read other people''s registrations'
);
reset role;
select todo_end();

select * from finish();
rollback;
