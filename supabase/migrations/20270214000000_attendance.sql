-- Sprint 10 · REG-006, PUB-003, REG-008 — attendance the KFUCS way (ADR-012): one session per scheduled day,
-- QR / online / manual check-in, session and event finalization with ONE canonical percentage, certificates.
-- Authoritative design: docs/11-modules/attendance/README.md, docs/05-database/entities/events.md §6–9.
-- KFUCS audit lessons built in: F-19 one formula, F-20 no orphaned sessions, F-23 no duplicate check-ins,
-- F-36 no completion without sign-off. Q-020 (certificates): off by default, threshold 70 % (the KFUCS value).

-- ------------------------------------------------------------------------------------------ site settings (read side)
-- The settings UI and the write function arrive in Sprint 11; attendance only reads two keys.
create table public.site_settings (
  key        text primary key check (key ~ '^[a-z0-9_]+$'),
  value      jsonb not null,
  is_public  boolean not null default false,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);
comment on table public.site_settings is 'Typed site configuration. Public keys are readable by the website; everything else needs settings.manage.';
alter table public.site_settings enable row level security;
revoke all on table public.site_settings from anon, authenticated;
grant select on public.site_settings to anon, authenticated;
create policy site_settings_select_public on public.site_settings
  for select to anon, authenticated using (is_public);
create policy site_settings_select_admin on public.site_settings
  for select to authenticated using (private.has_permission_any_scope('settings.manage'));

insert into public.site_settings (key, value, is_public) values
  ('certificates_enabled', 'false'::jsonb, false),
  ('certificate_threshold', '70'::jsonb, false)
on conflict (key) do nothing;

create or replace function private.setting(p_key text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$ select value from public.site_settings where key = p_key $$;
revoke all on function private.setting(text) from public, anon, authenticated;

-- ------------------------------------------------------------------------------------------ sessions and records
create table public.attendance_sessions (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events (id) on delete cascade,
  event_date_id uuid not null unique references public.event_dates (id) on delete restrict,
  -- "scheduled" is the absence of a row: a session exists from the moment an organizer opens it.
  status        text not null default 'open' check (status in ('open', 'closed', 'finalized')),
  opened_at     timestamptz not null default now(),
  opened_by     uuid references public.profiles (id) on delete set null,
  opened_late   boolean not null default false,
  closed_at     timestamptz,
  closed_by     uuid references public.profiles (id) on delete set null,
  qr_secret     text not null default encode(extensions.gen_random_bytes(24), 'hex'),
  finalized_at  timestamptz,
  finalized_by  uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index attendance_sessions_event_idx on public.attendance_sessions (event_id);

create table public.attendance_records (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references public.attendance_sessions (id) on delete cascade,
  registration_id uuid not null references public.event_registrations (id) on delete cascade,
  method          text not null check (method in ('qr', 'online', 'manual')),
  checked_in_at   timestamptz not null default now(),
  recorded_by     uuid references public.profiles (id) on delete set null,
  -- AT-2 / KFUCS F-23: one record per registration per session, whatever the method or the race.
  constraint attendance_records_one_per_session unique (registration_id, session_id)
);
create index attendance_records_session_idx on public.attendance_records (session_id);

-- ------------------------------------------------------------------------------------------ helpers
create or replace function private.today_riyadh()
returns date
language sql
stable
set search_path = ''
as $$ select (now() at time zone 'Asia/Riyadh')::date $$;

create or replace function private.session_committee(p_session uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select e.committee_id from public.attendance_sessions s join public.events e on e.id = s.event_id where s.id = p_session
$$;
revoke all on function private.session_committee(uuid) from public;
grant execute on function private.session_committee(uuid) to anon, authenticated;

-- AT-4 / KFUCS F-19: attended ÷ FINALIZED sessions on the CURRENT schedule. The only formula: the UI, the reports
-- and the certificates all call it. Null while no session is finalized.
create or replace function private.attendance_percent(p_registration uuid)
returns smallint
language sql
stable
security definer
set search_path = ''
as $$
  with r as (select event_id from public.event_registrations where id = p_registration),
  fin as (
    select s.id from public.attendance_sessions s
    join public.event_dates d on d.id = s.event_date_id
    join r on r.event_id = s.event_id
    where s.status = 'finalized'
  )
  select case when (select count(*) from fin) = 0 then null
    else round(100.0 * (select count(*) from public.attendance_records ar
                          where ar.registration_id = p_registration and ar.session_id in (select id from fin))
               / (select count(*) from fin))::smallint end
$$;
revoke all on function private.attendance_percent(uuid) from public, anon, authenticated;

-- Rotating QR token (AT-3): HMAC of the 30-second window with the session secret, valid for the current and the
-- previous window.
create or replace function private.qr_token(p_secret text, p_window bigint)
returns text
language sql
immutable
set search_path = ''
as $$ select substr(encode(extensions.hmac(p_window::text, p_secret, 'sha256'), 'hex'), 1, 24) $$;
revoke all on function private.qr_token(text, bigint) from public, anon, authenticated;

-- ------------------------------------------------------------------------------------------ RLS (reads only)
alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;
revoke all on table public.attendance_sessions, public.attendance_records from anon, authenticated;
grant select on public.attendance_records to authenticated;
-- The session row holds qr_secret: no table grant at all. Organizers read sessions through the functions below.

create policy attendance_records_select on public.attendance_records
  for select to authenticated
  using (
    private.has_permission('registrations.attendance', private.session_committee(session_id))
    or exists (select 1 from public.event_registrations r where r.id = registration_id and r.user_id = (select auth.uid()))
  );

-- ------------------------------------------------------------------------------------------ AT-5: no orphaned sessions
-- A scheduled date with a finalized session cannot be removed. A session that was only opened or closed goes away
-- with its date (its records with it).
create or replace function private.event_dates_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- When the whole event is being deleted (cascade) its dates and sessions simply go with it.
  if not exists (select 1 from public.events where id = old.event_id) then return old; end if;
  if exists (select 1 from public.attendance_sessions where event_date_id = old.id and status = 'finalized') then
    raise exception 'DATE_HAS_FINALIZED_SESSION' using errcode = 'P0001';
  end if;
  delete from public.attendance_sessions where event_date_id = old.id;
  return old;
end;
$$;
create trigger event_dates_guard before delete on public.event_dates
  for each row execute function private.event_dates_guard();

-- ------------------------------------------------------------------------------------------ sessions: open / close / finalize
create or replace function public.open_session(p_event_date uuid, p_confirm boolean default false)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  d public.event_dates;
  e public.events;
  s public.attendance_sessions;
  late boolean;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into d from public.event_dates where id = p_event_date;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  select * into e from public.events where id = d.event_id;
  if not private.has_permission('registrations.attendance', e.committee_id) then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if e.status <> 'published' then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;

  select * into s from public.attendance_sessions where event_date_id = p_event_date for update;
  if found then
    if s.status = 'open' then return s.id; end if;
    if s.status = 'finalized' then raise exception 'SESSION_FINALIZED' using errcode = 'P0001'; end if;
    -- reopen a closed (not yet finalized) session
    update public.attendance_sessions set status = 'open', closed_at = null, closed_by = null where id = s.id;
    perform private.write_audit('attendance.session_reopened', 'attendance_session', s.id::text, e.committee_id,
      jsonb_build_object('event', e.slug, 'date', d.event_date));
    return s.id;
  end if;

  late := d.event_date <> private.today_riyadh();
  if late and not coalesce(p_confirm, false) then raise exception 'NOT_SESSION_DAY' using errcode = 'P0001'; end if;

  insert into public.attendance_sessions (event_id, event_date_id, opened_by, opened_late)
  values (e.id, d.id, caller, late) returning * into s;
  perform private.write_audit('attendance.session_opened', 'attendance_session', s.id::text, e.committee_id,
    jsonb_build_object('event', e.slug, 'date', d.event_date, 'late', late));
  return s.id;
end;
$$;

create or replace function public.close_session(p_session uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  s public.attendance_sessions;
  committee uuid;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into s from public.attendance_sessions where id = p_session for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  committee := private.session_committee(p_session);
  if not private.has_permission('registrations.attendance', committee) then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if s.status <> 'open' then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
  update public.attendance_sessions set status = 'closed', closed_at = now(), closed_by = caller where id = s.id;
  perform private.write_audit('attendance.session_closed', 'attendance_session', s.id::text, committee, '{}'::jsonb);
end;
$$;

create or replace function public.finalize_session(p_session uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  s public.attendance_sessions;
  committee uuid;
  present integer;
  absent integer;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into s from public.attendance_sessions where id = p_session for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  committee := private.session_committee(p_session);
  if not private.has_permission('registrations.attendance', committee) then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if s.status = 'finalized' then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
  if s.status <> 'closed' then raise exception 'SESSION_NOT_CLOSED' using errcode = 'P0001'; end if;
  update public.attendance_sessions set status = 'finalized', finalized_at = now(), finalized_by = caller where id = s.id;
  select count(*) into present from public.attendance_records where session_id = s.id;
  select count(*) - present into absent from public.event_registrations where event_id = s.event_id and status = 'accepted';
  perform private.write_audit('attendance.session_finalized', 'attendance_session', s.id::text, committee,
    jsonb_build_object('present', present, 'absent', greatest(absent, 0)));
  return jsonb_build_object('present', present, 'absent', greatest(absent, 0));
end;
$$;

-- QR token for the organizer screen: 24 hex characters, valid for the current and the previous 30-second window.
create or replace function public.session_qr_token(p_session uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.attendance_sessions;
  epoch_now bigint := floor(extract(epoch from now()))::bigint;
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into s from public.attendance_sessions where id = p_session;
  if not found or not private.has_permission('registrations.attendance', private.session_committee(p_session)) then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if s.status <> 'open' then raise exception 'SESSION_NOT_OPEN' using errcode = 'P0001'; end if;
  return jsonb_build_object('token', private.qr_token(s.qr_secret, epoch_now / 30), 'expires_in', 30 - (epoch_now % 30));
end;
$$;

-- ------------------------------------------------------------------------------------------ check-in (participant)
create or replace function public.check_in(p_session uuid, p_token text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  s public.attendance_sessions;
  e public.events;
  reg public.event_registrations;
  epoch_now bigint := floor(extract(epoch from now()))::bigint;
  w bigint := epoch_now / 30;
  method text;
  inserted integer;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into s from public.attendance_sessions where id = p_session;
  if not found then raise exception 'SESSION_NOT_OPEN' using errcode = 'P0001'; end if;
  select * into e from public.events where id = s.event_id;
  -- AT-1: only an accepted registration of this event can check in.
  select * into reg from public.event_registrations where event_id = s.event_id and user_id = caller and status = 'accepted';
  if not found then raise exception 'NOT_ACCEPTED' using errcode = 'P0001'; end if;
  -- AT-3: self check-in only while the session is open.
  if s.status <> 'open' then raise exception 'SESSION_NOT_OPEN' using errcode = 'P0001'; end if;

  if nullif(p_token, '') is not null then
    if p_token not in (private.qr_token(s.qr_secret, w), private.qr_token(s.qr_secret, w - 1)) then
      raise exception 'TOKEN_EXPIRED' using errcode = 'P0001';
    end if;
    method := 'qr';
  else
    -- Without a token only online / hybrid events accept a self check-in (in person needs the code on screen).
    if e.location_mode = 'in_person' then raise exception 'TOKEN_EXPIRED' using errcode = 'P0001'; end if;
    method := 'online';
  end if;

  insert into public.attendance_records (session_id, registration_id, method)
  values (s.id, reg.id, method)
  on conflict (registration_id, session_id) do nothing;
  get diagnostics inserted = row_count;
  return case when inserted = 1 then 'checked_in' else 'already' end;
end;
$$;

-- What the check-in page needs to draw its state: the event, the caller's registration and the open session.
create or replace function public.check_in_context(p_slug text, p_session uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  e public.events;
  s public.attendance_sessions;
  reg public.event_registrations;
  day_no integer;
  d public.event_dates;
  rec public.attendance_records;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into e from public.events where slug = p_slug and status in ('published', 'completed');
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  select * into reg from public.event_registrations where event_id = e.id and user_id = caller and status = 'accepted';

  if p_session is not null then
    select * into s from public.attendance_sessions where id = p_session and event_id = e.id;
  else
    select * into s from public.attendance_sessions where event_id = e.id and status = 'open' order by opened_at desc limit 1;
  end if;

  if s.id is not null then
    select * into d from public.event_dates where id = s.event_date_id;
    select count(*) into day_no from public.event_dates where event_id = e.id and event_date <= d.event_date;
    if reg.id is not null then select * into rec from public.attendance_records where session_id = s.id and registration_id = reg.id; end if;
  end if;

  return jsonb_build_object(
    'event', jsonb_build_object('id', e.id, 'slug', e.slug, 'title_ar', e.title_ar, 'title_en', e.title_en, 'mode', e.location_mode),
    'accepted', reg.id is not null,
    'session', case when s.id is null then null else jsonb_build_object(
      'id', s.id, 'status', s.status, 'day', day_no, 'date', d.event_date,
      'days', (select count(*) from public.event_dates where event_id = e.id)) end,
    'checked_in_at', rec.checked_in_at
  );
end;
$$;

-- ------------------------------------------------------------------------------------------ organizer reads
-- Sessions of one event with live counts; one row per scheduled day (a day without a session is "scheduled").
create or replace function public.event_attendance_overview(p_event uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  e public.events;
  threshold integer := coalesce((private.setting('certificate_threshold'))::integer, 70);
  accepted integer;
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into e from public.events where id = p_event;
  if not found or not private.has_permission('registrations.attendance', e.committee_id) then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  select count(*) into accepted from public.event_registrations where event_id = p_event and status = 'accepted';

  return jsonb_build_object(
    'event', jsonb_build_object('id', e.id, 'slug', e.slug, 'status', e.status, 'title_ar', e.title_ar, 'title_en', e.title_en,
                                'finalized_at', e.attendance_finalized_at),
    'accepted', accepted,
    'threshold', threshold,
    'certificates_enabled', coalesce((private.setting('certificates_enabled'))::boolean, false),
    'average_percent', (select round(avg(attendance_percent))::integer from public.event_registrations
                         where event_id = p_event and status = 'accepted' and attendance_percent is not null),
    'eligible', (select count(*)::integer from public.event_registrations
                  where event_id = p_event and status = 'accepted' and attendance_result = 'attended'
                    and attendance_percent >= threshold),
    'certificates', jsonb_build_object(
      'issued', (select count(*)::integer from public.certificates where event_id = p_event),
      'sent', (select count(*)::integer from public.certificates where event_id = p_event and delivery_status = 'sent'),
      'failed', (select count(*)::integer from public.certificates where event_id = p_event and delivery_status = 'failed')),
    'days', coalesce((
      select jsonb_agg(jsonb_build_object(
        'event_date_id', d.id, 'date', d.event_date, 'day', d.rn,
        'session_id', s.id, 'status', coalesce(s.status, 'scheduled'), 'late', coalesce(s.opened_late, false),
        'present', coalesce(c.total, 0), 'qr', coalesce(c.qr, 0), 'online', coalesce(c.online, 0), 'manual', coalesce(c.manual, 0)
      ) order by d.event_date)
      from (select dd.id, dd.event_date, row_number() over (order by dd.event_date) as rn
              from public.event_dates dd where dd.event_id = p_event) d
      left join public.attendance_sessions s on s.event_date_id = d.id
      left join lateral (
        select count(*)::integer as total,
               count(*) filter (where method = 'qr')::integer as qr,
               count(*) filter (where method = 'online')::integer as online,
               count(*) filter (where method = 'manual')::integer as manual
        from public.attendance_records r where r.session_id = s.id) c on true
    ), '[]'::jsonb)
  );
end;
$$;

-- Accepted registrants of one session with their mark (names only — no e-mail, no answers).
create or replace function public.session_roster(p_session uuid)
returns table (
  registration_id uuid, full_name text, was_member boolean,
  present boolean, method text, checked_in_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.attendance_sessions;
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into s from public.attendance_sessions where id = p_session;
  if not found or not private.has_permission('registrations.attendance', private.session_committee(p_session)) then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  return query
    select r.id, r.full_name_snapshot, r.was_member, (a.id is not null), a.method, a.checked_in_at
    from public.event_registrations r
    left join public.attendance_records a on a.session_id = s.id and a.registration_id = r.id
    where r.event_id = s.event_id and r.status = 'accepted'
    order by (a.id is null), r.full_name_snapshot;
end;
$$;

-- ------------------------------------------------------------------------------------------ manual marking and corrections
create or replace function public.record_attendance(p_session uuid, p_registrations uuid[], p_present boolean default true)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  s public.attendance_sessions;
  committee uuid;
  changed integer;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into s from public.attendance_sessions where id = p_session for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  committee := private.session_committee(p_session);
  if not private.has_permission('registrations.attendance', committee) then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  -- AT: a finalized session is read-only here; corrections go through correct_attendance (permission + reason).
  if s.status = 'finalized' then raise exception 'SESSION_FINALIZED' using errcode = 'P0001'; end if;

  if coalesce(p_present, true) then
    insert into public.attendance_records (session_id, registration_id, method, recorded_by)
    select s.id, r.id, 'manual', caller
    from public.event_registrations r
    where r.id = any(p_registrations) and r.event_id = s.event_id and r.status = 'accepted'
    on conflict (registration_id, session_id) do nothing;
  else
    delete from public.attendance_records
    where session_id = s.id and registration_id = any(p_registrations) and method = 'manual';
  end if;
  get diagnostics changed = row_count;
  if changed > 0 then
    perform private.write_audit('attendance.recorded', 'attendance_session', s.id::text, committee,
      jsonb_build_object('present', coalesce(p_present, true), 'count', changed));
  end if;
  return changed;
end;
$$;

-- AT-7: after finalization a correction needs events.complete and a reason; it is audited and re-runs the roll-up.
create or replace function public.correct_attendance(p_session uuid, p_registration uuid, p_present boolean, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  s public.attendance_sessions;
  e public.events;
  reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into s from public.attendance_sessions where id = p_session for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  select * into e from public.events where id = s.event_id;
  if not private.has_permission('events.complete', e.committee_id) then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if s.status <> 'finalized' then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
  if reason is null then raise exception 'REASON_REQUIRED' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.event_registrations where id = p_registration and event_id = e.id and status = 'accepted') then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  if p_present then
    insert into public.attendance_records (session_id, registration_id, method, recorded_by)
    values (s.id, p_registration, 'manual', caller)
    on conflict (registration_id, session_id) do nothing;
  else
    delete from public.attendance_records where session_id = s.id and registration_id = p_registration;
  end if;

  if e.attendance_finalized_at is not null then
    update public.event_registrations r set
      attendance_percent = private.attendance_percent(r.id),
      attendance_result = case when exists (select 1 from public.attendance_records a where a.registration_id = r.id) then 'attended' else 'absent' end
    where r.id = p_registration;
  end if;
  perform private.write_audit('attendance.corrected', 'attendance_session', s.id::text, e.committee_id,
    jsonb_build_object('registration', p_registration, 'present', p_present, 'reason', reason));
end;
$$;

-- ------------------------------------------------------------------------------------------ event roll-up
create or replace function public.finalize_event_attendance(p_event uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  e public.events;
  threshold integer := coalesce((private.setting('certificate_threshold'))::integer, 70);
  attended integer;
  absent integer;
  eligible integer;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into e from public.events where id = p_event for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if not private.has_permission('events.complete', e.committee_id) then
    if private.has_permission('registrations.attendance', e.committee_id) then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if e.status <> 'published' or e.attendance_finalized_at is not null then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
  -- Every scheduled day needs a finalized session first (remove a day that never ran from the schedule instead).
  if not exists (select 1 from public.event_dates where event_id = p_event)
     or exists (
          select 1 from public.event_dates d
          left join public.attendance_sessions s on s.event_date_id = d.id
          where d.event_id = p_event and coalesce(s.status, 'scheduled') <> 'finalized') then
    raise exception 'SESSIONS_NOT_FINALIZED' using errcode = 'P0001';
  end if;

  update public.event_registrations r set
    attendance_percent = private.attendance_percent(r.id),
    attendance_result = case when exists (select 1 from public.attendance_records a where a.registration_id = r.id) then 'attended' else 'absent' end
  where r.event_id = p_event and r.status = 'accepted';

  update public.events set attendance_finalized_at = now(), attendance_finalized_by = caller where id = p_event;

  select count(*) filter (where attendance_result = 'attended'),
         count(*) filter (where attendance_result = 'absent'),
         count(*) filter (where attendance_result = 'attended' and attendance_percent >= threshold)
    into attended, absent, eligible
  from public.event_registrations where event_id = p_event and status = 'accepted';

  perform private.write_audit('attendance.event_finalized', 'event', e.id::text, e.committee_id,
    jsonb_build_object('slug', e.slug, 'attended', attended, 'absent', absent, 'eligible', eligible, 'threshold', threshold));
  return jsonb_build_object('attended', attended, 'absent', absent, 'eligible', eligible, 'threshold', threshold);
end;
$$;

-- ------------------------------------------------------------------------------------------ certificates
create table public.certificates (
  id                 uuid primary key default gen_random_uuid(),
  registration_id    uuid not null unique references public.event_registrations (id) on delete cascade,
  event_id           uuid not null references public.events (id) on delete cascade,
  user_id            uuid references public.profiles (id) on delete set null,
  recipient_name     text not null,
  recipient_email    text not null,
  attendance_percent smallint not null check (attendance_percent between 0 and 100),
  sessions_attended  smallint not null,
  sessions_expected  smallint not null,
  pdf_path           text,
  delivery_status    text not null default 'pending' check (delivery_status in ('pending', 'generated', 'sent', 'failed')),
  attempt_count      smallint not null default 0,
  last_attempt_at    timestamptz,
  sent_at            timestamptz,
  error_code         text,
  issued_at          timestamptz not null default now()
);
create index certificates_event_idx on public.certificates (event_id);
create index certificates_user_idx on public.certificates (user_id);
comment on table public.certificates is 'One per registration, frozen at issue (KFUCS BR-4.6). The id is the public verification id.';

alter table public.certificates enable row level security;
revoke all on table public.certificates from anon, authenticated;
grant select on public.certificates to authenticated;
create policy certificates_select on public.certificates
  for select to authenticated
  using (user_id = (select auth.uid())
         or private.has_permission('events.complete', (select e.committee_id from public.events e where e.id = event_id)));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('certificates', 'certificates', false, 2097152, array['application/pdf'])
on conflict (id) do nothing;

-- AT-8 / AT-10: eligibility is attended + percent ≥ threshold; one certificate per registration; frozen snapshot.
create or replace function public.issue_certificates(p_event uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  e public.events;
  threshold integer := coalesce((private.setting('certificate_threshold'))::integer, 70);
  expected integer;
  issued integer;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into e from public.events where id = p_event;
  if not found or not private.has_permission('events.complete', e.committee_id) then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if not coalesce((private.setting('certificates_enabled'))::boolean, false) then raise exception 'CERTIFICATES_DISABLED' using errcode = 'P0001'; end if;
  if e.attendance_finalized_at is null then raise exception 'ATTENDANCE_NOT_FINALIZED' using errcode = 'P0001'; end if;

  select count(*) into expected from public.attendance_sessions where event_id = p_event and status = 'finalized';
  insert into public.certificates (registration_id, event_id, user_id, recipient_name, recipient_email,
                                   attendance_percent, sessions_attended, sessions_expected)
  select r.id, r.event_id, r.user_id, r.full_name_snapshot, r.email_snapshot, r.attendance_percent,
         (select count(*) from public.attendance_records a where a.registration_id = r.id)::smallint, expected::smallint
  from public.event_registrations r
  where r.event_id = p_event and r.status = 'accepted' and r.attendance_result = 'attended'
    and r.attendance_percent >= threshold
  on conflict (registration_id) do nothing;
  get diagnostics issued = row_count;

  perform private.write_audit('certificate.issued', 'event', e.id::text, e.committee_id,
    jsonb_build_object('slug', e.slug, 'issued', issued, 'threshold', threshold));
  return jsonb_build_object('issued', issued,
    'total', (select count(*)::integer from public.certificates where event_id = p_event));
end;
$$;

-- AT-9: verification shows name, event, dates, percentage and validity only. Open to everyone (the id is the secret).
create or replace function public.verify_certificate(p_id uuid)
returns table (
  recipient_name text, title_ar text, title_en text, start_date date, end_date date,
  attendance_percent smallint, issued_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.recipient_name, e.title_ar, e.title_en, e.start_date, e.end_date, c.attendance_percent, c.issued_at
  from public.certificates c join public.events e on e.id = c.event_id
  where c.id = p_id
$$;

revoke all on function public.open_session(uuid, boolean), public.close_session(uuid), public.finalize_session(uuid),
  public.session_qr_token(uuid), public.check_in(uuid, text), public.check_in_context(text, uuid),
  public.event_attendance_overview(uuid), public.session_roster(uuid),
  public.record_attendance(uuid, uuid[], boolean), public.correct_attendance(uuid, uuid, boolean, text),
  public.finalize_event_attendance(uuid), public.issue_certificates(uuid), public.verify_certificate(uuid)
  from public, anon;
grant execute on function public.open_session(uuid, boolean), public.close_session(uuid), public.finalize_session(uuid),
  public.session_qr_token(uuid), public.check_in(uuid, text), public.check_in_context(text, uuid),
  public.event_attendance_overview(uuid), public.session_roster(uuid),
  public.record_attendance(uuid, uuid[], boolean), public.correct_attendance(uuid, uuid, boolean, text),
  public.finalize_event_attendance(uuid), public.issue_certificates(uuid)
  to authenticated;
grant execute on function public.verify_certificate(uuid) to anon, authenticated;

-- ------------------------------------------------------------------------------------------ events: schedule and completion
-- Re-created from 20261206000000_events.sql with the attendance rules (only the marked parts changed).
-- Single day and consecutive range keep the rows that are still on the schedule (their sessions with them) and
-- add the new ones; only dates that left the schedule are deleted (event_dates_guard handles their sessions).
create or replace function private.sync_event_dates()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  wanted date[] := '{}';
begin
  if new.schedule_type in ('single_day', 'consecutive_range') then
    if new.start_date is not null then
      select coalesce(array_agg(d::date), '{}') into wanted
      from generate_series(new.start_date::timestamp,
                           coalesce(case when new.schedule_type = 'single_day' then new.start_date else new.end_date end, new.start_date)::timestamp,
                           interval '1 day') as d;
    end if;
    delete from public.event_dates where event_id = new.id and not (event_date = any(wanted));
    insert into public.event_dates (event_id, event_date)
    select new.id, d from unnest(wanted) as d
    on conflict (event_id, event_date) do nothing;
  end if;
  return new;
end;
$$;

create or replace function public.save_event(
  p_event_id uuid,
  p jsonb,
  p_expected_updated_at timestamptz default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.events;
  old public.events;
  is_new boolean := p_event_id is null;
  caller uuid := (select auth.uid());
  has_private boolean := false;
  d_meeting_url text;
  d_meeting_notes text;
  d_group_link text;
  d_organizer_notes text;
  slug_in text;
  base text;
  n integer := 0;
  significant boolean := false;
  presenter jsonb;
  idx integer := 0;
  committee_status text;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;

  if is_new then
    v.id := gen_random_uuid();
    v.status := 'draft';
    v.created_by := caller;
    v.created_at := now();
    v.updated_at := now();
    v.type := coalesce(p ->> 'type', 'workshop');
    v.schedule_type := 'single_day';
    v.location_mode := 'in_person';
    v.audience := 'public';
    v.requires_approval := true;
    v.waitlist_enabled := false;
    v.certificate_available := false;
    v.goals := '{"ar":[],"en":[]}'::jsonb;
    v.faq := '[]'::jsonb;
    v.details := '{}'::jsonb;
    v.display_config := '{"show_presenters":false,"show_goals":true,"show_faq":true,"show_seats_remaining":false,"auto_close_registration":true,"show_details":true}'::jsonb;
    v.committee_id := nullif(p ->> 'committee_id', '')::uuid;
    if v.committee_id is null then raise exception 'SCOPE_REQUIRED' using errcode = 'P0001'; end if;
    if not private.has_permission('events.create', v.committee_id) then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  else
    select * into old from public.events where id = p_event_id for update;
    if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
    -- A user who cannot even see the event gets NOT_FOUND (no existence leak).
    if not (private.has_permission('events.view_drafts', old.committee_id) or old.status in ('published','cancelled','completed','archived')) then
      raise exception 'NOT_FOUND' using errcode = 'P0001';
    end if;
    if not private.has_permission('events.edit', old.committee_id) then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
    if old.status in ('pending_review', 'cancelled', 'completed', 'archived') then
      raise exception 'NOT_EDITABLE' using errcode = 'P0001';
    end if;
    -- Published events: the head and the leader (events.cancel marks them) may edit.
    if old.status = 'published' and not private.has_permission('events.cancel', old.committee_id) then
      raise exception 'FORBIDDEN' using errcode = 'P0001';
    end if;
    if p_expected_updated_at is not null and old.updated_at <> p_expected_updated_at then
      raise exception 'STALE_DATA' using errcode = 'P0001';
    end if;
    v := old;
    if p ? 'committee_id' and nullif(p ->> 'committee_id', '')::uuid is distinct from old.committee_id then
      v.committee_id := nullif(p ->> 'committee_id', '')::uuid;
      if not private.has_permission('events.create', v.committee_id) then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
    end if;
  end if;

  select status into committee_status from public.committees where id = v.committee_id;
  if committee_status is null then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if (is_new or v.committee_id is distinct from old.committee_id) and committee_status <> 'active' then
    raise exception 'COMMITTEE_INACTIVE' using errcode = 'P0001';
  end if;

  if p ? 'type' then v.type := p->>'type'; end if;
  if p ? 'title_ar' then v.title_ar := p->>'title_ar'; end if;
  if p ? 'title_en' then v.title_en := nullif(btrim(p->>'title_en'), ''); end if;
  if p ? 'summary_ar' then v.summary_ar := nullif(btrim(p->>'summary_ar'), ''); end if;
  if p ? 'summary_en' then v.summary_en := nullif(btrim(p->>'summary_en'), ''); end if;
  if p ? 'description_ar' then v.description_ar := nullif(btrim(p->>'description_ar'), ''); end if;
  if p ? 'description_en' then v.description_en := nullif(btrim(p->>'description_en'), ''); end if;
  if p ? 'schedule_type' then v.schedule_type := p->>'schedule_type'; end if;
  if p ? 'start_date' then v.start_date := nullif(p->>'start_date', '')::date; end if;
  if p ? 'end_date' then v.end_date := nullif(p->>'end_date', '')::date; end if;
  if p ? 'start_time' then v.start_time := nullif(p->>'start_time', '')::time; end if;
  if p ? 'end_time' then v.end_time := nullif(p->>'end_time', '')::time; end if;
  if p ? 'location_mode' then v.location_mode := p->>'location_mode'; end if;
  if p ? 'location_ar' then v.location_ar := nullif(btrim(p->>'location_ar'), ''); end if;
  if p ? 'location_en' then v.location_en := nullif(btrim(p->>'location_en'), ''); end if;
  if p ? 'map_url' then v.map_url := nullif(btrim(p->>'map_url'), ''); end if;
  if p ? 'seats' then v.seats := nullif(p->>'seats', '')::integer; end if;
  if p ? 'registration_start_at' then v.registration_start_at := nullif(p->>'registration_start_at', '')::timestamptz; end if;
  if p ? 'registration_end_at' then v.registration_end_at := nullif(p->>'registration_end_at', '')::timestamptz; end if;
  if p ? 'requires_approval' then v.requires_approval := (p->>'requires_approval')::boolean; end if;
  if p ? 'waitlist_enabled' then v.waitlist_enabled := (p->>'waitlist_enabled')::boolean; end if;
  if p ? 'audience' then v.audience := p->>'audience'; end if;
  if p ? 'goals' then v.goals := p->'goals'; end if;
  if p ? 'faq' then v.faq := p->'faq'; end if;
  if p ? 'details' then v.details := p->'details'; end if;
  if p ? 'display_config' then v.display_config := p->'display_config'; end if;
  if p ? 'cover_image_path' then v.cover_image_path := nullif(btrim(p->>'cover_image_path'), ''); end if;
  if p ? 'awards_ar' then v.awards_ar := nullif(btrim(p->>'awards_ar'), ''); end if;
  if p ? 'awards_en' then v.awards_en := nullif(btrim(p->>'awards_en'), ''); end if;
  if p ? 'certificate_available' then v.certificate_available := (p->>'certificate_available')::boolean; end if;
  if p ? 'contact_email' then v.contact_email := nullif(btrim(p->>'contact_email'), ''); end if;
  if p ? 'contact_phone' then v.contact_phone := nullif(btrim(p->>'contact_phone'), ''); end if;

  -- slug: provided (checked) or generated once for a new event
  slug_in := nullif(btrim(p ->> 'slug'), '');
  if slug_in is not null then
    if old.published_at is not null and slug_in <> old.slug then raise exception 'SLUG_LOCKED' using errcode = 'P0001'; end if;
    v.slug := slug_in;
    if exists (select 1 from public.events where slug = v.slug and id <> v.id) then raise exception 'SLUG_TAKEN' using errcode = 'P0001'; end if;
  elsif is_new then
    base := private.slugify(coalesce(v.title_en, ''));
    if char_length(base) < 3 then base := 'event'; end if;
    v.slug := base;
    while exists (select 1 from public.events where slug = v.slug) loop
      n := n + 1;
      v.slug := base || '-' || substr(md5(random()::text || n::text), 1, 5);
    end loop;
  end if;

  -- private details
  if p ? 'meeting_url' then d_meeting_url := nullif(btrim(p->>'meeting_url'), ''); has_private := true; end if;
  if p ? 'meeting_notes' then d_meeting_notes := nullif(btrim(p->>'meeting_notes'), ''); has_private := true; end if;
  if p ? 'group_link' then d_group_link := nullif(btrim(p->>'group_link'), ''); has_private := true; end if;
  if p ? 'organizer_notes' then d_organizer_notes := nullif(btrim(p->>'organizer_notes'), ''); has_private := true; end if;

  if is_new then
    insert into public.events select v.*;
  else
    -- significant change on a published event (dates, mode, place) → caller notifies registrants (Sprint 06)
    significant := old.status = 'published' and (
      v.start_date is distinct from old.start_date or v.end_date is distinct from old.end_date
      or v.start_time is distinct from old.start_time or v.end_time is distinct from old.end_time
      or v.location_mode is distinct from old.location_mode or v.location_ar is distinct from old.location_ar
      or v.schedule_type is distinct from old.schedule_type
    );
    update public.events set
      committee_id = v.committee_id, slug = v.slug, type = v.type, title_ar = v.title_ar, title_en = v.title_en,
      summary_ar = v.summary_ar, summary_en = v.summary_en, description_ar = v.description_ar, description_en = v.description_en,
      schedule_type = v.schedule_type, start_date = v.start_date, end_date = v.end_date, start_time = v.start_time, end_time = v.end_time,
      location_mode = v.location_mode, location_ar = v.location_ar, location_en = v.location_en, map_url = v.map_url,
      seats = v.seats, registration_start_at = v.registration_start_at, registration_end_at = v.registration_end_at,
      requires_approval = v.requires_approval, waitlist_enabled = v.waitlist_enabled, audience = v.audience,
      goals = v.goals, faq = v.faq, details = v.details, display_config = v.display_config,
      cover_image_path = v.cover_image_path, awards_ar = v.awards_ar, awards_en = v.awards_en,
      certificate_available = v.certificate_available, contact_email = v.contact_email, contact_phone = v.contact_phone
    where id = v.id;
  end if;

  if has_private or is_new then
    insert into public.event_private_details (event_id, meeting_url, meeting_notes, group_link, organizer_notes)
    values (v.id, d_meeting_url, d_meeting_notes, d_group_link, d_organizer_notes)
    on conflict (event_id) do update set meeting_url = case when p ? 'meeting_url' then excluded.meeting_url else public.event_private_details.meeting_url end, meeting_notes = case when p ? 'meeting_notes' then excluded.meeting_notes else public.event_private_details.meeting_notes end, group_link = case when p ? 'group_link' then excluded.group_link else public.event_private_details.group_link end, organizer_notes = case when p ? 'organizer_notes' then excluded.organizer_notes else public.event_private_details.organizer_notes end;
  end if;

  -- specific dates: replace the rows (single day / range are handled by the trigger)
  if v.schedule_type = 'specific_dates' and p ? 'dates' then
    delete from public.event_dates
     where event_id = v.id and event_date::text not in (select jsonb_array_elements_text(p -> 'dates'));
    insert into public.event_dates (event_id, event_date)
    select v.id, d::date from (select distinct jsonb_array_elements_text(p -> 'dates') as d) x
    on conflict (event_id, event_date) do nothing;
    update public.events set start_date = (select min(event_date) from public.event_dates where event_id = v.id),
                             end_date = (select max(event_date) from public.event_dates where event_id = v.id)
     where id = v.id;
  end if;

  -- presenters: replace the set (≤ 10)
  if p ? 'presenters' then
    if jsonb_array_length(p -> 'presenters') > 10 then raise exception 'VALIDATION_FAILED' using errcode = 'P0001'; end if;
    delete from public.event_presenters where event_id = v.id;
    for presenter in select * from jsonb_array_elements(p -> 'presenters') loop
      insert into public.event_presenters (event_id, profile_id, guest_name_ar, guest_name_en, guest_title_ar, guest_title_en, guest_photo_path, guest_link, role, sort_order)
      values (
        v.id, nullif(presenter ->> 'profile_id', '')::uuid,
        nullif(btrim(presenter ->> 'guest_name_ar'), ''), nullif(btrim(presenter ->> 'guest_name_en'), ''),
        nullif(btrim(presenter ->> 'guest_title_ar'), ''), nullif(btrim(presenter ->> 'guest_title_en'), ''),
        nullif(presenter ->> 'guest_photo_path', ''), nullif(presenter ->> 'guest_link', ''),
        coalesce(nullif(presenter ->> 'role', ''), 'presenter'), idx
      );
      idx := idx + 1;
    end loop;
  end if;

  perform private.write_audit(case when is_new then 'event.created' else 'event.updated' end, 'event', v.id::text, v.committee_id,
    jsonb_build_object('slug', v.slug, 'status', coalesce(old.status, 'draft'), 'significant_change', significant));

  return (select jsonb_build_object('id', e.id, 'slug', e.slug, 'status', e.status, 'updated_at', e.updated_at, 'significant_change', significant)
            from public.events e where e.id = v.id);
end;
$$;

create or replace function public.transition_event(p_id uuid, p_action text, p_note text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  e public.events;
  caller uuid := (select auth.uid());
  to_status text;
  audit_action text;
  missing text;
  note text := nullif(btrim(coalesce(p_note, '')), '');
  event_last_date date;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into e from public.events where id = p_id for update;
  if not found or not (private.has_permission('events.view_drafts', e.committee_id) or e.status in ('published','cancelled','completed','archived')) then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;

  case p_action
    when 'submit' then
      if not private.has_permission('events.submit', e.committee_id) then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
      if e.status not in ('draft', 'changes_requested') then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
      missing := private.event_missing_requirement(e.id);
      if missing is not null then raise exception 'INCOMPLETE:%', missing using errcode = 'P0001'; end if;
      to_status := 'pending_review'; audit_action := 'event.submitted';
    when 'withdraw' then
      if not private.has_permission('events.submit', e.committee_id) then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
      if e.status <> 'pending_review' then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
      to_status := 'draft'; audit_action := 'event.withdrawn';
    when 'approve' then
      if not private.has_permission('events.approve', e.committee_id) then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
      if e.status not in ('pending_review', 'draft') then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
      missing := private.event_missing_requirement(e.id);
      if missing is not null then raise exception 'PUBLISH_GUARD:%', missing using errcode = 'P0001'; end if;
      to_status := 'published'; audit_action := 'event.approved';
    when 'request_changes' then
      if not private.has_permission('events.approve', e.committee_id) then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
      if e.status <> 'pending_review' then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
      if note is null or char_length(note) < 10 then raise exception 'NOTE_TOO_SHORT' using errcode = 'P0001'; end if;
      to_status := 'changes_requested'; audit_action := 'event.changes_requested';
    when 'cancel' then
      if not private.has_permission('events.cancel', e.committee_id) then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
      if e.status <> 'published' then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
      if note is null then raise exception 'REASON_REQUIRED' using errcode = 'P0001'; end if;
      to_status := 'cancelled'; audit_action := 'event.cancelled';
    when 'complete' then
      if not private.has_permission('events.complete', e.committee_id) then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
      if e.status <> 'published' then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
      select coalesce(max(event_date), e.end_date, e.start_date) into event_last_date from public.event_dates where event_id = e.id;
      if event_last_date is null or event_last_date >= (now() at time zone 'Asia/Riyadh')::date then
        raise exception 'EVENT_NOT_ENDED' using errcode = 'P0001';
      end if;
      if exists (select 1 from public.attendance_sessions where event_id = e.id) and e.attendance_finalized_at is null then
        raise exception 'ATTENDANCE_NOT_FINALIZED' using errcode = 'P0001';
      end if;
      to_status := 'completed'; audit_action := 'event.completed';
    when 'archive' then
      if not private.has_permission('events.complete', e.committee_id) then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
      if e.status not in ('completed', 'cancelled') then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
      to_status := 'archived'; audit_action := 'event.archived';
    else
      raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
  end case;

  perform set_config('app.event_transition', 'on', true);
  update public.events set
    status = to_status,
    submitted_by = case when p_action = 'submit' then caller else submitted_by end,
    submitted_at = case when p_action = 'submit' then now() else submitted_at end,
    submission_note = case when p_action = 'submit' then note else submission_note end,
    reviewed_by = case when p_action in ('approve', 'request_changes') then caller else reviewed_by end,
    reviewed_at = case when p_action in ('approve', 'request_changes') then now() else reviewed_at end,
    review_note = case when p_action in ('approve', 'request_changes') then note else review_note end,
    published_at = case when p_action = 'approve' then coalesce(published_at, now()) else published_at end,
    cancelled_at = case when p_action = 'cancel' then now() else cancelled_at end,
    cancel_reason = case when p_action = 'cancel' then note else cancel_reason end,
    completed_at = case when p_action = 'complete' then now() else completed_at end,
    archived_at = case when p_action = 'archive' then now() else archived_at end
  where id = e.id;
  perform set_config('app.event_transition', 'off', true);

  perform private.write_audit(audit_action, 'event', e.id::text, e.committee_id,
    jsonb_build_object('from', e.status, 'to', to_status, 'note', note, 'direct', (p_action = 'approve' and e.status = 'draft')));
  return to_status;
end;
$$;

grant execute on function public.save_event(uuid, jsonb, timestamptz) to authenticated;
grant execute on function public.transition_event(uuid, text, text) to authenticated;

