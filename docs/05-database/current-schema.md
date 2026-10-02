# Current Schema (As-Is)

| Field            | Value      |
| ---------------- | ---------- |
| **Snapshot**     | 2026-10-02, local stack `supabase_db_sdc_web` |
| **Status**       | Draft      |

Source: `supabase/seed_tables.sql` (DDL + sample data), verified against `information_schema`, `pg_constraint`, `pg_indexes`, `pg_policies` and table grants.

## 1. DDL (effective)

```sql
create table public.members (
  id            serial primary key,
  first_name    varchar(100),  last_name     varchar(100),
  first_name_en varchar(100),  last_name_en  varchar(100),
  major         varchar(100),  major_en      varchar(100),
  sub_major     varchar(100),  sub_major_en  varchar(100),
  status        varchar(100),  status_en     varchar(100),   -- academic status: طالب/خريج/موظف
  university    varchar(150),  university_en varchar(150),
  track         varchar(100),  track_en      varchar(100),
  bio           text,          bio_en        text,
  portfolio_url text, x_url text, linkedin_url text, github_url text,
  created_at    timestamptz default now()
);

create table public.event_registrations (
  id         serial primary key,
  user_id    uuid,                          -- no FK to auth.users
  event_id   integer not null,              -- refers to ids hardcoded in JS
  full_name  varchar(150),
  email      varchar(150),
  status     varchar(50) default 'pending', -- values used: pending | accepted | rejected
  created_at timestamptz default now()
);

alter table public.members enable row level security;
alter table public.event_registrations enable row level security;

create policy "Allow read members"          on public.members for select using (true);
create policy "Allow write members"         on public.members for all    using (true);
create policy "Allow read registrations"    on public.event_registrations for select using (true);
create policy "Allow insert registrations"  on public.event_registrations for insert with check (true);
create policy "Allow update registrations"  on public.event_registrations for update using (true);
```

Grants: `anon` and `authenticated` hold `SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER` on both tables (Supabase defaults).

## 2. Problems

| # | Problem | Consequence |
| - | ------- | ----------- |
| 1 | Open write policies for `public` (includes `anon`) | Data tampering/deletion by anyone (Critical) |
| 2 | Registrations readable by anyone | Personal data exposure (Critical) |
| 3 | No FKs | Orphans; `event_id` meaningless outside JS |
| 4 | No unique `(event_id, user_id)` | Duplicate registrations |
| 5 | `status` unconstrained (two different meanings: academic status on `members`, workflow on registrations) | Invalid values; confusing naming |
| 6 | Bilingual free text for taxonomy | Inconsistent filters ("King Saud University" vs typos); duplicated translation |
| 7 | `members` unlinked to accounts | Members cannot own/edit profiles; cannot tell members from visitors except by name match |
| 8 | Integer serial ids exposed in URLs | Enumerable; acceptable for public directory but not for private records |
| 9 | No `updated_at`, no actor columns | No traceability |
| 10 | Schema only in a destructive seed script; no migrations | Environments drift; production schema unknown |

The remote project's schema may differ (**OPEN Q-025**). Before Phase 1, dump it (`supabase db dump --linked --schema public`) and record differences here.
