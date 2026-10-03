# Sprint 04 — RBAC, Committees, Admin & Dashboard Shell

## Sprint Metadata

| Field               | Value |
| ------------------- | ----- |
| **Sprint #**        | 04 |
| **Duration**        | 2 weeks |
| **Start Date**      | 2026-11-22 |
| **End Date**        | 2026-12-05 |
| **Phase / Milestone** | Phase 2 — Identity & Access / M2 |
| **Target version**  | `v0.3.0` (M2 exit) |
| **Capacity**        | ~30 SP — planned 44 SP after adding stories; ADM-001 and AUTH-009 are explicit stretch; re-forecast after Sprint 03 |
| **Team**            | Tech lead + volunteer developers (assigned at sprint planning) |
| **Status**          | ✅ Local scope complete 2026-10-02 — remaining: Q-003/Q-004/Q-014/Q-039 confirmation, staging deploy, demo |

## Read First (reference pack)

| Topic | Document | What to take from it |
| ----- | -------- | -------------------- |
| Module specs | [Access control](../../../11-modules/access-control/README.md) (AC-1…9, `assign_role`, `getAccess`), [Committees](../../../11-modules/committees/README.md) (CM-1…8, handover), [Administration](../../../11-modules/administration/README.md) (users, roles screens) | Rules, server operations, error codes, tests |
| Security design | [Authorization model](../../../06-security/authorization-model.md), [Permission catalogue](../../../06-security/permission-catalog.md) (matrix = seed data), [RLS model](../../../05-database/rls-security-model.md) (`has_permission`, grants baseline, policy matrix) | Exactly what to seed and what each policy must say |
| Data | [Identity and access entities](../../../05-database/entities/identity-and-access.md), [Organization entities](../../../05-database/entities/organization.md), [Platform entities §1 `audit_logs`](../../../05-database/entities/platform.md#1-audit_logs) | Columns, constraints, indexes |
| Business | [Committee model](../../../03-business-domain/committee-model.md), [Organizational structure](../../../03-business-domain/organizational-structure.md) (position catalogue, terms), [Business rules](../../../03-business-domain/business-rules.md) BR-ORG-001…007 and BR-GOV-001…003, [Business processes](../../../03-business-domain/business-processes.md) (term handover, RACI) | Why the guards exist; who appoints whom |
| Screens | [01 shell](../../../10-design-system/INTERNAL-SCREENS/01-shell-layout.md), [02 sidebar](../../../10-design-system/INTERNAL-SCREENS/02-sidebar-navigation.md) (item → permission table, nav config contract), [03 conditional rendering](../../../10-design-system/INTERNAL-SCREENS/03-conditional-rendering.md) (hide vs disable rules, 403 view), [04 skeletons](../../../10-design-system/INTERNAL-SCREENS/04-skeleton-loading.md), [23 users and roles](../../../10-design-system/INTERNAL-SCREENS/23-admin-users-roles.md), [07 public members](../../../10-design-system/PUBLIC-SCREENS/07-members.md) | Layout, states, copy |
| Requirements | FR-CMT-001…005, FR-ADM-001/002/006 in [functional requirements](../../../02-requirements/functional-requirements.md) | Traceability |
| Engineering | [Server logic](../../../04-architecture/server-logic-and-data-access.md), [Frontend architecture](../../../04-architecture/frontend-architecture.md), [ADR-004](../../../90-decisions/README.md), [Open questions](../../../90-decisions/open-questions.md) Q-003, Q-004, Q-014, Q-032, Q-039 (defaults used as assumptions) | Patterns and assumptions |

## Sprint Objective

Authorization comes from the database: roles, permissions and time-bound role assignments with committee scope, enforced by RLS through `has_permission()`. The KFUCS-style dashboard shell renders a permission-filtered sidebar. `COMMITTEE_EMAILS` and the hardcoded leadership arrays are gone.

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| ACC-001 | Roles, permissions, role_permissions, role_assignments + `has_permission` + RLS + seeds ⛔ Q-003 | P0 | 8 | — | ✅ Done 2026-10-02 (recommended defaults; 647 pgTAP assertions incl. the 570-case matrix) |
| CMT-001 | Committees table + seed ⛔ Q-004 | P0 | 3 | — | ✅ Done 2026-10-02 (five committees, A-006) |
| ACC-003 | Dashboard shell with permission-filtered navigation (L-frame, skeletons) | P0 | 5 | — | ✅ Done 2026-10-02 (server-rendered sidebar, drawer, header, 403 view, skeletons; built items only) |
| ACC-002 | System admin assigns/ends roles with terms; anti-escalation and last-admin guards | P0 | 5 | — | ✅ Done 2026-10-02 (`/dashboard/admin/roles`: current, history, matrix; assign and end dialogs) |
| ACC-004 | Bootstrap admins; map the current reviewer to a role ⛔ Q-039 | P0 | 2 | — | 🔄 `private.bootstrap_system_admin(email)` + `committeeEmails.ts` deleted + local personas; the real first admins wait for Q-039 |
| CMT-002 | Leadership sections on `/members` from `current_positions` ⛔ Q-014 | P0 | 5 | — | ✅ Done 2026-10-02 (visual baselines unchanged; real leadership must be entered per environment, see gaps) |
| ACC-005 | `audit_logs` table (append-only, no UPDATE/DELETE grants) + audit triggers on role assignments, committees (BR-GOV-001/002) | P0 | 3 | — | ✅ Done 2026-10-02 |
| ACC-006 | `/account/roles` — my positions and terms (read-only) | P1 | 2 | — | ✅ Done 2026-10-02 |
| SEC-001 | **Local** RLS lockdown of the legacy tables (`members` write, `event_registrations` read/update) via `has_permission`; the Sprint 01 todo pgTAP tests become hard assertions | P0 | 3 | — | ✅ Done locally 2026-10-02 (`20261122000100_…`); production still waits for the deferred Supabase check |
| ADM-001 | Users list and 360° view (account + positions) at `/dashboard/admin/users` | P1 | 5 | — | 🔄 List with search and positions done; the 360° drawer (membership, registrations, last sign-in) waits for those modules |
| AUTH-009 | Account deletion request (audited; admins notified) — moved from Sprint 03 | P2 | 2 | — | ⏭ Moved to Sprint 11 (needs Q-031 retention answer and the audit viewer) |
| CMT-003 | `handover_head()` (end + assign in one transaction) and head appointment through the roles screen | P1 | 3 | — | ✅ Done 2026-10-02 (conflict in the assign dialog offers “Hand over to this person”) |
| TEST-002 | Persona E2E: six seeded personas log in; each sees exactly their sidebar; a head of committee A gets 404 on committee B | P0 | 3 | — | ✅ Done 2026-10-02 (17 RBAC E2E tests; cross-committee isolation is proven in pgTAP because committee-scoped screens arrive in Sprints 05–06) |

## Technical Tasks

1. **Migration** — access tables per [identity and access](../../../05-database/entities/identity-and-access.md); seed the [permission catalog](../../../06-security/permission-catalog.md).
2. **pgTAP** — the full role × permission matrix, escalation attempts, last-admin guard.
3. **Access context** — `getAccess()` server helper → `AccessProvider` → `can()` ([03-conditional-rendering](../../../10-design-system/INTERNAL-SCREENS/03-conditional-rendering.md)).
4. **Shell** — [01-shell-layout](../../../10-design-system/INTERNAL-SCREENS/01-shell-layout.md), [02-sidebar-navigation](../../../10-design-system/INTERNAL-SCREENS/02-sidebar-navigation.md), `loading.tsx` skeletons ([04-skeleton-loading](../../../10-design-system/INTERNAL-SCREENS/04-skeleton-loading.md)).
5. **Admin UI** — [23-admin-users-roles](../../../10-design-system/INTERNAL-SCREENS/23-admin-users-roles.md).
6. **Leadership** — the top sections of `/members` read `current_positions` (visual check proves the same look); the header account menu replaces the committee link.

7. **Audit** — `audit_logs` + a generic `private.audit()` trigger function used by role assignments and committees (ACC-005).
8. **Legacy lockdown (local)** — one migration replacing the open policies on `members` and `event_registrations` with owner/`has_permission` policies, so the Sprint 01 todo tests turn into hard assertions (SEC-001); the legacy `/committee` page reads `can('registrations.review')` instead of the e-mail list until Sprint 06 replaces it.
9. **Personas seed** — `supabase/seed.sql` adds six fictional personas with fixed `@example.test` addresses (local only) for pgTAP, E2E and the demo.
10. **Nav config** — `src/config/dashboard-nav.ts` is the single typed list from [02 §5](../../../10-design-system/INTERNAL-SCREENS/02-sidebar-navigation.md#5-configuration-implementation-contract), filtered by `visibleNav(access)`.

Every story also follows the [standard vertical-slice tasks](../../work-breakdown-structure.md#3-standard-tasks-per-story-vertical-slice) and the [Definition of Done](../../definition-of-done.md).

## Story Details and Acceptance Criteria

| Story | Given / When / Then | Rules | Traces to |
| ----- | ------------------- | ----- | --------- |
| ACC-001 | *Given* the seeded matrix, *when* pgTAP signs in as each persona, *then* each of the 30 permission keys is allowed or denied exactly as in [permission catalogue §2](../../../06-security/permission-catalog.md#2-role--permission-matrix-proposed-defaults). *Given* an assignment that starts tomorrow, *then* it grants nothing today | AC-1…AC-6 | FR-ADM-002 |
| CMT-001 | *Given* a clean database, *then* five committees exist (AI, Cybersecurity, Technology & Development, Projects, Design & Identity — A-006); deleting one referenced by an assignment is blocked | CM-1, CM-2 | FR-CMT-001 |
| ACC-003 | *Given* each persona, *when* they open `/dashboard`, *then* the sidebar equals the [role → view matrix](../../../10-design-system/INTERNAL-SCREENS/03-conditional-rendering.md#3-role--view-matrix-defaults-see-permission-catalog); a user with no permission is redirected to `/account`; the shell never shows a sidebar skeleton | AC-7 | FR-ADM-006 |
| ACC-002 | *Given* the leader, *when* they assign `system_admin` to themselves, *then* `ESCALATION_DENIED`. *Given* one active admin, *when* ending them, *then* `LAST_ADMIN`. *Given* an active head, *when* appointing a second, *then* `HEAD_ALREADY_ACTIVE` | AC-3, AC-5, AC-6 | FR-ADM-002, FR-CMT-002 |
| ACC-004 | *Given* the bootstrap script with two e-mails, *then* both become `system_admin` (idempotent, no real ids committed) and `committeeEmails.ts` is deleted | AC-9 | Q-039 |
| CMT-002 | *Given* `current_positions`, *when* `/members` renders, *then* the leadership sections show the active public positions in the same layout; an ended position disappears on its end date | CM-7 | FR-PUB-003 |
| ACC-005 | *Given* an assignment is created, updated or ended, *then* exactly one audit row exists with actor, action and before/after summary; any UPDATE/DELETE on `audit_logs` is denied even for admins | AD-2, AC-8 | BR-GOV-001/002 |
| SEC-001 | *Given* the local database, *when* anon tries to insert into `members` or select `event_registrations`, *then* it is denied; the legacy pages still work (public member read, own registrations, reviewers see all) | — | Audit F-01/F-02 |
| TEST-002 | *Given* six personas (plain user, committee member, committee head, leader, founder, system admin), *then* the sidebars match the matrix and cross-committee access is a 404 | AC-7 | FR-ADM-006 |

## Definition of Ready (checked 2026-10-02)

- [x] Permission catalogue and role matrix exist as seed-ready tables.
- [x] Screen blueprints for shell, sidebar, conditional rendering and admin screens exist.
- [x] Q-003, Q-004, Q-014, Q-032, Q-039 have recommended defaults recorded as assumptions; permissions are data, so late answers are seed-row migrations.
- [x] Sprint 03 delivers `profiles` and the cookie session this sprint builds on.
- [ ] Real first-admin e-mails (Q-039) — the bootstrap script takes them as parameters; local personas use fictional `@example.test` accounts.

## Dependencies

| Dependency | Source | Status |
| ---------- | ------ | ------ |
| Q-003 roles, Q-004 committees, Q-014 public positions, Q-039 admins | Leadership | Pending |

## Acceptance Criteria

- [x] `grep -r COMMITTEE_EMAILS src app` returns nothing.
- [x] pgTAP: the full role × permission matrix passes; the Sprint 01 todo tests are now hard assertions and green.
- [x] `audit_logs` has no UPDATE/DELETE grants (and an immutability trigger); every role change writes a row.
- [x] Each seeded role sees exactly the sidebar in the role → view matrix (unit test + persona E2E).
- [x] A head of committee A cannot act on committee B (RLS and `assign_role` deny, pgTAP; the committee-scoped screens that expose this in the UI arrive in Sprints 05–06).
- [x] Ending a term removes access at the end time without a deploy (E2E: end date passes → next request lands in `/account`).
- [ ] CI green, including the public-page visual check; all stories meet the [Definition of Done](../../definition-of-done.md)
- [ ] Deployed to staging; demo script executed

## Sprint Review Checklist (demo script)

- [ ] Log in as six seeded personas and compare the sidebars.
- [ ] Assign and end a role; show the audit entries.
- [ ] Arabic RTL and English LTR, dark and light
- [ ] At least one permission-denied case shown
- [ ] Release-notes lines collected

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Role-model answers arrive late | High | High | Seed the recommended defaults (assumptions); permissions are data, so later changes are seed-row migrations |

## References & Specifications

- ADR-004
- [Authorization model](../../../06-security/authorization-model.md)
- [Committee model](../../../03-business-domain/committee-model.md)

---

## Implementation Status (updated at sprint end)

### Completed
| Item | Details |
| ---- | ------- |
| Migrations | `20261122000000_committees_and_access_control.sql` (committees, roles, 30 permissions, matrix, `role_assignments` with exclusion constraints, `has_permission*`, RLS) and `20261122000100_audit_assignments_lockdown.sql` (audit log, `assign_role` / `end_role_assignment` / `handover_head`, `current_positions`, legacy lockdown, bootstrap function) |
| Guards (all in SQL) | scope required/forbidden, anti-escalation, self-assignment, one leader / one head per committee, duplicate holder, last admin, reason required, valid dates, inactive committee |
| pgTAP | 647 assertions: `01` critical findings (hard now), `03` the generated 570-case role × permission matrix, `04` guards, RLS, audit immutability, time-bound effect, public view |
| App | `getAccess()` per request, `can()` helpers, one typed nav list filtered per user, `DashboardShell` (sidebar, mobile drawer, header with theme/language/user menu), 403 view, skeleton `loading.tsx`, roles screen (current / history / read-only matrix), users list, `/account/roles`, overview |
| Legacy | `/committee` is gated by `registrations.review` from the database; `committeeEmails.ts` deleted; header shows a Dashboard link only to people with a position |
| Public site | `/members` leadership sections read `current_positions`; the visual baselines are unchanged (mocked rows reproduce the old hardcoded content) |
| Tests | 69 unit tests, 38 auth/RBAC E2E tests (real local stack), 647 pgTAP assertions, 120 visual/smoke tests |
| Tooling | `npm run db:personas` (six fictional local personas), `npm run db:gen-rbac-test` (regenerates the matrix test from `tests/fixtures/rbac-matrix.mjs`) |

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
| Real leadership data | `/members` now shows whoever holds public positions in the database. Each environment (staging, production) needs the real people as accounts with assignments, bios and tags — a launch task (Sprint 13) and part of Q-039/Q-014. Local development uses the personas script |
| BR-ORG-004 (committee roles need an active member) | `private.is_active_member()` is a documented placeholder returning true until members are linked to accounts (Sprint 08 replaces its body; `NOT_ACTIVE_MEMBER` is already wired) |
| Shell staleness | The shell is a layout, so it is computed on first load and after hard navigation or a Server Action; a permission change mid-session shows on the next full load. Pages and the database always re-check |
| Committee switcher, queue badges, environment ribbon | Specified in the blueprints; arrive with the committee-scoped screens (Sprints 05–06) |
| Audit viewer | Audit rows are written and protected; the screen is Sprint 11 |
| Admin MFA | Still proposed (Sprint 11–12) |
| Production | Nothing here has touched the production Supabase project; the lockdown migration waits for the deferred inspection (FND-003) |
| `ErrorCode` strings | Messages exist in Arabic and English for every code this sprint raises; the shared catalogue will move to `messages/` with UI-007 |
