-- Baseline of the LEGACY schema (Sprint 02 · DB-002).
--
-- Reconstructed from the repository (types + the former seed_tables.sql). It must be compared with the
-- remote dump when the owner runs the production inspection (Sprint 00 · FND-003, currently deferred);
-- adjust here BEFORE the first shared environment applies it, then `supabase migration repair --status applied`.
--
-- NOTE: this reproduces the open legacy policies on purpose (they exist in production per the audit,
-- docs/01-project/current-system-audit.md). They are replaced by owner-scoped policies in the
-- containment / RBAC migrations; pgTAP regression tests for that live in supabase/tests/.

create table if not exists public.members (
  id            serial primary key,
  first_name    varchar(100),
  last_name     varchar(100),
  first_name_en varchar(100),
  last_name_en  varchar(100),
  major         varchar(100),
  major_en      varchar(100),
  sub_major     varchar(100),
  sub_major_en  varchar(100),
  status        varchar(100),
  status_en     varchar(100),
  university    varchar(150),
  university_en varchar(150),
  track         varchar(100),
  track_en      varchar(100),
  bio           text,
  bio_en        text,
  portfolio_url text,
  x_url         text,
  linkedin_url  text,
  github_url    text,
  created_at    timestamptz default now()
);

create table if not exists public.event_registrations (
  id         serial primary key,
  user_id    uuid,
  event_id   integer not null,
  full_name  varchar(150),
  email      varchar(150),
  status     varchar(50) default 'pending',
  created_at timestamptz default now()
);

alter table public.members enable row level security;
alter table public.event_registrations enable row level security;

drop policy if exists "Allow read members" on public.members;
create policy "Allow read members" on public.members for select using (true);
drop policy if exists "Allow write members" on public.members;
create policy "Allow write members" on public.members for all using (true);

drop policy if exists "Allow read registrations" on public.event_registrations;
create policy "Allow read registrations" on public.event_registrations for select using (true);
drop policy if exists "Allow insert registrations" on public.event_registrations;
create policy "Allow insert registrations" on public.event_registrations for insert with check (true);
drop policy if exists "Allow update registrations" on public.event_registrations;
create policy "Allow update registrations" on public.event_registrations for update using (true);
