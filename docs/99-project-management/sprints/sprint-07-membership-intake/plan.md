# Sprint 07 — Membership I — Reference Data, Intake Cycles & /join

## Sprint Metadata

| Field               | Value |
| ------------------- | ----- |
| **Sprint #**        | 07 |
| **Duration**        | 2 weeks |
| **Start Date**      | 2027-01-03 |
| **End Date**        | 2027-01-16 |
| **Phase / Milestone** | Phase 3B — Membership & Members / M4 |
| **Target version**  | contributes to `v0.5.0` |
| **Capacity**        | ~28 SP — planned 24 SP |
| **Team**            | Tech lead + volunteer developers (assigned at sprint planning) |
| **Status**          | ⬜ Planned — dates indicative; re-forecast after Sprint 02 velocity |

## Sprint Objective

The leader schedules the annual intake cycle; `/join` shows closed / upcoming / open; signed-in users apply in a 5-step form while the window is open (D-001). If the next intake opens before this date (Q-011), Sprints 07–08 swap with 05–06.

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| MEM-001 | Reference data tables (universities, majors, tracks) seeded from legacy values | P0 | 3 | — | ⬜ |
| MBR-001 | Create and schedule an intake cycle ⛔ Q-011 | P0 | 5 | — | ⬜ |
| MBR-002 | `/join` shows open / upcoming / closed | P0 | 5 | — | ⬜ |
| MBR-003 | Apply while the cycle is open ⛔ Q-002 | P0 | 8 | — | ⬜ |
| MBR-005 | See my application status and withdraw | P1 | 3 | — | ⬜ |

## Technical Tasks

1. **Migration** — [membership entities](../../../05-database/entities/membership.md): `membership_cycles`, `membership_applications`; phase derived from dates; at most one open cycle.
2. **Screens** — [17-membership-cycles](../../../10-design-system/INTERNAL-SCREENS/17-membership-cycles.md), [25-join-page](../../../10-design-system/INTERNAL-SCREENS/25-join-page.md), `/account/membership`.
3. **Reference data admin** — minimal list/edit in [24-admin](../../../10-design-system/INTERNAL-SCREENS/24-admin-audit-emails-settings.md).

Every story also follows the [standard vertical-slice tasks](../../work-breakdown-structure.md#3-standard-tasks-per-story-vertical-slice) and the [Definition of Done](../../definition-of-done.md).

## Dependencies

| Dependency | Source | Status |
| ---------- | ------ | ------ |
| Q-002 account required?, Q-011 next intake, Q-012 form fields | Leadership | Pending |

## Acceptance Criteria

- [ ] Applying outside the window is rejected by the database.
- [ ] One application per user per cycle.
- [ ] `/join` matches the public visual language (design review sign-off).
- [ ] CI green, including the public-page visual check; all stories meet the [Definition of Done](../../definition-of-done.md)
- [ ] Deployed to staging; demo script executed

## Sprint Review Checklist (demo script)

- [ ] Schedule a cycle opening in one minute → watch `/join` change state → apply.
- [ ] Arabic RTL and English LTR, dark and light
- [ ] At least one permission-denied case shown
- [ ] Release-notes lines collected

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Intake date earlier than planned | Medium | High | Swap with Sprints 05–06 (roadmap rule) |

## References & Specifications

- ADR-011, D-001
- [Membership lifecycle](../../../03-business-domain/membership-lifecycle.md)
- FR-MBR-*

---

## Implementation Status (updated at sprint end)

### Completed
| Item | Details |
| ---- | ------- |

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
