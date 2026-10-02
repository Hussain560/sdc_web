-- Sprint 08 · MEM-002, MEM-003, MEM-004, MBR-004 — members v2 (expand–contract from the legacy table).
-- Authoritative design: docs/05-database/entities/membership.md §3, docs/11-modules/members/README.md (ME-1…ME-8),
-- docs/11-modules/membership/README.md (MB-6…MB-8, MB-11). The legacy table is kept (no grants) until reconciliation.

-- ------------------------------------------------------------------------------------------ 1. set the legacy table aside
alter table public.members rename to members_legacy;
alter table public.members_legacy rename constraint members_pkey to members_legacy_pkey;
alter sequence public.members_id_seq rename to members_legacy_id_seq;
drop policy if exists "Allow read members" on public.members_legacy;
drop policy if exists "Allow write members" on public.members_legacy;
drop policy if exists members_insert_manage on public.members_legacy;
drop policy if exists members_update_manage on public.members_legacy;
drop policy if exists members_delete_manage on public.members_legacy;
revoke all on table public.members_legacy from anon, authenticated;
comment on table public.members_legacy is
  'Pre-Sprint-08 members (open free-text table). No grants, no policies: read only by private.import_legacy_members(). Dropped in the hardening sprint.';

-- ------------------------------------------------------------------------------------------ 2. the new members table
create table public.members (
  id                   uuid primary key default gen_random_uuid(),
  legacy_id            integer unique,
  user_id              uuid unique references public.profiles (id) on delete restrict,
  status               text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  status_reason        text check (char_length(status_reason) <= 500),
  joined_at            timestamptz not null default now(),
  joined_cycle_id      uuid references public.membership_cycles (id) on delete set null,
  joined_via           text not null check (joined_via in ('application', 'legacy', 'manual')),
  application_id       uuid unique references public.membership_applications (id) on delete set null,
  first_name_ar        text not null check (char_length(btrim(first_name_ar)) >= 1),
  last_name_ar         text not null default '',
  first_name_en        text check (char_length(first_name_en) <= 100),
  last_name_en         text check (char_length(last_name_en) <= 100),
  academic_status      text check (academic_status in ('student', 'graduate', 'employee', 'other')),
  university_id        smallint references public.universities (id),
  major_id             smallint references public.majors (id),
  sub_major_id         smallint references public.majors (id),
  track_id             smallint references public.tracks (id),
  bio_ar               text check (char_length(bio_ar) <= 1000),
  bio_en               text check (char_length(bio_en) <= 1000),
  portfolio_url        text check (portfolio_url ~ '^https://' and char_length(portfolio_url) <= 500),
  github_url           text check (github_url ~ '^https://' and char_length(github_url) <= 500),
  linkedin_url         text check (linkedin_url ~ '^https://' and char_length(linkedin_url) <= 500),
  x_url                text check (x_url ~ '^https://' and char_length(x_url) <= 500),
  is_directory_visible boolean not null default false,
  legacy_claim_email   text check (legacy_claim_email ~* '^[^@\s]+@[^@\s]+$'),
  ended_at             timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  -- ME-5: a suspension always carries its reason.
  constraint members_suspension_reason check (status <> 'suspended' or nullif(btrim(status_reason), '') is not null)
);
create index members_status_visible_idx on public.members (status, is_directory_visible);
create trigger members_touch before update on public.members
  for each row execute function private.touch_updated_at();

-- ------------------------------------------------------------------------------------------ 3. legacy import (idempotent; dry-run report)
-- Reference values the legacy rows use are created first (sub-majors hang under their major).
create or replace function private.import_legacy_members()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  imported integer;
begin
  insert into public.universities (name_ar, name_en)
  select btrim(university), max(nullif(btrim(university_en), ''))
  from public.members_legacy where nullif(btrim(university), '') is not null group by btrim(university)
  on conflict (name_ar) do nothing;
  insert into public.majors (name_ar, name_en)
  select btrim(major), max(nullif(btrim(major_en), ''))
  from public.members_legacy where nullif(btrim(major), '') is not null group by btrim(major)
  on conflict do nothing;
  insert into public.majors (parent_id, name_ar, name_en)
  select p.id, btrim(l.sub_major), max(nullif(btrim(l.sub_major_en), ''))
  from public.members_legacy l
  join public.majors p on p.name_ar = btrim(l.major) and p.parent_id is null
  where nullif(btrim(l.sub_major), '') is not null
  group by p.id, btrim(l.sub_major)
  on conflict do nothing;
  insert into public.tracks (name_ar, name_en)
  select btrim(track), max(nullif(btrim(track_en), ''))
  from public.members_legacy where nullif(btrim(track), '') is not null group by btrim(track)
  on conflict (name_ar) do nothing;

  -- Legacy members stay visible in the directory until they claim their record or the cut-off passes (Q-026).
  insert into public.members (
    legacy_id, status, joined_at, joined_via, first_name_ar, last_name_ar, first_name_en, last_name_en,
    academic_status, university_id, major_id, sub_major_id, track_id, bio_ar, bio_en,
    portfolio_url, github_url, linkedin_url, x_url, is_directory_visible
  )
  select
    l.id, 'active', coalesce(l.created_at, now()), 'legacy',
    coalesce(nullif(btrim(l.first_name), ''), '—'), coalesce(btrim(l.last_name), ''),
    nullif(btrim(l.first_name_en), ''), nullif(btrim(l.last_name_en), ''),
    case btrim(coalesce(l.status, ''))
      when 'طالب' then 'student' when 'طالبة' then 'student'
      when 'خريج' then 'graduate' when 'خريجة' then 'graduate'
      when 'موظف' then 'employee' when 'موظفة' then 'employee'
      when '' then null else 'other' end,
    (select u.id from public.universities u where u.name_ar = btrim(l.university)),
    (select m.id from public.majors m where m.name_ar = btrim(l.major) and m.parent_id is null),
    (select s.id from public.majors s join public.majors p on p.id = s.parent_id
      where s.name_ar = btrim(l.sub_major) and p.name_ar = btrim(l.major)),
    (select t.id from public.tracks t where t.name_ar = btrim(l.track)),
    nullif(btrim(l.bio), ''), nullif(btrim(l.bio_en), ''),
    case when l.portfolio_url ~ '^https://' then l.portfolio_url end,
    case when l.github_url ~ '^https://' then l.github_url end,
    case when l.linkedin_url ~ '^https://' then l.linkedin_url end,
    case when l.x_url ~ '^https://' then l.x_url end,
    true
  from public.members_legacy l
  where not exists (select 1 from public.members m where m.legacy_id = l.id);
  get diagnostics imported = row_count;
  return imported;
end;
$$;
revoke all on function private.import_legacy_members() from public, anon, authenticated;

-- Dry-run report: what the import would do, and the data-quality findings leadership fixes first (Q-026).
create or replace function private.legacy_import_preview()
returns table (check_name text, total integer)
language sql
stable
security definer
set search_path = ''
as $$
  select 'legacy rows', count(*)::integer from public.members_legacy
  union all select 'already imported', count(*)::integer from public.members m where m.legacy_id is not null
  union all select 'duplicate Arabic names', count(*)::integer from (
    select 1 from public.members_legacy group by btrim(first_name), btrim(last_name) having count(*) > 1) d
  union all select 'missing university', count(*)::integer from public.members_legacy where nullif(btrim(university), '') is null
  union all select 'non-https links dropped', count(*)::integer from public.members_legacy
    where (portfolio_url is not null and portfolio_url !~ '^https://') or (github_url is not null and github_url !~ '^https://')
       or (linkedin_url is not null and linkedin_url !~ '^https://') or (x_url is not null and x_url !~ '^https://')
$$;
revoke all on function private.legacy_import_preview() from public, anon, authenticated;

select private.import_legacy_members();

-- ------------------------------------------------------------------------------------------ 4. privacy: the public directory view
-- ME-1: active + opted-in members, public columns only. Compatibility aliases keep the unchanged public UI working.
create view public.member_directory as
select
  m.id, m.legacy_id,
  m.first_name_ar as first_name, m.last_name_ar as last_name, m.first_name_en, m.last_name_en,
  mj.name_ar as major, mj.name_en as major_en,
  sm.name_ar as sub_major, sm.name_en as sub_major_en,
  case m.academic_status when 'student' then 'طالب' when 'graduate' then 'خريج' when 'employee' then 'موظف' when 'other' then 'أخرى' end as status,
  case m.academic_status when 'student' then 'Student' when 'graduate' then 'Graduate' when 'employee' then 'Employee' when 'other' then 'Other' end as status_en,
  u.name_ar as university, u.name_en as university_en,
  t.name_ar as track, t.name_en as track_en,
  m.bio_ar as bio, m.bio_en,
  m.portfolio_url, m.x_url, m.linkedin_url, m.github_url, m.joined_at
from public.members m
left join public.majors mj on mj.id = m.major_id
left join public.majors sm on sm.id = m.sub_major_id
left join public.universities u on u.id = m.university_id
left join public.tracks t on t.id = m.track_id
where m.status = 'active' and m.is_directory_visible;
comment on view public.member_directory is 'Public directory (ME-1): active + visible members, public columns only.';
revoke all on public.member_directory from anon, authenticated;
grant select on public.member_directory to anon, authenticated;

-- ------------------------------------------------------------------------------------------ 5. RLS on members + claim tokens
alter table public.members enable row level security;
revoke all on table public.members from anon, authenticated;
grant select on table public.members to authenticated;
create policy members_select_own on public.members for select to authenticated using (user_id = (select auth.uid()));
create policy members_select_staff on public.members for select to authenticated
  using (private.has_permission('members.view') or private.has_permission('members.manage'));

create table public.member_claim_tokens (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.members (id) on delete cascade,
  email       text not null,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);
alter table public.member_claim_tokens enable row level security;
revoke all on table public.member_claim_tokens from anon, authenticated;
comment on table public.member_claim_tokens is 'ME-6: hashed one-time tokens. No client access; used only by the claim functions.';

-- The real "is this person an active member" check (replaces the Sprint 06/07 placeholders).
create or replace function private.is_active_member(p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select exists (select 1 from public.members where user_id = p_user and status = 'active') $$;

create or replace function private.applicant_is_member(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select exists (select 1 from public.members where user_id = p_user and status = 'active') $$;

-- ------------------------------------------------------------------------------------------ 6. member self-service and leadership actions
-- ME-2: a member edits profile fields and visibility only; names are theirs to correct, status and dates are not.
create or replace function public.update_my_member_profile(p jsonb)
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
  if not found then raise exception 'NOT_A_MEMBER' using errcode = 'P0001'; end if;
  if m.status <> 'active' then raise exception 'NOT_A_MEMBER' using errcode = 'P0001'; end if;
  update public.members set
    first_name_ar = coalesce(nullif(btrim(p ->> 'first_name_ar'), ''), first_name_ar),
    last_name_ar = coalesce(btrim(p ->> 'last_name_ar'), last_name_ar),
    first_name_en = nullif(btrim(p ->> 'first_name_en'), ''), last_name_en = nullif(btrim(p ->> 'last_name_en'), ''),
    academic_status = coalesce(nullif(p ->> 'academic_status', ''), academic_status),
    university_id = nullif(p ->> 'university_id', '')::smallint, major_id = nullif(p ->> 'major_id', '')::smallint,
    sub_major_id = nullif(p ->> 'sub_major_id', '')::smallint, track_id = nullif(p ->> 'track_id', '')::smallint,
    bio_ar = nullif(p ->> 'bio_ar', ''), bio_en = nullif(p ->> 'bio_en', ''),
    portfolio_url = nullif(p ->> 'portfolio_url', ''), github_url = nullif(p ->> 'github_url', ''),
    linkedin_url = nullif(p ->> 'linkedin_url', ''), x_url = nullif(p ->> 'x_url', ''),
    is_directory_visible = coalesce((p ->> 'is_directory_visible')::boolean, is_directory_visible)
  where id = m.id;
  perform private.write_audit('member.profile_updated', 'member', m.id::text, null,
    jsonb_build_object('visible', coalesce((p ->> 'is_directory_visible')::boolean, m.is_directory_visible)));
exception
  when check_violation or invalid_text_representation or foreign_key_violation then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
end;
$$;

-- A member can leave the community themselves; leadership suspends / reinstates / deactivates with a reason.
create or replace function public.set_member_status(p_id uuid, p_status text, p_reason text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  m public.members;
  own boolean;
  reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if p_status not in ('active', 'inactive', 'suspended') then raise exception 'VALIDATION_FAILED' using errcode = 'P0001'; end if;
  select * into m from public.members where id = p_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  own := m.user_id = caller;

  -- Leadership acts through members.manage; a member may only deactivate themselves ("leave the community").
  if not private.has_permission('members.manage') then
    if not (own and p_status = 'inactive' and m.status = 'active') then
      raise exception 'FORBIDDEN' using errcode = 'P0001';
    end if;
  end if;
  if m.status = p_status then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
  if p_status in ('suspended', 'active') and reason is null then raise exception 'REASON_REQUIRED' using errcode = 'P0001'; end if;

  update public.members
     set status = p_status, status_reason = reason,
         ended_at = case when p_status = 'active' then null else now() end,
         is_directory_visible = case when p_status = 'active' then is_directory_visible else false end
   where id = m.id;

  -- ME-5 / BR-MBR-011: leaving the active state ends the person's committee roles (reinstating does not restore them).
  if p_status <> 'active' and m.user_id is not null then
    update public.role_assignments ra
       set ends_at = now(), ended_by = caller, end_reason = left('Membership ' || p_status || coalesce(': ' || reason, ''), 500)
      from public.roles r
     where ra.user_id = m.user_id and r.key = ra.role_key and r.scope = 'committee'
       and ra.starts_at <= now() and (ra.ends_at is null or ra.ends_at > now());
  end if;

  perform private.write_audit('member.' || p_status, 'member', m.id::text, null,
    jsonb_build_object('from', m.status, 'reason', reason));
  return p_status;
end;
$$;

-- ------------------------------------------------------------------------------------------ 7. claim flow (legacy members)
create or replace function public.create_member_claim_token(p_member uuid, p_email text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  m public.members;
  v_token text;
  v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('members.manage') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+$' then raise exception 'NO_EMAIL' using errcode = 'P0001'; end if;
  select * into m from public.members where id = p_member for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if m.user_id is not null then raise exception 'ALREADY_LINKED' using errcode = 'P0001'; end if;

  -- A new invite replaces older unused ones for the same member.
  update public.member_claim_tokens set expires_at = now() where member_id = m.id and used_at is null and expires_at > now();
  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into public.member_claim_tokens (member_id, email, token_hash, expires_at, created_by)
  values (m.id, v_email, encode(sha256(convert_to(v_token, 'UTF8')), 'hex'), now() + interval '7 days', caller);
  update public.members set legacy_claim_email = v_email where id = m.id;
  perform private.write_audit('member.claim_invited', 'member', m.id::text, null, '{}'::jsonb);
  return v_token;
end;
$$;

-- What the claim page shows before the person confirms ("this is my profile").
create or replace function public.preview_member_claim(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  t public.member_claim_tokens;
  m public.members;
  mail text;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into t from public.member_claim_tokens where token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex');
  if not found or t.used_at is not null then raise exception 'TOKEN_INVALID' using errcode = 'P0001'; end if;
  if t.expires_at <= now() then raise exception 'TOKEN_EXPIRED' using errcode = 'P0001'; end if;
  select * into m from public.members where id = t.member_id;
  if m.user_id is not null then raise exception 'ALREADY_LINKED' using errcode = 'P0001'; end if;
  select lower(email) into mail from auth.users where id = caller;
  if mail is distinct from lower(t.email) then raise exception 'EMAIL_MISMATCH' using errcode = 'P0001'; end if;
  return jsonb_build_object('name_ar', btrim(m.first_name_ar || ' ' || m.last_name_ar),
                            'name_en', nullif(btrim(coalesce(m.first_name_en, '') || ' ' || coalesce(m.last_name_en, '')), ''));
end;
$$;

create or replace function public.claim_legacy_member(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  t public.member_claim_tokens;
  m public.members;
  mail text;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into t from public.member_claim_tokens
   where token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex') for update;
  if not found or t.used_at is not null then raise exception 'TOKEN_INVALID' using errcode = 'P0001'; end if;
  if t.expires_at <= now() then raise exception 'TOKEN_EXPIRED' using errcode = 'P0001'; end if;
  select * into m from public.members where id = t.member_id for update;
  if m.user_id is not null or exists (select 1 from public.members where user_id = caller) then
    raise exception 'ALREADY_LINKED' using errcode = 'P0001';
  end if;
  select lower(email) into mail from auth.users where id = caller;
  if mail is distinct from lower(t.email) then raise exception 'EMAIL_MISMATCH' using errcode = 'P0001'; end if;

  update public.members set user_id = caller where id = m.id;
  update public.member_claim_tokens set used_at = now() where id = t.id;
  perform private.write_audit('member.claimed', 'member', m.id::text, null, '{}'::jsonb);
  return m.id;
end;
$$;

-- ------------------------------------------------------------------------------------------ 8. review: claim, release and bulk decisions
create or replace function public.claim_membership_application(p_id uuid, p_release boolean default false)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  a public.membership_applications;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('membership.review') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  select * into a from public.membership_applications where id = p_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if p_release then
    if a.status <> 'under_review' or (a.reviewer_id is distinct from caller and not private.is_system_admin()) then
      raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
    end if;
    update public.membership_applications set status = 'submitted', reviewer_id = null where id = a.id;
  else
    if a.status = 'under_review' and a.reviewer_id is distinct from caller then raise exception 'ALREADY_CLAIMED' using errcode = 'P0001'; end if;
    if a.status not in ('submitted', 'under_review') then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
    update public.membership_applications set status = 'under_review', reviewer_id = caller where id = a.id;
  end if;
  perform private.write_audit('membership_application.' || case when p_release then 'released' else 'claimed' end,
    'membership_application', a.id::text, null, '{}'::jsonb);
end;
$$;

-- Accept / reject / waitlist, one transaction per application, per-id results (MB-6, MB-7, MB-8, MB-11).
create or replace function public.decide_membership_applications(p_ids uuid[], p_decision text, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  to_status text;
  rec record;
  results jsonb := '[]'::jsonb;
  code text;
  cap integer;
  accepted integer;
  existing uuid;
  v_member uuid;
  note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('membership.review') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  to_status := case p_decision when 'accept' then 'accepted' when 'reject' then 'rejected' when 'waitlist' then 'waitlisted' end;
  if to_status is null or coalesce(array_length(p_ids, 1), 0) not between 1 and 200 then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if note is not null and char_length(note) > 1000 then raise exception 'VALIDATION_FAILED' using errcode = 'P0001'; end if;

  -- lock the cycles in a stable order: capacity checks cannot race between reviewers
  perform 1 from public.membership_cycles
   where id in (select cycle_id from public.membership_applications where id = any (p_ids)) order by id for update;

  for rec in
    select a.* from public.membership_applications a where a.id = any (p_ids) order by a.submitted_at, a.id
  loop
    code := null;
    if rec.user_id = caller then
      code := 'SELF_DECISION';
    elsif rec.status not in ('submitted', 'under_review', 'waitlisted') then
      code := 'INVALID_TRANSITION';
    elsif rec.status = 'waitlisted' and to_status = 'waitlisted' then
      code := 'INVALID_TRANSITION';
    elsif rec.status = 'under_review' and rec.reviewer_id is distinct from caller and not private.is_system_admin() then
      code := 'ALREADY_CLAIMED';
    elsif to_status = 'accepted' then
      select capacity into cap from public.membership_cycles where id = rec.cycle_id;
      select count(*) into accepted from public.membership_applications where cycle_id = rec.cycle_id and status = 'accepted';
      if cap is not null and accepted >= cap then code := 'CAPACITY_REACHED'; end if;
    end if;

    if code is null then
      update public.membership_applications
         set status = to_status, decided_by = caller, decided_at = now(), decision_note = note, reviewer_id = coalesce(reviewer_id, caller)
       where id = rec.id;
      if to_status = 'accepted' then
        -- MB-8: exactly one member per person — create, or reactivate an existing record (never a duplicate).
        select id into existing from public.members where user_id = rec.user_id;
        if existing is not null then
          update public.members
             set status = 'active', status_reason = null, ended_at = null, joined_cycle_id = rec.cycle_id,
                 application_id = rec.id, is_directory_visible = rec.wants_directory_listing or is_directory_visible
           where id = existing returning id into v_member;
        else
          insert into public.members (
            user_id, status, joined_via, joined_cycle_id, application_id, first_name_ar, last_name_ar, first_name_en,
            academic_status, university_id, major_id, sub_major_id, track_id, bio_ar, bio_en,
            portfolio_url, github_url, linkedin_url, x_url, is_directory_visible
          ) values (
            rec.user_id, 'active', 'application', rec.cycle_id, rec.id,
            split_part(btrim(rec.full_name_ar), ' ', 1), btrim(substr(btrim(rec.full_name_ar), length(split_part(btrim(rec.full_name_ar), ' ', 1)) + 1)),
            nullif(btrim(rec.full_name_en), ''), rec.academic_status, rec.university_id, rec.major_id, rec.sub_major_id, rec.track_id,
            rec.bio_ar, rec.bio_en, rec.portfolio_url, rec.github_url, rec.linkedin_url, rec.x_url, rec.wants_directory_listing
          ) returning id into v_member;
        end if;
      end if;
      perform private.write_audit('membership_application.' || to_status, 'membership_application', rec.id::text, null,
        jsonb_build_object('cycle_id', rec.cycle_id, 'from', rec.status));
      results := results || jsonb_build_object('id', rec.id, 'ok', true, 'status', to_status);
    else
      results := results || jsonb_build_object('id', rec.id, 'ok', false, 'code', code);
    end if;
  end loop;

  select results || coalesce(jsonb_agg(jsonb_build_object('id', x, 'ok', false, 'code', 'NOT_FOUND')), '[]'::jsonb) into results
    from unnest(p_ids) x where not exists (select 1 from public.membership_applications where id = x);
  return results;
end;
$$;

-- Reviewers read the applicant's e-mail through the profile (owner rights, gated by the permission); the internal
-- decision note is included for reviewers only and is never part of the applicant's own view (MA-5).
create view public.membership_review_queue as
select a.id, a.cycle_id, a.user_id, a.status, a.full_name_ar, a.full_name_en, a.academic_status, a.university_id,
       a.major_id, a.track_id, a.preferred_committee_id, a.submitted_at, a.decided_at, a.reviewer_id, a.decision_note,
       a.wants_directory_listing, p.email
from public.membership_applications a
join public.profiles p on p.id = a.user_id
where private.has_permission('membership.review');
revoke all on public.membership_review_queue from anon, authenticated;
grant select on public.membership_review_queue to authenticated;

revoke all on function public.update_my_member_profile(jsonb) from public, anon;
revoke all on function public.set_member_status(uuid, text, text) from public, anon;
revoke all on function public.create_member_claim_token(uuid, text) from public, anon;
revoke all on function public.preview_member_claim(text) from public, anon;
revoke all on function public.claim_legacy_member(text) from public, anon;
revoke all on function public.claim_membership_application(uuid, boolean) from public, anon;
revoke all on function public.decide_membership_applications(uuid[], text, text) from public, anon;
grant execute on function public.update_my_member_profile(jsonb) to authenticated;
grant execute on function public.set_member_status(uuid, text, text) to authenticated;
grant execute on function public.create_member_claim_token(uuid, text) to authenticated;
grant execute on function public.preview_member_claim(text) to authenticated;
grant execute on function public.claim_legacy_member(text) to authenticated;
grant execute on function public.claim_membership_application(uuid, boolean) to authenticated;
grant execute on function public.decide_membership_applications(uuid[], text, text) to authenticated;
