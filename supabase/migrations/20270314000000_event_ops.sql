-- Event operations (KFUCS parity): a 120-second QR window, check-in by registered e-mail from a public page
-- (no sign-in), live numbers for the QR screen, and the roster with e-mails.

-- ------------------------------------------------------------------------------------------ 120 s QR window
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
  return jsonb_build_object('token', private.qr_token(s.qr_secret, epoch_now / 120), 'expires_in', 120 - (epoch_now % 120));
end;
$$;

-- Signed-in self check-in: the token of this or the previous 120 s window is valid (up to four minutes of grace).
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
  w bigint := floor(extract(epoch from now()))::bigint / 120;
  method text;
  inserted integer;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into s from public.attendance_sessions where id = p_session;
  if not found then raise exception 'SESSION_NOT_OPEN' using errcode = 'P0001'; end if;
  select * into e from public.events where id = s.event_id;
  select * into reg from public.event_registrations where event_id = s.event_id and user_id = caller and status = 'accepted';
  if not found then raise exception 'NOT_ACCEPTED' using errcode = 'P0001'; end if;
  if s.status <> 'open' then raise exception 'SESSION_NOT_OPEN' using errcode = 'P0001'; end if;

  if nullif(p_token, '') is not null then
    if p_token not in (private.qr_token(s.qr_secret, w), private.qr_token(s.qr_secret, w - 1)) then
      raise exception 'TOKEN_EXPIRED' using errcode = 'P0001';
    end if;
    method := 'qr';
  else
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

-- ------------------------------------------------------------------------------------------ public check-in by e-mail
create table public.check_in_failures (
  id         bigint generated always as identity primary key,
  session_id uuid not null references public.attendance_sessions (id) on delete cascade,
  at         timestamptz not null default now()
);
create index check_in_failures_session_idx on public.check_in_failures (session_id, at desc);
alter table public.check_in_failures enable row level security;
revoke all on table public.check_in_failures from anon, authenticated;
comment on table public.check_in_failures is 'Failed public check-in attempts, only to throttle guessing of registered e-mails.';

-- What the public check-in page draws without a sign-in: the event title, the day and whether the session is open.
create or replace function public.check_in_public_context(p_session uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.attendance_sessions;
  e public.events;
  d public.event_dates;
  day_no integer;
begin
  select * into s from public.attendance_sessions where id = p_session;
  if not found then return null; end if;
  select * into e from public.events where id = s.event_id and status in ('published', 'completed');
  if not found then return null; end if;
  select * into d from public.event_dates where id = s.event_date_id;
  select count(*) into day_no from public.event_dates where event_id = e.id and event_date <= d.event_date;
  return jsonb_build_object(
    'event', jsonb_build_object('slug', e.slug, 'title_ar', e.title_ar, 'title_en', e.title_en),
    'session', jsonb_build_object('id', s.id, 'status', s.status, 'day', day_no, 'date', d.event_date,
      'days', (select count(*) from public.event_dates where event_id = e.id)));
end;
$$;

-- Check in with the e-mail used to register. The QR token is mandatory. Expected failures are returned (not raised)
-- so that the throttle row survives; at most 30 failures per session per minute.
create or replace function public.check_in_by_email(p_session uuid, p_token text, p_email text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.attendance_sessions;
  reg public.event_registrations;
  w bigint := floor(extract(epoch from now()))::bigint / 120;
  mail text := lower(btrim(coalesce(p_email, '')));
  inserted integer;
  code text;
begin
  select * into s from public.attendance_sessions where id = p_session;
  if not found then return jsonb_build_object('ok', false, 'code', 'SESSION_NOT_OPEN'); end if;
  delete from public.check_in_failures where at < now() - interval '1 hour';
  if (select count(*) from public.check_in_failures where session_id = s.id and at > now() - interval '1 minute') >= 30 then
    return jsonb_build_object('ok', false, 'code', 'RATE_LIMITED');
  end if;
  if mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' then return jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED'); end if;
  if s.status <> 'open' then return jsonb_build_object('ok', false, 'code', 'SESSION_NOT_OPEN'); end if;
  if nullif(p_token, '') is null
     or p_token not in (private.qr_token(s.qr_secret, w), private.qr_token(s.qr_secret, w - 1)) then
    return jsonb_build_object('ok', false, 'code', 'TOKEN_EXPIRED');
  end if;

  select * into reg from public.event_registrations
   where event_id = s.event_id and lower(email_snapshot) = mail
   order by (status = 'accepted') desc, created_at desc limit 1;
  if not found then
    code := 'NOT_REGISTERED';
  elsif reg.status = 'cancelled' then
    code := 'REGISTRATION_CANCELLED';
  elsif reg.status <> 'accepted' then
    code := 'NOT_ACCEPTED';
  end if;
  if code is not null then
    insert into public.check_in_failures (session_id) values (s.id);
    return jsonb_build_object('ok', false, 'code', code);
  end if;

  insert into public.attendance_records (session_id, registration_id, method)
  values (s.id, reg.id, 'qr')
  on conflict (registration_id, session_id) do nothing;
  get diagnostics inserted = row_count;
  return jsonb_build_object('ok', true, 'status', case when inserted = 1 then 'checked_in' else 'already' end,
                            'name', reg.full_name_snapshot);
end;
$$;
revoke all on function public.check_in_public_context(uuid), public.check_in_by_email(uuid, text, text) from public;
grant execute on function public.check_in_public_context(uuid), public.check_in_by_email(uuid, text, text) to anon, authenticated;

-- ------------------------------------------------------------------------------------------ live numbers (organizers)
create or replace function public.session_live(p_session uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.attendance_sessions;
  total integer;
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into s from public.attendance_sessions where id = p_session;
  if not found or not private.has_permission('registrations.attendance', private.session_committee(p_session)) then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  select count(*) into total from public.event_registrations where event_id = s.event_id and status = 'accepted';
  return jsonb_build_object(
    'status', s.status,
    'total', total,
    'present', (select count(*) from public.attendance_records where session_id = s.id),
    'qr', (select count(*) from public.attendance_records where session_id = s.id and method = 'qr'),
    'online', (select count(*) from public.attendance_records where session_id = s.id and method = 'online'),
    'manual', (select count(*) from public.attendance_records where session_id = s.id and method = 'manual'),
    'recent', coalesce((select jsonb_agg(jsonb_build_object('name', x.name, 'at', x.at, 'method', x.method) order by x.at desc)
                          from (select r.full_name_snapshot as name, a.checked_in_at as at, a.method
                                  from public.attendance_records a
                                  join public.event_registrations r on r.id = a.registration_id
                                 where a.session_id = s.id order by a.checked_in_at desc limit 6) x), '[]'::jsonb));
end;
$$;
revoke all on function public.session_live(uuid) from public, anon;
grant execute on function public.session_live(uuid) to authenticated;

-- ------------------------------------------------------------------------------------------ roster with e-mail
drop function public.session_roster(uuid);
create or replace function public.session_roster(p_session uuid)
returns table (
  registration_id uuid, full_name text, email text, was_member boolean,
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
    select r.id, r.full_name_snapshot, r.email_snapshot, r.was_member, (a.id is not null), a.method, a.checked_in_at
    from public.event_registrations r
    left join public.attendance_records a on a.session_id = s.id and a.registration_id = r.id
    where r.event_id = s.event_id and r.status = 'accepted'
    order by (a.id is null), r.full_name_snapshot;
end;
$$;
revoke all on function public.session_roster(uuid) from public, anon;
grant execute on function public.session_roster(uuid) to authenticated;
