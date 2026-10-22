-- LOCAL ONLY: sample rows for the e-mail log (/dashboard/admin/emails): every kind of mail the lifecycle sends, in both
-- languages, with sent, skipped, in-progress, retrying, abandoned and recovered ones. Nothing is actually sent.
--   docker exec -i supabase_db_sdc_web psql -U postgres -v ON_ERROR_STOP=1 < supabase/dev-email-logs.sql
-- Safe to run twice (the idempotency keys are fixed; existing seed rows are replaced).
begin;

delete from public.email_logs where idempotency_key like 'dev-seed:%';

insert into public.email_logs
  (created_at, template_key, locale, recipient_user_id, recipient_email, entity_type, entity_id, idempotency_key,
   attempt, status, provider, provider_message_id, error_code, error_message)
select now() - (v.mins || ' minutes')::interval, v.tpl, v.loc,
       (select id from public.profiles p where p.email = v.email), v.email, v.etype, v.eid,
       'dev-seed:' || case when v.n = 28 then 27 else v.n end, v.attempt, v.status, case when v.status in ('sent', 'failed') then 'mailpit' end,
       case when v.status = 'sent' then 'seed-' || v.n end, v.err,
       case when v.err is not null then 'The provider answered with an error (seed data).' end
from (values
  -- applicants
  (1,  3,    'membership.application_received',  'ar', 'seed.applicant1@example.test',  'membership_application', '00000000-0000-0000-0000-0000000e0001', 1, 'sent',    null),
  (2,  14,   'membership.application_received',  'ar', 'seed.applicant2@example.test',  'membership_application', '00000000-0000-0000-0000-0000000e0002', 1, 'sent',    null),
  (3,  30,   'membership.info_requested',        'ar', 'seed.applicant5@example.test',  'membership_application', '00000000-0000-0000-0000-0000000e0005', 1, 'sent',    null),
  (4,  55,   'membership.application_accepted',  'ar', 'seed.applicant6@example.test',  'membership_application', '00000000-0000-0000-0000-0000000e0006', 1, 'sent',    null),
  (5,  58,   'membership.application_waitlisted','ar', 'seed.applicant7@example.test',  'membership_application', '00000000-0000-0000-0000-0000000e0007', 1, 'sent',    null),
  (6,  61,   'membership.application_rejected',  'ar', 'seed.applicant8@example.test',  'membership_application', '00000000-0000-0000-0000-0000000e0008', 1, 'sent',    null),
  (7,  1500, 'membership.activation_reminder',   'ar', 'seed.applicant19@example.test', 'membership_application', '00000000-0000-0000-0000-0000000e0019', 1, 'sent',    null),
  (8,  2900, 'membership.activation_lapsed',     'ar', 'seed.applicant31@example.test', 'membership_application', '00000000-0000-0000-0000-0000000e0031', 1, 'sent',    null),
  (9,  62,   'membership.application_accepted',  'en', 'seed.applicant20@example.test', 'membership_application', '00000000-0000-0000-0000-0000000e0020', 1, 'sending', null),
  -- members
  (10, 120,  'member.term_reminder',             'ar', 'dev.expiring@example.test',     'member', 'aa1688fe-b3cc-4ec8-b891-5cf7e8718564', 1, 'sent', null),
  (11, 4300, 'member.expired',                   'ar', 'dev.expired@example.test',      'member', 'db29eb24-e19f-4907-9844-58a74ad8150d', 1, 'sent', null),
  (12, 200,  'member.suspended',                 'ar', 'dev.suspended@example.test',    'member', '59dd752a-4931-4abb-bd40-2d6629184311', 1, 'sent', null),
  (13, 8000, 'member.ended',                     'ar', 'dev.ended@example.test',        'member', 'b2292f81-bb9a-443c-a14e-2b36b916b0a8', 1, 'sent', null),
  (14, 8010, 'member.leave_approved',            'ar', 'dev.ended@example.test',        'member', 'b2292f81-bb9a-443c-a14e-2b36b916b0a8', 1, 'sent', null),
  (15, 90,   'member.leave_requested',           'ar', 'dev.leaving@example.test',      'member', '0f03e03d-c24e-4522-ad8f-067914ff3b24', 1, 'sent', null),
  (16, 88,   'member.leave_notice',              'ar', 'dev.leader@example.test',       'member', '0f03e03d-c24e-4522-ad8f-067914ff3b24', 1, 'sent', null),
  (17, 70,   'member.renewal_requested',         'ar', 'dev.leader@example.test',       'member', 'aa1688fe-b3cc-4ec8-b891-5cf7e8718564', 1, 'sent', null),
  (18, 20,   'member.message',                   'en', 'dev.regular@example.test',      'member', '761c5692-fe1f-4c25-ab9a-6abe56bbb6f7', 1, 'sent', null),
  (19, 400,  'account.blocked',                  'ar', 'dev.blocked@example.test',      'profile', '30cfa6b0-4345-4333-bbb7-4f48192e2001', 1, 'sent', null),
  (20, 5,    'leadership.digest',                'ar', 'dev.leader@example.test',       'system', 'digest-2026-10-22', 1, 'sent', null),
  (21, 6,    'leadership.digest',                'ar', 'dev.admin@example.test',        'system', 'digest-2026-10-22', 1, 'sent', null),
  -- skipped (no address / opted out)
  (22, 45,   'member.renewed',                   'ar', 'dev.plain@example.test',        'member', 'aa1688fe-b3cc-4ec8-b891-5cf7e8718564', 1, 'skipped', null),
  -- failed: will retry (attempt 1 and 2) and abandoned (attempt 3)
  (23, 25,   'membership.application_received',  'ar', 'seed.applicant3@example.test',  'membership_application', '00000000-0000-0000-0000-0000000e0003', 1, 'failed', 'PROVIDER_ERROR'),
  (24, 40,   'membership.application_accepted',  'ar', 'seed.applicant21@example.test', 'membership_application', '00000000-0000-0000-0000-0000000e0021', 2, 'failed', 'TIMEOUT'),
  (25, 700,  'member.created',                   'ar', 'dev.newmember@example.test',    'member', 'a93de40e-7425-4436-b845-9a02a1808e61', 4, 'failed', 'PROVIDER_ERROR'),
  (26, 1200, 'member.term_reminder',             'en', 'dev.expired@example.test',      'member', 'db29eb24-e19f-4907-9844-58a74ad8150d', 3, 'failed', 'INVALID_RECIPIENT'),
  -- recovered: failed first, then sent (same message)
  (27, 300,  'membership.application_accepted',  'ar', 'seed.applicant22@example.test', 'membership_application', '00000000-0000-0000-0000-0000000e0022', 1, 'failed', 'RATE_LIMITED'),
  (28, 290,  'membership.application_accepted',  'ar', 'seed.applicant22@example.test', 'membership_application', '00000000-0000-0000-0000-0000000e0022', 2, 'sent',   null)
) as v(n, mins, tpl, loc, email, etype, eid, attempt, status, err);

commit;
