# Database Conventions

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## 1. Naming

| Object | Convention | Example |
| ------ | ---------- | ------- |
| Schema | `public` for API-exposed tables; `private` for helper functions/tables never exposed via the Data API | `private.has_permission()` |
| Table | `snake_case`, plural | `event_registrations` |
| Column | `snake_case`, singular | `committee_id` |
| Primary key | `id` | — |
| Foreign key column | `<referenced_singular>_id` | `event_id` |
| Bilingual columns | `<name>_ar` (required where content is required), `<name>_en` | `title_ar`, `title_en` |
| Timestamps | `<verb>_at`, `timestamptz` | `published_at` |
| Actor columns | `<verb>_by` → `profiles(id)` | `decided_by` |
| Booleans | `is_` / `has_` / `requires_` prefix | `is_directory_visible` |
| Indexes | `<table>_<columns>_idx`; unique `<table>_<columns>_key` | `event_registrations_event_id_status_idx` |
| Constraints | `<table>_<column>_check`, `<table>_<column>_fkey` (Postgres defaults) | — |
| Functions | verb-first `snake_case` | `decide_membership_application` |
| Policies | `"<role>: <action> <scope>"` in plain English | `"reviewers: update registrations in scope"` |
| Migrations | `YYYYMMDDHHMMSS_<verb>_<object>.sql` (Supabase CLI) | `20261015120000_create_events.sql` |

## 2. Types

| Data | Type | Notes |
| ---- | ---- | ----- |
| Primary keys | `uuid default gen_random_uuid()` | Non-enumerable. Reference/lookup tables may use `smallint generated always as identity` or a `text` key. |
| Legacy ids | `legacy_id integer unique` | Kept on migrated rows for redirects (`/events/2` → slug) |
| Text | `text` + `CHECK (char_length(x) <= n)` | No `varchar(n)` |
| Status / enumerations | `text` + `CHECK (x in (...))` | Easier to evolve than Postgres `enum` (KFUCS practice); labels live in i18n catalogues |
| Date-times | `timestamptz` (UTC) | Display in Asia/Riyadh |
| Dates without time | `date` | e.g., `joined_on` if needed |
| Money | — | Not applicable (non-profit, no payments) |
| Flexible structured content | `jsonb` with `CHECK (jsonb_typeof(x) = 'object'/'array')` + Zod schema in the app | Only for rendered-as-a-whole content (event detail lists, cycle questions) — never for data that is filtered, joined or permission-checked |
| URLs | `text CHECK (x ~ '^https://')` | — |
| Emails | `text` (lowercased) | Validation in app; Auth is source of truth |

## 3. Standard columns

Every business table has:

```sql
created_at  timestamptz not null default now(),
updated_at  timestamptz not null default now(),   -- maintained by trigger private.set_updated_at()
created_by  uuid references public.profiles(id)   -- where an actor creates the row
```

Lifecycle tables add the actor/time pairs for each transition (`submitted_by/at`, `decided_by/at`, `published_at`, `cancelled_at` + `cancel_reason`).

## 4. Deletion policy

| Data | Policy |
| ---- | ------ |
| Entities with history (committees, events, articles, members, cycles, applications, registrations) | **No hard delete** once referenced or past draft. Use status (`inactive`, `cancelled`, `archived`, `withdrawn`). FKs use `ON DELETE RESTRICT`. |
| Never-published drafts | Hard delete allowed |
| Join rows (`article_tags`) | Hard delete |
| Account deletion (privacy request) | Profile anonymized; registrations/applications keep snapshot fields replaced by "Deleted user" per retention rules (**OPEN Q-031**) |
| `auth.users` → `profiles` | `ON DELETE CASCADE` only for `profiles`; everything else references `profiles` with `RESTRICT`/`SET NULL` as documented per entity |

## 5. Indexing strategy

| Rule | Example |
| ---- | ------- |
| Every FK column is indexed | `event_registrations(event_id)` |
| Columns used in RLS predicates are indexed | `role_assignments(user_id)`, `events(committee_id)` |
| Composite indexes match the dominant filter + sort | `events(status, starts_at desc)` |
| Partial indexes for hot subsets | `events(starts_at) where status = 'published'` |
| Unique constraints express business uniqueness | `event_registrations(event_id, user_id)` |
| Exclusion constraints for non-overlap rules | one open intake cycle; one active committee head (requires `btree_gist`) |
| No speculative indexes | Add with evidence (`EXPLAIN ANALYZE`) — data volume is small (hundreds–thousands of rows) |

## 6. Audit

Business actions are recorded in `audit_logs` ([platform entities](./entities/platform.md)) by the domain functions and Server Actions that perform them — not by generic row triggers on every table (too noisy for reports, insufficient for intent). Exception: `role_assignments` changes are audited by trigger (security-relevant, must not be bypassable).

## 7. Comments

Every table and non-obvious column has a `comment on …` describing meaning and classification (`public` / `internal` / `restricted`, see [data protection](../06-security/data-protection-and-privacy.md)).
