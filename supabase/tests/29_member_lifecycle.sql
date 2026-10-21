-- Sprint 18 · MEM-016..020, ACC-008 — states, guards, bulk results, leave requests, card, block, onboarding.
begin;
select no_plan();

delete from public.role_assignments;
delete from public.members;
delete from public.membership_applications;
delete from public.membership_cycles;

insert into auth.users (id, aud, role, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000a2a1', 'authenticated', 'authenticated', 'leader@lc.example.test', now(), '{"full_name":"Leader"}'),
  ('00000000-0000-0000-0000-00000000a2a2', 'authenticated', 'authenticated', 'admin@lc.example.test', now(), '{"full_name":"Admin"}'),
  ('00000000-0000-0000-0000-00000000a2a3', 'authenticated', 'authenticated', 'm1@lc.example.test', now(), '{"full_name":"M1"}'),
  ('00000000-0000-0000-0000-00000000a2a4', 'authenticated', 'authenticated', 'm2@lc.example.test', now(), '{"full_name":"M2"}'),
  ('00000000-0000-0000-0000-00000000a2a5', 'authenticated', 'authenticated', 'm3@lc.example.test', now(), '{"full_name":"M3"}'),
  ('00000000-0000-0000-0000-00000000a2a6', 'authenticated', 'authenticated', 'm4@lc.example.test', now(), '{"full_name":"M4"}'),
  ('00000000-0000-0000-0000-00000000a2a7', 'authenticated', 'authenticated', 'm5@lc.example.test', now(), '{"full_name":"M5"}'),
  ('00000000-0000-0000-0000-00000000a2a8', 'authenticated', 'authenticated', 'plain@lc.example.test', now(), '{"full_name":"Plain"}');
insert into public.role_assignments (user_id, role_key) values
  ('00000000-0000-0000-0000-00000000a2a1', 'community_leader'), ('00000000-0000-0000-0000-00000000a2a2', 'system_admin');
insert into public.role_assignments (user_id, role_key, committee_id)
  select '00000000-0000-0000-0000-00000000a2a6', 'committee_member', id from public.committees where slug = 'ai';

insert into public.members (id, user_id, status, joined_via, first_name_ar, last_name_ar, first_name_en, last_name_en, term_starts_at, term_ends_at, end_reason, suspension_category) values
  ('00000000-0000-0000-0000-00000000b2a1', '00000000-0000-0000-0000-00000000a2a1', 'active', 'manual', 'قائد', 'المجتمع', 'Leader', 'One', current_date - 30, current_date + 300, null, null),
  ('00000000-0000-0000-0000-00000000b2a2', '00000000-0000-0000-0000-00000000a2a2', 'active', 'manual', 'مدير', 'النظام', 'Admin', 'One', current_date - 30, current_date + 300, null, null),
  ('00000000-0000-0000-0000-00000000b2a3', '00000000-0000-0000-0000-00000000a2a3', 'active', 'manual', 'عضو', 'أول', 'Member', 'One', current_date - 30, current_date + 10, null, null),
  ('00000000-0000-0000-0000-00000000b2a4', '00000000-0000-0000-0000-00000000a2a4', 'expired', 'manual', 'عضو', 'ثان', 'Member', 'Two', current_date - 400, current_date - 5, null, null),
  ('00000000-0000-0000-0000-00000000b2a5', '00000000-0000-0000-0000-00000000a2a5', 'ended', 'manual', 'عضو', 'ثالث', 'Member', 'Three', current_date - 400, current_date - 5, 'left', null),
  ('00000000-0000-0000-0000-00000000b2a6', '00000000-0000-0000-0000-00000000a2a6', 'active', 'manual', 'عضو', 'رابع', 'Member', 'Four', current_date - 30, current_date + 300, null, null),
  ('00000000-0000-0000-0000-00000000b2a7', '00000000-0000-0000-0000-00000000a2a7', 'active', 'manual', 'عضو', 'خامس', 'Member', 'Five', current_date - 30, current_date + 300, null, null);

create temp table _t (k text primary key, v text);
grant select, insert, update on _t to authenticated, anon, service_role;

set local role authenticated;
-- ------------------------------------------------------------------------------------------ permissions
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a2a3","role":"authenticated"}', true);
select throws_ok($$select public.suspend_members(array['00000000-0000-0000-0000-00000000b2a7']::uuid[], 'conduct', 'x')$$, 'P0001', 'FORBIDDEN', 'a member cannot suspend anyone');
select throws_ok($$select public.renew_members(array['00000000-0000-0000-0000-00000000b2a7']::uuid[], current_date + 100)$$, 'P0001', 'FORBIDDEN', 'nor renew');
select throws_ok($$select public.block_accounts(array['00000000-0000-0000-0000-00000000a2a8']::uuid[], 'x')$$, 'P0001', 'FORBIDDEN', 'nor block');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a2a1","role":"authenticated"}', true);
-- ------------------------------------------------------------------------------------------ guards
select is((public.suspend_members(array['00000000-0000-0000-0000-00000000b2a1']::uuid[], 'conduct', 'x'))->0->>'code', 'SELF_ACTION', 'nobody acts on themselves');
select is((public.suspend_members(array['00000000-0000-0000-0000-00000000b2a2']::uuid[], 'conduct', 'x'))->0->>'code', 'HIGHER_ROLE', 'a leader cannot act on the system administrator');
select is((public.suspend_members(array['00000000-0000-0000-0000-00000000b2a3']::uuid[], 'conduct', null))->0->>'code', 'REASON_REQUIRED', 'a suspension needs an internal reason');
select is((public.suspend_members(array['00000000-0000-0000-0000-00000000b2a3']::uuid[], 'wrong', 'x'))->0->>'code', 'REASON_REQUIRED', 'and a category the member can see');
select is((public.suspend_members(array['00000000-0000-0000-0000-00000000b2a3']::uuid[], 'conduct', 'متكرر', current_date + 20))->0->>'ok', 'true', 'leadership suspends with a category, an internal reason and an end date');
select is((public.suspend_members(array['00000000-0000-0000-0000-00000000b2a3']::uuid[], 'conduct', 'again'))->0->>'code', 'INVALID_TRANSITION', 'suspending twice is refused');
select is((public.reinstate_members(array['00000000-0000-0000-0000-00000000b2a3']::uuid[], 'resolved'))->0->>'ok', 'true', 'reinstating works');
select is((public.reinstate_members(array['00000000-0000-0000-0000-00000000b2a3']::uuid[]))->0->>'code', 'INVALID_TRANSITION', 'an active member cannot be reinstated');

-- ------------------------------------------------------------------------------------------ renew in bulk
select is(jsonb_array_length(public.renew_members(array['00000000-0000-0000-0000-00000000b2a4', '00000000-0000-0000-0000-00000000b2a5', '00000000-0000-0000-0000-00000000b2a3', '00000000-0000-0000-0000-00000000b2ff']::uuid[], current_date + 365, 'welcome back')), 4, 'a bulk renewal returns a result per row');
select is((select string_agg(r ->> 'code', ',' order by r ->> 'id') from jsonb_array_elements(public.renew_members(array['00000000-0000-0000-0000-00000000b2a5', '00000000-0000-0000-0000-00000000b2ff']::uuid[], current_date + 365)) r),
  'INVALID_TRANSITION,NOT_FOUND', 'an ended member cannot be renewed and a missing one is reported');
select throws_ok($$select public.renew_members(array['00000000-0000-0000-0000-00000000b2a4']::uuid[], current_date - 1)$$, 'P0001', 'VALIDATION_FAILED', 'the new end date must be in the future');
select throws_ok($$select public.renew_members((select array_agg('00000000-0000-0000-0000-00000000b2a4'::uuid) from generate_series(1, 201)), current_date + 5)$$, 'P0001', 'VALIDATION_FAILED', 'at most 200 rows per call');
reset role;
select is((select status from public.members where id = '00000000-0000-0000-0000-00000000b2a4'), 'active', 'renewing an expired member makes them active again');
select is((select term_ends_at from public.members where id = '00000000-0000-0000-0000-00000000b2a4'), current_date + 365, 'with the new end date');
select is((select term_ends_at from public.members where id = '00000000-0000-0000-0000-00000000b2a3'), current_date + 365, 'renewing an active member moves the end date');
select ok(exists (select 1 from public.member_events where member_id = '00000000-0000-0000-0000-00000000b2a4' and kind = 'renewed' and data ->> 'message' = 'welcome back'), 'the history keeps the message');

-- ------------------------------------------------------------------------------------------ the internal reason never reaches the member
select is((select status_reason from public.members where id = '00000000-0000-0000-0000-00000000b2a3'), null, 'the members row carries no internal reason');
select is((select data ->> 'reason' from public.member_events where member_id = '00000000-0000-0000-0000-00000000b2a3' and kind = 'suspended'), 'متكرر', 'the reason is in the staff-only history');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a2a3","role":"authenticated"}', true);
select is((select count(*)::int from public.member_events), 0, 'a member cannot read the history');

-- ------------------------------------------------------------------------------------------ end membership
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a2a1","role":"authenticated"}', true);
select is((public.end_members(array['00000000-0000-0000-0000-00000000b2a6']::uuid[], null))->0->>'code', 'REASON_REQUIRED', 'terminating needs a reason');
select is((public.end_members(array['00000000-0000-0000-0000-00000000b2a6']::uuid[], 'سلوك', 'terminated', 'نشكر لك'))->0->>'ok', 'true', 'leadership ends a membership');
reset role;
select is((select status || '/' || end_reason from public.members where id = '00000000-0000-0000-0000-00000000b2a6'), 'ended/terminated', 'ended with its reason');
select is((select card_token from public.members where id = '00000000-0000-0000-0000-00000000b2a6'), null, 'the card is revoked');
select is((select count(*)::int from public.role_assignments where user_id = '00000000-0000-0000-0000-00000000a2a6' and (ends_at is null or ends_at > now())), 0, 'committee positions end with the membership');

-- ------------------------------------------------------------------------------------------ leave requests
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a2a7","role":"authenticated"}', true);
select throws_ok($$select public.end_members(array['00000000-0000-0000-0000-00000000b2a7']::uuid[], 'bye')$$, 'P0001', 'FORBIDDEN', 'a member cannot end their own membership');
select lives_ok($$select public.request_to_leave('أنتقل إلى مدينة أخرى', current_date + 14)$$, 'a member sends a leave request');
select throws_ok($$select public.request_to_leave('again')$$, 'P0001', 'ALREADY_PENDING', 'one pending request per member');
select is((select count(*)::int from public.member_leave_requests), 1, 'the member sees their own request');
select is((select status from public.members where user_id = '00000000-0000-0000-0000-00000000a2a7'), 'active', 'and stays an active member');
select lives_ok($$select public.withdraw_leave_request()$$, 'the member can withdraw it');
select lives_ok($$select public.request_to_leave('مرة أخرى')$$, 'and ask again');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a2a3","role":"authenticated"}', true);
select is((select count(*)::int from public.member_leave_requests), 0, 'another member does not see it');
select throws_ok(format($f$select public.decide_leave_requests(array[%L]::uuid[], 'approve')$f$, (select id from public.member_leave_requests limit 1)), 'P0001', 'FORBIDDEN', 'a member cannot decide');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a2a1","role":"authenticated"}', true);
insert into _t select 'req', id::text from public.member_leave_requests where status = 'pending';
select is((public.decide_leave_requests(array[(select v from _t where k = 'req')::uuid], 'approve', 'ok', current_date + 7))->0->>'ok', 'true', 'leadership approves with a later last day');
select is((select status from public.members where user_id = '00000000-0000-0000-0000-00000000a2a7'), 'active', 'the member stays active until that day');
select is((select leaves_on from public.members where user_id = '00000000-0000-0000-0000-00000000a2a7'), current_date + 7, 'and the day is recorded');
select is((public.decide_leave_requests(array[(select v from _t where k = 'req')::uuid], 'approve'))->0->>'code', 'INVALID_TRANSITION', 'a decided request is not decided again');
-- the leader's own request is decided by someone else
select lives_ok($$select public.request_to_leave('leader leaving')$$, 'a leader asks to leave');
insert into _t select 'own', id::text from public.member_leave_requests where member_id = '00000000-0000-0000-0000-00000000b2a1' and status = 'pending';
select is((public.decide_leave_requests(array[(select v from _t where k = 'own')::uuid], 'approve'))->0->>'code', 'SELF_DECISION', 'a leader cannot decide their own request');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a2a2","role":"authenticated"}', true);
select is((public.decide_leave_requests(array[(select v from _t where k = 'own')::uuid], 'decline', 'stay'))->0->>'ok', 'true', 'the system administrator can');
select is((select status from public.member_leave_requests where id = (select v from _t where k = 'own')::uuid), 'declined', 'declined');
reset role;
select is((select status from public.members where id = '00000000-0000-0000-0000-00000000b2a1'), 'active', 'a declined request leaves the member active');

-- ------------------------------------------------------------------------------------------ the card
select ok((select card_token from public.members where id = '00000000-0000-0000-0000-00000000b2a7') is not null, 'an active member has a card');
insert into _t select 'card', card_token from public.members where id = '00000000-0000-0000-0000-00000000b2a7';
set local role anon;
select is((public.verify_member_card((select v from _t where k = 'card')) ->> 'status'), 'active', 'the public page shows the real status');
select is((select string_agg(key, ',' order by key) from jsonb_object_keys(public.verify_member_card((select v from _t where k = 'card'))) key),
  'checked_at,member_no,name_ar,name_en,ok,status,term_ends_at', 'and only name, number, status and term end');
select is((public.verify_member_card('nonsense') ->> 'code'), 'TOKEN_INVALID', 'an unknown code is not valid');
reset role;
select is((public.verify_member_card((select card_token from public.members where id = '00000000-0000-0000-0000-00000000b2a4')) ->> 'status'), 'active', 'a renewed member verifies as active');
update public.members set status = 'expired' where id = '00000000-0000-0000-0000-00000000b2a4';
select is((public.verify_member_card((select card_token from public.members where id = '00000000-0000-0000-0000-00000000b2a4')) ->> 'status'), 'expired', 'an expired membership never shows as active');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a2a7","role":"authenticated"}', true);
select lives_ok($$select public.rotate_card_token()$$, 'a member rotates their code');
reset role;
select isnt((select card_token from public.members where id = '00000000-0000-0000-0000-00000000b2a7'), (select v from _t where k = 'card'), 'the code changed');
select is((public.verify_member_card((select v from _t where k = 'card')) ->> 'code'), 'TOKEN_INVALID', 'and the old one stopped working');

-- ------------------------------------------------------------------------------------------ block / unblock
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a2a1","role":"authenticated"}', true);
select is((public.block_accounts(array['00000000-0000-0000-0000-00000000a2a1']::uuid[], 'x'))->0->>'code', 'SELF_ACTION', 'nobody blocks themselves');
select is((public.block_accounts(array['00000000-0000-0000-0000-00000000a2a2']::uuid[], 'x'))->0->>'code', 'HIGHER_ROLE', 'a leader cannot block the system administrator');
select throws_ok($$select public.block_accounts(array['00000000-0000-0000-0000-00000000a2a8']::uuid[], '')$$, 'P0001', 'VALIDATION_FAILED', 'blocking needs a reason');
select is((public.block_accounts(array['00000000-0000-0000-0000-00000000a2a8', '00000000-0000-0000-0000-00000000a2a7']::uuid[], 'انتحال صفة'))->0->>'ok', 'true', 'leadership blocks any account');
select is((public.block_accounts(array['00000000-0000-0000-0000-00000000a2a8']::uuid[], 'again'))->0->>'code', 'INVALID_TRANSITION', 'already blocked');
reset role;
select ok((select blocked_at from public.profiles where id = '00000000-0000-0000-0000-00000000a2a8') is not null, 'the profile is blocked');
select ok((select banned_until from auth.users where id = '00000000-0000-0000-0000-00000000a2a8') > now() + interval '100 years', 'the auth user is banned');
select is((select card_token from public.members where id = '00000000-0000-0000-0000-00000000b2a7'), null, 'a blocked member card is revoked');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a2a8","role":"authenticated"}', true);
select is((public.my_account_state()) ->> 'blocked', 'true', 'the blocked person sees the blocked state, without the reason');
select ok(not (public.my_account_state() ? 'blocked_reason'), 'and never the reason');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a2a2","role":"authenticated"}', true);
select is((public.block_accounts(array['00000000-0000-0000-0000-00000000a2a1']::uuid[], 'test'))->0->>'ok', 'true', 'the system administrator can block a leader');
select is((select string_agg(r ->> 'code', ',' order by r ->> 'id') from jsonb_array_elements(public.unblock_accounts(array['00000000-0000-0000-0000-00000000a2a1', '00000000-0000-0000-0000-00000000a2a3']::uuid[], 'ok')) r),
  'INVALID_TRANSITION', 'unblock: one done, one that was not blocked');
reset role;
select ok((select banned_until from auth.users where id = '00000000-0000-0000-0000-00000000a2a1') is null, 'the ban is lifted');
select is((select card_token from public.members where id = '00000000-0000-0000-0000-00000000b2a7'), null, 'unblocking does not bring the old card back');

-- ------------------------------------------------------------------------------------------ onboarding, renewal request, account state
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a2a3","role":"authenticated"}', true);
select lives_ok($$select public.save_onboarding_step(2::smallint)$$, 'progress is saved per step');
select lives_ok($$select public.save_onboarding_step(1::smallint)$$, 'going back does not lose the furthest step');
select is((public.my_account_state()) -> 'member' ->> 'onboarding_step', '2', 'the furthest step is kept');
select lives_ok($$select public.save_onboarding_step(5::smallint, true)$$, 'finishing marks the member as onboarded');
select ok((public.my_account_state()) -> 'member' ->> 'onboarded_at' is not null, 'and it follows the member');
select lives_ok($$select public.request_renewal()$$, 'a member asks for renewal');
select throws_ok($$select public.request_renewal()$$, 'P0001', 'ALREADY_PENDING', 'once a week');
select ok(not (public.my_account_state() -> 'member' ? 'status_reason'), 'the account state has no internal reason');

-- ------------------------------------------------------------------------------------------ the list
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a2a2","role":"authenticated"}', true);
select ok((public.admin_list_members())->'counts' ? 'ending_soon' and (public.admin_list_members())->'counts' ? 'leave_requests', 'the list counts the new tabs');
select is((public.admin_list_members('ended'))->>'total', '2', 'ended members have their tab');
select is((public.admin_list_members(null, 'SDC-M-'))->>'total', '7', 'search by member number');
reset role;

select * from finish();
rollback;
