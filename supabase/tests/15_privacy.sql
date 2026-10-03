-- SEC-003: consent is stored, the data export, the deletion request and its handling, and the retention job.
begin;
select no_plan();

delete from public.role_assignments;
delete from public.event_registrations;
delete from public.membership_applications;
delete from public.membership_cycles;
delete from public.members;
delete from public.events where legacy_id is not null;

insert into auth.users (id, aud, role, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000f301', 'authenticated', 'authenticated', 'admin@priv.example.test', now(), '{"full_name":"Admin Person"}'),
  ('00000000-0000-0000-0000-00000000f302', 'authenticated', 'authenticated', 'subject@priv.example.test', now(), '{"full_name":"Subject Person"}'),
  ('00000000-0000-0000-0000-00000000f303', 'authenticated', 'authenticated', 'other@priv.example.test', now(), '{"full_name":"Other Person"}');
insert into public.role_assignments (user_id, role_key) values ('00000000-0000-0000-0000-00000000f301', 'system_admin');
insert into public.members (user_id, joined_via, first_name_ar, last_name_ar, bio_ar, status) values
  ('00000000-0000-0000-0000-00000000f302', 'manual', 'موضوع', 'البيانات', 'نبذة', 'active');

insert into public.events (id, slug, committee_id, type, status, title_ar, title_en, schedule_type, start_date, end_date, location_mode, published_at)
select s.id, s.slug, (select id from public.committees where slug = 'ai'), 'workshop', 'completed', 'فعالية ' || s.slug, 'Event ' || s.slug,
       'single_day', s.d, s.d, 'online', now()
from (values ('00000000-0000-0000-0000-0000000e3001'::uuid, 'priv-old', ((now() - interval '4 years')::date)),
             ('00000000-0000-0000-0000-0000000e3002'::uuid, 'priv-new', ((now() - interval '1 month')::date))) s(id, slug, d);
insert into public.event_registrations (id, event_id, user_id, status, full_name_snapshot, email_snapshot, consent_at, consent_version) values
  ('00000000-0000-0000-0000-00000000a301', '00000000-0000-0000-0000-0000000e3001', null, 'accepted', 'Old Guest', 'oldguest@example.test', now(), 'v1'),
  ('00000000-0000-0000-0000-00000000a302', '00000000-0000-0000-0000-0000000e3002', '00000000-0000-0000-0000-00000000f302', 'accepted', 'Subject Person', 'subject@priv.example.test', now(), 'v1'),
  ('00000000-0000-0000-0000-00000000a303', '00000000-0000-0000-0000-0000000e3002', null, 'accepted', 'Guest By Mail', 'subject@priv.example.test', now(), 'v1');

create temp table _req (id uuid);
grant select, insert on _req to authenticated;

-- ------------------------------------------------------------------ export
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f302","role":"authenticated"}', true);
select is((public.export_my_data() -> 'profile' ->> 'email'), 'subject@priv.example.test', 'the export carries the profile');
select is(jsonb_array_length(public.export_my_data() -> 'registrations'), 2, 'and every registration, including the one made as a guest with the same e-mail');
select is((public.export_my_data() -> 'member' ->> 'first_name_ar'), 'موضوع', 'and the member record');
select ok(public.export_my_data() ? 'positions', 'and the positions');

-- ------------------------------------------------------------------ request
select lives_ok($$select public.request_account_deletion('please')$$, 'a person requests deletion');
select throws_ok($$select public.request_account_deletion(null)$$, 'P0001', 'ALREADY_REQUESTED', 'a second open request is refused');
select is((select count(*)::int from public.data_requests), 1, 'the person sees their own request');
insert into _req select id from public.data_requests;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f303","role":"authenticated"}', true);
select is((select count(*)::int from public.data_requests), 0, 'other people do not');
select throws_ok($$select public.handle_data_request((select id from _req), 'done')$$, 'P0001', 'FORBIDDEN', 'a person without settings.manage cannot handle requests');

-- ------------------------------------------------------------------ handling
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f302","role":"authenticated"}', true);
select throws_ok($$select public.handle_data_request((select id from _req), 'done')$$, 'P0001', 'FORBIDDEN', 'the subject cannot approve their own request either');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f301","role":"authenticated"}', true);
select throws_ok($$select public.handle_data_request((select id from _req), 'maybe')$$, 'P0001', 'VALIDATION_FAILED', 'an unknown decision is refused');
select lives_ok($$select public.handle_data_request((select id from _req), 'done', 'processed')$$, 'an administrator completes the request');
reset role;
select is((select full_name_snapshot from public.event_registrations where id = '00000000-0000-0000-0000-00000000a302'), 'Anonymized', 'the registration is anonymized');
select is((select full_name_snapshot from public.event_registrations where id = '00000000-0000-0000-0000-00000000a303'), 'Anonymized', 'including the one made as a guest with the same e-mail');
select is((select status from public.event_registrations where id = '00000000-0000-0000-0000-00000000a302'), 'accepted', 'the status (the count) stays');
select is((select user_id from public.members where first_name_ar = '—'), null, 'the member row is unlinked from the account');
select is((select bio_ar from public.members where first_name_ar = '—'), null, 'and its profile text is removed');
select is((select status from public.data_requests where id = (select id from _req)), 'done', 'the request is closed');
select is((select count(*)::int from public.audit_logs where action = 'privacy.request_done' and entity_id = (select id::text from _req)), 1, 'and audited');
select is((select count(*)::int from public.role_assignments where user_id = '00000000-0000-0000-0000-00000000f302'), 0, 'no positions remain');

-- ------------------------------------------------------------------ retention
select is((public.run_retention(true) ->> 'registrations')::int, 1, 'dry run: the four-year-old registration is due');
select is((select full_name_snapshot from public.event_registrations where id = '00000000-0000-0000-0000-00000000a301'), 'Old Guest', 'a dry run changes nothing');
set local role authenticated;
select throws_ok($$select public.run_retention(true)$$, '42501', null, 'only the service role may run the retention job');
reset role;
select public.run_retention(false);
select is((select full_name_snapshot from public.event_registrations where id = '00000000-0000-0000-0000-00000000a301'), 'Anonymized', 'the old registration is anonymized');
select is((select status from public.event_registrations where id = '00000000-0000-0000-0000-00000000a301'), 'accepted', 'its status stays for the counts');
select is((public.run_retention(true) ->> 'registrations')::int, 0, 'and a second run finds nothing more');

select * from finish();
rollback;
