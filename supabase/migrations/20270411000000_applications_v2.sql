-- Sprint 18 · MBR-007 — applications v2: split names, reference number, tracking token, info requested, history.
-- Authoritative design: docs/99-project-management/sprints/sprint-18-membership-lifecycle/{lifecycle,plan}.md.
-- Expand only: full_name_* stays (filled by a trigger from the parts) so existing queries, e-mails and exports keep working.

-- ------------------------------------------------------------------------------------------ 0. cycle settings (used below)
alter table public.membership_cycles
  add column term_ends_at date,
  add column activation_deadline_days smallint not null default 7 check (activation_deadline_days between 1 and 30),
  add column rubric jsonb not null default '[]'::jsonb check (jsonb_typeof(rubric) = 'array' and jsonb_array_length(rubric) <= 6);

-- ------------------------------------------------------------------------------------------ 1. columns
alter table public.membership_applications
  add column first_name_ar  text check (char_length(btrim(first_name_ar)) between 1 and 100),
  add column middle_name_ar text check (char_length(middle_name_ar) <= 100),
  add column last_name_ar   text check (char_length(btrim(last_name_ar)) between 1 and 100),
  add column first_name_en  text check (char_length(first_name_en) <= 100),
  add column middle_name_en text check (char_length(middle_name_en) <= 100),
  add column last_name_en   text check (char_length(last_name_en) <= 100),
  add column reference           text,
  add column tracking_token_hash text,
  add column info_request        text check (char_length(info_request) <= 1000),
  add column info_fields         text[] not null default '{}',
  add column info_requested_at   timestamptz,
  add column resubmitted_at      timestamptz,
  add column accepted_at         timestamptz,
  add column activation_reminded_at timestamptz;

alter table public.membership_applications drop constraint membership_applications_status_check;
alter table public.membership_applications add constraint membership_applications_status_check
  check (status in ('submitted', 'under_review', 'info_requested', 'accepted', 'rejected', 'waitlisted', 'withdrawn', 'lapsed'));

-- The full names are derived from the parts whenever the parts are present.
create or replace function private.application_names() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.first_name_ar is not null then
    new.full_name_ar := left(btrim(regexp_replace(concat_ws(' ', btrim(new.first_name_ar), btrim(new.middle_name_ar), btrim(new.last_name_ar)), '\s+', ' ', 'g')), 100);
  end if;
  if new.first_name_en is not null or new.last_name_en is not null then
    new.full_name_en := nullif(left(btrim(regexp_replace(concat_ws(' ', btrim(new.first_name_en), btrim(new.middle_name_en), btrim(new.last_name_en)), '\s+', ' ', 'g')), 100), '');
  end if;
  return new;
end;
$$;
create trigger membership_applications_names before insert or update on public.membership_applications
  for each row execute function private.application_names();

-- ------------------------------------------------------------------------------------------ 2. reference number SDC-YY-NNNN
create table public.application_reference_counters (
  year smallint primary key,
  last integer not null default 0
);
alter table public.application_reference_counters enable row level security;
revoke all on table public.application_reference_counters from anon, authenticated;

create or replace function private.next_application_reference(p_at timestamptz default now())
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  y smallint := extract(year from (p_at at time zone 'Asia/Riyadh'))::smallint;
  n integer;
begin
  insert into public.application_reference_counters as c (year, last) values (y, 1)
  on conflict (year) do update set last = c.last + 1
  returning last into n;
  return 'SDC-' || lpad((y % 100)::text, 2, '0') || '-' || lpad(n::text, 4, '0');
end;
$$;
revoke all on function private.next_application_reference(timestamptz) from public, anon, authenticated;

create or replace function private.application_reference() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.reference is null then new.reference := private.next_application_reference(new.submitted_at); end if;
  return new;
end;
$$;
create trigger membership_applications_reference before insert on public.membership_applications
  for each row execute function private.application_reference();

-- Backfill in order of submission.
do $$
declare r record;
begin
  for r in select id, submitted_at from public.membership_applications where reference is null order by submitted_at, id loop
    update public.membership_applications set reference = private.next_application_reference(r.submitted_at) where id = r.id;
  end loop;
end $$;
alter table public.membership_applications alter column reference set not null;
alter table public.membership_applications add constraint membership_applications_reference_uq unique (reference);
create unique index membership_applications_token_uq on public.membership_applications (tracking_token_hash) where tracking_token_hash is not null;

-- ------------------------------------------------------------------------------------------ 3. history
create table public.application_events (
  id             bigint generated always as identity primary key,
  application_id uuid not null references public.membership_applications (id) on delete cascade,
  kind           text not null check (char_length(kind) <= 40),
  actor_id       uuid references public.profiles (id) on delete set null,
  data           jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index application_events_app_idx on public.application_events (application_id, id);
alter table public.application_events enable row level security;
revoke all on table public.application_events from anon, authenticated;
grant select on table public.application_events to authenticated;
create policy application_events_select_reviewers on public.application_events
  for select to authenticated using (private.has_permission('membership.review'));

create or replace function private.add_application_event(p_app uuid, p_kind text, p_data jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.application_events (application_id, kind, actor_id, data)
  values (p_app, p_kind, (select p.id from public.profiles p where p.id = (select auth.uid())), coalesce(p_data, '{}'::jsonb));
end;
$$;
revoke all on function private.add_application_event(uuid, text, jsonb) from public, anon, authenticated;

-- Existing applications get their first history entry.
insert into public.application_events (application_id, kind, created_at)
select id, 'submitted', submitted_at from public.membership_applications;

-- ------------------------------------------------------------------------------------------ 4. throttle and tokens
create table public.public_attempts (
  id       bigint generated always as identity primary key,
  kind     text not null,
  key_hash text not null,
  at       timestamptz not null default now()
);
create index public_attempts_idx on public.public_attempts (kind, key_hash, at desc);
alter table public.public_attempts enable row level security;
revoke all on table public.public_attempts from anon, authenticated;

-- true = allowed (and counted); false = over the limit.
create or replace function private.throttle(p_kind text, p_key text, p_max integer, p_window interval)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_key is null then return true; end if;
  delete from public.public_attempts where at < now() - interval '1 day';
  if (select count(*) from public.public_attempts where kind = p_kind and key_hash = p_key and at > now() - p_window) >= p_max then
    return false;
  end if;
  insert into public.public_attempts (kind, key_hash) values (p_kind, p_key);
  return true;
end;
$$;
revoke all on function private.throttle(text, text, integer, interval) from public, anon, authenticated;

create or replace function private.token_hash(p_token text) returns text
language sql immutable set search_path = '' as $$
  select encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex')
$$;
create or replace function private.new_token() returns text
language sql volatile set search_path = '' as $$
  select replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
$$;

-- ------------------------------------------------------------------------------------------ 5. validation with name parts
create or replace function private.validate_application(p jsonb, p_questions jsonb)
returns void
language plpgsql
stable
set search_path = ''
as $$
declare
  q jsonb;
  a jsonb;
  k text;
  ans jsonb := coalesce(p -> 'answers', '{}'::jsonb);
begin
  if p ? 'first_name_ar' then
    -- v2 form: first and last name in both languages (middle optional), phone required.
    if char_length(btrim(coalesce(p ->> 'first_name_ar', ''))) not between 1 and 100
       or char_length(btrim(coalesce(p ->> 'last_name_ar', ''))) not between 1 and 100
       or char_length(btrim(coalesce(p ->> 'first_name_en', ''))) not between 1 and 100
       or char_length(btrim(coalesce(p ->> 'last_name_en', ''))) not between 1 and 100
       or char_length(coalesce(p ->> 'middle_name_ar', '')) > 100
       or char_length(coalesce(p ->> 'middle_name_en', '')) > 100
       or coalesce(p ->> 'phone', '') !~ '^\+?[0-9]{8,15}$' then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
  elsif char_length(btrim(coalesce(p ->> 'full_name_ar', ''))) not between 3 and 100 then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if coalesce(p ->> 'academic_status', '') not in ('student', 'graduate', 'employee', 'other')
     or jsonb_typeof(ans) <> 'object' then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  for q in select * from jsonb_array_elements(p_questions) loop
    k := q ->> 'key';
    a := ans -> k;
    if coalesce((q ->> 'required')::boolean, false)
       and (a is null or a = 'null'::jsonb or btrim(a #>> '{}') = '' and jsonb_typeof(a) = 'string'
            or jsonb_typeof(a) = 'array' and jsonb_array_length(a) = 0) then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    if a is not null and jsonb_typeof(a) = 'string' and char_length(a #>> '{}') > 2000 then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
  end loop;
end;
$$;

-- ------------------------------------------------------------------------------------------ 6. apply (public) v2
-- Expected failures are RETURNED (not raised) so the throttle rows persist. On success the raw tracking token is
-- returned once; only its hash is stored.
create or replace function public.apply_for_membership(
  p_cycle uuid,
  p jsonb,
  p_ip_hash text default null,
  p_honeypot text default null,
  p_elapsed_ms integer default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.membership_cycles;
  mail text := lower(btrim(coalesce(p ->> 'email', '')));
  mail_hash text;
  v_id uuid;
  v_ref text;
  v_token text := private.new_token();
  loc text := case when p ->> 'lang' = 'en' then 'en' else 'ar' end;
  v2 boolean := p ? 'first_name_ar';
begin
  if nullif(btrim(coalesce(p_honeypot, '')), '') is not null then
    return jsonb_build_object('ok', true, 'id', null);   -- a bot: pretend, store nothing
  end if;

  select * into c from public.membership_cycles where id = p_cycle and status = 'published';
  if not found then return jsonb_build_object('ok', false, 'code', 'NOT_FOUND'); end if;
  -- MB-1: the database clock decides, not the browser.
  if private.cycle_phase(c.status, c.opens_at, c.closes_at, c.closed_early_at) <> 'open' then
    return jsonb_build_object('ok', false, 'code', 'CYCLE_CLOSED');
  end if;

  mail_hash := encode(extensions.digest(mail || ':' || p_cycle::text, 'sha256'), 'hex');
  delete from public.application_attempts where at < now() - interval '1 day';
  if (select count(*) from public.application_attempts where cycle_id = p_cycle and email_hash = mail_hash and at > now() - interval '3 minutes') >= 3
     or (p_ip_hash is not null and (select count(*) from public.application_attempts where ip_hash = p_ip_hash and at > now() - interval '10 minutes') >= 6) then
    return jsonb_build_object('ok', false, 'code', 'RATE_LIMITED');
  end if;
  insert into public.application_attempts (cycle_id, email_hash, ip_hash) values (p_cycle, mail_hash, p_ip_hash);

  if p_elapsed_ms is not null and p_elapsed_ms < 5000 then return jsonb_build_object('ok', false, 'code', 'TOO_FAST'); end if;
  if mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$' or char_length(mail) > 160 then
    return jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED', 'field', 'email');
  end if;
  if coalesce(btrim(p ->> 'consent_version'), '') = '' or coalesce((p ->> 'consent')::boolean, false) is not true then
    return jsonb_build_object('ok', false, 'code', 'CONSENT_REQUIRED');
  end if;
  begin
    perform private.validate_application(p, c.questions);
  exception when sqlstate 'P0001' then
    return jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
  end;

  if exists (select 1 from public.members m join public.profiles pr on pr.id = m.user_id
              where lower(pr.email) = mail and m.status = 'active') then
    return jsonb_build_object('ok', false, 'code', 'ALREADY_MEMBER');
  end if;
  if exists (select 1 from public.membership_applications where cycle_id = c.id and lower(email) = mail and status <> 'withdrawn') then
    return jsonb_build_object('ok', false, 'code', 'ALREADY_APPLIED');
  end if;

  begin
    insert into public.membership_applications (
      cycle_id, user_id, email, locale, full_name_ar, full_name_en,
      first_name_ar, middle_name_ar, last_name_ar, first_name_en, middle_name_en, last_name_en,
      phone, academic_status, university_id, major_id,
      sub_major_id, track_id, preferred_committee_id, bio_ar, bio_en, portfolio_url, github_url, linkedin_url, x_url,
      answers, wants_directory_listing, consent_version, tracking_token_hash
    ) values (
      c.id, null, mail, loc,
      case when v2 then 'x x' else btrim(p ->> 'full_name_ar') end,
      case when v2 then null else nullif(btrim(p ->> 'full_name_en'), '') end,
      case when v2 then btrim(p ->> 'first_name_ar') end, case when v2 then nullif(btrim(p ->> 'middle_name_ar'), '') end,
      case when v2 then btrim(p ->> 'last_name_ar') end,
      case when v2 then btrim(p ->> 'first_name_en') end, case when v2 then nullif(btrim(p ->> 'middle_name_en'), '') end,
      case when v2 then btrim(p ->> 'last_name_en') end,
      nullif(p ->> 'phone', ''),
      p ->> 'academic_status', nullif(p ->> 'university_id', '')::smallint, nullif(p ->> 'major_id', '')::smallint,
      nullif(p ->> 'sub_major_id', '')::smallint, nullif(p ->> 'track_id', '')::smallint,
      nullif(p ->> 'preferred_committee_id', '')::uuid, nullif(p ->> 'bio_ar', ''), nullif(p ->> 'bio_en', ''),
      nullif(p ->> 'portfolio_url', ''), nullif(p ->> 'github_url', ''), nullif(p ->> 'linkedin_url', ''),
      nullif(p ->> 'x_url', ''), coalesce(p -> 'answers', '{}'::jsonb),
      coalesce((p ->> 'wants_directory_listing')::boolean, false), p ->> 'consent_version',
      private.token_hash(v_token)
    ) returning id, reference into v_id, v_ref;
  exception
    when check_violation or invalid_text_representation or foreign_key_violation or numeric_value_out_of_range then
      return jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
    when unique_violation then
      return jsonb_build_object('ok', false, 'code', 'ALREADY_APPLIED');
  end;

  perform private.add_application_event(v_id, 'submitted');
  perform private.write_audit('membership_application.submitted', 'membership_application', v_id::text, null,
    jsonb_build_object('cycle_id', c.id, 'guest', true));
  return jsonb_build_object('ok', true, 'id', v_id, 'reference', v_ref, 'token', v_token);
end;
$$;
revoke all on function public.apply_for_membership(uuid, jsonb, text, text, integer) from public;
grant execute on function public.apply_for_membership(uuid, jsonb, text, text, integer) to anon, authenticated;

-- ------------------------------------------------------------------------------------------ 7. tracking (no account)
-- Everything the applicant may see, derived from the token only. Internal notes, scores, reviewer names and the
-- queue position are never part of it.
create or replace function public.track_application(p_token text, p_ip_hash text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.membership_applications;
  c public.membership_cycles;
  masked text;
  edit_values jsonb := '{}'::jsonb;
  edit_questions jsonb := '[]'::jsonb;
  timeline jsonb;
  f text;
  q jsonb;
begin
  if not private.throttle('track', p_ip_hash, 60, interval '10 minutes') then
    return jsonb_build_object('ok', false, 'code', 'RATE_LIMITED');
  end if;
  select * into a from public.membership_applications where tracking_token_hash = private.token_hash(p_token);
  if not found then return jsonb_build_object('ok', false, 'code', 'TOKEN_INVALID'); end if;
  select * into c from public.membership_cycles where id = a.cycle_id;
  if a.decided_at is not null and a.decided_at < now() - interval '90 days' then
    return jsonb_build_object('ok', false, 'code', 'TOKEN_INVALID');
  end if;
  masked := regexp_replace(a.email, '^(.{1,3}).*(@.*)$', '\1…\2');

  if a.status = 'info_requested' then
    foreach f in array a.info_fields loop
      if f like 'q:%' then
        edit_values := edit_values || jsonb_build_object(f, coalesce(a.answers -> substr(f, 3), 'null'::jsonb));
        select x into q from jsonb_array_elements(c.questions) x where x ->> 'key' = substr(f, 3);
        if q is not null then edit_questions := edit_questions || jsonb_build_array(q); end if;
      else
        edit_values := edit_values || jsonb_build_object(f, to_jsonb(
          case f when 'portfolio_url' then a.portfolio_url when 'github_url' then a.github_url
                 when 'linkedin_url' then a.linkedin_url when 'x_url' then a.x_url
                 when 'bio_ar' then a.bio_ar when 'bio_en' then a.bio_en end));
      end if;
    end loop;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('kind', k, 'at', t) order by t), '[]'::jsonb) into timeline from (
    select 'submitted' as k, a.submitted_at as t
    union all select 'review_started', min(e.created_at) from public.application_events e where e.application_id = a.id and e.kind = 'claimed'
    union all select 'info_requested', a.info_requested_at where a.info_requested_at is not null
    union all select 'resubmitted', a.resubmitted_at where a.resubmitted_at is not null
    union all select 'decided', a.decided_at where a.decided_at is not null and a.status in ('accepted', 'rejected', 'waitlisted', 'lapsed')
    union all select 'withdrawn', a.withdrawn_at where a.withdrawn_at is not null
  ) x where t is not null;

  return jsonb_build_object(
    'ok', true,
    'reference', a.reference,
    'status', a.status,
    'submitted_at', a.submitted_at,
    'first_name', coalesce(a.first_name_ar, split_part(a.full_name_ar, ' ', 1)),
    'first_name_en', coalesce(a.first_name_en, split_part(coalesce(a.full_name_en, ''), ' ', 1)),
    'locale', a.locale,
    'email_masked', masked,
    'cycle', jsonb_build_object('name_ar', c.name_ar, 'name_en', c.name_en, 'review_ends_at', c.review_ends_at,
                                'closes_at', c.closes_at, 'status', c.status),
    'info_request', case when a.status = 'info_requested' then a.info_request end,
    'info_requested_at', a.info_requested_at,
    'info_deadline', case when a.status = 'info_requested' then coalesce(c.review_ends_at, c.closes_at) end,
    'edit_values', edit_values,
    'edit_questions', edit_questions,
    'accepted_at', a.accepted_at,
    'activation_deadline', case when a.status = 'accepted' and a.accepted_at is not null
                                then a.accepted_at + make_interval(days => c.activation_deadline_days) end,
    'timeline', timeline,
    'editable', a.status = 'info_requested' and c.status <> 'completed'
                and (c.review_ends_at is null or c.review_ends_at > now()),
    'withdrawable', a.status in ('submitted', 'under_review', 'info_requested', 'waitlisted')
  );
end;
$$;
revoke all on function public.track_application(text, text) from public;
grant execute on function public.track_application(text, text) to anon, authenticated;

create or replace function public.resubmit_application_by_token(p_token text, p_patch jsonb, p_ip_hash text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.membership_applications;
  c public.membership_cycles;
  f text;
  v text;
  ans jsonb;
  qdef jsonb;
begin
  if not private.throttle('track', p_ip_hash, 60, interval '10 minutes') then
    return jsonb_build_object('ok', false, 'code', 'RATE_LIMITED');
  end if;
  select * into a from public.membership_applications where tracking_token_hash = private.token_hash(p_token) for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'TOKEN_INVALID'); end if;
  select * into c from public.membership_cycles where id = a.cycle_id;
  if a.status <> 'info_requested' or c.status = 'completed' or (c.review_ends_at is not null and c.review_ends_at <= now()) then
    return jsonb_build_object('ok', false, 'code', 'NOT_EDITABLE');
  end if;
  if jsonb_typeof(p_patch) <> 'object' then return jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED'); end if;

  ans := a.answers;
  begin
    -- only the parts the reviewer asked to fix may change
    for f, v in select key, case when jsonb_typeof(value) = 'string' then value #>> '{}' else value::text end from jsonb_each(p_patch) loop
      if not (f = any (a.info_fields)) then
        return jsonb_build_object('ok', false, 'code', 'NOT_EDITABLE');
      end if;
      if f like 'q:%' then
        select x into qdef from jsonb_array_elements(c.questions) x where x ->> 'key' = substr(f, 3);
        if qdef is null or char_length(v) > 2000 or (coalesce((qdef ->> 'required')::boolean, false) and btrim(v) in ('', '[]')) then
          return jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
        end if;
        ans := jsonb_set(ans, array[substr(f, 3)], p_patch -> f);
      elsif f = 'portfolio_url' then update public.membership_applications set portfolio_url = nullif(btrim(v), '') where id = a.id;
      elsif f = 'github_url' then update public.membership_applications set github_url = nullif(btrim(v), '') where id = a.id;
      elsif f = 'linkedin_url' then update public.membership_applications set linkedin_url = nullif(btrim(v), '') where id = a.id;
      elsif f = 'x_url' then update public.membership_applications set x_url = nullif(btrim(v), '') where id = a.id;
      elsif f = 'bio_ar' then update public.membership_applications set bio_ar = nullif(btrim(v), '') where id = a.id;
      elsif f = 'bio_en' then update public.membership_applications set bio_en = nullif(btrim(v), '') where id = a.id;
      else
        return jsonb_build_object('ok', false, 'code', 'NOT_EDITABLE');
      end if;
    end loop;
  exception when check_violation or invalid_text_representation then
    return jsonb_build_object('ok', false, 'code', 'VALIDATION_FAILED');
  end;

  update public.membership_applications
     set answers = ans, status = 'submitted', resubmitted_at = now(), reviewer_id = null,
         info_request = null, info_fields = '{}'
   where id = a.id;
  perform private.add_application_event(a.id, 'resubmitted', jsonb_build_object('fields', to_jsonb(a.info_fields)));
  perform private.write_audit('membership_application.resubmitted', 'membership_application', a.id::text, null, '{}'::jsonb);
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.resubmit_application_by_token(text, jsonb, text) from public;
grant execute on function public.resubmit_application_by_token(text, jsonb, text) to anon, authenticated;

create or replace function public.withdraw_application_by_token(p_token text, p_ip_hash text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare a public.membership_applications;
begin
  if not private.throttle('track', p_ip_hash, 60, interval '10 minutes') then
    return jsonb_build_object('ok', false, 'code', 'RATE_LIMITED');
  end if;
  select * into a from public.membership_applications where tracking_token_hash = private.token_hash(p_token) for update;
  if not found then return jsonb_build_object('ok', false, 'code', 'TOKEN_INVALID'); end if;
  if a.status not in ('submitted', 'under_review', 'info_requested', 'waitlisted') then
    return jsonb_build_object('ok', false, 'code', 'NOT_EDITABLE');
  end if;
  update public.membership_applications set status = 'withdrawn', withdrawn_at = now(), reviewer_id = null where id = a.id;
  perform private.add_application_event(a.id, 'withdrawn');
  perform private.write_audit('membership_application.withdrawn', 'membership_application', a.id::text, null, '{}'::jsonb);
  return jsonb_build_object('ok', true);
end;
$$;
revoke all on function public.withdraw_application_by_token(text, text) from public;
grant execute on function public.withdraw_application_by_token(text, text) to anon, authenticated;

-- Server only (service role): mint a fresh tracking token for the application the e-mail belongs to. Used when the
-- "received" mail is re-sent or the person asks for a new link; the previous link is replaced.
create or replace function public.rotate_tracking_token(p_application uuid default null, p_email text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.membership_applications;
  v_token text := private.new_token();
begin
  if p_application is not null then
    select * into a from public.membership_applications where id = p_application;
  else
    select * into a from public.membership_applications
     where lower(email) = lower(btrim(coalesce(p_email, ''))) and status not in ('withdrawn')
     order by submitted_at desc limit 1;
  end if;
  if not found then return null; end if;
  update public.membership_applications set tracking_token_hash = private.token_hash(v_token) where id = a.id;
  return jsonb_build_object('id', a.id, 'token', v_token, 'locale', a.locale, 'email', a.email,
                            'reference', a.reference, 'name', a.first_name_ar);
end;
$$;
revoke all on function public.rotate_tracking_token(uuid, text) from public, anon, authenticated;
grant execute on function public.rotate_tracking_token(uuid, text) to service_role;

-- Throttle for the "send me a new link" form (service role only).
create or replace function public.allow_public_attempt(p_kind text, p_key text, p_max integer, p_minutes integer)
returns boolean
language sql
security definer
set search_path = ''
as $$ select private.throttle(p_kind, p_key, p_max, make_interval(mins => p_minutes)) $$;
revoke all on function public.allow_public_attempt(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.allow_public_attempt(text, text, integer, integer) to service_role;
