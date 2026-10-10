-- Check-in hardening.
--
-- 1. The QR code is valid for exactly 120 seconds from the moment it is issued (plus a 10 second grace for a request
--    already in flight). It used to be signed in clock-aligned windows, so the panel could show "80 s left" on a
--    fresh code and an old code stayed valid for up to 240 s. The token is now "<issued epoch>.<mac>"; the database
--    checks the MAC and the age. Old links say "this code expired" the moment they are opened or submitted.
-- 2. Public check-in by e-mail is throttled per IP (hashed), per e-mail and per session, and every refused attempt
--    counts, so guessing e-mails or hammering an old link cannot go on.

alter table public.check_in_failures
  add column email_hash text,
  add column ip_hash text;
create index check_in_failures_ip_idx on public.check_in_failures (ip_hash, at desc) where ip_hash is not null;
create index check_in_failures_email_idx on public.check_in_failures (session_id, email_hash, at desc) where email_hash is not null;

-- Age of a code: 'valid', 'expired' (well formed and signed, but too old) or 'invalid' (anything else).
create or replace function private.qr_verify(
  p_secret text,
  p_token text,
  p_now bigint default floor(extract(epoch from now()))::bigint
) returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  issued bigint;
begin
  if p_token is null or p_token !~ '^[0-9]{9,12}\.[0-9a-f]{24}$' then return 'invalid'; end if;
  issued := split_part(p_token, '.', 1)::bigint;
  if split_part(p_token, '.', 2) <> private.qr_token(p_secret, issued) then return 'invalid'; end if;
  if issued > p_now + 5 then return 'invalid'; end if;
  if p_now > issued + 120 + 10 then return 'expired'; end if;
  return 'valid';
end;
$$;
revoke all on function private.qr_verify(text, text, bigint) from public, anon, authenticated;

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
  return jsonb_build_object(
    'token', epoch_now::text || '.' || private.qr_token(s.qr_secret, epoch_now),
    'expires_in', 120);
end;
$$;

-- Signed-in check-in (QR token or, for online events, the session alone).
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
    if private.qr_verify(s.qr_secret, p_token) <> 'valid' then
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

-- What the check-in page asks when it opens a link: is the session open and is this code still good?
-- Returns 'valid', 'expired' (an old or unreadable code), 'closed' (the session is not open) or 'missing'.
create or replace function public.check_in_token_status(p_session uuid, p_token text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.attendance_sessions;
begin
  select * into s from public.attendance_sessions where id = p_session;
  if not found then return 'missing'; end if;
  if s.status <> 'open' then return 'closed'; end if;
  if nullif(p_token, '') is null then return 'missing'; end if;
  return case private.qr_verify(s.qr_secret, p_token) when 'valid' then 'valid' else 'expired' end;
end;
$$;

-- Public check-in by e-mail. Refused attempts are RETURNED (not raised) so their throttle rows persist.
drop function public.check_in_by_email(uuid, text, text);
create or replace function public.check_in_by_email(
  p_session uuid,
  p_token text,
  p_email text,
  p_ip_hash text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.attendance_sessions;
  reg public.event_registrations;
  mail text := lower(btrim(coalesce(p_email, '')));
  mail_hash text;
  inserted integer;
  code text;
begin
  select * into s from public.attendance_sessions where id = p_session;
  if not found then return jsonb_build_object('ok', false, 'code', 'SESSION_NOT_OPEN'); end if;
  delete from public.check_in_failures where at < now() - interval '1 hour';
  mail_hash := case when mail = '' then null else encode(extensions.digest(mail, 'sha256'), 'hex') end;

  -- Throttles over refused attempts: this IP (12 in 10 min), this e-mail on this session (5 in 10 min), and a
  -- circuit breaker for the whole session (60 in a minute). A throttled call is not itself counted.
  if (p_ip_hash is not null
        and (select count(*) from public.check_in_failures where ip_hash = p_ip_hash and at > now() - interval '10 minutes') >= 12)
     or (mail_hash is not null
        and (select count(*) from public.check_in_failures where session_id = s.id and email_hash = mail_hash and at > now() - interval '10 minutes') >= 5)
     or (select count(*) from public.check_in_failures where session_id = s.id and at > now() - interval '1 minute') >= 60 then
    return jsonb_build_object('ok', false, 'code', 'RATE_LIMITED');
  end if;

  if mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' then code := 'VALIDATION_FAILED';
  elsif s.status <> 'open' then code := 'SESSION_NOT_OPEN';
  elsif private.qr_verify(s.qr_secret, p_token) <> 'valid' then code := 'TOKEN_EXPIRED';
  else
    select * into reg from public.event_registrations
     where event_id = s.event_id and lower(email_snapshot) = mail
     order by (status = 'accepted') desc, created_at desc limit 1;
    if not found then code := 'NOT_REGISTERED';
    elsif reg.status = 'cancelled' then code := 'REGISTRATION_CANCELLED';
    elsif reg.status <> 'accepted' then code := 'NOT_ACCEPTED';
    end if;
  end if;

  if code is not null then
    insert into public.check_in_failures (session_id, email_hash, ip_hash) values (s.id, mail_hash, p_ip_hash);
    return jsonb_build_object('ok', false, 'code', code);
  end if;

  insert into public.attendance_records (session_id, registration_id, method)
  values (s.id, reg.id, 'qr')
  on conflict (registration_id, session_id) do nothing;
  get diagnostics inserted = row_count;
  return jsonb_build_object('ok', true, 'status', case when inserted = 1 then 'checked_in' else 'already' end,
                            'name', reg.full_name_snapshot, 'checked_in_at', (
                              select a.checked_in_at from public.attendance_records a
                               where a.session_id = s.id and a.registration_id = reg.id));
end;
$$;

revoke all on function public.check_in_by_email(uuid, text, text, text), public.check_in_token_status(uuid, text) from public;
grant execute on function public.check_in_by_email(uuid, text, text, text), public.check_in_token_status(uuid, text) to anon, authenticated;
