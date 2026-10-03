-- Sprint 04 · ACC-005, ACC-002, CMT-003, CMT-002, SEC-001
-- Audit log (append-only), the only write path for role assignments, the public leadership view,
-- and the lockdown of the legacy tables (docs/01-project/current-system-audit.md findings F-01/F-02).

-- ---------------------------------------------------------------------------------------------- audit_logs
create table public.audit_logs (
  id          bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null check (action ~ '^[a-z_]+\.[a-z_]+$'),
  entity_type text not null,
  entity_id   text not null,
  committee_id uuid,
  summary     jsonb not null default '{}'::jsonb,
  request_id  text
);
comment on table public.audit_logs is 'Append-only record of business and security actions (BR-GOV-001/002).';
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_actor_idx on public.audit_logs (actor_id, occurred_at desc);
create index audit_logs_time_idx on public.audit_logs (occurred_at desc);

alter table public.audit_logs enable row level security;
revoke all on table public.audit_logs from anon, authenticated;
grant select on table public.audit_logs to authenticated;
create policy audit_logs_select on public.audit_logs
  for select to authenticated using (private.has_permission('audit.view'));

-- Defence in depth: even the table owner cannot rewrite history. The single allowed change is the
-- FK action "on delete set null" when an actor's profile is deleted.
create or replace function private.audit_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and new.actor_id is null and old.actor_id is not null
     and (new.id, new.occurred_at, new.action, new.entity_type, new.entity_id, new.committee_id, new.summary, new.request_id)
         is not distinct from
         (old.id, old.occurred_at, old.action, old.entity_type, old.entity_id, old.committee_id, old.summary, old.request_id)
  then
    return new;
  end if;
  raise exception 'AUDIT_IMMUTABLE' using errcode = 'P0001';
end;
$$;
create trigger audit_logs_immutable before update or delete on public.audit_logs
  for each row execute function private.audit_immutable();

create or replace function private.write_audit(
  p_action text, p_entity_type text, p_entity_id text, p_committee uuid, p_summary jsonb
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, committee_id, summary)
  values (
    (select p.id from public.profiles p where p.id = (select auth.uid())),
    p_action, p_entity_type, p_entity_id, p_committee, coalesce(p_summary, '{}'::jsonb)
  );
end;
$$;
revoke all on function private.write_audit(text, text, text, uuid, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------- audit triggers
create or replace function private.audit_role_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform private.write_audit('role.assigned', 'role_assignment', new.id::text, new.committee_id,
      jsonb_build_object('user_id', new.user_id, 'role_key', new.role_key,
                         'starts_at', new.starts_at, 'ends_at', new.ends_at));
  elsif tg_op = 'UPDATE' then
    if old.ends_at is distinct from new.ends_at then
      perform private.write_audit('role.ended', 'role_assignment', new.id::text, new.committee_id,
        jsonb_build_object('user_id', new.user_id, 'role_key', new.role_key,
                           'before', old.ends_at, 'after', new.ends_at, 'reason', new.end_reason));
    else
      perform private.write_audit('role.updated', 'role_assignment', new.id::text, new.committee_id,
        jsonb_build_object('user_id', new.user_id, 'role_key', new.role_key));
    end if;
  elsif tg_op = 'DELETE' then
    perform private.write_audit('role.deleted', 'role_assignment', old.id::text, old.committee_id,
      jsonb_build_object('user_id', old.user_id, 'role_key', old.role_key));
    return old;
  end if;
  return new;
end;
$$;
create trigger role_assignments_audit after insert or update or delete on public.role_assignments
  for each row execute function private.audit_role_assignment();

create or replace function private.audit_committee()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform private.write_audit('committee.created', 'committee', new.id::text, new.id,
      jsonb_build_object('slug', new.slug));
  elsif old.status is distinct from new.status then
    perform private.write_audit(
      case when new.status = 'inactive' then 'committee.deactivated' else 'committee.reactivated' end,
      'committee', new.id::text, new.id, jsonb_build_object('before', old.status, 'after', new.status));
  else
    perform private.write_audit('committee.updated', 'committee', new.id::text, new.id,
      jsonb_build_object('slug', new.slug));
  end if;
  return new;
end;
$$;
create trigger committees_audit after insert or update on public.committees
  for each row execute function private.audit_committee();

-- ---------------------------------------------------------------------------------------------- assignment functions
create or replace function private.is_system_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.role_assignments ra
    where ra.user_id = (select auth.uid()) and ra.role_key = 'system_admin'
      and ra.starts_at <= now() and (ra.ends_at is null or ra.ends_at > now())
  );
$$;
revoke all on function private.is_system_admin() from public;
grant execute on function private.is_system_admin() to anon, authenticated;

-- Shared authorization for assigning/ending: returns normally when allowed, raises a machine code otherwise.
create or replace function private.authorize_role_change(p_role text, p_committee uuid, p_target_user uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_caller uuid := (select auth.uid());
begin
  if v_caller is null then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  if private.is_system_admin() then
    return;  -- BR-ORG-006: system_admin is the only exception to anti-escalation
  end if;

  if private.has_permission('roles.assign') then
    -- Leaders manage committee roles only; global roles are the system admin's.
    if p_role in ('system_admin', 'community_leader', 'founder', 'advisor') then
      raise exception 'ESCALATION_DENIED' using errcode = 'P0001';
    end if;
  elsif p_role = 'committee_member' and p_committee is not null
        and private.has_permission('committee_members.manage', p_committee) then
    null;  -- a committee head manages plain members of their own committee only (CM-6)
  else
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  -- Nobody grants a permission they do not hold in that scope.
  if exists (
    select 1 from public.role_permissions rp
    where rp.role_key = p_role and not private.has_permission(rp.permission_key, p_committee)
  ) then
    raise exception 'ESCALATION_DENIED' using errcode = 'P0001';
  end if;

  if p_target_user = v_caller then
    raise exception 'SELF_ASSIGNMENT' using errcode = 'P0001';
  end if;
end;
$$;
revoke all on function private.authorize_role_change(text, uuid, uuid) from public, anon, authenticated;

create or replace function public.assign_role(
  p_user uuid,
  p_role text,
  p_committee uuid default null,
  p_starts_at timestamptz default now(),
  p_ends_at timestamptz default null,
  p_title_ar text default null,
  p_title_en text default null,
  p_bio_ar text default null,
  p_bio_en text default null,
  p_tags_ar text[] default null,
  p_tags_en text[] default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_scope text;
  v_status text;
  v_id uuid;
  v_constraint text;
begin
  if (select auth.uid()) is null then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;

  select scope into v_scope from public.roles where key = p_role;
  if v_scope is null then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if v_scope = 'committee' and p_committee is null then raise exception 'SCOPE_REQUIRED' using errcode = 'P0001'; end if;
  if v_scope = 'global' and p_committee is not null then raise exception 'SCOPE_FORBIDDEN' using errcode = 'P0001'; end if;

  perform private.authorize_role_change(p_role, p_committee, p_user);

  if p_ends_at is not null and p_ends_at < p_starts_at then
    raise exception 'INVALID_DATE' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.profiles where id = p_user) then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if p_committee is not null then
    select status into v_status from public.committees where id = p_committee;
    if v_status is null then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
    if v_status <> 'active' then raise exception 'COMMITTEE_INACTIVE' using errcode = 'P0001'; end if;
  end if;
  if v_scope = 'committee' and not private.is_active_member(p_user) then
    raise exception 'NOT_ACTIVE_MEMBER' using errcode = 'P0001';
  end if;

  begin
    insert into public.role_assignments (
      user_id, role_key, committee_id, starts_at, ends_at, assigned_by,
      display_title_ar, display_title_en, public_bio_ar, public_bio_en, public_tags_ar, public_tags_en
    ) values (
      p_user, p_role, p_committee, p_starts_at, p_ends_at, (select auth.uid()),
      p_title_ar, p_title_en, p_bio_ar, p_bio_en, p_tags_ar, p_tags_en
    ) returning id into v_id;
  exception when exclusion_violation then
    get stacked diagnostics v_constraint = constraint_name;
    if v_constraint = 'role_assignments_one_leader' then
      raise exception 'LEADER_ALREADY_ACTIVE' using errcode = 'P0001';
    elsif v_constraint = 'role_assignments_one_head' then
      raise exception 'HEAD_ALREADY_ACTIVE' using errcode = 'P0001';
    else
      raise exception 'ALREADY_ASSIGNED' using errcode = 'P0001';
    end if;
  end;

  return v_id;
end;
$$;

create or replace function public.end_role_assignment(
  p_id uuid,
  p_reason text,
  p_ends_at timestamptz default now()
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.role_assignments;
begin
  if (select auth.uid()) is null then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;

  select * into a from public.role_assignments where id = p_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;

  perform private.authorize_role_change(a.role_key, a.committee_id, a.user_id);

  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'REASON_REQUIRED' using errcode = 'P0001';
  end if;
  if a.ends_at is not null and a.ends_at <= now() then
    raise exception 'ALREADY_ENDED' using errcode = 'P0001';
  end if;

  -- A scheduled assignment that is cancelled becomes an empty term; an active one ends at p_ends_at.
  p_ends_at := greatest(p_ends_at, a.starts_at);

  -- BR-ORG-007: the last active system admin cannot be ended.
  if a.role_key = 'system_admin' and not exists (
    select 1 from public.role_assignments x
    where x.role_key = 'system_admin' and x.id <> a.id
      and x.starts_at <= now() and (x.ends_at is null or x.ends_at > now())
  ) then
    raise exception 'LAST_ADMIN' using errcode = 'P0001';
  end if;

  update public.role_assignments
     set ends_at = p_ends_at, ended_by = (select auth.uid()), end_reason = left(btrim(p_reason), 500)
   where id = p_id;
end;
$$;

-- Handover: end the current head and appoint the next one atomically (CM handover sequence).
create or replace function public.handover_head(
  p_committee uuid,
  p_new_head uuid,
  p_at timestamptz default now()
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current uuid;
begin
  if not (private.is_system_admin() or private.has_permission('roles.assign')) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  select id into v_current
  from public.role_assignments
  where role_key = 'committee_head' and committee_id = p_committee
    and starts_at <= p_at and (ends_at is null or ends_at > p_at)
  limit 1;

  if v_current is not null then
    perform public.end_role_assignment(v_current, 'handover', p_at);
  end if;

  return public.assign_role(p_new_head, 'committee_head', p_committee, p_at, null);
end;
$$;

revoke all on function public.assign_role(uuid, text, uuid, timestamptz, timestamptz, text, text, text, text, text[], text[]) from public, anon;
revoke all on function public.end_role_assignment(uuid, text, timestamptz) from public, anon;
revoke all on function public.handover_head(uuid, uuid, timestamptz) from public, anon;
grant execute on function public.assign_role(uuid, text, uuid, timestamptz, timestamptz, text, text, text, text, text[], text[]) to authenticated;
grant execute on function public.end_role_assignment(uuid, text, timestamptz) to authenticated;
grant execute on function public.handover_head(uuid, uuid, timestamptz) to authenticated;

-- Bootstrap (Q-039): the first system administrators are created by a maintainer through the service role / psql,
-- never from the app. No real e-mail addresses are committed.
create or replace function private.bootstrap_system_admin(p_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_id uuid;
begin
  select id into v_user from public.profiles where lower(email) = lower(p_email);
  if v_user is null then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  select id into v_id from public.role_assignments
   where user_id = v_user and role_key = 'system_admin' and (ends_at is null or ends_at > now());
  if v_id is not null then return v_id; end if;
  insert into public.role_assignments (user_id, role_key) values (v_user, 'system_admin') returning id into v_id;
  return v_id;
end;
$$;
revoke all on function private.bootstrap_system_admin(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------- public leadership view
-- Runs with the owner's rights on purpose: it exposes ONLY active assignments of public roles and display fields,
-- never user ids or private data (docs/11-modules/committees §7, rule CM-7).
create view public.current_positions as
select
  ra.id                       as assignment_id,
  ra.role_key,
  r.name_ar                   as role_name_ar,
  r.name_en                   as role_name_en,
  r.display_order             as role_order,
  ra.display_title_ar,
  ra.display_title_en,
  ra.public_bio_ar,
  ra.public_bio_en,
  ra.public_tags_ar,
  ra.public_tags_en,
  c.id                        as committee_id,
  c.slug                      as committee_slug,
  c.name_ar                   as committee_name_ar,
  c.name_en                   as committee_name_en,
  c.display_order             as committee_order,
  p.full_name_ar              as person_name_ar,
  coalesce(p.full_name_en, p.full_name_ar) as person_name_en,
  ra.starts_at,
  ra.ends_at
from public.role_assignments ra
join public.roles r on r.key = ra.role_key and r.is_public_position
join public.profiles p on p.id = ra.user_id
left join public.committees c on c.id = ra.committee_id
where ra.starts_at <= now() and (ra.ends_at is null or ra.ends_at > now());
comment on view public.current_positions is 'Public leadership: active assignments of public roles (CM-7).';
revoke all on public.current_positions from anon, authenticated;
grant select on public.current_positions to anon, authenticated;

-- ---------------------------------------------------------------------------------------------- legacy lockdown (SEC-001)
-- members: still publicly readable (legacy pages read the table until Sprint 08); writes need members.manage.
revoke all on table public.members from anon, authenticated;
grant select on table public.members to anon, authenticated;
grant insert, update, delete on table public.members to authenticated;
drop policy if exists "Allow write members" on public.members;
create policy members_insert_manage on public.members
  for insert to authenticated with check (private.has_permission('members.manage'));
create policy members_update_manage on public.members
  for update to authenticated
  using (private.has_permission('members.manage')) with check (private.has_permission('members.manage'));
create policy members_delete_manage on public.members
  for delete to authenticated using (private.has_permission('members.manage'));

-- event_registrations: owners read and create their own rows; reviewers read and decide.
revoke all on table public.event_registrations from anon, authenticated;
grant select, insert, update on table public.event_registrations to authenticated;
grant usage, select on sequence public.event_registrations_id_seq to authenticated;
drop policy if exists "Allow read registrations" on public.event_registrations;
drop policy if exists "Allow insert registrations" on public.event_registrations;
drop policy if exists "Allow update registrations" on public.event_registrations;
create policy registrations_select_own on public.event_registrations
  for select to authenticated using (user_id = (select auth.uid()));
create policy registrations_select_reviewers on public.event_registrations
  for select to authenticated using (private.has_permission_any_scope('registrations.review'));
create policy registrations_insert_own on public.event_registrations
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy registrations_update_reviewers on public.event_registrations
  for update to authenticated
  using (private.has_permission_any_scope('registrations.review'))
  with check (private.has_permission_any_scope('registrations.review'));
