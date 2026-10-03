-- Sprint 11 · RPT-001, RPT-002 — every report metric against a fixture with known answers, the period rules,
-- the scope (a head cannot read another committee), small-group masking, the queues and my activity.
begin;
select no_plan();

delete from public.role_assignments;
delete from public.certificates;
delete from public.event_registrations;
delete from public.events; -- isolate from dev data (rolled back)
delete from public.members;
delete from public.membership_applications;
delete from public.membership_cycles;
delete from public.articles;

create temp table _c as select (select id from public.committees where slug = 'ai') as a,
                               (select id from public.committees where slug = 'cybersecurity') as b;
grant select on _c to authenticated;

insert into auth.users (id, aud, role, email, raw_user_meta_data)
select ('00000000-0000-0000-0000-00000000' || lpad(n::text, 4, '0'))::uuid, 'authenticated', 'authenticated', 'u' || n || '@rep.example.test', jsonb_build_object('full_name', 'Report User ' || n)
from generate_series(1101, 1120) n;
-- 1101 leader · 1102 head ai · 1103 head cyber · 1104 plain · 1105 founder · 1111..1116 members · 1117..1120 applicants
insert into public.role_assignments (user_id, role_key) values
  ('00000000-0000-0000-0000-000000001101', 'community_leader'),
  ('00000000-0000-0000-0000-000000001105', 'founder');
insert into public.role_assignments (user_id, role_key, committee_id)
select '00000000-0000-0000-0000-000000001102'::uuid, 'committee_head', a from _c
union all select '00000000-0000-0000-0000-000000001103'::uuid, 'committee_head', b from _c;

-- events: E1 ai 9–10 Mar 2026 (attendance signed off) · E2 cyber 1 May 2026 (not signed off) · E3 ai 2027 · E4 ai Jun 2025 (previous period)
insert into public.events (id, slug, committee_id, type, status, title_ar, title_en, schedule_type, start_date, end_date, location_mode, attendance_finalized_at, published_at) values
  ('00000000-0000-0000-0000-0000000e1001', 'rep-e1', (select a from _c), 'bootcamp', 'published', 'فعالية ١', 'Event One', 'consecutive_range', '2026-03-09', '2026-03-10', 'online', now(), now()),
  ('00000000-0000-0000-0000-0000000e1002', 'rep-e2', (select b from _c), 'workshop', 'published', 'فعالية ٢', 'Event Two', 'single_day', '2026-05-01', '2026-05-01', 'online', null, now()),
  ('00000000-0000-0000-0000-0000000e1003', 'rep-e3', (select a from _c), 'workshop', 'published', 'فعالية ٣', 'Event Three', 'single_day', '2027-03-01', '2027-03-01', 'online', null, now()),
  ('00000000-0000-0000-0000-0000000e1004', 'rep-e4', (select a from _c), 'workshop', 'completed', 'فعالية ٤', 'Event Four', 'single_day', '2025-06-01', '2025-06-01', 'online', now(), now());

insert into public.event_registrations (event_id, user_id, status, attendance_percent, attendance_result, was_member, full_name_snapshot, email_snapshot, created_at) values
  ('00000000-0000-0000-0000-0000000e1001', '00000000-0000-0000-0000-000000001111', 'accepted', 100, 'attended', true,  'R1', 'r1@x.test', '2026-02-20'),
  ('00000000-0000-0000-0000-0000000e1001', '00000000-0000-0000-0000-000000001112', 'accepted', 100, 'attended', true,  'R2', 'r2@x.test', '2026-02-20'),
  ('00000000-0000-0000-0000-0000000e1001', '00000000-0000-0000-0000-000000001113', 'accepted', 50,  'attended', false, 'R3', 'r3@x.test', '2026-02-21'),
  ('00000000-0000-0000-0000-0000000e1001', '00000000-0000-0000-0000-000000001114', 'accepted', 0,   'absent',   false, 'R4', 'r4@x.test', '2026-02-21'),
  ('00000000-0000-0000-0000-0000000e1001', '00000000-0000-0000-0000-000000001115', 'rejected', null, null,       false, 'R5', 'r5@x.test', '2026-02-22'),
  ('00000000-0000-0000-0000-0000000e1001', '00000000-0000-0000-0000-000000001116', 'pending',  null, null,       true,  'R6', 'r6@x.test', '2026-02-22'),
  ('00000000-0000-0000-0000-0000000e1002', '00000000-0000-0000-0000-000000001111', 'accepted', null, null,       true,  'R7', 'r7@x.test', '2026-04-20'),
  ('00000000-0000-0000-0000-0000000e1002', '00000000-0000-0000-0000-000000001112', 'accepted', null, null,       true,  'R8', 'r8@x.test', '2026-04-20'),
  ('00000000-0000-0000-0000-0000000e1002', '00000000-0000-0000-0000-000000001113', 'waitlisted', null, null,     false, 'R9', 'r9@x.test', '2026-04-21'),
  ('00000000-0000-0000-0000-0000000e1004', '00000000-0000-0000-0000-000000001111', 'accepted', 100, 'attended', true,  'P1', 'p1@x.test', '2025-05-10'),
  ('00000000-0000-0000-0000-0000000e1004', '00000000-0000-0000-0000-000000001112', 'accepted', 100, 'attended', true,  'P2', 'p2@x.test', '2025-05-10');

insert into public.articles (slug, committee_id, status, title_ar, body_ar, published_at) values
  ('rep-a1', (select a from _c), 'published', 'مقال أول', 'نص', '2026-03-01'),
  ('rep-a2', (select a from _c), 'published', 'مقال ثان', 'نص', '2026-06-01'),
  ('rep-a3', (select b from _c), 'published', 'مقال ثالث', 'نص', '2025-06-01'),
  ('rep-a4', (select a from _c), 'in_review', 'مقال قيد المراجعة', 'نص', null);

-- six active members: five students and one graduate (so one group is large enough to show and one is masked)
insert into public.members (user_id, joined_via, first_name_ar, academic_status, status, joined_at)
select ('00000000-0000-0000-0000-00000000' || lpad(n::text, 4, '0'))::uuid, 'manual', 'عضو ' || n,
       case when n = 1116 then 'graduate' else 'student' end, 'active', '2026-02-01'
from generate_series(1111, 1116) n;

-- applications: one cycle in the period with four applicants (accepted, rejected, waitlisted, still in review)
insert into public.membership_cycles (id, name_ar, opens_at, closes_at, status) values
  ('00000000-0000-0000-0000-0000000c1001', 'دورة تقارير', '2026-01-05', '2026-01-25', 'completed');
insert into public.membership_applications (cycle_id, user_id, status, full_name_ar, academic_status, consent_version, submitted_at)
select '00000000-0000-0000-0000-0000000c1001'::uuid, ('00000000-0000-0000-0000-00000000' || lpad(n::text, 4, '0'))::uuid,
       (array['accepted', 'rejected', 'waitlisted', 'submitted'])[n - 1116], 'متقدم ' || n, 'student', 'v1', '2026-01-10'
from generate_series(1117, 1120) n;

set local role authenticated;

-- =============================================================================== community metrics (leader)
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001101","role":"authenticated"}', true);
create temp table _s as select public.community_stats('2026-01-01', '2026-12-31') as j;
grant select on _s to authenticated;
select is((select j #>> '{current,events_held}' from _s), '2', 'events held: published or completed events whose last date is in the period');
select is((select j #>> '{current,registrations}' from _s), '9', 'registrations created in the period');
select is((select j #>> '{current,accepted}' from _s), '6', 'accepted registrations');
select is((select j #>> '{current,acceptance_rate}' from _s), '86', 'acceptance rate = accepted ÷ (accepted + rejected) = 6/7');
select is((select j #>> '{current,attendance_rate}' from _s), '63', 'attendance rate = mean percentage of events with finalized attendance only (62.5 → 63)');
select is((select j #>> '{current,attendance_events}' from _s), '1', 'only one event has finalized attendance in the period (the other is "not recorded")');
select is((select j #>> '{current,member_share}' from _s), '56', 'member participation = 5 of 9 registrations');
select is((select j #>> '{current,articles_published}' from _s), '2', 'articles published in the period');
select is((select j #>> '{current,active_members}' from _s), '6', 'active members at the period end');
select is((select j #>> '{current,new_members}' from _s), '6', 'new members in the period');
select is((select j #>> '{previous,events_held}' from _s), '1', 'the previous period has its own metrics (for the deltas)');
select is((select j #>> '{previous,registrations}' from _s), '2', 'previous registrations');
select is((select j #>> '{previous,attendance_rate}' from _s), '100', 'previous attendance rate');
select is((select j #>> '{funnel,submitted}' from _s), '4', 'funnel: applications submitted in the period');
select is((select j #>> '{funnel,accepted}' from _s), '1', 'funnel: accepted');
select is((select j #>> '{funnel,in_review}' from _s), '1', 'funnel: still in review');
select is((select jsonb_array_length(j -> 'monthly') from _s), 12, 'one monthly row per month of the period');
select is((select j -> 'monthly' -> 1 ->> 'registrations' from _s), '6', 'February registrations');
select is((select j -> 'monthly' -> 2 ->> 'attendance' from _s), '63', 'March attendance (event finalized)');
select is((select j -> 'monthly' -> 4 ->> 'attendance' from _s), null, 'a month without finalized attendance shows none, not 0');
select is((select m #>> '{metrics,registrations}' from _s, jsonb_array_elements(j -> 'committees') m where m ->> 'slug' = 'ai'), '6', 'the AI committee row');
select is((select m #>> '{metrics,registrations}' from _s, jsonb_array_elements(j -> 'committees') m where m ->> 'slug' = 'cybersecurity'), '3', 'the Cybersecurity committee row');
select is((select m #>> '{count}' from _s, jsonb_array_elements(j -> 'academic_status') m where m ->> 'key' = 'student'), '5', 'a group of five is shown');
select is((select m -> 'count' from _s, jsonb_array_elements(j -> 'academic_status') m where m ->> 'key' = 'graduate'), 'null'::jsonb, 'a group under five is masked (RP-2 spirit)');

-- period rules
select throws_ok($$select public.community_stats('2026-12-31', '2026-01-01')$$, 'P0001', 'INVALID_PERIOD', 'the end must not precede the start');
select throws_ok($$select public.community_stats('2010-01-01', '2026-01-01')$$, 'P0001', 'INVALID_PERIOD', 'the period is capped at five years');
select is((public.community_stats('2030-01-01', '2030-12-31') #>> '{current,acceptance_rate}'), null, 'a period without data has no rate (not 0 %)');

-- =============================================================================== scope
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001105","role":"authenticated"}', true);
select ok((public.community_stats('2026-01-01', '2026-12-31') #>> '{current,registrations}') = '9', 'a founder reads the community dashboard');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001102","role":"authenticated"}', true);
select throws_ok($$select public.community_stats('2026-01-01', '2026-12-31')$$, 'P0001', 'FORBIDDEN', 'a committee head cannot read the community dashboard');
create temp table _h as select public.committee_stats((select a from _c), '2026-01-01', '2026-12-31') as j;
grant select on _h to authenticated;
select is((select j #>> '{current,registrations}' from _h), '6', 'a head reads their committee: registrations');
select is((select j #>> '{current,events_held}' from _h), '1', 'events held');
select is((select j #>> '{current,attendance_rate}' from _h), '63', 'attendance rate');
select is((select j #>> '{current,committee_size}' from _h), '1', 'committee size = active positions');
select is((select j #>> '{current,articles_published}' from _h), '2', 'articles of the committee');
select is((select jsonb_array_length(j -> 'events') from _h), 1, 'the committee table lists its events in the period');
select is((select j #>> '{events,0,attendance}' from _h), '63', 'with their attendance');
select throws_ok($$select public.committee_stats((select b from _c), '2026-01-01', '2026-12-31')$$, 'P0001', 'NOT_FOUND', 'a head cannot read another committee');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001101","role":"authenticated"}', true);
select ok((public.committee_stats((select b from _c), '2026-01-01', '2026-12-31') #>> '{current,registrations}') = '3', 'the leader reads any committee');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001104","role":"authenticated"}', true);
select throws_ok($$select public.committee_stats((select a from _c), '2026-01-01', '2026-12-31')$$, 'P0001', 'NOT_FOUND', 'a plain user reads nothing');
set local role anon;
select throws_ok($$select public.community_stats('2026-01-01', '2026-12-31')$$, '42501', null, 'anon cannot call the report functions');

-- =============================================================================== queues
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001101","role":"authenticated"}', true);
select is((public.pending_queues() ->> 'articles_in_review')::int, 1, 'the leader sees the article waiting for review');
select is((public.pending_queues() ->> 'applications_open')::int, 1, 'and the application still in review');
select is((public.pending_queues() ->> 'registrations_pending')::int, 1, 'and the pending registration');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001103","role":"authenticated"}', true);
select is((public.pending_queues() ->> 'registrations_pending')::int, 0, 'the head of Cybersecurity sees none of the AI registrations');
select is((public.pending_queues() ->> 'articles_in_review')::int, 0, 'nor the AI article');
select is((public.pending_queues() ->> 'applications_open')::int, 0, 'nor applications (no membership.review)');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001102","role":"authenticated"}', true);
select is((public.pending_queues() ->> 'articles_in_review')::int, 1, 'the head of AI sees their article waiting');

-- =============================================================================== dashboard summary and my activity
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001101","role":"authenticated"}', true);
select is((public.dashboard_summary() ->> 'active_members')::int, 6, 'the dashboard shows active members to people with the community report');
select is((public.dashboard_summary() ->> 'upcoming_events')::int, 1, 'and the upcoming events in scope (E3)');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001103","role":"authenticated"}', true);
select is(public.dashboard_summary() ->> 'active_members', null, 'a head does not get the member total');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001111","role":"authenticated"}', true);
select is(jsonb_array_length(public.my_activity() -> 'registrations'), 3, 'my activity lists my own registrations');
select is((public.my_activity() #>> '{member,status}'), 'active', 'and my member status');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000001117","role":"authenticated"}', true);
select is((public.my_activity() #>> '{application,status}'), 'accepted', 'and my latest application');
select is(jsonb_array_length(public.my_activity() -> 'registrations'), 0, 'without anyone else''s registrations');

select * from finish();
rollback;
