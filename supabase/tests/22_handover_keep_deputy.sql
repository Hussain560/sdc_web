-- Sprint 17 (ACC-007): a handover can keep the previous head on as deputy.
begin;
select no_plan();

delete from public.role_assignments;
delete from public.members;

insert into auth.users (id, aud, role, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000001a01', 'authenticated', 'authenticated', 'adm@example.test', now(), '{"full_name":"Admin Person"}'),
  ('00000000-0000-0000-0000-000000001a02', 'authenticated', 'authenticated', 'oldhead@example.test', now(), '{"full_name":"Old Head"}'),
  ('00000000-0000-0000-0000-000000001a03', 'authenticated', 'authenticated', 'newhead@example.test', now(), '{"full_name":"New Head"}'),
  ('00000000-0000-0000-0000-000000001a04', 'authenticated', 'authenticated', 'other@example.test', now(), '{"full_name":"Other Person"}');
insert into public.members (user_id, status, joined_via, first_name_ar, last_name_ar) values
  ('00000000-0000-0000-0000-000000001a01', 'active', 'manual', 'مدير', 'النظام'),
  ('00000000-0000-0000-0000-000000001a02', 'active', 'manual', 'قائد', 'سابق'),
  ('00000000-0000-0000-0000-000000001a03', 'active', 'manual', 'قائد', 'جديد'),
  ('00000000-0000-0000-0000-000000001a04', 'active', 'manual', 'عضو', 'آخر');
insert into public.role_assignments (user_id, role_key) values ('00000000-0000-0000-0000-000000001a01', 'system_admin');
insert into public.role_assignments (user_id, role_key, committee_id)
  select '00000000-0000-0000-0000-000000001a02'::uuid, 'committee_head', id from public.committees where slug = 'ai';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001a01","role":"authenticated"}', true);

-- The picker tells the dialog who leads the committee now.
select is((public.search_assignable_users('جديد', (select id from public.committees where slug = 'ai')))->'head'->>'name_ar', 'قائد سابق', 'the search names the current head');
select is((public.search_assignable_users('جديد'))->'head', 'null'::jsonb, 'without a committee there is no head to name');

-- Keep as deputy.
select lives_ok($$select public.handover_head((select id from public.committees where slug = 'ai'), '00000000-0000-0000-0000-000000001a03', now(), true)$$, 'hand over and keep the old head as deputy');
select is((select count(*)::int from public.role_assignments where role_key = 'committee_head' and user_id = '00000000-0000-0000-0000-000000001a03' and (ends_at is null or ends_at > now())), 1, 'the new head is in place');
select is((select count(*)::int from public.role_assignments where role_key = 'committee_head' and user_id = '00000000-0000-0000-0000-000000001a02' and (ends_at is null or ends_at > now())), 0, 'the old head no longer leads');
select is((select count(*)::int from public.role_assignments where role_key = 'committee_deputy' and user_id = '00000000-0000-0000-0000-000000001a02' and (ends_at is null or ends_at > now())), 1, 'and is now the deputy');

-- Without the option nothing changes for the old head (the old three-argument call still works).
select lives_ok($$select public.handover_head((select id from public.committees where slug = 'ai'), '00000000-0000-0000-0000-000000001a04')$$, 'the old three-argument call still works');
select is((select count(*)::int from public.role_assignments where role_key = 'committee_head' and user_id = '00000000-0000-0000-0000-000000001a03' and (ends_at is null or ends_at > now())), 0, 'the previous head left without staying on');
select is((select count(*)::int from public.role_assignments where user_id = '00000000-0000-0000-0000-000000001a03' and role_key = 'committee_deputy'), 0, 'and is not a deputy');

-- Only those who may assign roles.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001a02","role":"authenticated"}', true);
select throws_ok($$select public.handover_head((select id from public.committees where slug = 'ai'), '00000000-0000-0000-0000-000000001a03', now(), true)$$, 'P0001', 'FORBIDDEN', 'a deputy cannot hand over the leadership');
reset role;

select * from finish();
rollback;
