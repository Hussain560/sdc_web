-- SEC-003 — privacy: consent on guest registrations, data-subject flows (access export, deletion request, handling)
-- and the retention job. Wording and periods follow data-protection-and-privacy.md (proposed, pending Q-031).

-- ------------------------------------------------------------------------------------------ consent on registrations
alter table public.event_registrations add column consent_at timestamptz;
alter table public.event_registrations add column consent_version text;
comment on column public.event_registrations.consent_version is 'Privacy notice version the person accepted (guest form). Null for rows created before the notice existed.';

-- register_guest now needs the consent version (the notice the person ticked). Same rules otherwise.
drop function public.register_guest(uuid, text, text, text, jsonb, text, text, integer);
create or replace function public.register_guest(
  p_event uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_answers jsonb default '{}'::jsonb,
  p_ip_hash text default null,
  p_honeypot text default null,
  p_elapsed_ms integer default null,
  p_consent_version text default null
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
  if nullif(btrim(coalesce(p_honeypot, '')), '') is not null then
    return jsonb_build_object('ok', true, 'status', 'pending', 'id', null);
  end if;

  select * into e from public.events where id = p_event for update;
  if not found or e.status <> 'published' then return jsonb_build_object('ok', false, 'code', 'REGISTRATION_CLOSED'); end if;

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
  if nullif(btrim(coalesce(p_consent_version, '')), '') is null or char_length(p_consent_version) > 40 then
    return jsonb_build_object('ok', false, 'code', 'CONSENT_REQUIRED');
  end if;
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

  insert into public.event_registrations (event_id, user_id, status, full_name_snapshot, email_snapshot, was_member, answers, consent_at, consent_version)
  values (e.id, null, v_status, name_in, mail, false, extra || jsonb_build_object('phone', phone_in, 'source', 'guest_form'), now(), btrim(p_consent_version))
  returning id into v_id;

  perform private.write_audit('registration.created', 'registration', v_id::text, e.committee_id,
    jsonb_build_object('event_id', e.id, 'status', v_status, 'guest', true));
  return jsonb_build_object('ok', true, 'id', v_id, 'status', v_status);
end;
$$;
revoke all on function public.register_guest(uuid, text, text, text, jsonb, text, text, integer, text) from public;
grant execute on function public.register_guest(uuid, text, text, text, jsonb, text, text, integer, text) to anon, authenticated;

-- ------------------------------------------------------------------------------------------ data-subject requests
create table public.data_requests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles (id) on delete set null,
  email      text not null,
  kind       text not null default 'deletion' check (kind in ('deletion')),
  status     text not null default 'pending' check (status in ('pending', 'done', 'rejected')),
  reason     text check (char_length(reason) <= 500),
  note       text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  handled_by uuid references public.profiles (id) on delete set null,
  handled_at timestamptz
);
create unique index data_requests_one_open on public.data_requests (user_id, kind) where status = 'pending';
alter table public.data_requests enable row level security;
revoke all on table public.data_requests from anon, authenticated;
grant select on public.data_requests to authenticated;
create policy data_requests_select on public.data_requests
  for select to authenticated using (user_id = (select auth.uid()) or private.has_permission('settings.manage'));

-- Access: everything the platform holds about the signed-in person, as one JSON document.
create or replace function public.export_my_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  mail text;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select lower(email) into mail from public.profiles where id = caller;
  return jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) - 'avatar_path' from public.profiles p where p.id = caller),
    'member', (select to_jsonb(m) - 'legacy_claim_email' from public.members m where m.user_id = caller),
    'applications', coalesce((select jsonb_agg(to_jsonb(a) order by a.submitted_at)
        from public.membership_applications a where a.user_id = caller or lower(a.email) = mail), '[]'::jsonb),
    'registrations', coalesce((select jsonb_agg(jsonb_build_object(
          'id', r.id, 'event', e.title_ar, 'status', r.status, 'registered_at', r.created_at,
          'attendance_percent', r.attendance_percent, 'attendance_result', r.attendance_result,
          'consent_at', r.consent_at, 'consent_version', r.consent_version, 'answers', r.answers) order by r.created_at)
        from public.event_registrations r join public.events e on e.id = r.event_id
        where r.user_id = caller or lower(r.email_snapshot) = mail), '[]'::jsonb),
    'certificates', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'event', e.title_ar, 'attendance_percent', c.attendance_percent, 'issued_at', c.issued_at) order by c.issued_at)
        from public.certificates c join public.events e on e.id = c.event_id
        where c.user_id = caller or lower(c.recipient_email) = mail), '[]'::jsonb),
    'positions', coalesce((select jsonb_agg(jsonb_build_object('role', ra.role_key, 'starts_at', ra.starts_at, 'ends_at', ra.ends_at))
        from public.role_assignments ra where ra.user_id = caller), '[]'::jsonb),
    'requests', coalesce((select jsonb_agg(jsonb_build_object('kind', d.kind, 'status', d.status, 'created_at', d.created_at))
        from public.data_requests d where d.user_id = caller), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;

create or replace function public.request_account_deletion(p_reason text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  mail text;
  v_id uuid;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select email into mail from public.profiles where id = caller;
  if exists (select 1 from public.data_requests where user_id = caller and kind = 'deletion' and status = 'pending') then
    raise exception 'ALREADY_REQUESTED' using errcode = 'P0001';
  end if;
  if char_length(coalesce(p_reason, '')) > 500 then raise exception 'VALIDATION_FAILED' using errcode = 'P0001'; end if;
  insert into public.data_requests (user_id, email, reason) values (caller, mail, nullif(btrim(p_reason), '')) returning id into v_id;
  perform private.write_audit('privacy.deletion_requested', 'data_request', v_id::text, null, '{}'::jsonb);
  return v_id;
end;
$$;
revoke all on function public.request_account_deletion(text) from public, anon;
grant execute on function public.request_account_deletion(text) to authenticated;

-- Replaces what identifies a person with placeholders everywhere the platform keeps it, and unlinks the account so
-- it can be deleted. Aggregate facts (counts, attendance, dates) stay. The audit log is append-only and is kept.
create or replace function private.anonymize_person(p_user uuid, p_email text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  n_reg integer; n_app integer; n_cert integer; n_mem integer;
begin
  update public.event_registrations
     set full_name_snapshot = 'Anonymized', email_snapshot = 'anonymized-' || id || '@deleted.invalid', answers = '{}'::jsonb, user_id = null
   where user_id = p_user or lower(email_snapshot) = lower(p_email);
  get diagnostics n_reg = row_count;
  update public.membership_applications
     set full_name_ar = 'Anonymized', full_name_en = null, email = 'anonymized-' || id || '@deleted.invalid', phone = null,
         bio_ar = null, bio_en = null, portfolio_url = null, github_url = null, linkedin_url = null, x_url = null,
         answers = '{}'::jsonb, user_id = null
   where user_id = p_user or lower(email) = lower(p_email);
  get diagnostics n_app = row_count;
  update public.certificates
     set recipient_name = 'Anonymized', recipient_email = 'anonymized-' || id || '@deleted.invalid', user_id = null
   where user_id = p_user or lower(recipient_email) = lower(p_email);
  get diagnostics n_cert = row_count;
  update public.members
     set first_name_ar = '—', last_name_ar = '', first_name_en = null, last_name_en = null, bio_ar = null, bio_en = null,
         portfolio_url = null, github_url = null, linkedin_url = null, x_url = null, legacy_claim_email = null,
         is_directory_visible = false, status = 'inactive', ended_at = coalesce(ended_at, now()), user_id = null
   where user_id = p_user;
  get diagnostics n_mem = row_count;
  update public.email_logs set recipient_email = 'anonymized@deleted.invalid', recipient_user_id = null
   where recipient_user_id = p_user or lower(recipient_email) = lower(p_email);
  delete from public.role_assignments where user_id = p_user;
  return jsonb_build_object('registrations', n_reg, 'applications', n_app, 'certificates', n_cert, 'members', n_mem);
end;
$$;
revoke all on function private.anonymize_person(uuid, text) from public, anon, authenticated;

-- Handling a request (settings.manage): reject, or complete = anonymize now. The account itself is removed by the
-- server right after (it holds the admin key); this function never deletes auth rows.
create or replace function public.handle_data_request(p_id uuid, p_decision text, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  r public.data_requests;
  result jsonb := '{}'::jsonb;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('settings.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if p_decision not in ('done', 'rejected') or char_length(coalesce(p_note, '')) > 500 then raise exception 'VALIDATION_FAILED' using errcode = 'P0001'; end if;
  select * into r from public.data_requests where id = p_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if r.status <> 'pending' then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
  if r.user_id = caller then raise exception 'SELF_DECISION' using errcode = 'P0001'; end if;
  if p_decision = 'done' then
    result := private.anonymize_person(r.user_id, r.email);
  end if;
  update public.data_requests set status = p_decision, note = nullif(btrim(p_note), ''), handled_by = caller, handled_at = now() where id = r.id;
  perform private.write_audit('privacy.request_' || p_decision, 'data_request', r.id::text, null, result);
  return jsonb_build_object('user_id', r.user_id, 'email', r.email, 'result', result);
end;
$$;
revoke all on function public.handle_data_request(uuid, text, text) from public, anon;
grant execute on function public.handle_data_request(uuid, text, text) to authenticated;

-- ------------------------------------------------------------------------------------------ retention
-- Proposed periods: rejected/withdrawn applications 2 years, registrations 3 years after the event, e-mail log 1 year.
-- Dry run returns the counts only. Executed by the service role from /api/cron/retention.
create or replace function public.run_retention(p_dry boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  n_app integer; n_reg integer; n_mail integer;
  app_cut timestamptz := now() - interval '2 years';
  reg_cut date := (now() - interval '3 years')::date;
  mail_cut timestamptz := now() - interval '1 year';
begin
  select count(*) into n_app from public.membership_applications
   where status in ('rejected', 'withdrawn') and email not like 'anonymized-%'
     and coalesce(decided_at, withdrawn_at, updated_at) < app_cut;
  select count(*) into n_reg from public.event_registrations r
   where r.email_snapshot not like 'anonymized-%'
     and coalesce((select max(d.event_date) from public.event_dates d where d.event_id = r.event_id),
                  (select coalesce(e.end_date, e.start_date) from public.events e where e.id = r.event_id)) < reg_cut;
  select count(*) into n_mail from public.email_logs where created_at < mail_cut;

  if not coalesce(p_dry, false) then
    update public.membership_applications
       set full_name_ar = 'Anonymized', full_name_en = null, email = 'anonymized-' || id || '@deleted.invalid', phone = null,
           bio_ar = null, bio_en = null, portfolio_url = null, github_url = null, linkedin_url = null, x_url = null,
           answers = '{}'::jsonb, user_id = null
     where status in ('rejected', 'withdrawn') and email not like 'anonymized-%'
       and coalesce(decided_at, withdrawn_at, updated_at) < app_cut;
    update public.event_registrations r
       set full_name_snapshot = 'Anonymized', email_snapshot = 'anonymized-' || r.id || '@deleted.invalid', answers = '{}'::jsonb
     where r.email_snapshot not like 'anonymized-%'
       and coalesce((select max(d.event_date) from public.event_dates d where d.event_id = r.event_id),
                    (select coalesce(e.end_date, e.start_date) from public.events e where e.id = r.event_id)) < reg_cut;
    delete from public.email_logs where created_at < mail_cut;
    perform private.write_audit('privacy.retention_run', 'system', 'retention', null,
      jsonb_build_object('applications', n_app, 'registrations', n_reg, 'email_logs', n_mail));
  end if;
  return jsonb_build_object('dry', coalesce(p_dry, false), 'applications', n_app, 'registrations', n_reg, 'email_logs', n_mail);
end;
$$;
revoke all on function public.run_retention(boolean) from public, anon, authenticated;
grant execute on function public.run_retention(boolean) to service_role;
