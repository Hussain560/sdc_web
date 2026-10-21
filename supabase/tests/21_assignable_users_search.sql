-- Sprint 17 (ACC-007): the person picker of "assign position" answers according to who asks.
begin;
select no_plan();

delete from public.role_assignments;
delete from public.members;

insert into auth.users (id, aud, role, email, email_confirmed_at, last_sign_in_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000e101', 'authenticated', 'authenticated', 'admin@example.test', now(), now(), '{"full_name":"Admin Person"}'),
  ('00000000-0000-0000-0000-00000000e102', 'authenticated', 'authenticated', 'head@example.test', now(), now(), '{"full_name":"Head Person"}'),
  ('00000000-0000-0000-0000-00000000e103', 'authenticated', 'authenticated', 'abdulrahman@example.test', now(), now(), '{"full_name":"عبدالرحمن القحطاني"}'),
  ('00000000-0000-0000-0000-00000000e104', 'authenticated', 'authenticated', 'salma@example.test', now(), now(), '{"full_name":"سلمى القحطاني"}'),
  ('00000000-0000-0000-0000-00000000e105', 'authenticated', 'authenticated', 'naif@example.test', now(), null, '{"full_name":"نايف القحطاني"}'),
  ('00000000-0000-0000-0000-00000000e106', 'authenticated', 'authenticated', 'plain@example.test', now(), now(), '{"full_name":"Plain Person"}'),
  ('00000000-0000-0000-0000-00000000e107', 'authenticated', 'authenticated', 'gone@example.test', now(), now(), '{"full_name":"قحطاني سابق"}');

insert into public.members (id, user_id, status, joined_via, first_name_ar, middle_name_ar, last_name_ar, first_name_en, middle_name_en, last_name_en) values
  ('00000000-0000-0000-0000-00000000f101', '00000000-0000-0000-0000-00000000e101', 'active', 'manual', 'مدير', null, 'النظام', 'Admin', null, 'Person'),
  ('00000000-0000-0000-0000-00000000f102', '00000000-0000-0000-0000-00000000e102', 'active', 'manual', 'قائد', null, 'اللجنة', 'Head', null, 'Person'),
  ('00000000-0000-0000-0000-00000000f103', '00000000-0000-0000-0000-00000000e103', 'active', 'manual', 'عبدالرحمن', 'محمد', 'القحطاني', 'Abdulrahman', 'Mohammed', 'Alqahtani'),
  ('00000000-0000-0000-0000-00000000f104', '00000000-0000-0000-0000-00000000e104', 'active', 'manual', 'سلمى', 'ناصر', 'القحطاني', 'Salma', 'Nasser', 'Alqahtani'),
  ('00000000-0000-0000-0000-00000000f105', '00000000-0000-0000-0000-00000000e105', 'active', 'manual', 'نايف', 'سعد', 'القحطاني', 'Naif', 'Saad', 'Alqahtani'),
  ('00000000-0000-0000-0000-00000000f107', '00000000-0000-0000-0000-00000000e107', 'expired', 'manual', 'سابق', null, 'القحطاني', 'Former', null, 'Alqahtani');
-- a member with no account yet
insert into public.members (id, status, joined_via, first_name_ar, last_name_ar, first_name_en, last_name_en)
  values ('00000000-0000-0000-0000-00000000f108', 'active', 'legacy', 'بلا', 'حساب', 'No', 'Account');

insert into public.role_assignments (user_id, role_key) values ('00000000-0000-0000-0000-00000000e101', 'system_admin');
insert into public.role_assignments (user_id, role_key, committee_id)
  select '00000000-0000-0000-0000-00000000e102'::uuid, 'committee_head', id from public.committees where slug = 'ai';
insert into public.role_assignments (user_id, role_key, committee_id)
  select '00000000-0000-0000-0000-00000000e103'::uuid, 'committee_member', id from public.committees where slug = 'ai';

-- ------------------------------------------------------------------------------------------ the administrator
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000e101","role":"authenticated"}', true);

select is((public.search_assignable_users('القحطاني'))->>'restricted', 'false', 'an administrator is not limited');
select is(jsonb_array_length((public.search_assignable_users('القحطاني'))->'rows'), 3, 'finds the active members by last name in Arabic, not the inactive one');
select is(jsonb_array_length((public.search_assignable_users('alqahtani'))->'rows'), 3, 'finds them by the English last name, which the account name did not carry');
select is(jsonb_array_length((public.search_assignable_users('Mohammed'))->'rows'), 1, 'finds a member by the English middle name');
select is((public.search_assignable_users('محمد'))->'rows'->0->>'name_ar', 'عبدالرحمن محمد القحطاني', 'and by the Arabic middle name');
select is((public.search_assignable_users('abdulrahman@'))->'rows'->0->>'email', 'abdulrahman@example.test', 'an administrator can search by e-mail and sees it');
select is(jsonb_array_length((public.search_assignable_users('x'))->'rows'), 0, 'one letter returns nothing');
select is(jsonb_array_length((public.search_assignable_users('%%'))->'rows'), 0, 'a wildcard is not a wildcard');
select is(jsonb_array_length((public.search_assignable_users('بلا'))->'rows'), 0, 'a member with no account cannot be assigned, so is not listed');
select is((public.search_assignable_users('naif'))->'rows'->0->>'activated', 'false', 'an account that never signed in is marked not activated');
select is((public.search_assignable_users('salma'))->'rows'->0->>'activated', 'true', 'an active account is not');

-- With a committee, its people come first and carry their role.
select is((public.search_assignable_users('القحطاني', (select id from public.committees where slug = 'ai')))->'rows'->0->>'in_committee', 'true', 'committee members are listed first');
select is((public.search_assignable_users('القحطاني', (select id from public.committees where slug = 'ai')))->'rows'->0->>'name_ar', 'عبدالرحمن محمد القحطاني', 'the committee member is the first row');
select isnt((public.search_assignable_users('القحطاني', (select id from public.committees where slug = 'ai')))->'rows'->0->>'role_ar', null, 'with the role they hold');

-- ------------------------------------------------------------------------------------------ the committee head
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000e102","role":"authenticated"}', true);
select is((public.search_assignable_users('القحطاني', (select id from public.committees where slug = 'ai')))->>'restricted', 'true', 'a committee head is told the search is limited');
select is(jsonb_array_length((public.search_assignable_users('القحطاني', (select id from public.committees where slug = 'ai')))->'rows'), 1, 'and finds only people of the own committee');
select is((public.search_assignable_users('القحطاني', (select id from public.committees where slug = 'ai')))->'rows'->0->>'email', null, 'without e-mail addresses');
select is(jsonb_array_length((public.search_assignable_users('salma', (select id from public.committees where slug = 'ai')))->'rows'), 0, 'another member is not revealed');
select is(jsonb_array_length((public.search_assignable_users('salma@', (select id from public.committees where slug = 'ai')))->'rows'), 0, 'e-mail is not searchable for a head');
select throws_ok($$select public.search_assignable_users('القحطاني')$$, 'P0001', 'FORBIDDEN', 'a head cannot search without naming the own committee');
select throws_ok($$select public.search_assignable_users('القحطاني', (select id from public.committees where slug = 'cybersecurity'))$$, 'P0001', 'FORBIDDEN', 'a head cannot search for another committee');

-- ------------------------------------------------------------------------------------------ everybody else
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000e106","role":"authenticated"}', true);
select throws_ok($$select public.search_assignable_users('القحطاني')$$, 'P0001', 'FORBIDDEN', 'a person with no role cannot use the picker');
reset role;
set local role anon;
select throws_ok($$select public.search_assignable_users('القحطاني')$$, '42501', null, 'anon cannot call it');
reset role;

select * from finish();
rollback;
