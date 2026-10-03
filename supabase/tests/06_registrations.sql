-- Sprint 06 · REG-001…005, SEC-008, TEST-004 — registrations: self-service rules, capacity under decisions,
-- reviewer scope, snapshots, private-link access, no direct writes, legacy mapping.
begin;
select no_plan();

delete from public.role_assignments; -- isolate from dev personas / E2E leftovers (rolled back)
delete from public.event_registrations;
delete from public.events where legacy_id is not null; -- the six migrated events would skew counts

create temp table _c as select (select id from public.committees where slug = 'ai') as a,
                               (select id from public.committees where slug = 'cybersecurity') as b;
create temp table _r (k text primary key, id uuid);
grant select on _c to authenticated, anon;
grant select, insert, update on _r to authenticated, anon;

insert into auth.users (id, aud, role, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000d001', 'authenticated', 'authenticated', 'heada@example.test',  now(), '{"full_name":"Head A Person"}'),
  ('00000000-0000-0000-0000-00000000d002', 'authenticated', 'authenticated', 'headb@example.test',  now(), '{"full_name":"Head B Person"}'),
  ('00000000-0000-0000-0000-00000000d003', 'authenticated', 'authenticated', 'user1@example.test',  now(), '{"full_name":"User One Person"}'),
  ('00000000-0000-0000-0000-00000000d004', 'authenticated', 'authenticated', 'user2@example.test',  now(), '{"full_name":"User Two Person"}'),
  ('00000000-0000-0000-0000-00000000d005', 'authenticated', 'authenticated', 'user3@example.test',  now(), '{"full_name":"User Three Person"}'),
  ('00000000-0000-0000-0000-00000000d006', 'authenticated', 'authenticated', 'nomail@example.test', null,  '{"full_name":"Unconfirmed Person"}');

insert into public.role_assignments (user_id, role_key, committee_id)
select '00000000-0000-0000-0000-00000000d001'::uuid, 'committee_head', a from _c
union all select '00000000-0000-0000-0000-00000000d002'::uuid, 'committee_head', b from _c;

-- Fixture events (published, future): open/approval, 1-seat auto-accept, 1-seat + waitlist, other committee, past.
create temp table _e (k text primary key, id uuid);
grant select on _e to authenticated, anon;
with ins as (
  insert into public.events (slug, committee_id, type, status, title_ar, title_en, schedule_type, start_date, start_time, end_time,
                             location_mode, seats, requires_approval, waitlist_enabled, audience, published_at)
  select s.slug, s.committee, 'workshop', 'published', 'فعالية ' || s.slug, 'Event ' || s.slug, 'single_day',
         (now() at time zone 'Asia/Riyadh')::date + s.days, '18:00', '20:00', 'online', s.seats, s.approval, s.waitlist, s.audience, now()
  from (
    select 'approval-ev'  as slug, (select a from _c) as committee, 10 as seats, true  as approval, false as waitlist, 'public' as audience, 30 as days
    union all select 'one-seat',   (select a from _c), 1,    false, false, 'public',       30
    union all select 'waitlist',   (select a from _c), 1,    false, true,  'public',       30
    union all select 'other-comm', (select b from _c), null, true,  false, 'public',       30
    union all select 'past',       (select a from _c), null, false, false, 'public',       -5
    union all select 'members',    (select a from _c), null, false, false, 'members_only', 30
  ) s
  returning slug, id
)
insert into _e select slug, id from ins;
insert into public.event_private_details (event_id, group_link)
select id, 'https://chat.example.test/' || k from _e;

-- =============================================================================== structure
select has_table('public', 'event_registrations', 'new registrations table exists');
select has_table('public', 'event_registrations_legacy', 'legacy table is kept');
select is((select count(*)::int from information_schema.role_table_grants where table_name = 'event_registrations_legacy' and grantee in ('anon', 'authenticated')), 0, 'legacy table has no client grants');
select is((select count(*)::int from public.event_registrations where legacy_id is not null),
          (select count(*)::int from public.event_registrations_legacy l join public.events e on e.legacy_id = l.event_id), 'legacy rows mapped by legacy_id');

-- =============================================================================== anonymous + unconfirmed
set local role anon;
select throws_ok($$select public.register_for_event((select id from _e where k = 'one-seat'))$$, '42501', null, 'anon cannot register');
select throws_ok($$select count(*) from public.event_registrations$$, '42501', null, 'anon cannot read registrations');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000d006","role":"authenticated"}', true);
select throws_ok($$select public.register_for_event((select id from _e where k = 'one-seat'))$$, 'P0001', 'EMAIL_NOT_CONFIRMED', 'unconfirmed e-mail cannot register');

-- =============================================================================== self-service
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000d003","role":"authenticated"}', true);
select is((public.register_for_event((select id from _e where k = 'approval-ev')) ->> 'status'), 'pending', 'approval event → pending');
select throws_ok($$select public.register_for_event((select id from _e where k = 'approval-ev'))$$, 'P0001', 'ALREADY_REGISTERED', 'cannot register twice');
select is((public.register_for_event((select id from _e where k = 'one-seat')) ->> 'status'), 'accepted', 'auto-accept takes the last seat');
select throws_ok($$select public.register_for_event((select id from _e where k = 'past'))$$, 'P0001', 'REGISTRATION_CLOSED', 'past event is closed');
-- MEMBERS_ONLY is wired in register_for_event; is_active_member() is a stub until Sprint 08, so it is asserted there.
select is((select full_name_snapshot from public.event_registrations where user_id = '00000000-0000-0000-0000-00000000d003' and status = 'accepted'), 'User One Person', 'snapshot of the name is stored');
select is((select group_link from public.my_registrations where slug = 'one-seat'), 'https://chat.example.test/one-seat', 'accepted registrant sees the group link');
select is((select group_link from public.my_registrations where slug = 'approval-ev'), null, 'pending registrant does not see the group link');
select is((select count(*)::int from public.event_private_details), 1, 'RLS: private details visible only for the accepted event');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000d004","role":"authenticated"}', true);
select throws_ok($$select public.register_for_event((select id from _e where k = 'one-seat'))$$, 'P0001', 'EVENT_FULL', 'full event without waitlist refuses');
select is((public.register_for_event((select id from _e where k = 'waitlist')) ->> 'status'), 'accepted', 'waitlist event: first takes the seat');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000d005","role":"authenticated"}', true);
select is((public.register_for_event((select id from _e where k = 'waitlist')) ->> 'status'), 'waitlisted', 'waitlist event: second is waitlisted');
select is((select count(*)::int from public.event_registrations), 1, 'a user reads only their own registration');
select throws_ok($$insert into public.event_registrations (event_id, full_name_snapshot, email_snapshot) values ((select id from _e where k = 'past'), 'x', 'x')$$, '42501', null, 'no direct inserts');
select throws_ok($$update public.event_registrations set status = 'accepted'$$, '42501', null, 'no direct updates');

-- cancel and re-register
select lives_ok($$select public.cancel_registration((select id from public.event_registrations limit 1))$$, 'a participant can cancel before the start');
select is((select status from public.event_registrations limit 1), 'cancelled', 'status is cancelled');
select throws_ok($$select public.cancel_registration((select id from public.event_registrations limit 1))$$, 'P0001', 'INVALID_TRANSITION', 'cancelling twice is refused');
select is((public.register_for_event((select id from _e where k = 'waitlist')) ->> 'status'), 'waitlisted', 're-registering reuses the row');
select is((select count(*)::int from public.event_registrations), 1, 'still one row per user and event');

-- =============================================================================== reviewers: scope + capacity
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000d002","role":"authenticated"}', true);
select is((select count(*)::int from public.event_registrations), 0, 'head of another committee sees none of these');
insert into _r select 'pending', id from public.event_registrations where false;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000d001","role":"authenticated"}', true);
select is((select count(*)::int from public.event_registrations), 4, 'head A sees all registrations of their committee');
insert into _r select 'appr', id from public.event_registrations where event_id = (select id from _e where k = 'approval-ev');
insert into _r select 'wait', id from public.event_registrations where event_id = (select id from _e where k = 'waitlist') and status = 'waitlisted';
insert into _r select 'taken', id from public.event_registrations where event_id = (select id from _e where k = 'waitlist') and status = 'accepted';

select is((public.decide_registrations(array[(select id from _r where k = 'appr')], 'accept') -> 0 ->> 'ok'), 'true', 'head accepts a pending registration');
select is((select notify_status from public.event_registrations where id = (select id from _r where k = 'appr')), 'not_sent', 'decision queues a notification');
select is((public.decide_registrations(array[(select id from _r where k = 'wait')], 'accept') -> 0 ->> 'code'), 'CAPACITY_REACHED', 'accepting beyond capacity is refused');
select is((public.decide_registrations(array[(select id from _r where k = 'appr')], 'accept') -> 0 ->> 'code'), 'INVALID_TRANSITION', 'repeat decision is refused');
select is((public.decide_registrations(array[gen_random_uuid()], 'accept') -> 0 ->> 'code'), 'NOT_FOUND', 'unknown id reported per row');
select is((public.decide_registrations(array[(select id from _r where k = 'taken'), (select id from _r where k = 'wait')], 'reject') -> 1 ->> 'status'), 'rejected', 'bulk decision reports per row');

select lives_ok($$select public.cancel_registration_by_organizer((select id from _r where k = 'appr'), 'Event moved')$$, 'organizer cancels with a reason');
select throws_ok($$select public.cancel_registration_by_organizer((select id from _r where k = 'wait'), 'late')$$, 'P0001', 'INVALID_TRANSITION', 'organizer cannot cancel a rejected row');

-- another committee's head cannot decide
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000d002","role":"authenticated"}', true);
select is((public.decide_registrations(array[(select id from _r where k = 'appr')], 'reject') -> 0 ->> 'code'), 'FORBIDDEN', 'out-of-scope head is forbidden');

-- =============================================================================== public counts
reset role;
select cmp_ok((select count(*)::int from public.audit_logs where action in ('registration.accepted', 'registration.rejected', 'registration.cancelled')), '>=', 4, 'decisions and cancellations are audited');
select is((select accepted_count from public.public_events where slug = 'one-seat'), 1, 'public_events counts accepted registrations');
select is((select seats_left from public.public_events where slug = 'one-seat'), 0, 'seats_left reaches zero');

select * from finish();
rollback;
