# Sprint 11 — Reports, Audit Log, Exports & Settings

## Sprint Metadata

| Field               | Value |
| ------------------- | ----- |
| **Sprint #**        | 11 |
| **Duration**        | 2 weeks |
| **Start Date**      | 2027-02-28 |
| **End Date**        | 2027-03-13 |
| **Phase / Milestone** | Phase 4 — Internal Management & Reporting / M6 |
| **Target version**  | `v0.7.0` (M6 exit) |
| **Capacity**        | ~22 SP (Eid al-Fitr ≈ 2027-03-09) — planned 20 SP |
| **Team**            | Tech lead + volunteer developers (assigned at sprint planning) |
| **Status**          | ⬜ Planned — dates indicative; re-forecast after Sprint 02 velocity |

## Sprint Objective

Leadership and committee heads see dashboards built on one set of report functions; the audit log, e-mail log, reference data and site settings are manageable without developers; registrant exports are audited.

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| RPT-001 | Community dashboard ⛔ Q-008 | P0 | 5 | — | ⬜ |
| RPT-002 | Committee dashboard | P0 | 3 | — | ⬜ |
| ACC-005 | Audit log UI | P0 | 3 | — | ⬜ |
| ACC-006 | Reference data and site settings UIs | P1 | 3 | — | ⬜ |
| REG-007 | Registrant export (audited) | P1 | 3 | — | ⬜ |
| PUB-001 | Partners section ⛔ Q-021 | P2 | 3 | — | ⬜ |

## Technical Tasks

1. **Functions** — `community_stats`, `committee_stats` per the [reporting model](../../../03-business-domain/reporting-model.md).
2. **Screens** — [10-dashboard-overview](../../../10-design-system/INTERNAL-SCREENS/10-dashboard-overview.md), [22-reports](../../../10-design-system/INTERNAL-SCREENS/22-reports.md), [24-admin](../../../10-design-system/INTERNAL-SCREENS/24-admin-audit-emails-settings.md).
3. **Footer** social links read `site_settings` (visual check unchanged).

Every story also follows the [standard vertical-slice tasks](../../work-breakdown-structure.md#3-standard-tasks-per-story-vertical-slice) and the [Definition of Done](../../definition-of-done.md).

## Dependencies

| Dependency | Source | Status |
| ---------- | ------ | ------ |
| Q-008 KPIs, Q-021 partners | Leadership | Pending |

## Acceptance Criteria

- [ ] Report numbers match SQL spot checks on seed data.
- [ ] Every export writes an audit row with the filter used.
- [ ] CI green, including the public-page visual check; all stories meet the [Definition of Done](../../definition-of-done.md)
- [ ] Deployed to staging; demo script executed

## Sprint Review Checklist (demo script)

- [ ] Leader dashboard vs committee-head dashboard for the same period.
- [ ] Arabic RTL and English LTR, dark and light
- [ ] At least one permission-denied case shown
- [ ] Release-notes lines collected

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Eid holiday | High | Low | Plan about 1.5 weeks of work |

## References & Specifications

- FR-RPT-*, FR-ADM-*

---

## Implementation Status (updated at sprint end)

### Completed
| Item | Details |
| ---- | ------- |

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
