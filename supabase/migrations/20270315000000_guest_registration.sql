-- Guest registration (KFUCS parity): a visitor registers for a public event from a modal, without an account.
-- The same seat rules as register_for_event apply (row lock, phase, audience, capacity, waitlist), plus the
-- anti-spam layers: honeypot, a minimum fill time, a per-email and a per-IP throttle (hashed), one active
-- registration per e-mail and event. Expected failures are RETURNED (not raised) so the throttle rows persist.

create table public.registration_attempts (
  id         bigint generated always as identity primary key,
  event_id   uuid not null references public.events (id) on delete cascade,
  email_hash text not null,
  ip_hash    text,
  at         timestamptz not null default now()
);
create index registration_attempts_email_idx on public.registration_attempts (event_id, email_hash, at desc);
create index registration_attempts_ip_idx on public.registration_attempts (ip_hash, at desc);
alter table public.registration_attempts enable row level security;
revoke all on table public.registration_attempts from anon, authenticated;
comment on table public.registration_attempts is 'Guest registration attempts (hashed e-mail and IP), only to throttle abuse. Rows older than a day are purged.';

create or replace function public.register_guest(
  p_event uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_answers jsonb default '{}'::jsonb,
  p_ip_hash text default null,
  p_honeypot text default null,
  p_elapsed_ms integer default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  e public.events;
  name_in text := btrim(coalesce(p_name, ''));
  mail text := lower(btrim(coalesce(p_email, '')));
  phone_in text := btrim(coalesce(p_phone, ''));
  digits text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  mail_hash text;
  last_d date;
  accepted integer;
  phase text;
  v_status text;
  v_id uuid;
  extra jsonb := '{}'::jsonb;
begin
  -- Bots fill hidden fields: pretend it worked, store nothing.
  if nullif(btrim(coalesce(p_honeypot, '')), '') is not null then
    return jsonb_build_object('ok', true, 'status', 'pending', 'id', null);
  end if;

  select * into e from public.events where id = p_event for update;   -- serialises seat decisions
  if not found or e.status <> 'published' then return jsonb_build_object('ok', false, 'code', 'REGISTRATION_CLOSED'); end if;

  -- Throttle first (this call counts), so failures cannot be used to probe without limit.
  mail_hash := encode(extensions.digest(mail || ':' || p_event::text, 'sha256'), 'hex');
  delete from public.registration_attempts where at < now() - interval '1 day';
  if (select count(*) from public.registration_attempts where event_id = p_event and email_hash = mail_hash and at > now() - interval '3 minutes') >= 3
     or (p_ip_hash is not null and (select count(*) from public.registration_attempts where ip_hash = p_ip_hash and at > now() - interval '10 minutes') >= 8) then
    return jsonb_build_object('ok', false, 'code', 'RATE_LIMITED');
  end if;
  insert into public.registration_attempts (event_id, email_hash, ip_hash) values (p_event, mail_hash, p_ip_hash);

  if p_elapsed_ms is not null and p_elapsed_ms < 1500 then return jsonb_build_object('ok', false, 'code', 'TOO_FAST'); end if;

  if char_length(name_in) not between 3 and 100 then return jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED', 'field', 'name'); end if;
  if mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' or char_length(mail) > 160 then return jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED', 'field', 'email'); end if;
  if char_length(digits) not between 8 and 15 or phone_in !~ '^[+0-9 ()-]{8,25}$' then return jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED', 'field', 'phone'); end if;
  if jsonb_typeof(coalesce(p_answers, '{}'::jsonb)) <> 'object' then return jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED', 'field', 'answers'); end if;
  -- only short text answers are kept: the university, and the language the person used (for the e-mails)
  select coalesce(jsonb_object_agg(k, left(v #>> '{}', 120)), '{}'::jsonb) into extra
    from jsonb_each(coalesce(p_answers, '{}'::jsonb)) as t(k, v)
   where ((k = 'university') or (k = 'lang' and (v #>> '{}') in ('ar', 'en'))) and jsonb_typeof(v) = 'string';

  accepted := private.accepted_count(e.id);
  select max(event_date) into last_d from public.event_dates where event_id = e.id;
  phase := private.event_phase(e.status, e.start_date, coalesce(last_d, e.end_date, e.start_date), e.start_time, e.end_time,
                               e.registration_start_at, e.registration_end_at, e.seats, accepted, false);
  if phase is distinct from 'registration_open' then return jsonb_build_object('ok', false, 'code', 'REGISTRATION_CLOSED'); end if;
  if e.audience = 'members_only' then return jsonb_build_object('ok', false, 'code', 'MEMBERS_ONLY'); end if;

  if exists (select 1 from public.event_registrations where event_id = e.id and lower(email_snapshot) = mail and status <> 'cancelled') then
    return jsonb_build_object('ok', false, 'code', 'ALREADY_REGISTERED');
  end if;

  if e.requires_approval then
    v_status := 'pending';
  elsif e.seats is null or accepted < e.seats then
    v_status := 'accepted';
  elsif e.waitlist_enabled then
    v_status := 'waitlisted';
  else
    return jsonb_build_object('ok', false, 'code', 'EVENT_FULL');
  end if;

  insert into public.event_registrations (event_id, user_id, status, full_name_snapshot, email_snapshot, was_member, answers)
  values (e.id, null, v_status, name_in, mail, false,
          extra || jsonb_build_object('phone', phone_in, 'source', 'guest_form'))
  returning id into v_id;

  perform private.write_audit('registration.created', 'registration', v_id::text, e.committee_id,
    jsonb_build_object('event_id', e.id, 'status', v_status, 'guest', true));
  return jsonb_build_object('ok', true, 'id', v_id, 'status', v_status);
end;
$$;
revoke all on function public.register_guest(uuid, text, text, text, jsonb, text, text, integer) from public;
grant execute on function public.register_guest(uuid, text, text, text, jsonb, text, text, integer) to anon, authenticated;
