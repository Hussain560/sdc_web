# Sprint 13 — Production Readiness & Launch

## Sprint Metadata

| Field               | Value |
| ------------------- | ----- |
| **Sprint #**        | 13 |
| **Duration**        | 2 weeks |
| **Start Date**      | 2027-03-28 |
| **End Date**        | 2027-04-10 |
| **Phase / Milestone** | Phase 6 — Production Readiness & Launch / M8 |
| **Target version**  | `v1.0.0` |
| **Capacity**        | ~20 SP — planned 16 SP |
| **Team**            | Tech lead + volunteer developers (assigned at sprint planning) |
| **Status**          | ⬜ Planned — dates indicative; re-forecast after Sprint 02 velocity |

## Sprint Objective

The rebuilt platform becomes production: data migration rehearsed and executed, legacy tables dropped, production environment verified, runbooks and handover complete, and the launch announced in Arabic and English.

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| LCH-001 | Production cutover runbook and rehearsal | P0 | 5 | — | ⬜ |
| LCH-002 | Contract migrations (drop legacy tables) | P0 | 3 | — | ⬜ |
| LCH-003 | Production env, domain, e-mail domain verification, monitoring/keep-alive | P0 | 3 | — | ⬜ |
| LCH-004 | Handover: two system admins trained; runbooks; access inventory updated | P0 | 3 | — | ⬜ |
| LCH-005 | Launch announcement (ar/en) and release notes | P1 | 2 | — | ⬜ |

## Technical Tasks

1. Rehearse the cutover on a staging copy with synthetic data and time each step.
2. Announce the freeze window to committees; run the production migration; smoke-test with the [manual QA checklist](../../../09-quality/manual-qa-checklist.md).
3. Tag `v1.0.0` and write the release record in [releases](../../releases/README.md).

Every story also follows the [standard vertical-slice tasks](../../work-breakdown-structure.md#3-standard-tasks-per-story-vertical-slice) and the [Definition of Done](../../definition-of-done.md).

## Dependencies

| Dependency | Source | Status |
| ---------- | ------ | ------ |
| All Must requirements done | Sprints 01–12 | — |

## Acceptance Criteria

- [ ] Release checklist complete; two system admins active; backups verified after cutover.
- [ ] Rollback plan tested in the rehearsal.
- [ ] CI green, including the public-page visual check; all stories meet the [Definition of Done](../../definition-of-done.md)
- [ ] Deployed to staging; demo script executed

## Sprint Review Checklist (demo script)

- [ ] Live production walkthrough with leadership.
- [ ] Arabic RTL and English LTR, dark and light
- [ ] At least one permission-denied case shown
- [ ] Release-notes lines collected

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Data migration surprises | Medium | High | Two rehearsals; rollback snapshot before cutover |

## References & Specifications

- [Deployment](../../../08-infrastructure/deployment.md)
- [Versioning and releases](../../../07-engineering/versioning-and-releases.md)

---

## Implementation Status (updated at sprint end)

### Completed
| Item | Details |
| ---- | ------- |

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
