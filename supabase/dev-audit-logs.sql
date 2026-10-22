-- LOCAL ONLY: sample rows for the audit log (/dashboard/admin/audit): members, applications, cycles, positions,
-- committees, events, privacy and settings, with actors and field summaries. Safe to run twice (seed rows replaced).
--   docker exec -i supabase_db_sdc_web psql -U postgres -v ON_ERROR_STOP=1 < supabase/dev-audit-logs.sql
begin;
delete from public.audit_logs where request_id = 'dev-seed';

insert into public.audit_logs (occurred_at, actor_id, action, entity_type, entity_id, summary, request_id)
select now() - (v.mins || ' minutes')::interval,
       (select id from public.profiles where email = v.actor), v.action, v.etype, v.eid, v.summary::jsonb, 'dev-seed'
from (values
  (4,    'dev.leader@example.test', 'membership_application.accepted',       'membership_application', '00000000-0000-0000-0000-0000000e0006', '{"score":4.4,"capacity":"5/6"}'),
  (9,    'dev.leader@example.test', 'membership_application.scored',         'membership_application', '00000000-0000-0000-0000-0000000e0016', '{"average":4.3}'),
  (15,   'dev.founder@example.test','membership_application.waitlisted',     'membership_application', '00000000-0000-0000-0000-0000000e0007', '{}'),
  (22,   'dev.leader@example.test', 'membership_application.info_requested', 'membership_application', '00000000-0000-0000-0000-0000000e0005', '{"fields":["github_url"]}'),
  (40,   'dev.leader@example.test', 'membership_cycle.updated',              'membership_cycle', '00000000-0000-0000-0000-00000000cc01', '{"fields":["capacity","rubric"],"capacity":6}'),
  (75,   'dev.admin@example.test',  'member.updated_by_staff',               'member', 'aa1688fe-b3cc-4ec8-b891-5cf7e8718564', '{"fields":["headline_ar","about_ar","github_url"]}'),
  (80,   'dev.admin@example.test',  'member.skills_updated_by_staff',        'member', 'aa1688fe-b3cc-4ec8-b891-5cf7e8718564', '{"count":5}'),
  (95,   'dev.leader@example.test', 'member.renewed',                        'member', 'aa1688fe-b3cc-4ec8-b891-5cf7e8718564', '{"term_ends_at":"2027-11-03"}'),
  (130,  'dev.leader@example.test', 'member.suspended',                      'member', '59dd752a-4931-4abb-bd40-2d6629184311', '{"category":"inactivity","until":"2026-11-21"}'),
  (200,  'dev.leader@example.test', 'member.leave_approved',                 'member', 'b2292f81-bb9a-443c-a14e-2b36b916b0a8', '{"effective":"2026-10-12"}'),
  (260,  'dev.admin@example.test',  'account.blocked',                       'profile', '30cfa6b0-4345-4333-bbb7-4f48192e2001', '{"reason":"spam reports"}'),
  (300,  'dev.leader@example.test', 'role.assigned',                         'role_assignment', '043049ce-73f9-4484-b870-ba4f8c94bb94', '{"role_key":"committee_member","committee":"cybersecurity","starts_at":"2026-09-12T09:38:15+00:00","ends_at":null}'),
  (320,  'dev.leader@example.test', 'role.ended',                            'role_assignment', '043049ce-73f9-4484-b870-ba4f8c94bb95', '{"role_key":"committee_member","committee":"ai","end_reason":"stepped down"}'),
  (500,  'dev.admin@example.test',  'committee.updated',                     'committee', 'cc4a0441-e0e4-438f-b40f-4a3b39257cee', '{"fields":["name_ar","description_en"]}'),
  (800,  'dev.admin@example.test',  'event.deleted',                         'event', '95f1f80b-191f-4e78-b317-fe4313eb56e7', '{"title":"draft event"}'),
  (1200, 'dev.admin@example.test',  'settings.update',                       'site_settings', 'site', '{"fields":["contact_email","whatsapp_url"]}'),
  (1500, 'dev.admin@example.test',  'privacy.retention_run',                 'system', 'retention', '{"count":3}'),
  (1700, 'dev.leader@example.test', 'attendance.session_opened',             'attendance_session', 'a7f63bac-2454-439a-a6a4-a67008b0e4a3', '{}'),
  (1800, 'dev.leader@example.test', 'certificate.issued',                    'event', '960e4bca-5e73-4c23-afa8-f03c2ef351ba', '{"count":12}'),
  (2000, 'dev.admin@example.test',  'tag.update',                            'tag', 'tag-ai', '{"fields":["name_ar"]}')
) as v(mins, actor, action, etype, eid, summary);
commit;
