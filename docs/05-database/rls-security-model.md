# RLS Security Model

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft (Proposed) |

## 1. Principles

1. **RLS is the authorization boundary for data.** Every table in `public` has RLS enabled and explicit policies. A missing policy means "denied".
2. **Least privilege grants as well as policies.** Revoke Supabase's default broad grants and grant only the operations each API role needs (defense in depth; e.g., no direct `INSERT` on `event_registrations` — inserts go through a function).
3. **Writes that change lifecycle state go through functions**, not direct `UPDATE`, so transition guards cannot be skipped.
4. **Public read models are views** exposing only public columns (`security_invoker = true` so the caller's RLS still applies to base tables, combined with public-read policies on the needed rows/columns).
5. **Helper functions live in schema `private`**, which is not exposed through the Data API.

## 2. Permission check helper (reference implementation sketch)

```sql
create schema if not exists private;

create or replace function private.has_permission(
  p_permission text,
  p_committee  uuid default null
) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.role_assignments ra
    join public.roles r            on r.key = ra.role_key
    join public.role_permissions rp on rp.role_key = ra.role_key
    where ra.user_id = (select auth.uid())
      and rp.permission_key = p_permission
      and ra.starts_at <= now()
      and (ra.ends_at is null or ra.ends_at > now())
      and (r.scope = 'global' or ra.committee_id = p_committee)
  );
$$;

revoke all on function private.has_permission(text, uuid) from public;
grant execute on function private.has_permission(text, uuid) to authenticated;
```

Performance notes (Supabase RLS guidance): wrap `auth.uid()` in `(select …)` so it is evaluated once per statement; index `role_assignments(user_id)`; keep helpers `stable`; prefer `committee_id in (select private.committees_with_permission('…'))` over per-row function calls on large tables.

## 3. Policy matrix (target)

Legend: ✅ allowed · ⛔ denied · *scope* = in the committee(s) where the user holds the permission (or globally) · *fn* = only via domain function.

| Table | anon SELECT | authenticated SELECT | INSERT | UPDATE | DELETE |
| ----- | ----------- | -------------------- | ------ | ------ | ------ |
| `profiles` | ⛔ | own; `users.view`; reviewers via views | trigger only | own (limited cols) | ⛔ |
| `roles`, `permissions`, `role_permissions` | ✅ (public positions only for roles) | ✅ | ⛔ (migration) | `roles.manage` (display fields) | ⛔ |
| `role_assignments` | public positions via `current_positions` view | own; `roles.view` | fn `assign_role` (`roles.assign` + anti-escalation) | fn | ⛔ |
| `committees` | active | active; all with `committees.manage` | `committees.manage` | `committees.manage` | ⛔ |
| `membership_cycles` | published/completed | same; all with `membership.manage_cycles` | `membership.manage_cycles` | same | draft only |
| `membership_applications` | ⛔ | own; `membership.review` | fn (cycle open) | fn (own edit/withdraw; review decisions) | ⛔ |
| `members` | via `member_directory` view | own; `members.view` | fn (acceptance) / `members.manage` (manual/legacy) | own profile cols; status via fn with `members.manage` | ⛔ |
| `universities`, `majors`, `tracks`, `tags` | ✅ | ✅ | `reference_data.manage` | same | ⛔ (deactivate) |
| `events` | published/cancelled/completed | + drafts in *scope* (`events.view_drafts`) | `events.create` in *scope* | editable states with `events.edit` in *scope*; transitions via fn | drafts with `events.delete` in *scope* |
| `event_private_details` | ⛔ | `events.edit` in *scope*; accepted registrant | `events.edit` in *scope* | same | ⛔ |
| `event_registrations` | ⛔ | own; `registrations.review` in event's *scope* | fn `register_for_event` | fn (cancel own; decide; attendance) | ⛔ |
| `articles`, `article_authors`, `article_tags` | published | + drafts in *scope* (`articles.edit`) | `articles.create` | `articles.edit` in *scope*; transitions via fn | never-published drafts |
| `audit_logs` | ⛔ | `audit.view` | definer fn/trigger only | ⛔ | ⛔ |
| `email_logs` | ⛔ | organizers in *scope*; `audit.view` | server only | ⛔ | ⛔ |
| `site_settings` | public keys | public keys | `settings.manage` | `settings.manage` | ⛔ |

## 4. Grants baseline

```sql
-- applied in the first schema migration for every new table:
revoke all on table public.<table> from anon, authenticated;
grant select on table public.<table> to anon, authenticated;          -- if any read policy exists
grant insert, update on table public.<table> to authenticated;        -- only if direct writes are allowed
-- functions: revoke execute from public; grant to authenticated explicitly
```

`TRUNCATE`, `REFERENCES` and `TRIGGER` are never granted to API roles.

## 5. Service role

The service role bypasses RLS. It is used only by `lib/supabase/admin.ts` (server-only) for: Auth admin operations (claim/invite links), system jobs (email retry), and migrations/CI. Each use performs an explicit permission check against the calling user first and writes an audit entry.

## 6. Testing RLS

RLS is tested with **pgTAP** in `supabase/tests/` (run by `supabase test db` locally and in CI):

- For each table × actor (anon, plain user, member, committee member, committee head of A, head of B, leader, founder, admin): assert allowed/denied SELECT/INSERT/UPDATE/DELETE per the matrix above.
- Cross-committee isolation: head of committee A cannot read registrations for committee B's events.
- Transition guards: e.g., registering after `registration_closes_at` raises `REGISTRATION_CLOSED`.
- Regression test for the Critical audit findings: anon cannot write `members` or read `event_registrations`.

The test matrix is part of the [Definition of Done](../99-project-management/definition-of-done.md) for any migration that adds or changes a table or policy.
