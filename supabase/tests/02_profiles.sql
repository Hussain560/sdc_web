-- Sprint 03 · AUTH-005 — profiles: trigger, backfill safety, own-row RLS, column grants.
begin;
select plan(11);

insert into auth.users (id, aud, role, email, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', 'Alice@Example.test',
   '{"full_name":"سارة محمد العتيبي","locale":"en"}'),
  ('00000000-0000-0000-0000-0000000000b2', 'authenticated', 'authenticated', 'bob@example.test', '{}'),
  ('00000000-0000-0000-0000-0000000000c3', 'authenticated', 'authenticated', 'xy@example.test', '{}');

select is((select count(*)::int from public.profiles where id in
  ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000b2')), 2,
  'sign-up trigger creates a profile per user');
select is((select email from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
  'alice@example.test', 'e-mail is mirrored lowercase');
select is((select full_name_ar from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
  'سارة محمد العتيبي', 'name comes from sign-up metadata');
select is((select preferred_locale from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
  'en', 'locale comes from sign-up metadata');
select is((select full_name_ar from public.profiles where id = '00000000-0000-0000-0000-0000000000b2'),
  'bob', 'missing name falls back to the e-mail local part');
select is((select full_name_ar from public.profiles where id = '00000000-0000-0000-0000-0000000000c3'),
  'user-00000000', 'too-short fallback still satisfies the 3-char check');

update auth.users set email = 'alice2@example.test' where id = '00000000-0000-0000-0000-0000000000a1';
select is((select email from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
  'alice2@example.test', 'e-mail change is mirrored');

-- act as Alice
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

select is((select count(*)::int from public.profiles), 1, 'a user sees only their own profile');

update public.profiles set full_name_ar = 'اسم جديد كامل' where id = '00000000-0000-0000-0000-0000000000a1';
select is((select full_name_ar from public.profiles), 'اسم جديد كامل', 'a user can edit their own name');

update public.profiles set full_name_ar = 'اختراق اسم' where id = '00000000-0000-0000-0000-0000000000b2';
reset role;
select is((select full_name_ar from public.profiles where id = '00000000-0000-0000-0000-0000000000b2'),
  'bob', 'a user cannot edit another profile (0 rows affected)');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select throws_ok(
  $$update public.profiles set email = 'evil@example.test' where id = '00000000-0000-0000-0000-0000000000a1'$$,
  '42501', null, 'a user cannot change the mirrored e-mail (column grant)');
reset role;

select * from finish();
rollback;
