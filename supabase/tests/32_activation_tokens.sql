-- Sprint 18 · ACC-009 — the activation link token: lives for the cycle's activation period, is replaced by a new one,
-- and ends neutrally when expired, unknown, not accepted or already used. Only the server (service role) can use it.
begin;
select no_plan();

delete from public.members;
delete from public.membership_applications;
delete from public.membership_cycles;

insert into auth.users (id, aud, role, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000f501', 'authenticated', 'authenticated', 'act-a@example.test', now(), '{}'),
  ('00000000-0000-0000-0000-00000000f502', 'authenticated', 'authenticated', 'act-b@example.test', now(), '{}');

insert into public.membership_cycles (id, name_ar, opens_at, closes_at, status, capacity, questions, rubric, term_ends_at, activation_deadline_days) values
  ('00000000-0000-0000-0000-00000000f601', 'دورة التفعيل', now() - interval '5 days', now() - interval '1 day', 'published', 5, '[]', '[]', '2027-12-31', 7);

insert into public.membership_applications (id, cycle_id, user_id, email, first_name_ar, last_name_ar, first_name_en, last_name_en, full_name_ar,
  phone, academic_status, consent_version, wants_directory_listing, status, accepted_at) values
  ('00000000-0000-0000-0000-00000000f701', '00000000-0000-0000-0000-00000000f601', '00000000-0000-0000-0000-00000000f501', 'act-a@example.test', 'أ', 'ب', 'A', 'B', 'x x', '+966501110010', 'student', 'v1', false, 'accepted', now()),
  ('00000000-0000-0000-0000-00000000f702', '00000000-0000-0000-0000-00000000f601', '00000000-0000-0000-0000-00000000f502', 'act-b@example.test', 'ج', 'د', 'C', 'D', 'x x', '+966501110011', 'student', 'v1', false, 'submitted', null);

create temp table _t (k text primary key, v text);

insert into _t select 'one', public.issue_activation_token('00000000-0000-0000-0000-00000000f701');
select matches((select v from _t where k = 'one'), '^[0-9a-f]{64}$', 'a token is 64 random hex characters');
select isnt((select activation_token_hash from public.membership_applications where id = '00000000-0000-0000-0000-00000000f701'), (select v from _t where k = 'one'), 'only its hash is stored');
select ok((select activation_token_expires_at between now() + interval '6 days 23 hours' and now() + interval '7 days 1 hour' from public.membership_applications where id = '00000000-0000-0000-0000-00000000f701'), 'it lives for the cycle activation period (7 days)');
select is((public.resolve_activation_token((select v from _t where k = 'one')))->>'ok', 'true', 'a valid token resolves');
select is((public.resolve_activation_token((select v from _t where k = 'one')))->>'email', 'act-a@example.test', 'to the person it belongs to');

-- a new link replaces the old one
insert into _t select 'two', public.issue_activation_token('00000000-0000-0000-0000-00000000f701');
select is((public.resolve_activation_token((select v from _t where k = 'one')))->>'code', 'TOKEN_INVALID', 'the old link stops working');
select is((public.resolve_activation_token((select v from _t where k = 'two')))->>'ok', 'true', 'the new one works');

select is((public.resolve_activation_token('nonsense'))->>'code', 'TOKEN_INVALID', 'an unknown token');
select is((public.resolve_activation_token(''))->>'code', 'TOKEN_INVALID', 'an empty token');

-- expiry
update public.membership_applications set activation_token_expires_at = now() - interval '1 minute' where id = '00000000-0000-0000-0000-00000000f701';
select is((public.resolve_activation_token((select v from _t where k = 'two')))->>'code', 'TOKEN_EXPIRED', 'an expired token');
update public.membership_applications set activation_token_expires_at = now() + interval '1 day' where id = '00000000-0000-0000-0000-00000000f701';

-- not accepted
insert into _t select 'three', public.issue_activation_token('00000000-0000-0000-0000-00000000f702');
select is((public.resolve_activation_token((select v from _t where k = 'three')))->>'code', 'NOT_ACCEPTED', 'a token of an application that is not accepted does nothing');

-- already active
insert into public.members (user_id, status, joined_via, first_name_ar, last_name_ar, activated_at) values
  ('00000000-0000-0000-0000-00000000f501', 'active', 'application', 'أ', 'ب', now());
select is((public.resolve_activation_token((select v from _t where k = 'two')))->>'code', 'ALREADY_ACTIVE', 'once the account is active the link says so');

-- only the server may use them
set local role anon;
select throws_ok($$select public.issue_activation_token('00000000-0000-0000-0000-00000000f701')$$, '42501', null, 'anon cannot issue tokens');
select throws_ok($$select public.resolve_activation_token('x')$$, '42501', null, 'anon cannot resolve tokens');
reset role;
set local role authenticated;
select throws_ok($$select public.issue_activation_token('00000000-0000-0000-0000-00000000f701')$$, '42501', null, 'a signed-in user cannot issue tokens');
reset role;

select * from finish();
rollback;
