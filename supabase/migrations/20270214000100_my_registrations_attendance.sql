-- Sprint 10 · REG-006 — my registrations also show the attendance percentage (the one formula, stored at the roll-up)
-- and the certificate, if one was issued. Columns are appended, so CREATE OR REPLACE keeps existing callers working.
create or replace view public.my_registrations as
select
  r.id, r.event_id, r.status, r.attendance_result, r.created_at, r.decided_at, r.cancelled_at,
  e.slug, e.title_ar, e.title_en, e.status as event_status, e.start_date, e.end_date, e.start_time,
  e.location_mode, e.location_ar, e.location_en, e.cover_image_path,
  case when r.status = 'accepted' then d.group_link end as group_link,
  case when r.status = 'accepted' then d.meeting_url end as meeting_url,
  case when r.status = 'accepted' then d.meeting_notes end as meeting_notes,
  r.attendance_percent,
  (select c.id from public.certificates c where c.registration_id = r.id) as certificate_id
from public.event_registrations r
join public.events e on e.id = r.event_id
left join public.event_private_details d on d.event_id = e.id
where r.user_id = (select auth.uid());
