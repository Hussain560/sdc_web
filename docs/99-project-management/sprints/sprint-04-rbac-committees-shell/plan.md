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
| **Capacity**        | ~30 SP — planned 28 SP |
| **Team**            | Tech lead + volunteer developers (assigned at sprint planning) |
| **Status**          | ⬜ Planned — dates indicative; re-forecast after Sprint 02 velocity |

## Sprint Objective

Authorization comes from the database: roles, permissions and time-bound role assignments with committee scope, enforced by RLS through `has_permission()`. The KFUCS-style dashboard shell renders a permission-filtered sidebar. `COMMITTEE_EMAILS` and the hardcoded leadership arrays are gone.

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| ACC-001 | Roles, permissions, role_permissions, role_assignments + `has_permission` + RLS + seeds ⛔ Q-003 | P0 | 8 | — | ⬜ |
| CMT-001 | Committees table + seed ⛔ Q-004 | P0 | 3 | — | ⬜ |
| ACC-003 | Dashboard shell with permission-filtered navigation (L-frame, skeletons) | P0 | 5 | — | ⬜ |
| ACC-002 | System admin assigns/ends roles with terms; anti-escalation and last-admin guards | P0 | 5 | — | ⬜ |
| ACC-004 | Bootstrap admins; map the current reviewer to a role ⛔ Q-039 | P0 | 2 | — | ⬜ |
| CMT-002 | Leadership sections on `/members` from `current_positions` ⛔ Q-014 | P0 | 5 | — | ⬜ |

## Technical Tasks

1. **Migration** — access tables per [identity and access](../../../05-database/entities/identity-and-access.md); seed the [permission catalog](../../../06-security/permission-catalog.md).
2. **pgTAP** — the full role × permission matrix, escalation attempts, last-admin guard.
3. **Access context** — `getAccess()` server helper → `AccessProvider` → `can()` ([03-conditional-rendering](../../../10-design-system/INTERNAL-SCREENS/03-conditional-rendering.md)).
4. **Shell** — [01-shell-layout](../../../10-design-system/INTERNAL-SCREENS/01-shell-layout.md), [02-sidebar-navigation](../../../10-design-system/INTERNAL-SCREENS/02-sidebar-navigation.md), `loading.tsx` skeletons ([04-skeleton-loading](../../../10-design-system/INTERNAL-SCREENS/04-skeleton-loading.md)).
5. **Admin UI** — [23-admin-users-roles](../../../10-design-system/INTERNAL-SCREENS/23-admin-users-roles.md).
6. **Leadership** — the top sections of `/members` read `current_positions` (visual check proves the same look); the header account menu replaces the committee link.

Every story also follows the [standard vertical-slice tasks](../../work-breakdown-structure.md#3-standard-tasks-per-story-vertical-slice) and the [Definition of Done](../../definition-of-done.md).

## Dependencies

| Dependency | Source | Status |
| ---------- | ------ | ------ |
| Q-003 roles, Q-004 committees, Q-014 public positions, Q-039 admins | Leadership | Pending |

## Acceptance Criteria

- [ ] `grep -r COMMITTEE_EMAILS src app` returns nothing.
- [ ] Each seeded role sees exactly the sidebar in the role → view matrix.
- [ ] A head of committee A cannot act on committee B (UI hidden, server 403, RLS deny).
- [ ] Ending a term removes access at the end time without a deploy.
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

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
