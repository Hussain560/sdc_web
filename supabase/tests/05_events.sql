-- Sprint 05 · EVT-006, EVT-011, TEST-003 — events: lifecycle by role, publish guards, visibility, private links,
-- slug lock, dates, presenters, history and the derived phase truth table.
begin;
select no_plan();

delete from public.role_assignments; -- isolate from dev personas / E2E leftovers (rolled back)

create temp table _c as select (select id from public.committees where slug = 'ai') as a,
                               (select id from public.committees where slug = 'cybersecurity') as b;
create temp table _e (k text primary key, id uuid, updated_at timestamptz);
grant select on _c to authenticated, anon;
grant select, insert, update on _e to authenticated, anon;

insert into auth.users (id, aud, role, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000c001', 'authenticated', 'authenticated', 'admin@example.test',   '{"full_name":"Admin Person One"}'),
  ('00000000-0000-0000-0000-00000000c002', 'authenticated', 'authenticated', 'leader@example.test',  '{"full_name":"Leader Person Two"}'),
  ('00000000-0000-0000-0000-00000000c003', 'authenticated', 'authenticated', 'heada@example.test',   '{"full_name":"Head A Person"}'),
  ('00000000-0000-0000-0000-00000000c004', 'authenticated', 'authenticated', 'headb@example.test',   '{"full_name":"Head B Person"}'),
  ('00000000-0000-0000-0000-00000000c005', 'authenticated', 'authenticated', 'membera@example.test', '{"full_name":"Member A Person"}'),
  ('00000000-0000-0000-0000-00000000c006', 'authenticated', 'authenticated', 'plain@example.test',   '{"full_name":"Plain User Person"}'),
  ('00000000-0000-0000-0000-00000000c007', 'authenticated', 'authenticated', 'founder@example.test', '{"full_name":"Founder Person One"}'),
  ('00000000-0000-0000-0000-00000000c008', 'authenticated', 'authenticated', 'deputya@example.test', '{"full_name":"Deputy A Person"}');

insert into public.role_assignments (user_id, role_key) values
  ('00000000-0000-0000-0000-00000000c001', 'system_admin'),
  ('00000000-0000-0000-0000-00000000c002', 'community_leader'),
  ('00000000-0000-0000-0000-00000000c007', 'founder');
insert into public.role_assignments (user_id, role_key, committee_id)
select '00000000-0000-0000-0000-00000000c003'::uuid, 'committee_head', a from _c
union all select '00000000-0000-0000-0000-00000000c004'::uuid, 'committee_head', b from _c
union all select '00000000-0000-0000-0000-00000000c005'::uuid, 'committee_member', a from _c
union all select '00000000-0000-0000-0000-00000000c008'::uuid, 'committee_deputy', a from _c;

-- =============================================================================== phase truth table (pure function)
-- Event: 10 Nov 2026 18:00–20:00 Riyadh (UTC+3), registration closes 9 Nov 23:59, 60 seats.
select is(private.event_phase('published', '2026-11-10', '2026-11-10', '18:00', '20:00', null, '2026-11-09 20:59:00+00', 60, 10, true, '2026-11-01 09:00+00'), 'registration_open', 'phase: registration open before the deadline');
select is(private.event_phase('published', '2026-11-10', '2026-11-10', '18:00', '20:00', '2026-11-05 00:00+00', '2026-11-09 20:59:00+00', 60, 10, true, '2026-11-01 09:00+00'), 'announced', 'phase: announced before registration opens');
select is(private.event_phase('published', '2026-11-10', '2026-11-10', '18:00', '20:00', null, '2026-11-09 20:59:00+00', 60, 10, true, '2026-11-09 21:30+00'), 'registration_closed', 'phase: closed after the deadline, before the start');
select is(private.event_phase('published', '2026-11-10', '2026-11-10', '18:00', '20:00', null, '2026-11-09 20:59:00+00', 60, 10, true, '2026-11-10 16:00+00'), 'in_progress', 'phase: in progress during the event');
select is(private.event_phase('published', '2026-11-10', '2026-11-10', '18:00', '20:00', null, '2026-11-09 20:59:00+00', 60, 10, true, '2026-11-10 18:00+00'), 'ended', 'phase: ended after the last day');
select is(private.event_phase('published', '2026-11-10', '2026-11-10', '18:00', '20:00', null, '2026-11-10 20:59:00+00', 60, 10, true, '2026-11-10 16:00+00'), 'registration_open', 'phase: an extended deadline reopens registration while in progress (KFUCS rule)');
select is(private.event_phase('published', '2026-11-10', '2026-11-10', '18:00', '20:00', null, '2026-11-09 20:59:00+00', 60, 60, true, '2026-11-01 09:00+00'), 'registration_closed', 'phase: full + auto-close closes registration');
select is(private.event_phase('published', '2026-11-10', '2026-11-10', '18:00', '20:00', null, '2026-11-09 20:59:00+00', 60, 60, false, '2026-11-01 09:00+00'), 'registration_open', 'phase: full without auto-close stays open');
select is(private.event_phase('published', null, null, null, null, null, null, null, 0, true, '2026-11-01 09:00+00'), 'announced', 'phase: no date yet is announced');
select is(private.event_phase('published', '2026-11-10', '2026-11-12', null, null, null, null, null, 0, true, '2026-11-10 10:00+00'), 'registration_open', 'phase: no deadline = open until the end of the first day');
select is(private.event_phase('published', '2026-11-10', '2026-11-12', null, null, null, null, null, 0, true, '2026-11-11 09:00+00'), 'in_progress', 'phase: multi-day event is in progress on day 2');
select is(private.event_phase('draft', '2026-11-10', '2026-11-10', null, null, null, null, null, 0, true, '2026-11-01 00:00+00'), null, 'phase: drafts have no phase');
select is(private.event_phase('cancelled', '2026-11-10', '2026-11-10', null, null, null, null, null, 0, true, '2026-11-01 00:00+00'), 'cancelled', 'phase: cancelled');
select is(private.event_phase('completed', '2026-11-10', '2026-11-10', null, null, null, null, null, 0, true, '2026-11-01 00:00+00'), 'ended', 'phase: completed events are ended');
-- Riyadh vs UTC around midnight: 21:00Z on 9 Nov is already 00:00 on 10 Nov in Riyadh
select is(private.event_phase('published', '2026-11-10', '2026-11-10', null, null, null, null, null, 0, true, '2026-11-09 21:00+00'), 'registration_open', 'phase: Riyadh date boundary (first day, no times)');

set local role authenticated;

-- =============================================================================== committee member: drafts only
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c005","role":"authenticated"}', true);
insert into _e select 'main', (r ->> 'id')::uuid, (r ->> 'updated_at')::timestamptz
  from (select public.save_event(null, jsonb_build_object(
    'committee_id', (select a from _c), 'type', 'workshop', 'title_ar', 'ورشة تجريبية', 'title_en', 'Test Workshop',
    'schedule_type', 'single_day', 'start_date', '2026-12-10', 'start_time', '18:00', 'end_time', '20:00',
    'location_mode', 'online', 'goals', '{"ar":["هدف أول"],"en":["First goal"]}'::jsonb)) as r) s;
select ok((select id from _e where k = 'main') is not null, 'a committee member can create a draft in their committee');
select is((select status from public.events where id = (select id from _e where k = 'main')), 'draft', 'new events are drafts');
select is((select slug from public.events where id = (select id from _e where k = 'main')), 'test-workshop', 'the slug is generated from the English title');
select is((select count(*)::int from public.event_dates where event_id = (select id from _e where k = 'main')), 1, 'a single-day event gets one event_dates row');
select throws_ok($$select public.save_event(null, jsonb_build_object('committee_id', (select b from _c), 'type', 'meeting', 'title_ar', 'اجتماع'))$$,
  'P0001', 'FORBIDDEN', 'a member cannot create events for another committee');
select throws_ok($$select public.transition_event((select id from _e where k = 'main'), 'submit')$$, 'P0001', 'FORBIDDEN', 'a committee member cannot submit');
select throws_ok($$select public.transition_event((select id from _e where k = 'main'), 'approve')$$, 'P0001', 'FORBIDDEN', 'a committee member cannot approve');
select throws_ok($$update public.events set title_ar = 'تلاعب'$$, '42501', null, 'there is no direct UPDATE path to events');
select throws_ok($$delete from public.events$$, '42501', null, 'there is no direct DELETE path to events');
select throws_ok($$select public.save_event((select id from _e where k = 'main'), '{"title_ar":"عنوان جديد"}'::jsonb, '2000-01-01'::timestamptz)$$,
  'P0001', 'STALE_DATA', 'a stale copy is rejected (optimistic concurrency)');
select lives_ok($$select public.save_event((select id from _e where k = 'main'), '{"title_ar":"عنوان معدل"}'::jsonb)$$, 'a member can edit their draft');

-- =============================================================================== head A: submit with guards
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c003","role":"authenticated"}', true);
select throws_ok($$select public.transition_event((select id from _e where k = 'main'), 'submit')$$, 'P0001', 'INCOMPLETE:group_link', 'submit needs the group link');
select lives_ok($$select public.save_event((select id from _e where k = 'main'), '{"group_link":"https://chat.example/group","meeting_url":"https://meet.example/x","organizer_notes":"internal"}'::jsonb)$$,
  'the head saves the private links');
select is(public.transition_event((select id from _e where k = 'main'), 'submit', 'ready'), 'pending_review', 'the head submits for review');
select throws_ok($$select public.save_event((select id from _e where k = 'main'), '{"title_ar":"لا يمكن"}'::jsonb)$$, 'P0001', 'NOT_EDITABLE', 'a pending_review event is read-only');
select is(public.transition_event((select id from _e where k = 'main'), 'withdraw'), 'draft', 'the head can withdraw');
select is(public.transition_event((select id from _e where k = 'main'), 'submit'), 'pending_review', 'and submit again');
select throws_ok($$select public.transition_event((select id from _e where k = 'main'), 'approve')$$, 'P0001', 'FORBIDDEN', 'a head cannot approve (Q-005 default: the leader approves)');
select throws_ok($$select public.transition_event((select id from _e where k = 'main'), 'cancel', 'x')$$, 'P0001', 'INVALID_TRANSITION', 'cannot cancel an unpublished event');

-- visibility
select is((select count(*)::int from public.events where id = (select id from _e where k = 'main')), 1, 'the head sees their committee''s pending event');
select is((select count(*)::int from public.event_private_details where event_id = (select id from _e where k = 'main')), 1, 'the head reads the private links');

-- =============================================================================== other committee head + visibility
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c004","role":"authenticated"}', true);
select is((select count(*)::int from public.events), 0, 'a head of B cannot see committee A''s unpublished event');
select is((select count(*)::int from public.event_private_details), 0, 'a head of B cannot read committee A''s private links');
select throws_ok($$select public.transition_event((select id from _e where k = 'main'), 'withdraw')$$, 'P0001', 'NOT_FOUND', 'out-of-scope events look non-existent (no existence leak)');
select is((select count(*)::int from public.event_history((select id from _e where k = 'main'))), 0, 'a head of B gets no history of A''s event');

-- plain user
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c006","role":"authenticated"}', true);
select is((select count(*)::int from public.events), 0, 'a plain user sees no drafts');
select throws_ok($$select public.save_event(null, jsonb_build_object('committee_id', (select a from _c), 'type', 'talk', 'title_ar', 'محاضرة'))$$, 'P0001', 'FORBIDDEN', 'a plain user cannot create events');

-- founder: read-only oversight (Q-032 default)
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c007","role":"authenticated"}', true);
select is((select count(*)::int from public.events where id = (select id from _e where k = 'main')), 1, 'a founder sees the pipeline (events.view_drafts)');
select throws_ok($$select public.save_event((select id from _e where k = 'main'), '{"title_ar":"لا"}'::jsonb)$$, 'P0001', 'FORBIDDEN', 'a founder cannot edit');
select throws_ok($$select public.transition_event((select id from _e where k = 'main'), 'approve')$$, 'P0001', 'FORBIDDEN', 'a founder cannot approve');
select is((select count(*)::int from public.event_private_details), 0, 'a founder cannot read private links');

-- =============================================================================== leader: review
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c002","role":"authenticated"}', true);
select throws_ok($$select public.transition_event((select id from _e where k = 'main'), 'request_changes', 'short')$$, 'P0001', 'NOTE_TOO_SHORT', 'a change request needs a note of at least 10 characters');
select is(public.transition_event((select id from _e where k = 'main'), 'request_changes', 'Please add the prerequisites'), 'changes_requested', 'the leader requests changes');
select is((select review_note from public.events where id = (select id from _e where k = 'main')), 'Please add the prerequisites', 'the note is stored');
select is((select count(*)::int from public.events where id = (select id from _e where k = 'main')), 1, 'the leader sees every committee''s events');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c003","role":"authenticated"}', true);
select is(public.transition_event((select id from _e where k = 'main'), 'submit'), 'pending_review', 'the head resubmits after changes were requested');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c002","role":"authenticated"}', true);
-- remove the group link to prove the publish guard
select is(public.transition_event((select id from _e where k = 'main'), 'approve', 'looks good'), 'published', 'the leader approves and publishes');
select ok((select published_at is not null from public.events where id = (select id from _e where k = 'main')), 'published_at is set');
select throws_ok($$select public.transition_event((select id from _e where k = 'main'), 'approve')$$, 'P0001', 'INVALID_TRANSITION', 'approving twice is an invalid transition');
select throws_ok($$select public.save_event((select id from _e where k = 'main'), '{"slug":"changed-slug"}'::jsonb)$$, 'P0001', 'SLUG_LOCKED', 'the slug is locked after the first publish');

-- fast-track: a draft approved directly, but publish guards still apply
insert into _e select 'fast', (r ->> 'id')::uuid, (r ->> 'updated_at')::timestamptz
  from (select public.save_event(null, jsonb_build_object('committee_id', (select b from _c), 'type', 'meetup', 'title_ar', 'لقاء سريع',
    'start_date', '2026-12-20', 'location_mode', 'online')) as r) s;
select throws_ok($$select public.transition_event((select id from _e where k = 'fast'), 'approve')$$, 'P0001', 'PUBLISH_GUARD:group_link', 'publish guard: a group link is required');
select lives_ok($$select public.save_event((select id from _e where k = 'fast'), '{"group_link":"https://chat.example/fast"}'::jsonb)$$, 'add the group link');
select throws_ok($$select public.transition_event((select id from _e where k = 'fast'), 'approve')$$, 'P0001', 'PUBLISH_GUARD:goals', 'publish guard: at least one Arabic goal');
select lives_ok($$select public.save_event((select id from _e where k = 'fast'), '{"goals":{"ar":["هدف"],"en":[]}}'::jsonb)$$, 'add a goal');
select is(public.transition_event((select id from _e where k = 'fast'), 'approve'), 'published', 'the approver publishes a draft directly (fast-track)');


-- online event does not need a location; in-person does
insert into _e select 'inperson', (r ->> 'id')::uuid, (r ->> 'updated_at')::timestamptz
  from (select public.save_event(null, jsonb_build_object('committee_id', (select a from _c), 'type', 'workshop', 'title_ar', 'ورشة حضورية',
    'start_date', '2026-12-22', 'location_mode', 'in_person', 'group_link', 'https://chat.example/ip', 'goals', '{"ar":["هدف"],"en":[]}'::jsonb)) as r) s;
select throws_ok($$select public.transition_event((select id from _e where k = 'inperson'), 'approve')$$, 'P0001', 'PUBLISH_GUARD:location', 'publish guard: an in-person event needs a location');

-- =============================================================================== public read model + private details
reset role;
set local role anon;
select is((select count(*)::int from public.events), 2, 'anon sees only the two published events');
select ok(not exists (select 1 from public.events where status <> 'published'), 'anon never sees drafts');
select throws_ok($$select * from public.event_private_details$$, '42501', null, 'anon cannot read private links');
select is((select count(*)::int from public.public_events), 2, 'the public view lists published events');
select ok((select phase is not null from public.public_events where slug = 'test-workshop'), 'the public view carries the derived phase');
select ok(not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'public_events' and column_name in ('group_link', 'meeting_url', 'review_note', 'submission_note')), 'the public view exposes no private or editorial columns');
select throws_ok($$select public.save_event(null, '{}'::jsonb)$$, '42501', null, 'anon cannot call save_event');
reset role;

-- =============================================================================== cancel, complete, archive
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c003","role":"authenticated"}', true);
select throws_ok($$select public.transition_event((select id from _e where k = 'main'), 'cancel', '  ')$$, 'P0001', 'REASON_REQUIRED', 'cancelling needs a reason');
select throws_ok($$select public.transition_event((select id from _e where k = 'main'), 'complete')$$, 'P0001', 'EVENT_NOT_ENDED', 'an event cannot be completed before it ended');
-- time travel as the table owner
reset role;
update public.event_dates set event_date = '2026-01-05' where event_id = (select id from _e where k = 'main');
update public.events set start_date = '2026-01-05', end_date = '2026-01-05' where id = (select id from _e where k = 'main');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c003","role":"authenticated"}', true);
select is(public.transition_event((select id from _e where k = 'main'), 'complete'), 'completed', 'the head completes an ended event');
select is(public.transition_event((select id from _e where k = 'main'), 'archive'), 'archived', 'and archives it');
select throws_ok($$select public.transition_event((select id from _e where k = 'fast'), 'cancel', 'Not our event')$$, 'P0001', 'FORBIDDEN', 'a head of A cannot cancel committee B''s event');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c004","role":"authenticated"}', true);
select is(public.transition_event((select id from _e where k = 'fast'), 'cancel', 'Speaker unavailable'), 'cancelled', 'the head of B cancels with a reason');
select is((select cancel_reason from public.events where id = (select id from _e where k = 'fast')), 'Speaker unavailable', 'the reason is stored');

-- =============================================================================== drafts: delete, dates, presenters
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c003","role":"authenticated"}', true);
insert into _e select 'dates', (r ->> 'id')::uuid, (r ->> 'updated_at')::timestamptz
  from (select public.save_event(null, jsonb_build_object('committee_id', (select a from _c), 'type', 'bootcamp', 'title_ar', 'معسكر',
    'schedule_type', 'consecutive_range', 'start_date', '2026-12-01', 'end_date', '2026-12-03')) as r) s;
select is((select count(*)::int from public.event_dates where event_id = (select id from _e where k = 'dates')), 3, 'a consecutive range creates one row per day');
select lives_ok($$select public.save_event((select id from _e where k = 'dates'), '{"schedule_type":"specific_dates","dates":["2026-12-05","2026-12-07","2026-12-07","2026-12-11"]}'::jsonb)$$, 'switch to specific dates');
select is((select count(*)::int from public.event_dates where event_id = (select id from _e where k = 'dates')), 3, 'specific dates replace the rows (duplicates collapsed)');
select is((select start_date::text from public.events where id = (select id from _e where k = 'dates')), '2026-12-05', 'start_date follows the earliest specific date');
select is((select end_date::text from public.events where id = (select id from _e where k = 'dates')), '2026-12-11', 'end_date follows the latest specific date');
select lives_ok($$select public.save_event((select id from _e where k = 'dates'), '{"presenters":[{"guest_name_ar":"م. أحمد","guest_title_ar":"مهندس","role":"judge"},{"guest_name_ar":"سارة","role":"presenter"}]}'::jsonb)$$, 'guest presenters are saved');
select is((select count(*)::int from public.event_presenters where event_id = (select id from _e where k = 'dates')), 2, 'two presenters stored');
select is((select role from public.event_presenters where event_id = (select id from _e where k = 'dates') and sort_order = 0), 'judge', 'presenter order is kept');
select throws_ok($$select public.save_event((select id from _e where k = 'dates'), jsonb_build_object('presenters', (select jsonb_agg(jsonb_build_object('guest_name_ar', 'x' || i)) from generate_series(1, 11) i)))$$,
  'P0001', 'VALIDATION_FAILED', 'at most 10 presenters');
select throws_ok($$select public.save_event((select id from _e where k = 'dates'), '{"slug":"test-workshop"}'::jsonb)$$, 'P0001', 'SLUG_TAKEN', 'a taken slug is rejected');
select is((select total from public.event_status_counts where status = 'draft'), (select count(*)::int from public.events where status = 'draft'), 'status counts match the caller''s visible rows');
select lives_ok($$select public.delete_event_draft((select id from _e where k = 'dates'))$$, 'the head deletes a never-published draft');
select is((select count(*)::int from public.event_dates where event_id = (select id from _e where k = 'dates')), 0, 'its dates are removed with it');
select throws_ok($$select public.delete_event_draft((select id from _e where k = 'fast'))$$, 'P0001', 'NOT_FOUND', 'out-of-scope drafts cannot be deleted (and are invisible)');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c002","role":"authenticated"}', true);
select throws_ok($$select public.delete_event_draft((select id from _e where k = 'main'))$$, 'P0001', 'NOT_DELETABLE', 'a published (now archived) event cannot be deleted');

-- history for people who can see the event
select cmp_ok((select count(*)::int from public.event_history((select id from _e where k = 'main'))), '>=', 8, 'the leader reads the full history');
select ok((select bool_or(action = 'event.changes_requested') from public.event_history((select id from _e where k = 'main'))), 'history includes the change request');
select ok((select bool_or(summary ->> 'note' = 'Please add the prerequisites') from public.event_history((select id from _e where k = 'main'))), 'history carries the note');

-- committee deputy: edits and submits but cannot cancel or delete another way
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c008","role":"authenticated"}', true);
insert into _e select 'deputy', (r ->> 'id')::uuid, (r ->> 'updated_at')::timestamptz
  from (select public.save_event(null, jsonb_build_object('committee_id', (select a from _c), 'type', 'talk', 'title_ar', 'محاضرة النائب')) as r) s;
select ok((select id from _e where k = 'deputy') is not null, 'a deputy can create a draft');
select throws_ok($$select public.transition_event((select id from _e where k = 'deputy'), 'cancel', 'no')$$, 'P0001', 'FORBIDDEN', 'a deputy cannot cancel');

reset role;
select ok(exists (select 1 from public.audit_logs where entity_id = (select id::text from _e where k = 'fast') and action = 'event.approved' and (summary ->> 'direct')::boolean), 'fast-track approval is audited as direct');

select * from finish();
rollback;
