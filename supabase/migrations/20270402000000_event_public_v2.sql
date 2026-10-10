-- RDS-011: what the v2 event page needs that was not public yet.

-- A place per day (multi-day events can meet in different venues). Null falls back to the event's place.
alter table public.event_dates
  add column location_ar text check (location_ar is null or char_length(location_ar) <= 500),
  add column location_en text check (location_en is null or char_length(location_en) <= 500);

-- The certificate rule is shown on the event page ("attend 70% of the sessions"), so these two are public.
update public.site_settings set is_public = true where key in ('certificates_enabled', 'certificate_threshold');

-- Is a check-in session open right now? A boolean only: no session id, no token (the QR carries those).
create or replace function public.event_checkin_open(p_slug text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.attendance_sessions s
    join public.events e on e.id = s.event_id
    where e.slug = p_slug and e.status = 'published' and s.status = 'open'
  )
$$;
revoke all on function public.event_checkin_open(text) from public;
grant execute on function public.event_checkin_open(text) to anon, authenticated;
