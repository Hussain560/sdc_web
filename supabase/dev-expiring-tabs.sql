-- LOCAL ONLY: fills the member record tabs for ماجد علي القرني (dev.expiring): positions (one ended, one active),
-- event participation (three attended events), a past membership application (accepted in the spring cycle) and an
-- audit trail. Run after the lifecycle seeds. Safe to run twice (fixed ids, guarded inserts).
--   docker exec -i supabase_db_sdc_web psql -U postgres -v ON_ERROR_STOP=1 < supabase/dev-expiring-tabs.sql
begin;

create temp table _me on commit drop as
select m.id as member_id, p.id as user_id, p.email, m.joined_at
from public.members m join public.profiles p on p.id = m.user_id
where p.email = 'dev.expiring@example.test';

-- 1) Committee positions ----------------------------------------------------------------------------------------------
insert into public.role_assignments (user_id, role_key, committee_id, starts_at, ends_at, end_reason, assigned_by, created_at)
select me.user_id, 'committee_member', c.id, now() - interval '320 days', now() - interval '150 days',
       'stepped down after the spring term', (select id from public.profiles where email = 'dev.leader@example.test'), now()
from _me me, public.committees c
where c.slug = 'ai'
  and not exists (select 1 from public.role_assignments r where r.user_id = me.user_id and r.committee_id = c.id and r.starts_at < now() - interval '300 days');

insert into public.role_assignments (user_id, role_key, committee_id, starts_at, ends_at, assigned_by, created_at)
select me.user_id, 'committee_member', c.id, now() - interval '40 days', null,
       (select id from public.profiles where email = 'dev.leader@example.test'), now()
from _me me, public.committees c
where c.slug = 'cybersecurity'
  and not exists (select 1 from public.role_assignments r where r.user_id = me.user_id and r.committee_id = c.id and r.ends_at is null);

-- 2) Event participation: three attended events ----------------------------------------------------------------------
insert into public.event_registrations (event_id, user_id, status, attendance_result, attendance_percent,
  full_name_snapshot, email_snapshot, was_member, answers, created_at, updated_at)
select e.id, me.user_id, 'accepted', 'attended', 100, 'ماجد علي القرني', me.email, true, '{}'::jsonb,
       now() - (e.n * 25 || ' days')::interval, now()
from _me me
cross join (
  select id, row_number() over (order by created_at) as n from public.events where status = 'published'
) e
where e.n <= 3
  and not exists (select 1 from public.event_registrations r where r.user_id = me.user_id);

-- 3) A past membership application (the spring cycle, accepted) ------------------------------------------------------
insert into public.membership_applications (cycle_id, user_id, email, first_name_ar, middle_name_ar, last_name_ar,
  first_name_en, middle_name_en, last_name_en, full_name_ar, full_name_en, phone, academic_status, status, reference,
  university_id, major_id, track_id, bio_ar, github_url, answers, consent_version, consent_at, submitted_at,
  accepted_at, decided_at, wants_directory_listing, created_at, updated_at, info_fields)
select c.id, me.user_id, me.email, 'ماجد', 'علي', 'القرني', 'Majed', 'Ali', 'Alqarni', 'ماجد علي القرني', 'Majed Ali Alqarni',
  '+966506000021', 'employee', 'accepted', 'SDC-26-0521', 1, 1, 1, 'مهندس برمجيات أعمل على الخدمات الخلفية.',
  'https://github.com/majed-q', '{"why":"أريد نشر ما أتعلمه ومشاركة الخبرة."}'::jsonb, 'v1', now() - interval '210 days',
  now() - interval '212 days', now() - interval '205 days', now() - interval '205 days', true, now(), now(), '{}'
from _me me, public.membership_cycles c
where c.id = '00000000-0000-0000-0000-00000000cc00'
  and not exists (select 1 from public.membership_applications a where a.cycle_id = c.id and a.user_id = me.user_id);

-- 4) Audit trail (entity = this member) -----------------------------------------------------------------------------
insert into public.audit_logs (occurred_at, actor_id, action, entity_type, entity_id, summary)
select now() - (x.days || ' days')::interval, (select id from public.profiles where email = 'dev.leader@example.test'),
       x.action, 'member', me.member_id::text, x.summary::jsonb
from _me me
cross join (values
  (340, 'member.created', '{"via":"application"}'),
  (205, 'member.activated', '{}'),
  (150, 'member.role_changed', '{"role":"committee_member","committee":"ai","change":"ended"}'),
  (40, 'member.role_changed', '{"role":"committee_member","committee":"cybersecurity","change":"assigned"}'),
  (19, 'member.renewal_requested', '{}'),
  (10, 'member.profile_updated', '{"fields":["headline_ar","about_ar"]}')
) as x(days, action, summary)
where not exists (select 1 from public.audit_logs l where l.entity_type = 'member' and l.entity_id = me.member_id::text and l.action = x.action);

commit;
