-- Sprint 18 · MBR-010..013 — claim, scoring, decisions (capacity, self decision, plain rejection), undo, funnel, waitlist.
begin;
select no_plan();

delete from public.role_assignments;
delete from public.members;
delete from public.membership_applications;
delete from public.membership_cycles;

insert into auth.users (id, aud, role, email, email_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000a281', 'authenticated', 'authenticated', 'leader1@example.test', now(), '{"full_name":"Leader One"}'),
  ('00000000-0000-0000-0000-00000000a282', 'authenticated', 'authenticated', 'leader2@example.test', now(), '{"full_name":"Leader Two"}'),
  ('00000000-0000-0000-0000-00000000a283', 'authenticated', 'authenticated', 'plain@example.test', now(), '{"full_name":"Plain"}'),
  ('00000000-0000-0000-0000-00000000a291', 'authenticated', 'authenticated', 'app.a@example.test', now(), '{"full_name":"A"}'),
  ('00000000-0000-0000-0000-00000000a292', 'authenticated', 'authenticated', 'app.b@example.test', now(), '{"full_name":"B"}'),
  ('00000000-0000-0000-0000-00000000a293', 'authenticated', 'authenticated', 'app.c@example.test', now(), '{"full_name":"C"}'),
  ('00000000-0000-0000-0000-00000000a294', 'authenticated', 'authenticated', 'app.d@example.test', now(), '{"full_name":"D"}'),
  ('00000000-0000-0000-0000-00000000a295', 'authenticated', 'authenticated', 'app.e@example.test', now(), '{"full_name":"E"}');
-- A second reviewer who is not the system administrator (who may override a claim): a founder holding the review permission.
insert into public.role_permissions (role_key, permission_key) values ('founder', 'membership.review') on conflict do nothing;
insert into public.role_assignments (user_id, role_key) values
  ('00000000-0000-0000-0000-00000000a281', 'community_leader'), ('00000000-0000-0000-0000-00000000a282', 'founder');

insert into public.membership_cycles (id, name_ar, opens_at, closes_at, status, capacity, questions, rubric, term_ends_at) values
  ('00000000-0000-0000-0000-00000000c281', 'دورة المراجعة', now() - interval '3 days', now() + interval '3 days', 'published', 2, '[]',
   '[{"key":"motivation","label_ar":"الدافع","label_en":"Motivation","weight":2},{"key":"links","label_ar":"الأعمال","label_en":"Work","weight":1}]'::jsonb,
   '2027-06-30');

insert into public.membership_applications (id, cycle_id, user_id, email, first_name_ar, middle_name_ar, last_name_ar, first_name_en, last_name_en, full_name_ar, phone, academic_status, consent_version, wants_directory_listing, submitted_at) values
  ('00000000-0000-0000-0000-0000000d0a01', '00000000-0000-0000-0000-00000000c281', '00000000-0000-0000-0000-00000000a291', 'app.a@example.test', 'نورة', 'سعيد', 'القحطاني', 'Noura', 'Alqahtani', 'x x', '+966504000001', 'student', 'v1', true, now() - interval '3 hours'),
  ('00000000-0000-0000-0000-0000000d0a02', '00000000-0000-0000-0000-00000000c281', '00000000-0000-0000-0000-00000000a292', 'app.b@example.test', 'خالد', null, 'الهاجري', 'Khalid', 'Alhajri', 'x x', '+966504000002', 'graduate', 'v1', false, now() - interval '2 hours'),
  ('00000000-0000-0000-0000-0000000d0a03', '00000000-0000-0000-0000-00000000c281', '00000000-0000-0000-0000-00000000a293', 'app.c@example.test', 'ليلى', null, 'المطيري', 'Layla', 'Almutairi', 'x x', '+966504000003', 'student', 'v1', false, now() - interval '1 hour'),
  ('00000000-0000-0000-0000-0000000d0a04', '00000000-0000-0000-0000-00000000c281', '00000000-0000-0000-0000-00000000a294', 'app.d@example.test', 'تركي', null, 'العتيبي', 'Turki', 'Alotaibi', 'x x', '+966504000004', 'student', 'v1', false, now() - interval '50 minutes'),
  ('00000000-0000-0000-0000-0000000d0a05', '00000000-0000-0000-0000-00000000c281', '00000000-0000-0000-0000-00000000a295', 'app.e@example.test', 'سارة', null, 'الدوسري', 'Sara', 'Aldosari', 'x x', '+966504000005', 'student', 'v1', false, now() - interval '40 minutes'),
  ('00000000-0000-0000-0000-0000000d0a06', '00000000-0000-0000-0000-00000000c281', null, 'leader1@example.test', 'قائد', null, 'المجتمع', 'Leader', 'One', 'x x', '+966504000006', 'employee', 'v1', false, now() - interval '30 minutes');

create temp table _u (k text primary key, v text);
grant select, insert, update on _u to authenticated, service_role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a283","role":"authenticated"}', true);
select throws_ok($$select public.save_application_score('00000000-0000-0000-0000-0000000d0a01', '{"motivation":5,"links":3}'::jsonb)$$, 'P0001', 'FORBIDDEN', 'scoring needs membership.review');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a281","role":"authenticated"}', true);
-- ------------------------------------------------------------------------------------------ scoring
select throws_ok($$select public.save_application_score('00000000-0000-0000-0000-0000000d0a01', '{"motivation":6,"links":3}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED', 'scores are 1 to 5');
select throws_ok($$select public.save_application_score('00000000-0000-0000-0000-0000000d0a01', '{"motivation":5}'::jsonb)$$, 'P0001', 'VALIDATION_FAILED', 'every criterion needs a score');
select throws_ok($$select public.save_application_score('00000000-0000-0000-0000-0000000d0a06', '{"motivation":5,"links":5}'::jsonb)$$, 'P0001', 'SELF_DECISION', 'a reviewer never scores their own application (matched by e-mail)');
select is((public.save_application_score('00000000-0000-0000-0000-0000000d0a01', '{"motivation":5,"links":3}'::jsonb, 'قوي'))->>'average', '4.3', 'the weighted average of one reviewer');
select is((public.save_application_score('00000000-0000-0000-0000-0000000d0a01', '{"motivation":5,"links":3}'::jsonb, 'قوي جداً'))->>'reviewers', '1', 'a reviewer has one row, editable');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a282","role":"authenticated"}', true);
select is((public.save_application_score('00000000-0000-0000-0000-0000000d0a01', '{"motivation":3,"links":3}'::jsonb))->>'average', '3.7', 'the mean across reviewers');
select is((select score_reviewers from public.membership_review_queue where id = '00000000-0000-0000-0000-0000000d0a01'), 2, 'the queue shows how many reviewers scored');
select is((select count(*)::int from public.application_scores), 2, 'reviewers read the scores');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a283","role":"authenticated"}', true);
select is((select count(*)::int from public.application_scores), 0, 'nobody else does');
select is((select count(*)::int from public.membership_review_queue), 0, 'nor the review queue');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a281","role":"authenticated"}', true);
select save_application_score('00000000-0000-0000-0000-0000000d0a02', '{"motivation":2,"links":2}'::jsonb);
select save_application_score('00000000-0000-0000-0000-0000000d0a03', '{"motivation":4,"links":4}'::jsonb);

-- ------------------------------------------------------------------------------------------ claim
select lives_ok($$select public.claim_membership_application('00000000-0000-0000-0000-0000000d0a01')$$, 'a reviewer claims an application');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a282","role":"authenticated"}', true);
select throws_ok($$select public.claim_membership_application('00000000-0000-0000-0000-0000000d0a01')$$, 'P0001', 'ALREADY_CLAIMED', 'a second reviewer cannot take it');
select throws_ok($$select public.request_application_info('00000000-0000-0000-0000-0000000d0a01', 'x', '{}')$$, 'P0001', 'ALREADY_CLAIMED', 'nor ask the applicant for a correction on it');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a281","role":"authenticated"}', true);

-- ------------------------------------------------------------------------------------------ decisions
select is((public.decide_membership_applications(array['00000000-0000-0000-0000-0000000d0a01']::uuid[], 'accept'))->0->>'ok', 'true', 'accepting creates the member');
select is((public.decide_membership_applications(array['00000000-0000-0000-0000-0000000d0a06']::uuid[], 'accept'))->0->>'code', 'SELF_DECISION', 'a reviewer never decides their own application');
select is((public.decide_membership_applications(array['00000000-0000-0000-0000-0000000d0a02']::uuid[], 'reject', 'weak motivation'))->0->>'ok', 'true', 'rejecting stores an internal note only');
select is((public.decide_membership_applications(array['00000000-0000-0000-0000-0000000d0a03']::uuid[], 'accept'))->0->>'ok', 'true', 'a second place is available');
select is((public.decide_membership_applications(array['00000000-0000-0000-0000-0000000d0a04']::uuid[], 'accept'))->0->>'code', 'CAPACITY_REACHED', 'capacity is checked at acceptance');
select is((public.decide_membership_applications(array['00000000-0000-0000-0000-0000000d0a04']::uuid[], 'waitlist'))->0->>'ok', 'true', 'the application goes to the waiting list');
select is((public.decide_membership_applications(array['00000000-0000-0000-0000-0000000d0a02']::uuid[], 'accept'))->0->>'code', 'INVALID_TRANSITION', 'a rejected application is not decided again');
select is((public.decide_membership_applications(array['00000000-0000-0000-0000-0000000d0a99']::uuid[], 'accept'))->0->>'code', 'NOT_FOUND', 'a missing application is reported per row');
reset role;

select is((select first_name_ar || '|' || middle_name_ar || '|' || last_name_ar || '|' || first_name_en || '|' || last_name_en from public.members where user_id = '00000000-0000-0000-0000-00000000a291'),
  'نورة|سعيد|القحطاني|Noura|Alqahtani', 'the member gets the name parts from the application');
select is((select term_ends_at from public.members where user_id = '00000000-0000-0000-0000-00000000a291'), '2027-06-30'::date, 'the term ends on the date set on the cycle');
select is((select phone from public.members where user_id = '00000000-0000-0000-0000-00000000a291'), '+966504000001', 'the phone in international format is copied');
select ok((select member_no from public.members where user_id = '00000000-0000-0000-0000-00000000a291') is not null
          and (select card_token from public.members where user_id = '00000000-0000-0000-0000-00000000a291') is not null, 'a member number and a card are issued');
select is((select count(distinct member_no)::int from public.members), 2, 'member numbers are unique');
select ok((select accepted_at from public.membership_applications where id = '00000000-0000-0000-0000-0000000d0a01') is not null, 'the acceptance time is recorded');
select ok(exists (select 1 from public.application_events where application_id = '00000000-0000-0000-0000-0000000d0a02' and kind = 'rejected'), 'the history records the rejection');
select is((select decision_note from public.membership_applications where id = '00000000-0000-0000-0000-0000000d0a02'), 'weak motivation', 'the internal note is stored');

-- ------------------------------------------------------------------------------------------ funnel and waitlist
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a281","role":"authenticated"}', true);
select is((select applied from public.membership_cycle_funnel where cycle_id = '00000000-0000-0000-0000-00000000c281'), 6, 'funnel: applied');
select is((select accepted from public.membership_cycle_funnel where cycle_id = '00000000-0000-0000-0000-00000000c281'), 2, 'funnel: accepted');
select is((select waitlisted from public.membership_cycle_funnel where cycle_id = '00000000-0000-0000-0000-00000000c281'), 1, 'funnel: waitlisted');
select is((select activated from public.membership_cycle_funnel where cycle_id = '00000000-0000-0000-0000-00000000c281'), 0, 'funnel: nobody has activated yet');
select is((select position from public.membership_waitlist where application_id = '00000000-0000-0000-0000-0000000d0a04'), 1, 'the waitlist has an order');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a283","role":"authenticated"}', true);
select is((select count(*)::int from public.membership_waitlist), 0, 'the waitlist is for reviewers only');
select is((select count(*)::int from public.membership_cycle_funnel), 0, 'and so is the funnel');
reset role;

-- ------------------------------------------------------------------------------------------ undo
update public.membership_cycles set capacity = 5 where id = '00000000-0000-0000-0000-00000000c281';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a281","role":"authenticated"}', true);
select is((public.decide_membership_applications(array['00000000-0000-0000-0000-0000000d0a05']::uuid[], 'accept'))->0->>'ok', 'true', 'accepting E');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a282","role":"authenticated"}', true);
select throws_ok($$select public.undo_application_decision('00000000-0000-0000-0000-0000000d0a05')$$, 'P0001', 'UNDO_EXPIRED', 'only the person who decided can undo');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a281","role":"authenticated"}', true);
select is(public.undo_application_decision('00000000-0000-0000-0000-0000000d0a05'), 'submitted', 'the decision is undone within the window');
reset role;
select is((select count(*)::int from public.members where user_id = '00000000-0000-0000-0000-00000000a295'), 0, 'and the member created by it disappears');
select ok((select decided_at from public.membership_applications where id = '00000000-0000-0000-0000-0000000d0a05') is null, 'the decision time is cleared');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a281","role":"authenticated"}', true);
select is((public.decide_membership_applications(array['00000000-0000-0000-0000-0000000d0a05']::uuid[], 'reject'))->0->>'ok', 'true', 'rejecting E');
reset role;
insert into public.email_outbox (template_key, entity_type, entity_id, state, recipient_email, locale, status)
  values ('membership.application_rejected', 'membership_application', '00000000-0000-0000-0000-0000000d0a05', 's1', 'app.e@example.test', 'ar', 'processing');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000a281","role":"authenticated"}', true);
select throws_ok($$select public.undo_application_decision('00000000-0000-0000-0000-0000000d0a05')$$, 'P0001', 'UNDO_EXPIRED', 'once the e-mail is being sent the decision stays');
reset role;

select * from finish();
rollback;
