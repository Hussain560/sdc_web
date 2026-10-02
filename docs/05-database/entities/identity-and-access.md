# Entities — Identity and Access

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft (Proposed) |

Classification (**Cls**): **P** public, **I** internal (signed-in staff in scope), **R** restricted (owner + authorized roles only).

## 1. `profiles`

One row per `auth.users` row, created by trigger `private.handle_new_user()` on `auth.users` insert (name from sign-up metadata). The user's email is mirrored and kept in sync by trigger on `auth.users` update so that authorized reviewers can read it through RLS without touching the `auth` schema.

| Column | Type | Null | Default / Constraint | Cls | Description |
| ------ | ---- | ---- | -------------------- | --- | ----------- |
| `id` | uuid | no | PK, FK → `auth.users(id)` ON DELETE CASCADE | I | Same id as the auth user |
| `email` | text | no | lowercased; synced from `auth.users` | R | Contact email |
| `full_name_ar` | text | no | 3–100 chars | I | Name as entered at sign-up (current rule: ≥ 3 words) |
| `full_name_en` | text | yes | ≤ 100 | I | Optional English name |
| `preferred_locale` | text | no | `'ar'`; CHECK in (`ar`,`en`) | I | Email and UI language |
| `avatar_path` | text | yes | storage path | P* | *Public only if the user is a visible member |
| `created_at`, `updated_at` | timestamptz | no | now() | I | — |

Indexes: PK; `lower(email)` unique.

RLS: user reads/updates own row (not `email`, not `id`); holders of `users.view` read all; holders of `registrations.review`/`membership.review` read rows of people in their scope (via the registration/application, through views). No insert/delete by clients (trigger/admin only).

## 2. `roles`

Seeded catalogue; changes by migration (or `system_admin` UI for display fields only).

| Column | Type | Null | Default / Constraint | Description |
| ------ | ---- | ---- | -------------------- | ----------- |
| `key` | text | no | PK, `^[a-z_]+$` | `system_admin`, `founder`, `community_leader`, `advisor`, `committee_head`, `committee_deputy`, `committee_member` |
| `name_ar`, `name_en` | text | no | — | Display names |
| `scope` | text | no | CHECK in (`global`,`committee`) | Whether an assignment needs a committee |
| `is_public_position` | boolean | no | false | Shown on the public leadership view |
| `display_order` | smallint | no | 0 | Ordering on the leadership view |
| `description_ar`, `description_en` | text | yes | — | — |

## 3. `permissions`

| Column | Type | Null | Constraint | Description |
| ------ | ---- | ---- | ---------- | ----------- |
| `key` | text | no | PK, `^[a-z_]+\.[a-z_]+$` | e.g., `events.approve` |
| `module` | text | no | — | Grouping in the admin UI |
| `description_ar`, `description_en` | text | no | — | — |

The catalogue is defined in [permission catalog](../../06-security/permission-catalog.md) and seeded by migration.

## 4. `role_permissions`

| Column | Type | Constraint |
| ------ | ---- | ---------- |
| `role_key` | text | FK → `roles(key)` ON DELETE CASCADE |
| `permission_key` | text | FK → `permissions(key)` ON DELETE CASCADE |
| | | PK (`role_key`, `permission_key`) |

## 5. `role_assignments`

The single source of truth for **positions** (who is founder, leader, committee head…) **and** for authorization.

| Column | Type | Null | Default / Constraint | Cls | Description |
| ------ | ---- | ---- | -------------------- | --- | ----------- |
| `id` | uuid | no | PK | I | — |
| `user_id` | uuid | no | FK → `profiles(id)` RESTRICT | I | Holder |
| `role_key` | text | no | FK → `roles(key)` | P (if public position) | Role |
| `committee_id` | uuid | yes | FK → `committees(id)` RESTRICT | P | Required iff `roles.scope = 'committee'` (trigger check) |
| `display_title_ar`, `display_title_en` | text | yes | ≤ 100 | P | Optional public title override (e.g., "Head of Projects") |
| `starts_at` | timestamptz | no | now() | P | Term start |
| `ends_at` | timestamptz | yes | CHECK `ends_at > starts_at` | P | Term end; null = open-ended |
| `assigned_by` | uuid | yes | FK → `profiles` | I | — |
| `ended_by`, `end_reason` | uuid, text | yes | — | I | — |
| `created_at`, `updated_at` | timestamptz | no | now() | I | — |

Constraints:

- `exclude using gist (role_key with =, tstzrange(starts_at, ends_at) with &&) where (role_key = 'community_leader')` — one leader at a time.
- `exclude using gist (committee_id with =, tstzrange(starts_at, ends_at) with &&) where (role_key = 'committee_head')` — one head per committee at a time.
- Trigger: committee-scoped roles require an **active member** (BR-ORG-004).
- Trigger: every insert/update/delete writes `audit_logs` (security-relevant).

Indexes: `(user_id)`, `(committee_id)`, `(role_key)`, partial `(user_id) where ends_at is null`.

Active assignment definition: `starts_at <= now() and (ends_at is null or ends_at > now())`.

## 6. Helper functions (schema `private`)

| Function | Returns | Purpose |
| -------- | ------- | ------- |
| `private.has_permission(p_permission text, p_committee uuid default null)` | boolean | True if the current user (`auth.uid()`) has an active assignment of a role granting `p_permission`, where the role is global **or** its committee equals `p_committee` |
| `private.has_permission_any_scope(p_permission text)` | boolean | True if granted in any scope (for listing pages) |
| `private.committees_with_permission(p_permission text)` | setof uuid | Committee ids where the user holds the permission (for RLS `committee_id in (...)`); returns all committees if granted globally |
| `private.is_active_member(p_user uuid default auth.uid())` | boolean | Active member record exists |

All are `stable`, `security definer`, `set search_path = ''`, owned by a role that can read the access tables, and **not** exposed via the Data API (schema `private` not in exposed schemas). Details: [RLS model](../rls-security-model.md).
