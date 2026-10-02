-- Sprint 04 · ACC-002, ACC-005, CMT-001..003 — guards of the role-assignment functions, RLS on the access
-- tables, audit immutability and the public leadership view.
begin;
select no_plan();

-- isolate from dev personas / E2E leftovers: this transaction is rolled back
delete from public.role_assignments;

create temp table _c as select (select id from public.committees where slug = 'ai') as a,
                               (select id from public.committees where slug = 'cybersecurity') as b;
grant select on _c to authenticated, anon;

insert into auth.users (id, aud, role, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000b001', 'authenticated', 'authenticated', 'admin@example.test',  '{"full_name":"Admin Person One"}'),
  ('00000000-0000-0000-0000-00000000b002', 'authenticated', 'authenticated', 'leader@example.test', '{"full_name":"Leader Person Two"}'),
  ('00000000-0000-0000-0000-00000000b003', 'authenticated', 'authenticated', 'heada@example.test',  '{"full_name":"Head A Person"}'),
  ('00000000-0000-0000-0000-00000000b004', 'authenticated', 'authenticated', 'headb@example.test',  '{"full_name":"Head B Person"}'),
  ('00000000-0000-0000-0000-00000000b005', 'authenticated', 'authenticated', 'plain@example.test',  '{"full_name":"Plain User Person"}'),
  ('00000000-0000-0000-0000-00000000b006', 'authenticated', 'authenticated', 'target@example.test', '{"full_name":"Target Person One"}'),
  ('00000000-0000-0000-0000-00000000b007', 'authenticated', 'authenticated', 'target2@example.test','{"full_name":"Target Person Two"}'),
  ('00000000-0000-0000-0000-00000000b008', 'authenticated', 'authenticated', 'member1@example.test','{"full_name":"Member Person One"}'),
  ('00000000-0000-0000-0000-00000000b009', 'authenticated', 'authenticated', 'sched@example.test',  '{"full_name":"Scheduled Person"}');

-- Committee roles require an active member (is_active_member is real since Sprint 08): the fixtures are members.
insert into public.members (user_id, joined_via, first_name_ar)
select id, 'manual', 'عضو' from public.profiles where id::text like '00000000-0000-0000-0000-00000000b%';

insert into public.role_assignments (user_id, role_key, committee_id, display_title_ar, public_bio_en, public_tags_en) values
  ('00000000-0000-0000-0000-00000000b001', 'system_admin', null, null, null, null),
  ('00000000-0000-0000-0000-00000000b002', 'community_leader', null, 'قائد المجتمع', 'Runs the community', array['Leadership']);
insert into public.role_assignments (user_id, role_key, committee_id)
select '00000000-0000-0000-0000-00000000b003'::uuid, 'committee_head', a from _c
union all select '00000000-0000-0000-0000-00000000b004'::uuid, 'committee_head', b from _c;

set local role authenticated;

-- ======================================================================= leader (community_leader)
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000b002","role":"authenticated"}', true);

select throws_ok($$select public.assign_role('00000000-0000-0000-0000-00000000b006', 'committee_head', (select b from _c))$$,
  'P0001', 'HEAD_ALREADY_ACTIVE', 'a second active head for the same committee is rejected');
select lives_ok($$select public.assign_role('00000000-0000-0000-0000-00000000b006', 'committee_deputy', (select a from _c))$$,
  'the leader can appoint a deputy');
select throws_ok($$select public.assign_role('00000000-0000-0000-0000-00000000b006', 'system_admin')$$,
  'P0001', 'ESCALATION_DENIED', 'the leader cannot grant system_admin');
select throws_ok($$select public.assign_role('00000000-0000-0000-0000-00000000b002', 'system_admin')$$,
  'P0001', 'ESCALATION_DENIED', 'the leader cannot make themselves system_admin');
select throws_ok($$select public.assign_role('00000000-0000-0000-0000-00000000b006', 'founder')$$,
  'P0001', 'ESCALATION_DENIED', 'the leader cannot grant a global role');
select throws_ok($$select public.assign_role('00000000-0000-0000-0000-00000000b006', 'committee_head')$$,
  'P0001', 'SCOPE_REQUIRED', 'a committee role needs a committee');
select throws_ok($$select public.assign_role('00000000-0000-0000-0000-00000000b006', 'advisor', (select a from _c))$$,
  'P0001', 'SCOPE_FORBIDDEN', 'a global role forbids a committee');
select throws_ok($$select public.assign_role('00000000-0000-0000-0000-00000000b002', 'committee_member', (select a from _c))$$,
  'P0001', 'SELF_ASSIGNMENT', 'the leader cannot assign themselves a committee role');
select throws_ok($$select public.assign_role('00000000-0000-0000-0000-00000000b006', 'committee_member', (select a from _c), now(), now() - interval '1 day')$$,
  'P0001', 'INVALID_DATE', 'an end date before the start date is rejected');
select throws_ok($$select public.assign_role('00000000-0000-0000-0000-0000000000ff', 'committee_member', (select a from _c))$$,
  'P0001', 'NOT_FOUND', 'an unknown user is rejected');

-- ======================================================================= committee head A
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000b003","role":"authenticated"}', true);

select lives_ok($$select public.assign_role('00000000-0000-0000-0000-00000000b008', 'committee_member', (select a from _c))$$,
  'a head can add a member to their own committee');
select throws_ok($$select public.assign_role('00000000-0000-0000-0000-00000000b008', 'committee_member', (select a from _c))$$,
  'P0001', 'ALREADY_ASSIGNED', 'the same person cannot hold the same role twice');
select throws_ok($$select public.assign_role('00000000-0000-0000-0000-00000000b007', 'committee_member', (select b from _c))$$,
  'P0001', 'FORBIDDEN', 'a head cannot add members to another committee');
select throws_ok($$select public.assign_role('00000000-0000-0000-0000-00000000b007', 'committee_deputy', (select a from _c))$$,
  'P0001', 'FORBIDDEN', 'a head cannot appoint a deputy (CM-6)');
select throws_ok($$select public.assign_role('00000000-0000-0000-0000-00000000b003', 'committee_member', (select a from _c))$$,
  'P0001', 'SELF_ASSIGNMENT', 'a head cannot assign themselves');

-- RLS on assignments: heads see their own committee roster only
select is((select count(*)::int from public.role_assignments where committee_id = (select b from _c)), 0,
  'a head of A cannot read the assignments of committee B');
select cmp_ok((select count(*)::int from public.role_assignments where committee_id = (select a from _c)), '>=', 2,
  'a head of A reads the roster of committee A');
select is((select count(*)::int from public.audit_logs), 0, 'a head cannot read the audit log');

-- ======================================================================= plain user
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000b005","role":"authenticated"}', true);
select throws_ok($$select public.assign_role('00000000-0000-0000-0000-00000000b007', 'committee_member', (select a from _c))$$,
  'P0001', 'FORBIDDEN', 'a plain user cannot assign roles');
select is((select count(*)::int from public.role_assignments), 0, 'a plain user sees no assignments');
select throws_ok($$insert into public.role_assignments (user_id, role_key) values ('00000000-0000-0000-0000-00000000b005', 'system_admin')$$,
  '42501', null, 'there is no direct INSERT path to role_assignments');
select throws_ok($$update public.role_assignments set ends_at = now()$$,
  '42501', null, 'there is no direct UPDATE path to role_assignments');
select throws_ok($$delete from public.role_assignments$$,
  '42501', null, 'there is no DELETE path to role_assignments (history is kept)');
select throws_ok($$insert into public.committees (slug, name_ar) values ('rogue', 'rogue')$$,
  '42501', null, 'a plain user cannot create committees');

-- ======================================================================= ending assignments
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000b002","role":"authenticated"}', true);
select throws_ok($$select public.end_role_assignment((select id from public.role_assignments where role_key = 'committee_deputy' limit 1), '  ')$$,
  'P0001', 'REASON_REQUIRED', 'ending an assignment needs a reason');
select throws_ok($$select public.end_role_assignment((select id from public.role_assignments where role_key = 'system_admin'), 'cleanup')$$,
  'P0001', 'ESCALATION_DENIED', 'the leader cannot end a system_admin');
select lives_ok($$select public.end_role_assignment((select id from public.role_assignments where role_key = 'committee_deputy' limit 1), 'term finished')$$,
  'the leader ends a deputy with a reason');
select throws_ok($$select public.end_role_assignment((select id from public.role_assignments where role_key = 'committee_deputy' limit 1), 'again')$$,
  'P0001', 'ALREADY_ENDED', 'an ended assignment cannot be ended twice');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000b004","role":"authenticated"}', true);
select throws_ok($$select public.end_role_assignment((select id from public.role_assignments where role_key = 'committee_member' limit 1), 'nope')$$,
  'P0001', 'NOT_FOUND', 'a head of B cannot even see (so cannot end) a member of committee A');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000b003","role":"authenticated"}', true);
select lives_ok($$select public.end_role_assignment((select id from public.role_assignments where role_key = 'committee_member' limit 1), 'left the committee')$$,
  'a head ends a member of their own committee');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000b001","role":"authenticated"}', true);
select throws_ok($$select public.end_role_assignment((select id from public.role_assignments where role_key = 'system_admin'), 'leaving')$$,
  'P0001', 'LAST_ADMIN', 'the last system_admin cannot be ended');
select throws_ok($$select public.assign_role('00000000-0000-0000-0000-00000000b007', 'community_leader')$$,
  'P0001', 'LEADER_ALREADY_ACTIVE', 'only one community leader at a time');
select lives_ok($$select public.assign_role('00000000-0000-0000-0000-00000000b007', 'system_admin')$$,
  'a system_admin can grant system_admin');
select lives_ok($$select public.end_role_assignment((select id from public.role_assignments where role_key = 'system_admin' and user_id = '00000000-0000-0000-0000-00000000b001'), 'rotation')$$,
  'with a second admin in place the first can be ended');

-- ======================================================================= handover (leader)
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000b002","role":"authenticated"}', true);
select lives_ok($$select public.handover_head((select a from _c), '00000000-0000-0000-0000-00000000b006', now())$$,
  'handover ends the old head and appoints the new one atomically');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000b003","role":"authenticated"}', true);
select is(private.has_permission('events.cancel', (select a from _c)), false, 'after the handover the old head lost access in A');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000b006","role":"authenticated"}', true);
select is(private.has_permission('events.cancel', (select a from _c)), true, 'after the handover the new head has access in A');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000b005","role":"authenticated"}', true);
select throws_ok($$select public.handover_head((select a from _c), '00000000-0000-0000-0000-00000000b005', now())$$,
  'P0001', 'FORBIDDEN', 'a plain user cannot run a handover');

-- ======================================================================= audit
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000b002","role":"authenticated"}', true);
select is((select count(*)::int from public.audit_logs), 0, 'the leader has no audit.view (Q-032 default)');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000b007","role":"authenticated"}', true);
select cmp_ok((select count(*)::int from public.audit_logs where action = 'role.assigned'), '>=', 4, 'the new admin reads role.assigned audit rows');
select cmp_ok((select count(*)::int from public.audit_logs where action = 'role.ended'), '>=', 3, 'ended assignments are audited');
select ok(exists (select 1 from public.audit_logs where action = 'role.assigned' and actor_id = '00000000-0000-0000-0000-00000000b002'), 'audit rows carry the acting user');

reset role;
select throws_ok($$update public.audit_logs set action = 'role.tampered'$$, 'P0001', 'AUDIT_IMMUTABLE', 'audit rows cannot be updated, even by the owner');
select throws_ok($$delete from public.audit_logs$$, 'P0001', 'AUDIT_IMMUTABLE', 'audit rows cannot be deleted, even by the owner');

-- ======================================================================= time-bound effectiveness
insert into public.role_assignments (user_id, role_key, committee_id, starts_at, ends_at)
select '00000000-0000-0000-0000-00000000b009'::uuid, 'committee_member', a, now() + interval '1 day', null::timestamptz from _c
union all
select '00000000-0000-0000-0000-00000000b005'::uuid, 'committee_member', a, now() - interval '10 days', now() - interval '1 day' from _c;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000b005","role":"authenticated"}', true);
select is(private.has_permission('events.create', (select a from _c)), false, 'an assignment that already ended grants nothing');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000b008","role":"authenticated"}', true);
select is(private.has_permission('events.create', (select a from _c)), false, 'a member whose assignment was ended has no access');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000b009","role":"authenticated"}', true);
select is(private.has_permission('events.create', (select a from _c)), false, 'an assignment starting tomorrow grants nothing today');

-- ======================================================================= public leadership view
reset role;
set local role anon;
select cmp_ok((select count(*)::int from public.current_positions), '>=', 2, 'anon can read the public leadership view');
select ok(not exists (select 1 from public.current_positions where role_key = 'committee_member'), 'non-public roles never appear');
select ok((select count(*) from public.current_positions where role_key = 'community_leader') = 1, 'exactly one community leader is shown');
select ok(not exists (select 1 from information_schema.columns where table_name = 'current_positions' and column_name in ('user_id', 'email')), 'the view exposes no account identifiers');
select throws_ok($$select * from public.role_assignments$$, '42501', null, 'anon cannot read role_assignments directly');
select is((select count(*)::int from public.committees where status = 'active'), 5, 'anon reads the five seeded active committees');

select * from finish();
rollback;
