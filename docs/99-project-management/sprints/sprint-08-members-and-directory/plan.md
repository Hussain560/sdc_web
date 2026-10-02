# Sprint 08 — Membership II — Review, Members & Directory

## Sprint Metadata

| Field               | Value |
| ------------------- | ----- |
| **Sprint #**        | 08 |
| **Duration**        | 2 weeks |
| **Start Date**      | 2027-01-17 |
| **End Date**        | 2027-01-30 |
| **Phase / Milestone** | Phase 3B — Membership & Members / M4 |
| **Target version**  | `v0.5.0` (M4 exit) |
| **Capacity**        | ~28 SP — planned 26 SP |
| **Team**            | Tech lead + volunteer developers (assigned at sprint planning) |
| **Status**          | ⬜ Planned — dates indicative; re-forecast after Sprint 02 velocity |

## Sprint Objective

Reviewers decide applications in bulk and decisions are e-mailed; accepted applicants become members linked to their accounts; the public directory and profiles read a privacy-safe view; legacy members can claim their records.

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| MBR-004 | Review and decide applications (bulk); decision e-mails ⛔ Q-013 | P0 | 8 | — | ⬜ |
| MEM-002 | Directory and profile from `member_directory` with filters ⛔ Q-007 | P0 | 5 | — | ⬜ |
| MEM-003 | Members edit their profile and directory visibility ⛔ Q-030 | P0 | 5 | — | ⬜ |
| MEM-004 | Legacy member import + claim flow ⛔ Q-026, Q-038 | P0 | 8 | — | ⬜ |

## Technical Tasks

1. **Screens** — [18-membership-applications](../../../10-design-system/INTERNAL-SCREENS/18-membership-applications.md), [19-members-management](../../../10-design-system/INTERNAL-SCREENS/19-members-management.md); public [07-members](../../../10-design-system/PUBLIC-SCREENS/07-members.md) and [08-member-profile](../../../10-design-system/PUBLIC-SCREENS/08-member-profile.md) with the same look.
2. **Privacy** — the view exposes public columns only; anon has no access to `members`.
3. **Claim** — e-mailed one-time token → `claim_legacy_member()`.

Every story also follows the [standard vertical-slice tasks](../../work-breakdown-structure.md#3-standard-tasks-per-story-vertical-slice) and the [Definition of Done](../../definition-of-done.md).

## Dependencies

| Dependency | Source | Status |
| ---------- | ------ | ------ |
| Q-007 public fields, Q-026 legacy data, Q-038 claim method | Leadership | Pending |

## Acceptance Criteria

- [ ] Anon `select * from members` is denied (pgTAP).
- [ ] The directory shows only opted-in active members; visual check unchanged.
- [ ] An accepted application creates exactly one member row (idempotent).
- [ ] CI green, including the public-page visual check; all stories meet the [Definition of Done](../../definition-of-done.md)
- [ ] Deployed to staging; demo script executed

## Sprint Review Checklist (demo script)

- [ ] Bulk-accept five applications → e-mails → members appear in the directory after opting in.
- [ ] Arabic RTL and English LTR, dark and light
- [ ] At least one permission-denied case shown
- [ ] Release-notes lines collected

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Legacy data quality | High | Medium | Import script with a dry-run report; manual fixes before import |

## References & Specifications

- [Membership entities](../../../05-database/entities/membership.md)
- FR-MEM-*

---

## Implementation Status (updated at sprint end)

### Completed
| Item | Details |
| ---- | ------- |

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
