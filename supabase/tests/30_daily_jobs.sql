-- Sprint 18 · MEM-016, ACC-009, MBR-013 — the daily job: expiry, reminders, leave dates, lapse, waitlist promotion,
-- restore, the outbox, the digest. Every job must change nothing the second time it runs.
begin;
select no_plan();

delete from public.role_assignments;
delete from public.members;
delete from public.membership_applications;
delete from public.membership_cycles;

insert into auth.users (id, aud, role, email, email_confirmed_at, last_sign_in_at, raw_user_meta_data)
select ('00000000-0000-0000-0000-00000000a3' || lpad(i::text, 2, '0'))::uuid, 'authenticated', 'authenticated', 'u' || i || '@dj.example.test', now(),
       case when i in (1, 2, 3, 4, 5, 6, 7, 8, 30, 31) then now() - interval '1 day' end, '{"full_name":"User"}'::jsonb
  from generate_series(1, 40) i;
insert into auth.users (id, aud, role, email, email_confirmed_at, raw_user_meta_data)
  values ('00000000-0000-0000-0000-00000000a399', 'authenticated', 'authenticated', 'leader@dj.example.test', now(), '{"full_name":"Leader"}') on conflict do nothing;
insert into public.role_assignments (user_id, role_key) values ('00000000-0000-0000-0000-00000000a399', 'community_leader') on conflict do nothing;

insert into public.membership_cycles (id, name_ar, opens_at, closes_at, status, capacity, questions, activation_deadline_days) values
  ('00000000-0000-0000-0000-00000000c301', 'دورة المهام اليومية', now() - interval '1 day', now() + interval '10 days', 'published', 10, '[]', 7),
  ('00000000-0000-0000-0000-00000000c302', 'دورة القائمة', now() - interval '60 days', now() - interval '40 days', 'published', 2, '[]', 7);

-- Members for expiry, reminders, leave dates and suspension end.
insert into public.members (id, user_id, status, joined_via, first_name_ar, last_name_ar, term_starts_at, term_ends_at, activated_at, leaves_on, suspension_category, suspended_until)
select ('00000000-0000-0000-0000-0000000b30' || lpad(i::text, 2, '0'))::uuid, ('00000000-0000-0000-0000-00000000a3' || lpad(i::text, 2, '0'))::uuid,
       case when i = 8 then 'suspended' else 'active' end, 'manual', 'عضو', 'رقم ' || i, current_date - 100,
       case i when 1 then current_date - 1 when 2 then current_date + 30 when 3 then current_date + 7 when 4 then current_date + 1
              when 5 then current_date + 3 when 6 then current_date + 40 else current_date + 200 end,
       now(), case when i = 7 then current_date end, case when i = 8 then 'conduct' end, case when i = 8 then current_date end
  from generate_series(1, 8) i;

-- Acceptances in the first cycle: day 3 reminder, day 6 reminder, lapse.
insert into public.membership_applications (id, cycle_id, user_id, email, first_name_ar, last_name_ar, first_name_en, last_name_en, full_name_ar, academic_status, consent_version, status, accepted_at, decided_at)
select ('00000000-0000-0000-0000-0000000d30' || lpad(i::text, 2, '0'))::uuid, '00000000-0000-0000-0000-00000000c301',
       ('00000000-0000-0000-0000-00000000a3' || lpad(i::text, 2, '0'))::uuid, 'u' || i || '@dj.example.test', 'متقدم', 'رقم ' || i, 'Applicant', 'N' || i, 'x x', 'student', 'v1', 'accepted',
       now() - (case i when 10 then interval '4 days' when 11 then interval '6 days 12 hours' else interval '8 days' end), now()
  from generate_series(10, 12) i;
insert into public.members (user_id, status, joined_via, first_name_ar, last_name_ar, application_id, term_starts_at, term_ends_at)
select ('00000000-0000-0000-0000-00000000a3' || lpad(i::text, 2, '0'))::uuid, 'active', 'application', 'مقبول', 'رقم ' || i,
       ('00000000-0000-0000-0000-0000000d30' || lpad(i::text, 2, '0'))::uuid, current_date, current_date + 300
  from generate_series(10, 12) i;

-- The waiting-list cycle: two seats, both taken (one by an activated member, one not activated and overdue), two waiting.
insert into public.membership_applications (id, cycle_id, user_id, email, first_name_ar, last_name_ar, first_name_en, last_name_en, full_name_ar, academic_status, consent_version, status, accepted_at, decided_at, submitted_at)
select ('00000000-0000-0000-0000-0000000d31' || lpad(i::text, 2, '0'))::uuid, '00000000-0000-0000-0000-00000000c302',
       ('00000000-0000-0000-0000-00000000a3' || lpad(i::text, 2, '0'))::uuid, 'u' || i || '@dj.example.test', 'قائمة', 'رقم ' || i, 'List', 'N' || i, 'x x', 'student', 'v1',
       case when i in (20, 21) then 'accepted' else 'waitlisted' end,
       case when i = 20 then now() - interval '30 days' when i = 21 then now() - interval '9 days' end,
       case when i in (20, 21) then now() - interval '9 days' end, now() - (interval '1 hour' * (40 - i))
  from generate_series(20, 23) i;
insert into public.members (user_id, status, joined_via, first_name_ar, last_name_ar, application_id, term_starts_at, term_ends_at, activated_at)
select ('00000000-0000-0000-0000-00000000a3' || lpad(i::text, 2, '0'))::uuid, 'active', 'application', 'مقبول', 'قائمة ' || i,
       ('00000000-0000-0000-0000-0000000d31' || lpad(i::text, 2, '0'))::uuid, current_date, current_date + 300, case when i = 20 then now() end
  from generate_series(20, 21) i;
update public.members set activated_at = null where application_id = '00000000-0000-0000-0000-0000000d3121';

create temp table _d (k text primary key, v jsonb);
grant select, insert, update on _d to service_role, authenticated;

-- ------------------------------------------------------------------------------------------ access
set local role authenticated;
select throws_ok($$select public.run_membership_daily(true)$$, '42501', null, 'only the server (service role) can run the daily job');
select throws_ok($$select public.leadership_digest()$$, '42501', null, 'or read the digest');
select throws_ok($$select public.claim_due_outbox(5)$$, '42501', null, 'or take outbox rows');
reset role;

-- ------------------------------------------------------------------------------------------ dry run changes nothing
set local role service_role;
insert into _d select 'dry', public.run_membership_daily(true);
reset role;
select is((select status from public.members where id = '00000000-0000-0000-0000-0000000b3001'), 'active', 'a dry run changes nothing');
select is((select v -> 'expired' ->> 0 from _d where k = 'dry'), '00000000-0000-0000-0000-0000000b3001', 'but reports who would expire');

-- ------------------------------------------------------------------------------------------ the real run
set local role service_role;
insert into _d select 'run1', public.run_membership_daily(false);
insert into _d select 'run2', public.run_membership_daily(false);
reset role;

select is((select status from public.members where id = '00000000-0000-0000-0000-0000000b3001'), 'expired', 'a member whose term ended yesterday is expired');
select is(jsonb_array_length((select v -> 'expired' from _d where k = 'run1')), 1, 'once');
select is(jsonb_array_length((select v -> 'expired' from _d where k = 'run2')), 0, 'and never again');
select is((select status from public.members where id = '00000000-0000-0000-0000-0000000b3002'), 'active', 'a member with 30 days left is still active');
select ok(exists (select 1 from public.member_events where member_id = '00000000-0000-0000-0000-0000000b3001' and kind = 'expired'), 'the expiry is in the history');
select ok(exists (select 1 from public.audit_logs where action = 'member.expired' and entity_id = '00000000-0000-0000-0000-0000000b3001'), 'and audited');

-- reminders: the smallest due mark, once
select is((select string_agg((r ->> 'days'), ',' order by r ->> 'member') from jsonb_array_elements((select v -> 'term_reminders' from _d where k = 'run1')) r), '30,7,1,7',
  'reminders go out at 30, 7 and 1 day (a member with 3 days left gets the 7-day mark)');
select is(jsonb_array_length((select v -> 'term_reminders' from _d where k = 'run2')), 0, 'and not a second time');
select is((select count(*)::int from public.term_reminders), 4, 'the sent reminders are recorded per term');

-- leave dates and suspension ends
select is((select status || '/' || end_reason from public.members where id = '00000000-0000-0000-0000-0000000b3007'), 'ended/left', 'an approved leave ends the membership on its day');
select is((select status from public.members where id = '00000000-0000-0000-0000-0000000b3008'), 'active', 'a suspension reaches its end date and the member is reinstated');

-- activation reminders and lapse
select is((select string_agg((r ->> 'day'), ',' order by r ->> 'application') from jsonb_array_elements((select v -> 'activation_reminders' from _d where k = 'run1')) r), '3,6', 'activation reminders on day 3 and day 6');
select is(jsonb_array_length((select v -> 'activation_reminders' from _d where k = 'run2')), 0, 'once each');
select is((select status from public.membership_applications where id = '00000000-0000-0000-0000-0000000d3012'), 'lapsed', 'an acceptance not activated within the deadline lapses');
select is((select status || '/' || end_reason from public.members where application_id = '00000000-0000-0000-0000-0000000d3012'), 'ended/lapsed', 'and the member row ends with that reason');
select is(jsonb_array_length((select v -> 'lapsed' from _d where k = 'run2')), 0, 'lapsing is idempotent');
select is((select status from public.membership_applications where id = '00000000-0000-0000-0000-0000000d3121'), 'lapsed', 'the overdue acceptance in the waiting-list cycle lapses too');

-- promotion: the freed place is held for 24 hours
select is(jsonb_array_length((select v -> 'promote' from _d where k = 'run1')), 0, 'the freed place is held 24 hours before it is offered on');
update public.membership_applications set lapsed_at = now() - interval '25 hours' where id = '00000000-0000-0000-0000-0000000d3121';
set local role service_role;
insert into _d select 'run3', public.run_membership_daily(true);
reset role;
select is((select v -> 'promote' -> 0 ->> 'application' from _d where k = 'run3'), '00000000-0000-0000-0000-0000000d3122', 'after the hold the first waiting applicant (order of submission) is next');
select is(jsonb_array_length((select v -> 'promote' from _d where k = 'run3')), 1, 'and only as many as there are free places');

set local role service_role;
select is((public.system_accept_applications(array['00000000-0000-0000-0000-0000000d3122', '00000000-0000-0000-0000-0000000d3123']::uuid[]))->0->>'ok', 'true', 'the system accepts the next applicant');
select is((public.system_accept_applications(array['00000000-0000-0000-0000-0000000d3122', '00000000-0000-0000-0000-0000000d3123']::uuid[]))->0->>'code', 'INVALID_TRANSITION', 'a second run changes nothing');
reset role;
select is((select decision_note from public.membership_applications where id = '00000000-0000-0000-0000-0000000d3122'), 'activation_lapsed', 'the reason is recorded as activation_lapsed');
select is((select count(*)::int from public.membership_applications where cycle_id = '00000000-0000-0000-0000-00000000c302' and status = 'accepted'), 2, 'capacity is never exceeded');
select is((select status from public.membership_applications where id = '00000000-0000-0000-0000-0000000d3123'), 'waitlisted', 'the next one keeps waiting');
select ok(exists (select 1 from public.members where application_id = '00000000-0000-0000-0000-0000000d3122'), 'the promoted person is a member with a term');

-- restore: only while a place remains
update public.membership_cycles set capacity = 2 where id = '00000000-0000-0000-0000-00000000c302';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a399","role":"authenticated"}', true);
select throws_ok($$select public.restore_application('00000000-0000-0000-0000-0000000d3121')$$, 'P0001', 'CAPACITY_REACHED', 'a lapsed person cannot be restored when the places are full');
reset role;
update public.membership_cycles set capacity = 3 where id = '00000000-0000-0000-0000-00000000c302';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a399","role":"authenticated"}', true);
select is((public.restore_application('00000000-0000-0000-0000-0000000d3121'))->>'ok', 'true', 'but can while a place remains');
select throws_ok($$select public.restore_application('00000000-0000-0000-0000-0000000d3121')$$, 'P0001', 'INVALID_TRANSITION', 'restoring twice is refused');
reset role;
select is((select status from public.members where application_id = '00000000-0000-0000-0000-0000000d3121'), 'active', 'the restored member is active again');

-- activation sync from the auth user
update public.members set activated_at = null where id = '00000000-0000-0000-0000-0000000b3003';
set local role service_role;
select public.run_membership_daily(false);
reset role;
select ok((select activated_at from public.members where id = '00000000-0000-0000-0000-0000000b3003') is not null, 'an account that signed in counts as activated');

-- ------------------------------------------------------------------------------------------ outbox
insert into public.email_outbox (template_key, entity_type, entity_id, state, recipient_email, locale, not_before) values
  ('membership.application_rejected', 'membership_application', 'o1', 's', 'a@example.test', 'ar', now() - interval '1 second'),
  ('membership.application_rejected', 'membership_application', 'o2', 's', 'b@example.test', 'ar', now() + interval '1 hour'),
  ('membership.application_rejected', 'membership_application', 'o3', 's', 'c@example.test', 'ar', now() - interval '1 second');
set local role service_role;
select is((select count(*)::int from public.claim_due_outbox(10)), 2, 'the outbox hands out only the rows that are due');
select is((select count(*)::int from public.claim_due_outbox(10)), 0, 'and never the same row twice');
select is(public.cancel_outbox('membership_application', 'o2'), 1, 'a held e-mail is cancelled (undo)');
select is(public.cancel_outbox('membership_application', 'o1'), 0, 'one that was already taken is not');
select throws_ok($$insert into public.email_outbox (template_key, entity_type, entity_id, state, recipient_email, locale) values ('membership.application_rejected', 'membership_application', 'o1', 's', 'z@example.test', 'ar')$$, '23505', null, 'one outbox row per event: sent once');

-- ------------------------------------------------------------------------------------------ digest
insert into _d select 'digest', public.leadership_digest();
reset role;
select is((select v -> 'recipients' -> 0 ->> 'email' from _d where k = 'digest'), 'leader@dj.example.test', 'the digest goes to the leadership');
select ok((select (v ->> 'waiting_activation')::int from _d where k = 'digest') >= 1, 'it counts the people still to activate');
select ok(jsonb_typeof((select v -> 'promoted' from _d where k = 'digest')) = 'array', 'and lists who was promoted');

select * from finish();
rollback;
