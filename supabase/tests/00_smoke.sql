begin;
select plan(4);

select has_table('public', 'members', 'members table exists');
select has_table('public', 'event_registrations', 'event_registrations table exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.members'::regclass),
  'RLS is enabled on members'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.event_registrations'::regclass),
  'RLS is enabled on event_registrations'
);

select * from finish();
rollback;
