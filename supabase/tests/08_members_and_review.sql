-- Sprint 08 · MBR-004, MEM-002…004 — directory privacy, self-service, status changes, claim tokens,
-- review decisions (self-decision, capacity, member creation, idempotency) and the legacy import.
begin;
select no_plan();

delete from public.role_assignments; -- isolate from dev personas / E2E leftovers (rolled back)
delete from public.membership_applications;
delete from public.membership_cycles;

create temp table _k (k text primary key, id uuid);
grant select, insert, update on _k to authenticated, anon;
create temp table _t (k text primary key, token text);
grant select, insert, update on _t to authenticated, anon;

insert into auth.users (id, aud, role, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000f001', 'authenticated', 'authenticated', 'leader@example.test',  now(), '{"full_name":"Leader Person One"}'),
  ('00000000-0000-0000-0000-00000000f002', 'authenticated', 'authenticated', 'head@example.test',    now(), '{"full_name":"Head Person Two"}'),
  ('00000000-0000-0000-0000-00000000f003', 'authenticated', 'authenticated', 'a1@example.test',      now(), '{"full_name":"Applicant One"}'),
  ('00000000-0000-0000-0000-00000000f004', 'authenticated', 'authenticated', 'a2@example.test',      now(), '{"full_name":"Applicant Two"}'),
  ('00000000-0000-0000-0000-00000000f005', 'authenticated', 'authenticated', 'a3@example.test',      now(), '{"full_name":"Applicant Three"}'),
  ('00000000-0000-0000-0000-00000000f006', 'authenticated', 'authenticated', 'legacy@example.test',  now(), '{"full_name":"Legacy Claimer"}'),
  ('00000000-0000-0000-0000-00000000f007', 'authenticated', 'authenticated', 'other@example.test',   now(), '{"full_name":"Other Person"}'),
  ('00000000-0000-0000-0000-00000000f008', 'authenticated', 'authenticated', 'cmember@example.test', now(), '{"full_name":"Committee Member"}');
insert into public.role_assignments (user_id, role_key) values ('00000000-0000-0000-0000-00000000f001', 'community_leader');
insert into public.role_assignments (user_id, role_key, committee_id)
select '00000000-0000-0000-0000-00000000f002'::uuid, 'committee_head', id from public.committees where slug = 'ai';

-- =============================================================================== legacy import + privacy
select cmp_ok((select count(*)::int from public.members where legacy_id is not null), '>=', 8, 'the seeded legacy rows were imported');
select is(private.import_legacy_members(), 0, 'the legacy import is idempotent');
select cmp_ok((select total from private.legacy_import_preview() where check_name = 'legacy rows'), '>=', 8, 'the dry-run report counts legacy rows');
select is((select count(*)::int from public.members m where m.legacy_id is not null and not m.is_directory_visible), 0, 'legacy members stay visible until claimed (Q-026)');
select cmp_ok((select count(*)::int from public.majors where parent_id is not null), '>=', 1, 'sub-majors were created under their major');

set local role anon;
select throws_ok($$select count(*) from public.members$$, '42501', null, 'ME-1: anon cannot read members');
select throws_ok($$select count(*) from public.member_claim_tokens$$, '42501', null, 'ME-1: anon cannot read claim tokens');
select cmp_ok((select count(*)::int from public.member_directory), '>=', 8, 'anon reads the directory view');
select is((select count(*)::int from information_schema.columns where table_schema = 'public' and table_name = 'member_directory' and column_name in ('user_id', 'legacy_claim_email', 'status_reason', 'is_directory_visible')), 0, 'the view exposes no private columns');
reset role;

-- =============================================================================== cycle + applications to review
insert into public.membership_cycles (name_ar, opens_at, closes_at, status, capacity)
values ('دورة المراجعة', now() - interval '3 days', now() - interval '1 day', 'published', 2);
insert into _k select 'c', id from public.membership_cycles where name_ar = 'دورة المراجعة';
insert into public.membership_applications (cycle_id, user_id, full_name_ar, academic_status, consent_version, wants_directory_listing, bio_ar, github_url)
select (select id from _k where k = 'c'), u.id, u.name, 'student', 'v1', u.vis, 'نبذة', 'https://github.com/example'
from (values
  ('00000000-0000-0000-0000-00000000f003'::uuid, 'متقدم أول اسم', true),
  ('00000000-0000-0000-0000-00000000f004'::uuid, 'متقدم ثان', false),
  ('00000000-0000-0000-0000-00000000f005'::uuid, 'متقدم ثالث', false),
  ('00000000-0000-0000-0000-00000000f001'::uuid, 'القائد نفسه', false)
) as u(id, name, vis);
update public.membership_applications set submitted_at = now() - interval '5 minutes' where user_id = '00000000-0000-0000-0000-00000000f003';
update public.membership_applications set submitted_at = now() - interval '4 minutes' where user_id = '00000000-0000-0000-0000-00000000f004';
update public.membership_applications set submitted_at = now() - interval '3 minutes' where user_id = '00000000-0000-0000-0000-00000000f005';
insert into _k select 'a' || right(user_id::text, 1), id from public.membership_applications where cycle_id = (select id from _k where k = 'c');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f002","role":"authenticated"}', true);
select throws_ok($$select public.decide_membership_applications(array[(select id from _k where k = 'a3')], 'accept')$$, 'P0001', 'FORBIDDEN', 'a committee head cannot decide applications');
select is((select count(*)::int from public.membership_review_queue), 0, 'a committee head sees no review queue');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f001","role":"authenticated"}', true);
select cmp_ok((select count(*)::int from public.membership_review_queue), '>=', 4, 'the leader sees the review queue with applicant e-mails');
select lives_ok($$select public.claim_membership_application((select id from _k where k = 'a3'))$$, 'a reviewer claims an application');
select is((select status from public.membership_applications where id = (select id from _k where k = 'a3')), 'under_review', 'the claim marks it under review');
select lives_ok($$select public.claim_membership_application((select id from _k where k = 'a3'), true)$$, 'the claimer releases it');
select is((public.decide_membership_applications(array[(select id from _k where k = 'a1')], 'reject') -> 0 ->> 'code'), 'SELF_DECISION', 'MB-6: a reviewer cannot decide their own application');

-- bulk accept: capacity is 2, three applicants are decided together
select is((select count(*)::int from jsonb_array_elements(public.decide_membership_applications(
  array[(select id from _k where k = 'a3'), (select id from _k where k = 'a4'), (select id from _k where k = 'a5')], 'accept', 'Welcome')) r where (r ->> 'ok')::boolean), 2, 'bulk accept stops at the capacity');
select is((select count(*)::int from public.membership_applications where cycle_id = (select id from _k where k = 'c') and status = 'accepted'), 2, 'MB-7: accepted never exceeds capacity');
select is((select count(*)::int from public.members where application_id is not null), 2, 'MB-8: each acceptance created exactly one member');
select is((select count(*)::int from public.members where user_id = '00000000-0000-0000-0000-00000000f003'), 1, 'the first applicant is a member');
select is((select is_directory_visible from public.members where user_id = '00000000-0000-0000-0000-00000000f003'), true, 'the directory opt-in carried over');
select is((select last_name_ar from public.members where user_id = '00000000-0000-0000-0000-00000000f003'), 'أول اسم', 'the Arabic name is split into first and last');
select is((public.decide_membership_applications(array[(select id from _k where k = 'a3')], 'accept') -> 0 ->> 'code'), 'INVALID_TRANSITION', 'deciding twice is refused');
select is((select count(*)::int from public.members where user_id = '00000000-0000-0000-0000-00000000f003'), 1, 'still one member row');
select is((public.decide_membership_applications(array[(select id from public.membership_applications where cycle_id = (select id from _k where k = 'c') and status = 'submitted' and user_id <> '00000000-0000-0000-0000-00000000f001')], 'waitlist') -> 0 ->> 'ok'), 'true', 'the applicant left over by the capacity can be waitlisted');
select is((public.decide_membership_applications(array[gen_random_uuid()], 'accept') -> 0 ->> 'code'), 'NOT_FOUND', 'unknown ids are reported per row');

-- applicants never see the internal note through their own view
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f003","role":"authenticated"}', true);
select is((select count(*)::int from information_schema.columns where table_name = 'my_membership_application' and column_name = 'decision_note'), 0, 'MA-5: the applicant view has no decision note');
select is((select status from public.my_membership_application), 'accepted', 'the applicant sees the decision');

-- =============================================================================== member self-service
select lives_ok($$select public.update_my_member_profile('{"bio_ar":"نبذة جديدة","github_url":"https://github.com/me","is_directory_visible":false}')$$, 'a member edits their profile and visibility');
select is((select count(*)::int from public.member_directory where bio = 'نبذة جديدة'), 0, 'hiding the profile removes it from the directory');
select throws_ok($$select public.update_my_member_profile('{"github_url":"http://insecure.test"}')$$, 'P0001', 'VALIDATION_FAILED', 'ME-3: links must be https');
select throws_ok($$update public.members set status = 'suspended'$$, '42501', null, 'ME-2: members cannot write the table directly');
select is((select count(*)::int from public.members), 1, 'a member reads only their own record');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f007","role":"authenticated"}', true);
select throws_ok($$select public.update_my_member_profile('{"bio_ar":"x"}')$$, 'P0001', 'NOT_A_MEMBER', 'a non-member cannot edit a member profile');

-- =============================================================================== status changes end committee roles
reset role;
insert into public.members (user_id, joined_via, first_name_ar, is_directory_visible) values ('00000000-0000-0000-0000-00000000f008', 'manual', 'عضو لجنة', true);
insert into public.role_assignments (user_id, role_key, committee_id)
select '00000000-0000-0000-0000-00000000f008', 'committee_member', id from public.committees where slug = 'ai';
insert into _k select 'cm', id from public.members where user_id = '00000000-0000-0000-0000-00000000f008';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f002","role":"authenticated"}', true);
select throws_ok($$select public.set_member_status((select id from _k where k = 'cm'), 'suspended', 'x')$$, 'P0001', 'FORBIDDEN', 'a committee head cannot change member status');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f001","role":"authenticated"}', true);
select throws_ok($$select public.set_member_status((select id from _k where k = 'cm'), 'suspended')$$, 'P0001', 'REASON_REQUIRED', 'ME-5: a suspension needs a reason');
select is(public.set_member_status((select id from _k where k = 'cm'), 'suspended', 'Code of conduct'), 'suspended', 'leadership suspends with a reason');
select is((select count(*)::int from public.member_directory where first_name = 'عضو لجنة'), 0, 'a suspended member is hidden');
select is((select count(*)::int from public.role_assignments where user_id = '00000000-0000-0000-0000-00000000f008' and (ends_at is null or ends_at > now())), 0, 'BR-MBR-011: committee roles ended');
select throws_ok($$select public.set_member_status((select id from _k where k = 'cm'), 'suspended', 'again')$$, 'P0001', 'INVALID_TRANSITION', 'suspending twice is refused');
select is(public.set_member_status((select id from _k where k = 'cm'), 'active', 'Resolved'), 'active', 'reinstating needs a reason and works');
select is((select count(*)::int from public.role_assignments where user_id = '00000000-0000-0000-0000-00000000f008' and (ends_at is null or ends_at > now())), 0, 'roles are not restored automatically');

-- a member can leave on their own
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f003","role":"authenticated"}', true);
select is(public.set_member_status((select id from public.members where user_id = '00000000-0000-0000-0000-00000000f003'), 'inactive'), 'inactive', 'a member leaves the community');
select throws_ok($$select public.set_member_status((select id from public.members where user_id = '00000000-0000-0000-0000-00000000f003'), 'active', 'back')$$, 'P0001', 'FORBIDDEN', 'a member cannot reactivate themselves');

-- =============================================================================== legacy claim flow
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f001","role":"authenticated"}', true);
insert into _k select 'legacy', id from public.members where legacy_id is not null and user_id is null order by legacy_id limit 1;
select throws_ok($$select public.create_member_claim_token((select id from _k where k = 'legacy'), 'not-an-email')$$, 'P0001', 'NO_EMAIL', 'an invite needs a valid e-mail');
insert into _t select 'ok', public.create_member_claim_token((select id from _k where k = 'legacy'), 'Legacy@Example.test');
reset role;
select is((select count(*)::int from public.member_claim_tokens where token_hash = (select token from _t where k = 'ok')), 0, 'ME-6: the raw token is never stored');
set local role authenticated;
select is((select length(token) from _t where k = 'ok'), 64, 'the token is long and random');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f001","role":"authenticated"}', true);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f007","role":"authenticated"}', true);
select throws_ok($$select public.claim_legacy_member((select token from _t where k = 'ok'))$$, 'P0001', 'EMAIL_MISMATCH', 'the account e-mail must match the invite');
select throws_ok($$select public.claim_legacy_member('not-a-real-token')$$, 'P0001', 'TOKEN_INVALID', 'an unknown token is invalid');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f006","role":"authenticated"}', true);
select is((public.preview_member_claim((select token from _t where k = 'ok')) ->> 'name_ar') is not null, true, 'the preview names the profile');
select is((select public.claim_legacy_member((select token from _t where k = 'ok'))), (select id from _k where k = 'legacy'), 'the matching account claims the record (case-insensitive e-mail)');
select is((select user_id from public.members where id = (select id from _k where k = 'legacy')), '00000000-0000-0000-0000-00000000f006'::uuid, 'the record is linked');
select throws_ok($$select public.claim_legacy_member((select token from _t where k = 'ok'))$$, 'P0001', 'TOKEN_INVALID', 'a token works once');

reset role;
-- expiry
insert into public.member_claim_tokens (member_id, email, token_hash, expires_at)
select m.id, 'other@example.test', encode(sha256(convert_to('expiredtoken0000000000000000000000000000000000000000000000000000', 'UTF8')), 'hex'), now() - interval '1 minute'
from public.members m where m.legacy_id is not null and m.user_id is null limit 1;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f007","role":"authenticated"}', true);
select throws_ok($$select public.claim_legacy_member('expiredtoken0000000000000000000000000000000000000000000000000000')$$, 'P0001', 'TOKEN_EXPIRED', 'ME-6: tokens expire');
reset role;

-- MEMBERS_ONLY events now use the real membership check
insert into public.events (slug, committee_id, type, status, title_ar, title_en, schedule_type, start_date, location_mode, audience, published_at)
select 'members-only-test', id, 'workshop', 'published', 'فعالية للأعضاء', 'Members only', 'single_day', (now() at time zone 'Asia/Riyadh')::date + 20, 'online', 'members_only', now()
from public.committees where slug = 'ai';
insert into _k select 'ev', id from public.events where slug = 'members-only-test';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f007","role":"authenticated"}', true);
select throws_ok($$select public.register_for_event((select id from _k where k = 'ev'))$$, 'P0001', 'MEMBERS_ONLY', 'a non-member cannot register for a members-only event');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f004","role":"authenticated"}', true);
select lives_ok($$select public.register_for_event((select id from _k where k = 'ev'))$$, 'an active member can');
reset role;

-- exports are audited and permission-checked
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f002","role":"authenticated"}', true);
select throws_ok($$select public.record_export('membership_applications', 3)$$, 'P0001', 'FORBIDDEN', 'a committee head cannot record a membership export');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000f001","role":"authenticated"}', true);
select lives_ok($$select public.record_export('membership_applications', 3)$$, 'the leader records a membership export');
reset role;
select is((select summary ->> 'rows' from public.audit_logs where action = 'export.membership_applications' order by id desc limit 1), '3', 'the export audit stores only a row count');

select cmp_ok((select count(*)::int from public.audit_logs where action like 'member.%' or action like 'membership_application.%'), '>=', 8, 'decisions, status changes and claims are audited');

select * from finish();
rollback;
