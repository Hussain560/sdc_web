-- Sprint 10 · REG-006, PUB-003, REG-008 — attendance (ADR-012): sessions, QR / online / manual check-in, the one
-- percentage formula (KFUCS F-19), orphaned sessions (F-20), duplicate check-ins (F-23), completion sign-off (F-36),
-- corrections, event roll-up and certificates.
begin;
select no_plan();

delete from public.role_assignments;
delete from public.certificates;
delete from public.event_registrations;
delete from public.events where legacy_id is not null;

create temp table _c as select (select id from public.committees where slug = 'ai') as a,
                               (select id from public.committees where slug = 'cybersecurity') as b;
-- The audit log is append-only: counts are compared with what was already there (E2E runs leave rows behind).
create temp table _audit0 as select action, count(*)::int as n from public.audit_logs group by action;
create temp table _s (k text primary key, id uuid);
grant select on _c to authenticated, anon;
grant select, insert, update on _s to authenticated, anon;
-- The formula is private (exposed through views and the roll-up); the test reads it through a definer wrapper.
create function public.t_pct(uuid) returns smallint language sql security definer as $$ select private.attendance_percent($1) $$; -- rolled back with the test
grant execute on function public.t_pct(uuid) to authenticated;

insert into auth.users (id, aud, role, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000f001', 'authenticated', 'authenticated', 'leader10@example.test', '{"full_name":"Leader Person Ten"}'),
  ('00000000-0000-0000-0000-00000000f002', 'authenticated', 'authenticated', 'heada10@example.test',  '{"full_name":"Head A Person Ten"}'),
  ('00000000-0000-0000-0000-00000000f003', 'authenticated', 'authenticated', 'headb10@example.test',  '{"full_name":"Head B Person Ten"}'),
  ('00000000-0000-0000-0000-00000000f004', 'authenticated', 'authenticated', 'membera10@example.test','{"full_name":"Member A Person Ten"}'),
  ('00000000-0000-0000-0000-00000000f011', 'authenticated', 'authenticated', 'p1@example.test',       '{"full_name":"Participant One Ten"}'),
  ('00000000-0000-0000-0000-00000000f012', 'authenticated', 'authenticated', 'p2@example.test',       '{"full_name":"Participant Two Ten"}'),
  ('00000000-0000-0000-0000-00000000f013', 'authenticated', 'authenticated', 'p3@example.test',       '{"full_name":"Participant Three Ten"}'),
  ('00000000-0000-0000-0000-00000000f014', 'authenticated', 'authenticated', 'p4@example.test',       '{"full_name":"Participant Four Ten"}'),
  ('00000000-0000-0000-0000-00000000f015', 'authenticated', 'authenticated', 'p5@example.test',       '{"full_name":"Participant Five Ten"}');

insert into public.role_assignments (user_id, role_key) values ('00000000-0000-0000-0000-00000000f001', 'community_leader');
insert into public.role_assignments (user_id, role_key, committee_id)
select '00000000-0000-0000-0000-00000000f002'::uuid, 'committee_head', a from _c
union all select '00000000-0000-0000-0000-00000000f003'::uuid, 'committee_head', b from _c
union all select '00000000-0000-0000-0000-00000000f004'::uuid, 'committee_member', a from _c;

-- Event 1: a two-day in-person camp that already ended (so completion is possible); event 2: a single online day today.
insert into public.events (id, slug, committee_id, type, status, title_ar, title_en, schedule_type, start_date, end_date, location_mode, published_at)
select '00000000-0000-0000-0000-0000000e0001', 'att-camp', a, 'bootcamp', 'published', 'معسكر الحضور', 'Attendance Camp',
       'specific_dates', private.today_riyadh() - 2, private.today_riyadh() - 1, 'in_person', now() from _c;
insert into public.event_dates (event_id, event_date) values
  ('00000000-0000-0000-0000-0000000e0001', private.today_riyadh() - 2),
  ('00000000-0000-0000-0000-0000000e0001', private.today_riyadh() - 1);
insert into public.events (id, slug, committee_id, type, status, title_ar, title_en, schedule_type, start_date, end_date, location_mode, published_at)
select '00000000-0000-0000-0000-0000000e0002', 'att-online', a, 'workshop', 'published', 'ورشة عن بعد', 'Online Workshop',
       'single_day', private.today_riyadh(), private.today_riyadh(), 'online', now() from _c;

insert into public.event_registrations (id, event_id, user_id, status, full_name_snapshot, email_snapshot) values
  ('00000000-0000-0000-0000-00000000a011', '00000000-0000-0000-0000-0000000e0001', '00000000-0000-0000-0000-00000000f011', 'accepted', 'Participant One Ten',   'p1@example.test'),
  ('00000000-0000-0000-0000-00000000a012', '00000000-0000-0000-0000-0000000e0001', '00000000-0000-0000-0000-00000000f012', 'accepted', 'Participant Two Ten',   'p2@example.test'),
  ('00000000-0000-0000-0000-00000000a013', '00000000-0000-0000-0000-0000000e0001', '00000000-0000-0000-0000-00000000f013', 'accepted', 'Participant Three Ten', 'p3@example.test'),
  ('00000000-0000-0000-0000-00000000a014', '00000000-0000-0000-0000-0000000e0001', '00000000-0000-0000-0000-00000000f014', 'accepted', 'Participant Four Ten',  'p4@example.test'),
  ('00000000-0000-0000-0000-00000000a015', '00000000-0000-0000-0000-0000000e0001', '00000000-0000-0000-0000-00000000f015', 'pending',  'Participant Five Ten',  'p5@example.test'),
  ('00000000-0000-0000-0000-00000000b011', '00000000-0000-0000-0000-0000000e0002', '00000000-0000-0000-0000-00000000f011', 'accepted', 'Participant One Ten',   'p1@example.test'),
  ('00000000-0000-0000-0000-00000000b013', '00000000-0000-0000-0000-0000000e0002', '00000000-0000-0000-0000-00000000f013', 'accepted', 'Participant Three Ten', 'p3@example.test'),
  ('00000000-0000-0000-0000-00000000b014', '00000000-0000-0000-0000-0000000e0002', '00000000-0000-0000-0000-00000000f014', 'accepted', 'Participant Four Ten',  'p4@example.test'),
  ('00000000-0000-0000-0000-00000000b015', '00000000-0000-0000-0000-0000000e0002', '00000000-0000-0000-0000-00000000f015', 'pending',  'Participant Five Ten',  'p5@example.test'),
  ('00000000-0000-0000-0000-00000000b012', '00000000-0000-0000-0000-0000000e0002', '00000000-0000-0000-0000-00000000f012', 'cancelled','Participant Two Ten',   'p2@example.test');

-- =============================================================================== settings defaults
select is((select value from public.site_settings where key = 'certificate_threshold'), '70'::jsonb, 'the certificate threshold defaults to the KFUCS 70 %');
select is((select value from public.site_settings where key = 'certificates_enabled'), 'false'::jsonb, 'certificates are off until the owner answers Q-020');

set local role authenticated;

-- =============================================================================== opening sessions (committee member)
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f004","role":"authenticated"}', true);
select throws_ok($$select public.open_session((select id from public.event_dates where event_id = '00000000-0000-0000-0000-0000000e0001' order by event_date limit 1))$$,
  'P0001', 'NOT_SESSION_DAY', 'a session can only be opened on its own day without confirmation');
insert into _s select 'd1', public.open_session((select id from public.event_dates where event_id = '00000000-0000-0000-0000-0000000e0001' order by event_date limit 1), true);
select ok((select id from _s where k = 'd1') is not null, 'with confirmation a committee member opens a past day (late)');
insert into _s select 'online', public.open_session((select id from public.event_dates where event_id = '00000000-0000-0000-0000-0000000e0002'));
select ok((select id from _s where k = 'online') is not null, 'today''s session opens without confirmation');
select is(public.open_session((select id from public.event_dates where event_id = '00000000-0000-0000-0000-0000000e0001' order by event_date limit 1), true),
          (select id from _s where k = 'd1'), 'opening an open session is idempotent');
select is((select jsonb_array_length(public.event_attendance_overview('00000000-0000-0000-0000-0000000e0001') -> 'days')), 2, 'the overview lists every scheduled day');
select is((select public.event_attendance_overview('00000000-0000-0000-0000-0000000e0001') -> 'days' -> 1 ->> 'status'), 'scheduled', 'a day without a session is "scheduled"');
select is((select count(*)::int from public.session_roster((select id from _s where k = 'd1'))), 4, 'the roster lists accepted registrants only');

-- another committee's head, a participant and a plain account see nothing
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f003","role":"authenticated"}', true);
select throws_ok($$select public.open_session((select id from public.event_dates where event_id = '00000000-0000-0000-0000-0000000e0001' limit 1), true)$$, 'P0001', 'NOT_FOUND', 'another committee''s head cannot open sessions');
select throws_ok($$select * from public.session_roster((select id from _s where k = 'd1'))$$, 'P0001', 'NOT_FOUND', 'nor read its roster');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f011","role":"authenticated"}', true);
select throws_ok($$select public.session_qr_token((select id from _s where k = 'd1'))$$, 'P0001', 'NOT_FOUND', 'a participant cannot ask for the QR token');
select throws_ok($$select public.record_attendance((select id from _s where k = 'd1'), array['00000000-0000-0000-0000-00000000a011']::uuid[], true)$$, 'P0001', 'NOT_FOUND', 'nor mark attendance');

-- =============================================================================== QR check-in
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f004","role":"authenticated"}', true);
create temp table _t (tok text);
grant select, insert on _t to authenticated;
insert into _t select public.session_qr_token((select id from _s where k = 'd1')) ->> 'token';
select is(char_length((select tok from _t)), 24, 'the QR token is 24 characters');
select ok((public.session_qr_token((select id from _s where k = 'd1')) ->> 'expires_in')::int between 1 and 120, 'and rotates within 120 seconds (KFUCS)');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f011","role":"authenticated"}', true);
select is(public.check_in((select id from _s where k = 'd1'), (select tok from _t)), 'checked_in', 'an accepted registrant checks in with a valid token');
select is(public.check_in((select id from _s where k = 'd1'), (select tok from _t)), 'already', 'a second check-in is idempotent (KFUCS F-23)');
select throws_ok($$select public.check_in((select id from _s where k = 'd1'), 'not-the-token')$$, 'P0001', 'TOKEN_EXPIRED', 'a wrong or old token is refused');
select throws_ok($$select public.check_in((select id from _s where k = 'd1'), null)$$, 'P0001', 'TOKEN_EXPIRED', 'an in-person event needs the code on screen');
select is((select method from public.attendance_records where registration_id = '00000000-0000-0000-0000-00000000a011'), 'qr', 'the record keeps the method');
select is((select count(*)::int from public.attendance_records where registration_id = '00000000-0000-0000-0000-00000000a011'), 1, 'one record per registration per session');
select throws_ok($$insert into public.attendance_records (session_id, registration_id, method) values ((select id from _s where k = 'd1'), '00000000-0000-0000-0000-00000000a011', 'manual')$$,
  '42501', null, 'records cannot be written directly');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f015","role":"authenticated"}', true);
select throws_ok($$select public.check_in((select id from _s where k = 'd1'), (select tok from _t))$$, 'P0001', 'NOT_ACCEPTED', 'a pending registration cannot check in');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f001","role":"authenticated"}', true);
select throws_ok($$select public.check_in((select id from _s where k = 'd1'), (select tok from _t))$$, 'P0001', 'NOT_ACCEPTED', 'someone who never registered cannot either');

-- online event: a token-less self check-in is allowed while the session is open
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f011","role":"authenticated"}', true);
select is(public.check_in((select id from _s where k = 'online'), null), 'checked_in', 'online events accept a self check-in without a code');
select is((select method from public.attendance_records where session_id = (select id from _s where k = 'online')), 'online', 'recorded as online');
select is((public.check_in_context('att-online', null) -> 'session' ->> 'status'), 'open', 'the check-in page finds today''s open session');
select ok((public.check_in_context('att-online', null) ->> 'checked_in_at') is not null, 'and knows the caller already checked in');

-- =============================================================================== public check-in by e-mail (no sign-in)
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f004","role":"authenticated"}', true);
create temp table _t2 (tok text);
grant select, insert on _t2 to authenticated, anon;
insert into _t2 select public.session_qr_token((select id from _s where k = 'online')) ->> 'token';
select is((public.session_live((select id from _s where k = 'online')) ->> 'present')::int, 1, 'live numbers: one person is in');
select is((public.session_live((select id from _s where k = 'online')) ->> 'total')::int, 3, 'live numbers: three accepted registrants');
select is((public.session_live((select id from _s where k = 'online')) -> 'recent' -> 0 ->> 'name'), 'Participant One Ten', 'live numbers: the latest check-in is named');
select is((select email from public.session_roster((select id from _s where k = 'online')) where full_name = 'Participant Three Ten'), 'p3@example.test', 'the roster carries the e-mail');

set local role anon;
select is((public.check_in_public_context((select id from _s where k = 'online')) -> 'event' ->> 'slug'), 'att-online', 'the public context needs no sign-in');
select is(public.check_in_public_context(gen_random_uuid()), null, 'and is empty for an unknown session');
select throws_ok($$select public.session_live((select id from _s where k = 'online'))$$, '42501', null, 'anonymous visitors cannot read live numbers');
select is((public.check_in_by_email((select id from _s where k = 'online'), 'wrong-token', 'p3@example.test') ->> 'code'), 'TOKEN_EXPIRED', 'a wrong code is refused');
select is((public.check_in_by_email((select id from _s where k = 'online'), (select tok from _t2), 'nobody@example.test') ->> 'code'), 'NOT_REGISTERED', 'an unknown e-mail is not registered');
select is((public.check_in_by_email((select id from _s where k = 'online'), (select tok from _t2), 'p5@example.test') ->> 'code'), 'NOT_ACCEPTED', 'a pending registration is not accepted');
select is((public.check_in_by_email((select id from _s where k = 'online'), (select tok from _t2), 'p2@example.test') ->> 'code'), 'REGISTRATION_CANCELLED', 'a cancelled registration is told so');
select is((public.check_in_by_email((select id from _s where k = 'online'), (select tok from _t2), 'not-an-email') ->> 'code'), 'VALIDATION_FAILED', 'a malformed e-mail is refused');
select is((public.check_in_by_email((select id from _s where k = 'online'), (select tok from _t2), 'p3@example.test') ->> 'status'), 'checked_in', 'the registered e-mail checks in');
select is((public.check_in_by_email((select id from _s where k = 'online'), (select tok from _t2), 'P3@Example.TEST') ->> 'status'), 'already', 'the e-mail match ignores case and a second check-in is idempotent');
select is((public.check_in_by_email((select id from _s where k = 'online'), (select tok from _t2), ' p4@example.test ') ->> 'name'), 'Participant Four Ten', 'surrounding spaces are ignored and the name comes back');
select is((select count(*)::int from (select public.check_in_by_email((select id from _s where k = 'online'), (select tok from _t2), 'guess' || g || '@example.test') from generate_series(1, 40) g) x), 40, 'guessing keeps answering');
select is((public.check_in_by_email((select id from _s where k = 'online'), (select tok from _t2), 'p3@example.test') ->> 'code'), 'RATE_LIMITED', 'but after 30 failures a minute it is throttled');
set local role authenticated;

-- =============================================================================== manual marking, close, finalize
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f004","role":"authenticated"}', true);
select is(public.record_attendance((select id from _s where k = 'd1'), array['00000000-0000-0000-0000-00000000a012', '00000000-0000-0000-0000-00000000a015']::uuid[], true), 1, 'manual marking ignores registrations that are not accepted');
select is(public.record_attendance((select id from _s where k = 'd1'), array['00000000-0000-0000-0000-00000000a012']::uuid[], true), 0, 'marking twice changes nothing');
select is((select count(*)::int from public.session_roster((select id from _s where k = 'd1')) where present), 2, 'two people are present');
select lives_ok($$select public.close_session((select id from _s where k = 'd1'))$$, 'the session closes');
select throws_ok($$select public.session_qr_token((select id from _s where k = 'd1'))$$, 'P0001', 'SESSION_NOT_OPEN', 'a closed session has no QR');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f013","role":"authenticated"}', true);
select throws_ok($$select public.check_in((select id from _s where k = 'd1'), (select tok from _t))$$, 'P0001', 'SESSION_NOT_OPEN', 'self check-in stops when the session is closed');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f004","role":"authenticated"}', true);
select is(public.finalize_session((select id from _s where k = 'd1')) ->> 'absent', '2', 'finalizing says how many are recorded absent');
select throws_ok($$select public.finalize_session((select id from _s where k = 'd1'))$$, 'P0001', 'INVALID_TRANSITION', 'a session finalizes once');
select throws_ok($$select public.open_session((select id from public.event_dates where event_id = '00000000-0000-0000-0000-0000000e0001' order by event_date limit 1), true)$$, 'P0001', 'SESSION_FINALIZED', 'a finalized session cannot be reopened');
select throws_ok($$select public.record_attendance((select id from _s where k = 'd1'), array['00000000-0000-0000-0000-00000000a013']::uuid[], true)$$, 'P0001', 'SESSION_FINALIZED', 'a finalized session is read-only for marking');

-- the one formula: 1 finalized session of 1
select is(public.t_pct('00000000-0000-0000-0000-00000000a011'), 100::smallint, 'attended the only finalized day → 100 %');
select is(public.t_pct('00000000-0000-0000-0000-00000000a013'), 0::smallint, 'absent the only finalized day → 0 %');

-- corrections need events.complete and a reason (AT-7)
select throws_ok($$select public.correct_attendance((select id from _s where k = 'd1'), '00000000-0000-0000-0000-00000000a013', true, 'late phone')$$, 'P0001', 'FORBIDDEN', 'a member cannot correct a finalized session');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f002","role":"authenticated"}', true);
select throws_ok($$select public.correct_attendance((select id from _s where k = 'd1'), '00000000-0000-0000-0000-00000000a013', true, '  ')$$, 'P0001', 'REASON_REQUIRED', 'a correction needs a reason');
select lives_ok($$select public.correct_attendance((select id from _s where k = 'd1'), '00000000-0000-0000-0000-00000000a013', true, 'Phone battery died at the door')$$, 'the head corrects with a reason');
select is(public.t_pct('00000000-0000-0000-0000-00000000a013'), 100::smallint, 'the corrected person now counts');

-- =============================================================================== completion needs sign-off (F-36) and roll-up
select throws_ok($$select public.finalize_event_attendance('00000000-0000-0000-0000-0000000e0001')$$, 'P0001', 'SESSIONS_NOT_FINALIZED', 'the event cannot be finalized while a scheduled day has no finalized session');
select throws_ok($$select public.transition_event('00000000-0000-0000-0000-0000000e0001', 'complete')$$, 'P0001', 'ATTENDANCE_NOT_FINALIZED', 'completion needs finalized attendance once sessions exist (KFUCS F-36)');

-- the second day: open late, mark p1 and p2, close, finalize
create temp table _d2 (id uuid);
grant select, insert on _d2 to authenticated;
insert into _s select 'd2', public.open_session((select id from public.event_dates where event_id = '00000000-0000-0000-0000-0000000e0001' order by event_date desc limit 1), true);
select public.record_attendance((select id from _s where k = 'd2'), array['00000000-0000-0000-0000-00000000a011', '00000000-0000-0000-0000-00000000a012']::uuid[], true);
select public.close_session((select id from _s where k = 'd2'));
select public.finalize_session((select id from _s where k = 'd2'));

-- F-20: a scheduled day with a finalized session cannot be removed from the schedule
reset role;
select throws_ok($$delete from public.event_dates where id = (select event_date_id from public.attendance_sessions where id = (select id from _s where k = 'd2'))$$,
  'P0001', 'DATE_HAS_FINALIZED_SESSION', 'a date with a finalized session cannot be removed (KFUCS F-20)');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f004","role":"authenticated"}', true);
select throws_ok($$select public.finalize_event_attendance('00000000-0000-0000-0000-0000000e0001')$$, 'P0001', 'FORBIDDEN', 'a committee member cannot finalize the event');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f003","role":"authenticated"}', true);
select throws_ok($$select public.finalize_event_attendance('00000000-0000-0000-0000-0000000e0001')$$, 'P0001', 'NOT_FOUND', 'another committee''s head cannot even see it');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f002","role":"authenticated"}', true);
select is(public.finalize_event_attendance('00000000-0000-0000-0000-0000000e0001') ->> 'attended', '3', 'the roll-up counts who attended at least one day');
select is((select attendance_percent from public.event_registrations where id = '00000000-0000-0000-0000-00000000a011'), 100::smallint, 'p1 attended both days → 100 %');
select is((select attendance_percent from public.event_registrations where id = '00000000-0000-0000-0000-00000000a013'), 50::smallint, 'p3 attended one of two → 50 %');
select is((select attendance_result from public.event_registrations where id = '00000000-0000-0000-0000-00000000a014'), 'absent', 'p4 never came → absent');
select ok((select attendance_finalized_at from public.events where id = '00000000-0000-0000-0000-0000000e0001') is not null, 'the event records its finalization');
select is((public.event_attendance_overview('00000000-0000-0000-0000-0000000e0001') ->> 'eligible')::int, 2, 'two registrants reach the 70 % threshold');
select throws_ok($$select public.finalize_event_attendance('00000000-0000-0000-0000-0000000e0001')$$, 'P0001', 'INVALID_TRANSITION', 'attendance finalizes once');
select is(public.transition_event('00000000-0000-0000-0000-0000000e0001', 'complete'), 'completed', 'completion works once attendance is signed off');

-- a correction after the roll-up re-runs it
select lives_ok($$select public.correct_attendance((select id from _s where k = 'd1'), '00000000-0000-0000-0000-00000000a011', false, 'Left before the session started')$$, 'a correction after event finalization is allowed with a reason');
select is((select attendance_percent from public.event_registrations where id = '00000000-0000-0000-0000-00000000a011'), 50::smallint, 'and the percentage is recomputed with the same formula');

-- =============================================================================== certificates
select throws_ok($$select public.issue_certificates('00000000-0000-0000-0000-0000000e0001')$$, 'P0001', 'CERTIFICATES_DISABLED', 'certificates are refused while the setting is off');
reset role;
update public.site_settings set value = 'true'::jsonb where key = 'certificates_enabled';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f002","role":"authenticated"}', true);
select is(public.issue_certificates('00000000-0000-0000-0000-0000000e0001') ->> 'issued', '1', 'only registrants at or above the threshold are issued (p2: 100 %)');
select is(public.issue_certificates('00000000-0000-0000-0000-0000000e0001') ->> 'issued', '0', 'issuing again is idempotent (one per registration)');
reset role;
update public.site_settings set value = '40'::jsonb where key = 'certificate_threshold';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f002","role":"authenticated"}', true);
select is(public.issue_certificates('00000000-0000-0000-0000-0000000e0001') ->> 'issued', '2', 'a lower threshold issues the newly eligible; existing certificates keep their snapshot');
select is((select attendance_percent from public.certificates where registration_id = '00000000-0000-0000-0000-00000000a012'), 100::smallint, 'the snapshot is frozen at issue');

reset role;
create temp table _cert as select id from public.certificates where registration_id = '00000000-0000-0000-0000-00000000a012';
grant select on _cert to anon, authenticated;
set local role anon;
select set_config('request.jwt.claims', '', true);
select is((select recipient_name from public.verify_certificate((select id from _cert))), 'Participant Two Ten', 'anyone can verify a certificate by its id');
select is((select count(*)::int from public.verify_certificate('00000000-0000-0000-0000-000000000099')), 0, 'an unknown id verifies nothing');
select throws_ok($$select * from public.certificates$$, '42501', null, 'the certificates table is not public');

-- =============================================================================== who reads attendance records
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f012","role":"authenticated"}', true);
select ok((select count(*) from public.attendance_records) > 0 and (select count(*) = count(*) filter (where registration_id = '00000000-0000-0000-0000-00000000a012') from public.attendance_records), 'a participant reads only their own records');
select is((select count(*)::int from public.certificates), 1, 'and only their own certificate');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f003","role":"authenticated"}', true);
select is((select count(*)::int from public.attendance_records), 0, 'another committee''s head reads none');
select throws_ok($$select * from public.attendance_sessions$$, '42501', null, 'the sessions table (with the QR secret) has no grants');

-- =============================================================================== audit
reset role;
select ok((select count(*)::int from public.audit_logs where action = 'attendance.session_opened') - coalesce((select n from _audit0 where action = 'attendance.session_opened'), 0) >= 3, 'opening sessions is audited');
select ok((select count(*)::int from public.audit_logs where action = 'attendance.corrected') - coalesce((select n from _audit0 where action = 'attendance.corrected'), 0) = 2, 'corrections are audited with their reason');
select ok(exists (select 1 from public.audit_logs where action = 'attendance.corrected' and summary ->> 'reason' = 'Phone battery died at the door'), 'the reason is in the log');
select ok((select count(*)::int from public.audit_logs where action = 'attendance.event_finalized') - coalesce((select n from _audit0 where action = 'attendance.event_finalized'), 0) = 1, 'event finalization is audited');

select * from finish();
rollback;
