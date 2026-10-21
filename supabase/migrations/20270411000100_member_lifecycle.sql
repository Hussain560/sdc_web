-- Sprint 18 · MEM-016, MEM-017, MEM-020, ACC-009 — membership states v2, term, member number, digital card,
-- onboarding, leave requests, and the one transition core every status change goes through.
-- Authoritative: docs/99-project-management/sprints/sprint-18-membership-lifecycle/lifecycle.md §2.3–§4.

-- ------------------------------------------------------------------------------------------ 1. columns
alter table public.members drop constraint members_status_check;
-- Internal reasons move to member_events (staff only): a member can read their own members row.
alter table public.members drop constraint members_suspension_reason;
update public.members set status = 'ended' where status = 'inactive';
alter table public.members add constraint members_status_check check (status in ('active', 'suspended', 'expired', 'ended'));

alter table public.members
  add column end_reason          text check (end_reason in ('left', 'terminated', 'not_renewed', 'legacy', 'lapsed')),
  add column term_starts_at      date,
  add column term_ends_at        date,
  add column member_no           integer,
  add column card_token          text,
  add column card_rotated_at     timestamptz,
  add column onboarded_at        timestamptz,
  add column onboarding_step     smallint not null default 0 check (onboarding_step between 0 and 5),
  add column suspension_category text check (suspension_category in ('conduct', 'inactivity', 'administrative', 'other')),
  add column suspended_until     date,
  add column leaves_on           date,
  add column activated_at        timestamptz,
  add column renewal_requested_at timestamptz,
  add constraint members_term_order check (term_ends_at is null or term_starts_at is null or term_ends_at >= term_starts_at),
  add constraint members_ended_reason check (status <> 'ended' or end_reason is not null);

-- Existing ended rows came from the old "inactive": left by their own choice, or legacy imports.
update public.members set end_reason = case when joined_via = 'legacy' then 'legacy' else 'left' end where status = 'ended';
-- Existing suspensions get a neutral category (their reason moves to the history below).
update public.members set suspension_category = 'other' where status = 'suspended';
alter table public.members add constraint members_suspension_has_category check (status <> 'suspended' or suspension_category is not null);

-- Member numbers: assigned once, in order of joining, never reused.
create sequence public.member_no_seq as integer;
update public.members m set member_no = n.rn
  from (select id, row_number() over (order by joined_at, created_at, id) as rn from public.members) n where n.id = m.id;
select setval('public.member_no_seq', coalesce((select max(member_no) from public.members), 0) + 1, false);
alter table public.members alter column member_no set default nextval('public.member_no_seq');
alter table public.members alter column member_no set not null;
alter table public.members add constraint members_member_no_uq unique (member_no);
alter sequence public.member_no_seq owned by public.members.member_no;

create unique index members_card_token_uq on public.members (card_token) where card_token is not null;
update public.members set card_token = private.new_token() where status in ('active', 'expired') and card_token is null;
-- Activation is tracked from now on; earlier members count as activated when their account ever signed in or has a password.
update public.members m set activated_at = coalesce(au.last_sign_in_at, m.joined_at)
  from auth.users au
 where au.id = m.user_id and (au.last_sign_in_at is not null or coalesce(au.encrypted_password, '') <> '');

create index members_term_idx on public.members (status, term_ends_at);

-- Defaults for members added without an application: a one-year term (legacy imports keep no term).
create or replace function private.members_term_default() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'active' and new.joined_via = 'manual' then
    new.term_starts_at := coalesce(new.term_starts_at, (new.joined_at at time zone 'Asia/Riyadh')::date);
    new.term_ends_at := coalesce(new.term_ends_at, new.term_starts_at + interval '1 year');
  end if;
  if new.status in ('active', 'expired') and new.card_token is null then new.card_token := private.new_token(); end if;
  return new;
end;
$$;
create trigger members_term_default before insert on public.members
  for each row execute function private.members_term_default();

-- ------------------------------------------------------------------------------------------ 2. member history
create table public.member_events (
  id         bigint generated always as identity primary key,
  member_id  uuid not null references public.members (id) on delete cascade,
  kind       text not null check (char_length(kind) <= 40),
  actor_id   uuid references public.profiles (id) on delete set null,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index member_events_member_idx on public.member_events (member_id, id);
alter table public.member_events enable row level security;
revoke all on table public.member_events from anon, authenticated;
grant select on table public.member_events to authenticated;
-- Leadership reads the whole history (internal reasons included); a member never reads it directly.
create policy member_events_select_staff on public.member_events
  for select to authenticated using (private.has_permission('members.manage'));

create or replace function private.add_member_event(p_member uuid, p_kind text, p_data jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.member_events (member_id, kind, actor_id, data)
  values (p_member, p_kind, (select p.id from public.profiles p where p.id = (select auth.uid())), coalesce(p_data, '{}'::jsonb));
end;
$$;
revoke all on function private.add_member_event(uuid, text, jsonb) from public, anon, authenticated;

insert into public.member_events (member_id, kind, created_at)
select id, 'joined', joined_at from public.members;

-- Earlier internal reasons move to the history (staff only) and leave the row a member can read.
insert into public.member_events (member_id, kind, data)
select id, 'status_note', jsonb_build_object('reason', status_reason) from public.members where status_reason is not null;
update public.members set status_reason = null where status_reason is not null;

-- ------------------------------------------------------------------------------------------ 3. rank, today
create or replace function private.role_rank(p_user uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select coalesce(min(r.display_order), 1000)::integer
    from public.role_assignments ra join public.roles r on r.key = ra.role_key
   where ra.user_id = p_user and ra.starts_at <= now() and (ra.ends_at is null or ra.ends_at > now())
$$;
revoke all on function private.role_rank(uuid) from public, anon, authenticated;

-- ------------------------------------------------------------------------------------------ 4. the transition core
-- allowed: active → suspended | expired | ended | active (renew) · suspended → active | ended · expired → active | ended.
create or replace function private.member_transition(
  p_member uuid, p_to text, p_end_reason text, p_reason text, p_data jsonb, p_actor uuid default null
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.members;
  reason text := nullif(btrim(coalesce(p_reason, '')), '');
  ok boolean;
begin
  select * into m from public.members where id = p_member for update;
  if not found then return 'NOT_FOUND'; end if;
  ok := (m.status = 'active' and p_to in ('suspended', 'expired', 'ended', 'active'))
     or (m.status = 'suspended' and p_to in ('active', 'ended'))
     or (m.status = 'expired' and p_to in ('active', 'ended'));
  if not ok then return 'INVALID_TRANSITION'; end if;
  if p_to = 'suspended' and (reason is null or coalesce(p_data ->> 'category', '') not in ('conduct', 'inactivity', 'administrative', 'other')) then
    return 'REASON_REQUIRED';
  end if;
  if p_to = 'ended' then
    if p_end_reason not in ('left', 'terminated', 'not_renewed', 'legacy', 'lapsed') then return 'VALIDATION_FAILED'; end if;
    if p_end_reason = 'terminated' and reason is null then return 'REASON_REQUIRED'; end if;
  end if;

  if p_to = 'suspended' then
    update public.members set status = 'suspended', status_reason = null,
           suspension_category = p_data ->> 'category', suspended_until = nullif(p_data ->> 'until', '')::date
     where id = m.id;
  elsif p_to = 'expired' then
    update public.members set status = 'expired', status_reason = null where id = m.id;
  elsif p_to = 'ended' then
    update public.members set status = 'ended', end_reason = p_end_reason, status_reason = null, ended_at = now(),
           card_token = null, leaves_on = null, suspended_until = null, suspension_category = null
     where id = m.id;
  else -- active (reinstate or renew)
    update public.members set status = 'active', status_reason = null, ended_at = null,
           suspension_category = null, suspended_until = null, renewal_requested_at = null,
           term_starts_at = case when m.status = 'expired' then (now() at time zone 'Asia/Riyadh')::date else coalesce(term_starts_at, (now() at time zone 'Asia/Riyadh')::date) end,
           term_ends_at = coalesce(nullif(p_data ->> 'term_ends_at', '')::date, term_ends_at),
           card_token = coalesce(card_token, private.new_token())
     where id = m.id;
  end if;

  -- BR-MBR-011: leaving the active state ends the person's committee positions (reinstating does not restore them).
  if p_to <> 'active' and m.user_id is not null then
    update public.role_assignments ra
       set ends_at = now(), ended_by = p_actor, end_reason = left('Membership ' || p_to || coalesce(': ' || reason, ''), 500)
      from public.roles r
     where ra.user_id = m.user_id and r.key = ra.role_key and r.scope = 'committee'
       and ra.starts_at <= now() and (ra.ends_at is null or ra.ends_at > now());
  end if;

  perform private.add_member_event(m.id,
    case when p_to = 'active' and m.status = 'suspended' then 'reinstated'
         when p_to = 'active' then 'renewed' else p_to end,
    coalesce(p_data, '{}'::jsonb) || jsonb_build_object('from', m.status, 'reason', reason, 'end_reason', p_end_reason));
  perform private.write_audit('member.' || case when p_to = 'active' and m.status = 'suspended' then 'reinstated'
                                                 when p_to = 'active' then 'renewed' else p_to end,
    'member', m.id::text, null, jsonb_build_object('from', m.status, 'reason', reason, 'end_reason', p_end_reason));
  return null;
end;
$$;
revoke all on function private.member_transition(uuid, text, text, text, jsonb, uuid) from public, anon, authenticated;

-- Shared guard for the bulk actions: returns a refusal code or null.
create or replace function private.member_action_guard(p_member public.members, p_caller uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_member.user_id is not null and p_member.user_id = p_caller then 'SELF_ACTION'
    when p_member.user_id is not null and private.role_rank(p_member.user_id) < private.role_rank(p_caller) then 'HIGHER_ROLE'
  end
$$;
revoke all on function private.member_action_guard(public.members, uuid) from public, anon, authenticated;

-- ------------------------------------------------------------------------------------------ 5. bulk actions (members.manage)
create or replace function public.suspend_members(p_ids uuid[], p_category text, p_reason text, p_until date default null, p_message text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  caller uuid := (select auth.uid());
  m public.members;
  id uuid;
  code text;
  results jsonb := '[]'::jsonb;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('members.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if coalesce(array_length(p_ids, 1), 0) not between 1 and 200 then raise exception 'VALIDATION_FAILED' using errcode = 'P0001'; end if;
  foreach id in array p_ids loop
    select * into m from public.members where public.members.id = id;
    if not found then code := 'NOT_FOUND';
    else
      code := private.member_action_guard(m, caller);
      if code is null then
        code := private.member_transition(id, 'suspended', null, p_reason,
          jsonb_build_object('category', p_category, 'until', p_until, 'message', nullif(btrim(coalesce(p_message, '')), '')), caller);
      end if;
    end if;
    results := results || jsonb_build_object('id', id, 'ok', code is null, 'code', code);
  end loop;
  return results;
end;
$$;

create or replace function public.reinstate_members(p_ids uuid[], p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  caller uuid := (select auth.uid());
  m public.members;
  id uuid;
  code text;
  results jsonb := '[]'::jsonb;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('members.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if coalesce(array_length(p_ids, 1), 0) not between 1 and 200 then raise exception 'VALIDATION_FAILED' using errcode = 'P0001'; end if;
  foreach id in array p_ids loop
    select * into m from public.members where public.members.id = id;
    if not found then code := 'NOT_FOUND';
    elsif m.status <> 'suspended' then code := 'INVALID_TRANSITION';
    else
      code := private.member_action_guard(m, caller);
      if code is null then
        code := private.member_transition(id, 'active', null, p_note, '{}'::jsonb, caller);
      end if;
    end if;
    results := results || jsonb_build_object('id', id, 'ok', code is null, 'code', code);
  end loop;
  return results;
end;
$$;

create or replace function public.end_members(p_ids uuid[], p_reason text, p_end_reason text default 'terminated', p_message text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  caller uuid := (select auth.uid());
  m public.members;
  id uuid;
  code text;
  results jsonb := '[]'::jsonb;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('members.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if coalesce(array_length(p_ids, 1), 0) not between 1 and 200 or p_end_reason not in ('terminated', 'not_renewed') then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  foreach id in array p_ids loop
    select * into m from public.members where public.members.id = id;
    if not found then code := 'NOT_FOUND';
    else
      code := private.member_action_guard(m, caller);
      if code is null then
        code := private.member_transition(id, 'ended', p_end_reason, p_reason,
          jsonb_build_object('message', nullif(btrim(coalesce(p_message, '')), '')), caller);
      end if;
    end if;
    results := results || jsonb_build_object('id', id, 'ok', code is null, 'code', code);
  end loop;
  return results;
end;
$$;

create or replace function public.renew_members(p_ids uuid[], p_ends_at date, p_message text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  caller uuid := (select auth.uid());
  m public.members;
  id uuid;
  code text;
  results jsonb := '[]'::jsonb;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('members.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if coalesce(array_length(p_ids, 1), 0) not between 1 and 200 or p_ends_at is null or p_ends_at <= private.today_riyadh() then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  foreach id in array p_ids loop
    select * into m from public.members where public.members.id = id;
    if not found then code := 'NOT_FOUND';
    elsif m.status not in ('active', 'expired') then code := 'INVALID_TRANSITION';
    else
      -- Renewing is not a restricted action: leadership may renew itself; only members that were ended are refused.
      if m.status = 'active' then
        update public.members set term_ends_at = p_ends_at, renewal_requested_at = null,
               term_starts_at = coalesce(term_starts_at, private.today_riyadh()) where public.members.id = id;
        perform private.add_member_event(id, 'renewed', jsonb_build_object('term_ends_at', p_ends_at, 'from', 'active',
                                         'message', nullif(btrim(coalesce(p_message, '')), '')));
        perform private.write_audit('member.renewed', 'member', id::text, null, jsonb_build_object('term_ends_at', p_ends_at));
        code := null;
      else
        code := private.member_transition(id, 'active', null, null,
          jsonb_build_object('term_ends_at', p_ends_at, 'message', nullif(btrim(coalesce(p_message, '')), '')), caller);
      end if;
    end if;
    results := results || jsonb_build_object('id', id, 'ok', code is null, 'code', code);
  end loop;
  return results;
end;
$$;

-- ------------------------------------------------------------------------------------------ 6. leave requests
create table public.member_leave_requests (
  id                uuid primary key default gen_random_uuid(),
  member_id         uuid not null references public.members (id) on delete cascade,
  status            text not null default 'pending' check (status in ('pending', 'approved', 'declined', 'withdrawn')),
  reason            text check (char_length(reason) <= 1000),
  preferred_last_day date,
  effective_on      date,
  decided_by        uuid references public.profiles (id) on delete set null,
  decided_at        timestamptz,
  created_at        timestamptz not null default now()
);
create unique index member_leave_requests_one_pending on public.member_leave_requests (member_id) where status = 'pending';
alter table public.member_leave_requests enable row level security;
revoke all on table public.member_leave_requests from anon, authenticated;
grant select on table public.member_leave_requests to authenticated;
create policy leave_requests_select_own on public.member_leave_requests
  for select to authenticated using (exists (select 1 from public.members m where m.id = member_id and m.user_id = (select auth.uid())));
create policy leave_requests_select_staff on public.member_leave_requests
  for select to authenticated using (private.has_permission('members.manage'));

create or replace function public.request_to_leave(p_reason text default null, p_last_day date default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  m public.members;
  v_id uuid;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into m from public.members where user_id = caller for update;
  if not found or m.status not in ('active', 'suspended', 'expired') then raise exception 'NOT_A_MEMBER' using errcode = 'P0001'; end if;
  if exists (select 1 from public.member_leave_requests where member_id = m.id and status = 'pending') then
    raise exception 'ALREADY_PENDING' using errcode = 'P0001';
  end if;
  if char_length(coalesce(p_reason, '')) > 1000 or (p_last_day is not null and p_last_day < private.today_riyadh()) then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  insert into public.member_leave_requests (member_id, reason, preferred_last_day)
  values (m.id, nullif(btrim(coalesce(p_reason, '')), ''), p_last_day) returning id into v_id;
  perform private.add_member_event(m.id, 'leave_requested', jsonb_build_object('request', v_id));
  perform private.write_audit('member.leave_requested', 'member', m.id::text, null, jsonb_build_object('request', v_id));
  return v_id;
end;
$$;

create or replace function public.withdraw_leave_request()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  m public.members;
  r public.member_leave_requests;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into m from public.members where user_id = caller for update;
  if not found then raise exception 'NOT_A_MEMBER' using errcode = 'P0001'; end if;
  select * into r from public.member_leave_requests where member_id = m.id and status = 'pending' for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  update public.member_leave_requests set status = 'withdrawn', decided_at = now() where id = r.id;
  perform private.add_member_event(m.id, 'leave_withdrawn', jsonb_build_object('request', r.id));
  perform private.write_audit('member.leave_withdrawn', 'member', m.id::text, null, jsonb_build_object('request', r.id));
end;
$$;

-- Leadership decides, one or many. A leader never decides about their own request.
create or replace function public.decide_leave_requests(p_ids uuid[], p_decision text, p_note text default null, p_effective date default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_variable
declare
  caller uuid := (select auth.uid());
  r public.member_leave_requests;
  m public.members;
  id uuid;
  code text;
  eff date;
  results jsonb := '[]'::jsonb;
  note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('members.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if p_decision not in ('approve', 'decline') or coalesce(array_length(p_ids, 1), 0) not between 1 and 200
     or char_length(coalesce(note, '')) > 1000 then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  foreach id in array p_ids loop
    code := null;
    select * into r from public.member_leave_requests where public.member_leave_requests.id = id for update;
    if not found then code := 'NOT_FOUND';
    elsif r.status <> 'pending' then code := 'INVALID_TRANSITION';
    else
      select * into m from public.members where public.members.id = r.member_id for update;
      if m.user_id is not null and m.user_id = caller then code := 'SELF_DECISION';
      elsif p_decision = 'decline' then
        update public.member_leave_requests set status = 'declined', decided_by = caller, decided_at = now() where public.member_leave_requests.id = id;
        perform private.add_member_event(m.id, 'leave_declined', jsonb_build_object('request', id, 'note', note));
        perform private.write_audit('member.leave_declined', 'member', m.id::text, null, jsonb_build_object('request', id));
      else
        eff := coalesce(p_effective, r.preferred_last_day, private.today_riyadh());
        if eff < private.today_riyadh() then eff := private.today_riyadh(); end if;
        update public.member_leave_requests set status = 'approved', decided_by = caller, decided_at = now(),
               effective_on = eff where public.member_leave_requests.id = id;
        perform private.add_member_event(m.id, 'leave_approved', jsonb_build_object('request', id, 'effective_on', eff, 'note', note));
        perform private.write_audit('member.leave_approved', 'member', m.id::text, null, jsonb_build_object('request', id, 'effective_on', eff));
        if eff <= private.today_riyadh() then
          code := private.member_transition(m.id, 'ended', 'left', 'leave request approved', jsonb_build_object('request', id), caller);
          if code = 'INVALID_TRANSITION' then code := null; end if; -- already ended/expired: the approval still stands
        else
          update public.members set leaves_on = eff where public.members.id = m.id;
        end if;
      end if;
    end if;
    results := results || jsonb_build_object('id', id, 'ok', code is null, 'code', code);
  end loop;
  return results;
end;
$$;

-- ------------------------------------------------------------------------------------------ 7. card, renewal request, onboarding
create or replace function public.rotate_card_token()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  m public.members;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into m from public.members where user_id = caller for update;
  if not found or m.status not in ('active', 'expired') then raise exception 'NOT_A_MEMBER' using errcode = 'P0001'; end if;
  if exists (select 1 from public.profiles where id = caller and blocked_at is not null) then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  update public.members set card_token = private.new_token(), card_rotated_at = now() where id = m.id;
  perform private.add_member_event(m.id, 'card_rotated');
  perform private.write_audit('member.card_rotated', 'member', m.id::text, null, '{}'::jsonb);
end;
$$;

-- Public verification: name, member number, status and term end — nothing else (Q-L10).
create or replace function public.verify_member_card(p_token text, p_ip_hash text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare m public.members;
begin
  if not private.throttle('verify', p_ip_hash, 60, interval '10 minutes') then
    return jsonb_build_object('ok', false, 'code', 'RATE_LIMITED');
  end if;
  if coalesce(p_token, '') = '' then return jsonb_build_object('ok', false, 'code', 'TOKEN_INVALID'); end if;
  select * into m from public.members where card_token = p_token;
  if not found or m.status = 'ended' then return jsonb_build_object('ok', false, 'code', 'TOKEN_INVALID'); end if;
  return jsonb_build_object(
    'ok', true,
    'name_ar', btrim(m.first_name_ar || ' ' || m.last_name_ar),
    'name_en', nullif(btrim(coalesce(m.first_name_en, '') || ' ' || coalesce(m.last_name_en, '')), ''),
    'member_no', 'SDC-M-' || lpad(m.member_no::text, 6, '0'),
    'status', m.status,
    'term_ends_at', m.term_ends_at,
    'checked_at', now());
end;
$$;
revoke all on function public.verify_member_card(text, text) from public;
grant execute on function public.verify_member_card(text, text) to anon, authenticated;

-- A member asks leadership to renew (Q-L2). The mail to leadership is sent by the server.
create or replace function public.request_renewal()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  m public.members;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into m from public.members where user_id = caller for update;
  if not found or m.status not in ('active', 'expired') then raise exception 'NOT_A_MEMBER' using errcode = 'P0001'; end if;
  if m.renewal_requested_at is not null and m.renewal_requested_at > now() - interval '7 days' then
    raise exception 'ALREADY_PENDING' using errcode = 'P0001';
  end if;
  update public.members set renewal_requested_at = now() where id = m.id;
  perform private.add_member_event(m.id, 'renewal_requested');
  perform private.write_audit('member.renewal_requested', 'member', m.id::text, null, '{}'::jsonb);
end;
$$;

create or replace function public.save_onboarding_step(p_step smallint, p_done boolean default false)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  m public.members;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if p_step not between 0 and 5 then raise exception 'VALIDATION_FAILED' using errcode = 'P0001'; end if;
  select * into m from public.members where user_id = caller for update;
  if not found or m.status <> 'active' then raise exception 'NOT_A_MEMBER' using errcode = 'P0001'; end if;
  update public.members set onboarding_step = greatest(onboarding_step, p_step),
         onboarded_at = case when p_done and onboarded_at is null then now() else onboarded_at end
   where id = m.id;
  if p_done and m.onboarded_at is null then perform private.add_member_event(m.id, 'onboarded', jsonb_build_object('step', p_step)); end if;
end;
$$;

-- ------------------------------------------------------------------------------------------ 8. retire the old direct paths
drop function if exists public.set_member_status(uuid, text, text);

-- Active members only: the directory and member-only reads never show anyone else (the view already filters).
create or replace function private.is_active_member(p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select exists (select 1 from public.members where user_id = p_user and status = 'active') $$;

do $$
declare f text;
begin
  foreach f in array array[
    'suspend_members(uuid[], text, text, date, text)', 'reinstate_members(uuid[], text)',
    'end_members(uuid[], text, text, text)', 'renew_members(uuid[], date, text)',
    'request_to_leave(text, date)', 'withdraw_leave_request()', 'decide_leave_requests(uuid[], text, text, date)',
    'rotate_card_token()', 'request_renewal()', 'save_onboarding_step(smallint, boolean)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
