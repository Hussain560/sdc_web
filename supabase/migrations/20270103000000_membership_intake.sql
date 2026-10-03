-- Sprint 07 · MEM-001, MBR-001, MBR-002, MBR-003, MBR-005 — reference data, intake cycles, applications.
-- Authoritative design: docs/05-database/entities/membership.md, docs/05-database/entities/reference-data.md,
-- docs/11-modules/membership/README.md (rules MB-1…MB-11), docs/03-business-domain/membership-lifecycle.md.
-- Review/decision functions and the members table arrive in Sprint 08.

-- ------------------------------------------------------------------------------------------ 1. reference data
create table public.universities (
  id            smallint generated always as identity primary key,
  name_ar       text not null unique check (char_length(btrim(name_ar)) between 2 and 150),
  name_en       text check (char_length(name_en) <= 150),
  is_active     boolean not null default true,
  display_order smallint not null default 100
);
create table public.majors (
  id        smallint generated always as identity primary key,
  parent_id smallint references public.majors (id) on delete restrict,
  name_ar   text not null check (char_length(btrim(name_ar)) between 2 and 150),
  name_en   text check (char_length(name_en) <= 150),
  is_active boolean not null default true
);
create unique index majors_unique_name on public.majors (coalesce(parent_id, 0), name_ar);
create table public.tracks (
  id            smallint generated always as identity primary key,
  name_ar       text not null unique check (char_length(btrim(name_ar)) between 2 and 150),
  name_en       text check (char_length(name_en) <= 150),
  is_active     boolean not null default true,
  display_order smallint not null default 100
);

-- Seed 1: distinct values already present in the legacy members table (idempotent).
insert into public.universities (name_ar, name_en)
select btrim(university), max(nullif(btrim(university_en), ''))
from public.members where nullif(btrim(university), '') is not null group by btrim(university)
on conflict (name_ar) do nothing;
insert into public.majors (name_ar, name_en)
select btrim(major), max(nullif(btrim(major_en), ''))
from public.members where nullif(btrim(major), '') is not null group by btrim(major)
on conflict do nothing;
insert into public.tracks (name_ar, name_en)
select btrim(track), max(nullif(btrim(track_en), ''))
from public.members where nullif(btrim(track), '') is not null group by btrim(track)
on conflict (name_ar) do nothing;

-- Seed 2: sensible defaults (ASSUMPTION A-006 / Q-004 — editable by reference_data.manage).
insert into public.universities (name_ar, name_en, display_order) values
  ('جامعة الملك سعود', 'King Saud University', 10),
  ('جامعة الملك عبدالعزيز', 'King Abdulaziz University', 20),
  ('جامعة الإمام محمد بن سعود الإسلامية', 'Imam Mohammad Ibn Saud Islamic University', 30),
  ('جامعة الملك فهد للبترول والمعادن', 'King Fahd University of Petroleum and Minerals', 40),
  ('جامعة الأميرة نورة بنت عبدالرحمن', 'Princess Nourah bint Abdulrahman University', 50),
  ('جامعة الملك خالد', 'King Khalid University', 60),
  ('جامعة القصيم', 'Qassim University', 70),
  ('جامعة طيبة', 'Taibah University', 80),
  ('جامعة الملك فيصل', 'King Faisal University', 90),
  ('جامعة حائل', 'University of Hail', 100)
on conflict (name_ar) do nothing;
insert into public.majors (name_ar, name_en) values
  ('علوم الحاسب', 'Computer Science'), ('هندسة البرمجيات', 'Software Engineering'),
  ('نظم المعلومات', 'Information Systems'), ('تقنية المعلومات', 'Information Technology'),
  ('الأمن السيبراني', 'Cybersecurity'), ('الذكاء الاصطناعي', 'Artificial Intelligence'),
  ('علم البيانات', 'Data Science'), ('هندسة الحاسب', 'Computer Engineering')
on conflict do nothing;
insert into public.tracks (name_ar, name_en, display_order) values
  ('تطوير الويب', 'Web Development', 10), ('تطبيقات الجوال', 'Mobile Development', 20),
  ('الذكاء الاصطناعي', 'Artificial Intelligence', 30), ('الأمن السيبراني', 'Cybersecurity', 40),
  ('تحليل البيانات', 'Data Analysis', 50), ('تطوير الألعاب', 'Game Development', 60),
  ('الحوسبة السحابية وDevOps', 'Cloud & DevOps', 70), ('تجربة المستخدم والواجهات', 'UX / UI', 80)
on conflict (name_ar) do nothing;

alter table public.universities enable row level security;
alter table public.majors enable row level security;
alter table public.tracks enable row level security;
revoke all on table public.universities, public.majors, public.tracks from anon, authenticated;
grant select on table public.universities, public.majors, public.tracks to anon, authenticated;
grant insert, update on table public.universities, public.majors, public.tracks to authenticated;

do $$
declare t text;
begin
  foreach t in array array['universities', 'majors', 'tracks'] loop
    execute format('create policy %1$s_select on public.%1$s for select to anon, authenticated using (true)', t);
    execute format($p$create policy %1$s_insert on public.%1$s for insert to authenticated
                      with check (private.has_permission('reference_data.manage'))$p$, t);
    execute format($p$create policy %1$s_update on public.%1$s for update to authenticated
                      using (private.has_permission('reference_data.manage'))
                      with check (private.has_permission('reference_data.manage'))$p$, t);
  end loop;
end $$;

-- ------------------------------------------------------------------------------------------ 2. intake cycles
create table public.membership_cycles (
  id              uuid primary key default gen_random_uuid(),
  name_ar         text not null check (char_length(btrim(name_ar)) between 3 and 150),
  name_en         text check (char_length(name_en) <= 150),
  description_ar  text check (char_length(description_ar) <= 5000),
  description_en  text check (char_length(description_en) <= 5000),
  opens_at        timestamptz not null,
  closes_at       timestamptz not null,
  closed_early_at timestamptz,
  review_ends_at  timestamptz,
  capacity        integer check (capacity > 0),
  questions       jsonb not null default '[]'::jsonb check (jsonb_typeof(questions) = 'array'),
  status          text not null default 'draft' check (status in ('draft', 'published', 'completed')),
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint membership_cycles_window check (closes_at > opens_at),
  constraint membership_cycles_review check (review_ends_at is null or review_ends_at >= closes_at),
  -- MB-2 / BR-MBR-003: published cycles never overlap, so at most one cycle is open.
  constraint membership_cycles_no_overlap exclude using gist (tstzrange(opens_at, closes_at) with &&) where (status <> 'draft')
);
create trigger membership_cycles_touch before update on public.membership_cycles
  for each row execute function private.touch_updated_at();

-- Derived phase: the single source of truth for /join (no cron).
create or replace function private.cycle_phase(
  p_status text, p_opens timestamptz, p_closes timestamptz, p_early timestamptz, p_now timestamptz default now()
) returns text
language sql
stable
set search_path = ''
as $$
  select case
    when p_status = 'draft' then 'draft'
    when p_status = 'completed' then 'completed'
    when p_now < p_opens then 'scheduled'
    when p_now < least(p_closes, coalesce(p_early, p_closes)) then 'open'
    else 'closed'
  end
$$;
revoke all on function private.cycle_phase(text, timestamptz, timestamptz, timestamptz, timestamptz) from public;
grant execute on function private.cycle_phase(text, timestamptz, timestamptz, timestamptz, timestamptz) to anon, authenticated;

alter table public.membership_cycles enable row level security;
revoke all on table public.membership_cycles from anon, authenticated;
grant select on table public.membership_cycles to authenticated;
create policy cycles_select_managers on public.membership_cycles
  for select to authenticated using (private.has_permission('membership.manage_cycles'));

-- Public read model: published and completed cycles, public columns only (capacity and review date stay internal).
create view public.membership_cycle_phase as
select
  c.id, c.name_ar, c.name_en, c.description_ar, c.description_en, c.opens_at, c.closes_at, c.closed_early_at,
  least(c.closes_at, coalesce(c.closed_early_at, c.closes_at)) as effective_closes_at,
  c.questions, c.status,
  private.cycle_phase(c.status, c.opens_at, c.closes_at, c.closed_early_at) as phase
from public.membership_cycles c
where c.status in ('published', 'completed');
revoke all on public.membership_cycle_phase from anon, authenticated;
grant select on public.membership_cycle_phase to anon, authenticated;

-- ------------------------------------------------------------------------------------------ 3. applications
create table public.membership_applications (
  id                      uuid primary key default gen_random_uuid(),
  cycle_id                uuid not null references public.membership_cycles (id) on delete restrict,
  user_id                 uuid not null references public.profiles (id) on delete restrict,
  status                  text not null default 'submitted'
                            check (status in ('submitted', 'under_review', 'accepted', 'rejected', 'waitlisted', 'withdrawn')),
  full_name_ar            text not null check (char_length(btrim(full_name_ar)) between 3 and 100),
  full_name_en            text check (char_length(full_name_en) <= 100),
  phone                   text check (phone ~ '^\+?[0-9]{8,15}$'),
  academic_status         text not null check (academic_status in ('student', 'graduate', 'employee', 'other')),
  university_id           smallint references public.universities (id),
  major_id                smallint references public.majors (id),
  sub_major_id            smallint references public.majors (id),
  track_id                smallint references public.tracks (id),
  preferred_committee_id  uuid references public.committees (id),
  bio_ar                  text check (char_length(bio_ar) <= 1000),
  bio_en                  text check (char_length(bio_en) <= 1000),
  portfolio_url           text check (portfolio_url ~ '^https://'),
  github_url              text check (github_url ~ '^https://'),
  linkedin_url            text check (linkedin_url ~ '^https://'),
  x_url                   text check (x_url ~ '^https://'),
  answers                 jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  wants_directory_listing boolean not null default false,
  consent_at              timestamptz not null default now(),
  consent_version         text not null,
  submitted_at            timestamptz not null default now(),
  reviewer_id             uuid references public.profiles (id) on delete set null,
  decided_by              uuid references public.profiles (id) on delete set null,
  decided_at              timestamptz,
  decision_note           text check (char_length(decision_note) <= 1000),
  withdrawn_at            timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint membership_applications_one_per_cycle unique (cycle_id, user_id)
);
create index membership_applications_cycle_status_idx on public.membership_applications (cycle_id, status);
create index membership_applications_user_idx on public.membership_applications (user_id);
create trigger membership_applications_touch before update on public.membership_applications
  for each row execute function private.touch_updated_at();

alter table public.membership_applications enable row level security;
revoke all on table public.membership_applications from anon, authenticated;
grant select on table public.membership_applications to authenticated;
create policy applications_select_own on public.membership_applications
  for select to authenticated using (user_id = (select auth.uid()));
create policy applications_select_reviewers on public.membership_applications
  for select to authenticated using (private.has_permission('membership.review'));

-- Applicants and reviewers never read the internal decision note through the applicant's own view (MA-5):
-- the column is simply not granted to the owner-facing select path used by the app (see my_membership_application).
create view public.my_membership_application as
select
  a.id, a.cycle_id, a.status, a.full_name_ar, a.full_name_en, a.phone, a.academic_status, a.university_id,
  a.major_id, a.sub_major_id, a.track_id, a.preferred_committee_id, a.bio_ar, a.bio_en, a.portfolio_url,
  a.github_url, a.linkedin_url, a.x_url, a.answers, a.wants_directory_listing, a.submitted_at, a.decided_at,
  a.withdrawn_at, a.updated_at
from public.membership_applications a
where a.user_id = (select auth.uid());
revoke all on public.my_membership_application from anon, authenticated;
grant select on public.my_membership_application to authenticated;

create view public.membership_cycle_counts with (security_invoker = true) as
select cycle_id, status, count(*)::integer as total from public.membership_applications group by cycle_id, status;
revoke all on public.membership_cycle_counts from anon;
grant select on public.membership_cycle_counts to authenticated;

-- Placeholder replaced in Sprint 08 (members table): nobody is a member yet in the new model.
create or replace function private.applicant_is_member(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select false $$;
revoke all on function private.applicant_is_member(uuid) from public;
grant execute on function private.applicant_is_member(uuid) to authenticated;

-- ------------------------------------------------------------------------------------------ 4. cycle write paths
create or replace function private.validate_questions(p_questions jsonb)
returns void
language plpgsql
immutable
set search_path = ''
as $$
declare
  q jsonb;
  keys text[] := '{}';
begin
  if jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) > 10 then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  for q in select * from jsonb_array_elements(p_questions) loop
    if jsonb_typeof(q) <> 'object'
       or coalesce(q ->> 'key', '') !~ '^[a-z][a-z0-9_]{0,31}$'
       or (q ->> 'key') = any (keys)
       or coalesce(q ->> 'type', '') not in ('text', 'long_text', 'single_choice', 'multi_choice')
       or char_length(btrim(coalesce(q ->> 'label_ar', ''))) < 2
       or char_length(coalesce(q ->> 'label_ar', '')) > 200
       or char_length(coalesce(q ->> 'label_en', '')) > 200
       or (q ->> 'type' in ('single_choice', 'multi_choice')
           and (jsonb_typeof(q -> 'options') <> 'array' or jsonb_array_length(q -> 'options') not between 2 and 12)) then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    keys := keys || (q ->> 'key');
  end loop;
end;
$$;

create or replace function public.save_membership_cycle(p_id uuid, p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  c public.membership_cycles;
  v_opens timestamptz;
  v_closes timestamptz;
  v_review timestamptz;
  v_questions jsonb;
  v_id uuid;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('membership.manage_cycles') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;

  begin
    v_opens := (p ->> 'opens_at')::timestamptz;
    v_closes := (p ->> 'closes_at')::timestamptz;
    v_review := nullif(p ->> 'review_ends_at', '')::timestamptz;
  exception when others then
    raise exception 'INVALID_DATES' using errcode = 'P0001';
  end;
  if v_opens is null or v_closes is null or v_closes <= v_opens or (v_review is not null and v_review < v_closes) then
    raise exception 'INVALID_DATES' using errcode = 'P0001';
  end if;
  v_questions := coalesce(p -> 'questions', '[]'::jsonb);
  perform private.validate_questions(v_questions);

  if p_id is null then
    insert into public.membership_cycles (name_ar, name_en, description_ar, description_en, opens_at, closes_at,
                                          review_ends_at, capacity, questions, created_by)
    values (btrim(p ->> 'name_ar'), nullif(btrim(p ->> 'name_en'), ''), nullif(p ->> 'description_ar', ''),
            nullif(p ->> 'description_en', ''), v_opens, v_closes, v_review,
            nullif(p ->> 'capacity', '')::integer, v_questions, caller)
    returning id into v_id;
    perform private.write_audit('membership_cycle.created', 'membership_cycle', v_id::text, null, '{}'::jsonb);
    return jsonb_build_object('id', v_id);
  end if;

  select * into c from public.membership_cycles where id = p_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if c.status = 'completed' then raise exception 'NOT_EDITABLE' using errcode = 'P0001'; end if;
  if c.status = 'published'
     and private.cycle_phase(c.status, c.opens_at, c.closes_at, c.closed_early_at) <> 'scheduled'
     and (v_opens <> c.opens_at or v_closes <> c.closes_at) then
    raise exception 'NOT_EDITABLE' using errcode = 'P0001'; -- a running window changes only through extend / close early
  end if;
  if v_questions <> c.questions and exists (select 1 from public.membership_applications where cycle_id = c.id) then
    raise exception 'QUESTIONS_LOCKED' using errcode = 'P0001'; -- MB / edge case 6
  end if;

  update public.membership_cycles
     set name_ar = btrim(p ->> 'name_ar'), name_en = nullif(btrim(p ->> 'name_en'), ''),
         description_ar = nullif(p ->> 'description_ar', ''), description_en = nullif(p ->> 'description_en', ''),
         opens_at = v_opens, closes_at = v_closes, review_ends_at = v_review,
         capacity = nullif(p ->> 'capacity', '')::integer, questions = v_questions
   where id = c.id;
  perform private.write_audit('membership_cycle.updated', 'membership_cycle', c.id::text, null, '{}'::jsonb);
  return jsonb_build_object('id', c.id);
exception
  when exclusion_violation then raise exception 'CYCLE_OVERLAP' using errcode = 'P0001';
  when check_violation then raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  when invalid_text_representation then raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
end;
$$;

create or replace function public.transition_membership_cycle(p_id uuid, p_action text, p_closes_at timestamptz default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  c public.membership_cycles;
  phase text;
  pending integer;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  if not private.has_permission('membership.manage_cycles') then raise exception 'FORBIDDEN' using errcode = 'P0001'; end if;
  select * into c from public.membership_cycles where id = p_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  phase := private.cycle_phase(c.status, c.opens_at, c.closes_at, c.closed_early_at);

  case p_action
    when 'publish' then
      if c.status <> 'draft' then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
      update public.membership_cycles set status = 'published' where id = c.id;
    when 'unpublish' then
      if phase <> 'scheduled' or exists (select 1 from public.membership_applications where cycle_id = c.id) then
        raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
      end if;
      update public.membership_cycles set status = 'draft' where id = c.id;
    when 'open_now' then
      if phase not in ('draft', 'scheduled') then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
      if c.closes_at <= now() then raise exception 'INVALID_DATES' using errcode = 'P0001'; end if;
      update public.membership_cycles set status = 'published', opens_at = now() where id = c.id;
    when 'extend' then
      if phase not in ('open', 'closed') then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
      if p_closes_at is null or p_closes_at <= now() or p_closes_at <= c.closes_at then
        raise exception 'INVALID_DATES' using errcode = 'P0001';
      end if;
      update public.membership_cycles set closes_at = p_closes_at, closed_early_at = null where id = c.id;
    when 'close_early' then
      if phase <> 'open' then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
      update public.membership_cycles set closed_early_at = now() where id = c.id;
    when 'complete' then
      if phase <> 'closed' then raise exception 'INVALID_TRANSITION' using errcode = 'P0001'; end if;
      select count(*) into pending from public.membership_applications
       where cycle_id = c.id and status in ('submitted', 'under_review');
      if pending > 0 then raise exception 'PENDING_APPLICATIONS' using errcode = 'P0001'; end if;
      update public.membership_applications
         set status = 'rejected', decided_at = now(), decided_by = caller, decision_note = 'Cycle completed'
       where cycle_id = c.id and status = 'waitlisted';
      update public.membership_cycles set status = 'completed' where id = c.id;
    when 'delete' then
      if c.status <> 'draft' or exists (select 1 from public.membership_applications where cycle_id = c.id) then
        raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
      end if;
      delete from public.membership_cycles where id = c.id;
      perform private.write_audit('membership_cycle.deleted', 'membership_cycle', c.id::text, null, '{}'::jsonb);
      return 'deleted';
    else
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end case;

  perform private.write_audit('membership_cycle.' || p_action, 'membership_cycle', c.id::text, null,
    jsonb_build_object('from', phase));
  select private.cycle_phase(status, opens_at, closes_at, closed_early_at) into phase
    from public.membership_cycles where id = c.id;
  return phase;
exception
  when exclusion_violation then raise exception 'CYCLE_OVERLAP' using errcode = 'P0001';
end;
$$;

-- ------------------------------------------------------------------------------------------ 5. applicant write paths
-- Shared validation of the fixed fields and of the answers against the cycle's questions (MB-9, MB-10).
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
  if char_length(btrim(coalesce(p ->> 'full_name_ar', ''))) not between 3 and 100
     or coalesce(p ->> 'academic_status', '') not in ('student', 'graduate', 'employee', 'other')
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

create or replace function public.submit_membership_application(p_cycle uuid, p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  confirmed timestamptz;
  c public.membership_cycles;
  existing public.membership_applications;
  v_id uuid;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select email_confirmed_at into confirmed from auth.users where id = caller;
  if confirmed is null then raise exception 'EMAIL_NOT_CONFIRMED' using errcode = 'P0001'; end if;

  select * into c from public.membership_cycles where id = p_cycle and status = 'published';
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  -- MB-1: the database clock decides, not the browser.
  if private.cycle_phase(c.status, c.opens_at, c.closes_at, c.closed_early_at) <> 'open' then
    raise exception 'CYCLE_CLOSED' using errcode = 'P0001';
  end if;
  if private.applicant_is_member(caller) then raise exception 'ALREADY_MEMBER' using errcode = 'P0001'; end if;
  if coalesce(btrim(p ->> 'consent_version'), '') = '' or coalesce((p ->> 'consent')::boolean, false) is not true then
    raise exception 'CONSENT_REQUIRED' using errcode = 'P0001';
  end if;
  perform private.validate_application(p, c.questions);

  select * into existing from public.membership_applications where cycle_id = c.id and user_id = caller for update;
  if found and existing.status <> 'withdrawn' then raise exception 'ALREADY_APPLIED' using errcode = 'P0001'; end if;

  if found then
    update public.membership_applications set
      status = 'submitted', withdrawn_at = null, submitted_at = now(), consent_at = now(),
      full_name_ar = btrim(p ->> 'full_name_ar'), full_name_en = nullif(btrim(p ->> 'full_name_en'), ''),
      phone = nullif(p ->> 'phone', ''), academic_status = p ->> 'academic_status',
      university_id = nullif(p ->> 'university_id', '')::smallint, major_id = nullif(p ->> 'major_id', '')::smallint,
      sub_major_id = nullif(p ->> 'sub_major_id', '')::smallint, track_id = nullif(p ->> 'track_id', '')::smallint,
      preferred_committee_id = nullif(p ->> 'preferred_committee_id', '')::uuid,
      bio_ar = nullif(p ->> 'bio_ar', ''), bio_en = nullif(p ->> 'bio_en', ''),
      portfolio_url = nullif(p ->> 'portfolio_url', ''), github_url = nullif(p ->> 'github_url', ''),
      linkedin_url = nullif(p ->> 'linkedin_url', ''), x_url = nullif(p ->> 'x_url', ''),
      answers = coalesce(p -> 'answers', '{}'::jsonb),
      wants_directory_listing = coalesce((p ->> 'wants_directory_listing')::boolean, false),
      consent_version = p ->> 'consent_version'
    where id = existing.id returning id into v_id;
  else
    insert into public.membership_applications (
      cycle_id, user_id, full_name_ar, full_name_en, phone, academic_status, university_id, major_id, sub_major_id,
      track_id, preferred_committee_id, bio_ar, bio_en, portfolio_url, github_url, linkedin_url, x_url, answers,
      wants_directory_listing, consent_version
    ) values (
      c.id, caller, btrim(p ->> 'full_name_ar'), nullif(btrim(p ->> 'full_name_en'), ''), nullif(p ->> 'phone', ''),
      p ->> 'academic_status', nullif(p ->> 'university_id', '')::smallint, nullif(p ->> 'major_id', '')::smallint,
      nullif(p ->> 'sub_major_id', '')::smallint, nullif(p ->> 'track_id', '')::smallint,
      nullif(p ->> 'preferred_committee_id', '')::uuid, nullif(p ->> 'bio_ar', ''), nullif(p ->> 'bio_en', ''),
      nullif(p ->> 'portfolio_url', ''), nullif(p ->> 'github_url', ''), nullif(p ->> 'linkedin_url', ''),
      nullif(p ->> 'x_url', ''), coalesce(p -> 'answers', '{}'::jsonb),
      coalesce((p ->> 'wants_directory_listing')::boolean, false), p ->> 'consent_version'
    ) returning id into v_id;
  end if;

  perform private.write_audit('membership_application.submitted', 'membership_application', v_id::text, null,
    jsonb_build_object('cycle_id', c.id));
  return jsonb_build_object('id', v_id);
exception
  when check_violation or invalid_text_representation or foreign_key_violation or numeric_value_out_of_range then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
end;
$$;

create or replace function public.update_membership_application(p_id uuid, p jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  a public.membership_applications;
  c public.membership_cycles;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into a from public.membership_applications where id = p_id and user_id = caller for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  select * into c from public.membership_cycles where id = a.cycle_id;
  if a.status <> 'submitted' then raise exception 'NOT_EDITABLE' using errcode = 'P0001'; end if;
  if private.cycle_phase(c.status, c.opens_at, c.closes_at, c.closed_early_at) <> 'open' then
    raise exception 'CYCLE_CLOSED' using errcode = 'P0001';
  end if;
  perform private.validate_application(p, c.questions);
  update public.membership_applications set
    full_name_ar = btrim(p ->> 'full_name_ar'), full_name_en = nullif(btrim(p ->> 'full_name_en'), ''),
    phone = nullif(p ->> 'phone', ''), academic_status = p ->> 'academic_status',
    university_id = nullif(p ->> 'university_id', '')::smallint, major_id = nullif(p ->> 'major_id', '')::smallint,
    sub_major_id = nullif(p ->> 'sub_major_id', '')::smallint, track_id = nullif(p ->> 'track_id', '')::smallint,
    preferred_committee_id = nullif(p ->> 'preferred_committee_id', '')::uuid,
    bio_ar = nullif(p ->> 'bio_ar', ''), bio_en = nullif(p ->> 'bio_en', ''),
    portfolio_url = nullif(p ->> 'portfolio_url', ''), github_url = nullif(p ->> 'github_url', ''),
    linkedin_url = nullif(p ->> 'linkedin_url', ''), x_url = nullif(p ->> 'x_url', ''),
    answers = coalesce(p -> 'answers', '{}'::jsonb),
    wants_directory_listing = coalesce((p ->> 'wants_directory_listing')::boolean, false)
  where id = a.id;
  perform private.write_audit('membership_application.updated', 'membership_application', a.id::text, null, '{}'::jsonb);
exception
  when check_violation or invalid_text_representation or foreign_key_violation or numeric_value_out_of_range then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
end;
$$;

create or replace function public.withdraw_membership_application(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  a public.membership_applications;
  c public.membership_cycles;
begin
  if caller is null then raise exception 'UNAUTHENTICATED' using errcode = 'P0001'; end if;
  select * into a from public.membership_applications where id = p_id and user_id = caller for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  select * into c from public.membership_cycles where id = a.cycle_id;
  if a.status <> 'submitted'
     or private.cycle_phase(c.status, c.opens_at, c.closes_at, c.closed_early_at) <> 'open' then
    raise exception 'NOT_EDITABLE' using errcode = 'P0001'; -- MB-5
  end if;
  update public.membership_applications set status = 'withdrawn', withdrawn_at = now() where id = a.id;
  perform private.write_audit('membership_application.withdrawn', 'membership_application', a.id::text, null, '{}'::jsonb);
end;
$$;

revoke all on function public.save_membership_cycle(uuid, jsonb) from public, anon;
revoke all on function public.transition_membership_cycle(uuid, text, timestamptz) from public, anon;
revoke all on function public.submit_membership_application(uuid, jsonb) from public, anon;
revoke all on function public.update_membership_application(uuid, jsonb) from public, anon;
revoke all on function public.withdraw_membership_application(uuid) from public, anon;
grant execute on function public.save_membership_cycle(uuid, jsonb) to authenticated;
grant execute on function public.transition_membership_cycle(uuid, text, timestamptz) to authenticated;
grant execute on function public.submit_membership_application(uuid, jsonb) to authenticated;
grant execute on function public.update_membership_application(uuid, jsonb) to authenticated;
grant execute on function public.withdraw_membership_application(uuid) to authenticated;
