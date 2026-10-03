-- Sprint 10 · CMT-003 — committee management: create / edit / deactivate / reactivate / delete, the slug rule,
-- positions ending with their committee, the delete guard (CM-2) and who sees which cards.
begin;
select no_plan();

delete from public.role_assignments;

create temp table _k (k text primary key, id uuid);
grant select, insert on _k to authenticated;

insert into auth.users (id, aud, role, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000c101', 'authenticated', 'authenticated', 'leader10c@example.test', '{"full_name":"Leader Person Cmt"}'),
  ('00000000-0000-0000-0000-00000000c102', 'authenticated', 'authenticated', 'heada10c@example.test',  '{"full_name":"Head A Person Cmt"}'),
  ('00000000-0000-0000-0000-00000000c103', 'authenticated', 'authenticated', 'memberb10c@example.test','{"full_name":"Member B Person Cmt"}'),
  ('00000000-0000-0000-0000-00000000c104', 'authenticated', 'authenticated', 'plain10c@example.test',  '{"full_name":"Plain Person Cmt"}'),
  ('00000000-0000-0000-0000-00000000c105', 'authenticated', 'authenticated', 'founder10c@example.test','{"full_name":"Founder Person Cmt"}');
insert into public.role_assignments (user_id, role_key) values
  ('00000000-0000-0000-0000-00000000c101', 'community_leader'),
  ('00000000-0000-0000-0000-00000000c105', 'founder');
insert into public.role_assignments (user_id, role_key, committee_id)
select '00000000-0000-0000-0000-00000000c102'::uuid, 'committee_head', id from public.committees where slug = 'ai'
union all select '00000000-0000-0000-0000-00000000c103'::uuid, 'committee_member', id from public.committees where slug = 'cybersecurity';

set local role authenticated;

-- =============================================================================== creating and editing
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c102","role":"authenticated"}', true);
select throws_ok($$select public.save_committee(null, '{"slug":"nope","name_ar":"لجنة"}'::jsonb)$$, 'P0001', 'FORBIDDEN', 'a committee head cannot create committees');
select throws_ok($$select public.set_committee_status((select id from public.committees where slug = 'ai'), false, 'because')$$, 'P0001', 'FORBIDDEN', 'nor deactivate their own');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c101","role":"authenticated"}', true);
insert into _k select 'new', (public.save_committee(null, '{"slug":"data-science","name_ar":"لجنة علم البيانات","name_en":"Data Science","description_ar":"وصف","display_order":60,"contact_email":"ds@example.test"}'::jsonb) ->> 'id')::uuid;
select ok((select id from _k where k = 'new') is not null, 'the leader creates a committee');
select is((select status from public.committees where slug = 'data-science'), 'active', 'new committees are active');
select throws_ok($$select public.save_committee(null, '{"slug":"data-science","name_ar":"مكرر"}'::jsonb)$$, 'P0001', 'SLUG_TAKEN', 'the slug is unique');
select throws_ok($$select public.save_committee(null, '{"slug":"Bad Slug","name_ar":"لجنة"}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED:slug', 'the slug is lowercase letters, numbers and dashes');
select throws_ok($$select public.save_committee(null, '{"slug":"empty-name","name_ar":"  "}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED:name_ar', 'the Arabic name is required');
select throws_ok($$select public.save_committee(null, '{"slug":"bad-mail","name_ar":"لجنة","contact_email":"not-an-email"}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED:contact_email', 'the contact e-mail must look like one');
select throws_ok($$select public.save_committee(null, '{"slug":"bad-order","name_ar":"لجنة","display_order":5000}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED:display_order', 'the order stays in range');
select lives_ok($$select public.save_committee((select id from _k where k = 'new'), '{"name_ar":"لجنة علوم البيانات","name_en":"Data Science Committee"}'::jsonb)$$, 'a committee can be renamed');
select is((select slug from public.committees where id = (select id from _k where k = 'new')), 'data-science', 'a rename keeps the slug (CM-1)');
select throws_ok($$select public.save_committee((select id from _k where k = 'new'), '{"slug":"another-slug"}'::jsonb)$$, 'P0001', 'SLUG_LOCKED', 'the slug cannot be changed');

-- =============================================================================== deactivate ends the positions
select throws_ok($$select public.set_committee_status((select id from public.committees where slug = 'ai'), false, null)$$, 'P0001', 'REASON_REQUIRED', 'deactivating needs a reason');
select is(public.set_committee_status((select id from public.committees where slug = 'ai'), false, 'Merged into Technology') ->> 'positions_ended', '1', 'deactivating a committee ends its open positions');
select is((select status from public.committees where slug = 'ai'), 'inactive', 'and the committee is inactive');
select ok((select ends_at from public.role_assignments where role_key = 'committee_head' and user_id = '00000000-0000-0000-0000-00000000c102') <= now(), 'the head term ended');
select ok((select end_reason from public.role_assignments where role_key = 'committee_head' and user_id = '00000000-0000-0000-0000-00000000c102') like 'Committee deactivated:%', 'with the reason in the history');
select throws_ok($$select public.set_committee_status((select id from public.committees where slug = 'ai'), false, 'again')$$, 'P0001', 'INVALID_TRANSITION', 'deactivating twice is refused');
select is(public.set_committee_status((select id from public.committees where slug = 'ai'), true) ->> 'status', 'active', 'a committee can be reactivated');

-- =============================================================================== delete only when it owns nothing (CM-2)
select throws_ok($$select public.delete_committee((select id from public.committees where slug = 'cybersecurity'))$$, 'P0001', 'NOT_DELETABLE', 'a committee with positions cannot be deleted');
select lives_ok($$select public.delete_committee((select id from _k where k = 'new'))$$, 'an empty committee can be deleted');
select is((select count(*)::int from public.committees where slug = 'data-science'), 0, 'and it is gone');

-- =============================================================================== the cards
select is((select count(*)::int from public.committee_cards()), (select count(*)::int from public.committees), 'the leader sees every committee');
select is((select members_count from public.committee_cards() where slug = 'cybersecurity'), 1, 'the card counts active positions');
select is((select head_name_ar from public.committee_cards() where slug = 'ai'), null, 'a committee without a head shows none (the term ended on deactivation)');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c105","role":"authenticated"}', true);
select is((select count(*)::int from public.committee_cards()), (select count(*)::int from public.committees), 'a founder (roles.view) sees every committee read-only');
select throws_ok($$select public.save_committee(null, '{"slug":"founder-try","name_ar":"لجنة"}'::jsonb)$$, 'P0001', 'FORBIDDEN', 'but cannot change them');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c104","role":"authenticated"}', true);
select is((select count(*)::int from public.committee_cards()), 0, 'a plain user sees no card');
set local role anon;
select throws_ok($$select * from public.committee_cards()$$, '42501', null, 'anon cannot call the cards function');

reset role;
select ok((select count(*) from public.audit_logs where action in ('committee.created', 'committee.updated', 'committee.deactivated', 'committee.reactivated', 'committee.deleted')) >= 5, 'committee changes are audited');

select * from finish();
rollback;
