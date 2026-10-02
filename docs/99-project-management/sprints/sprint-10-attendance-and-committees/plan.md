# Sprint 10 — Attendance Sessions, Certificates Model & Committee Management

## Sprint Metadata

| Field               | Value |
| ------------------- | ----- |
| **Sprint #**        | 10 |
| **Duration**        | 2 weeks |
| **Start Date**      | 2027-02-14 |
| **End Date**        | 2027-02-27 |
| **Phase / Milestone** | Phase 4 — Internal Management & Reporting / M6 |
| **Target version**  | contributes to `v0.7.0` |
| **Capacity**        | ~22 SP (Ramadan) — planned 21 SP |
| **Team**            | Tech lead + volunteer developers (assigned at sprint planning) |
| **Status**          | ⬜ Planned — dates indicative; re-forecast after Sprint 02 velocity |

## Sprint Objective

Organizers run per-day attendance sessions the KFUCS way — QR, online and manual check-in, session and event finalization with one canonical percentage — and completing an event requires finalized attendance. Certificates are generated behind a setting (Q-020). Committees are managed in the dashboard.

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| REG-006 | Attendance sessions: open/close/finalize, QR + online + manual check-in, event finalization (ADR-012) | P0 | 8 | — | ⬜ |
| PUB-003 | `/events/[slug]/check-in` page | P0 | 3 | — | ⬜ |
| REG-008 | Certificates: eligibility, PDF, delivery + retry ⛔ Q-020 | P2 | 5 | — | ⬜ |
| CMT-003 | Committee management UI + public committee pages | P1 | 5 | — | ⬜ |

## Technical Tasks

1. **Migration** — `attendance_sessions`, `attendance_records` (UNIQUE), `attendance_percent()`, finalization functions, `certificates` ([events entities §6–8](../../../05-database/entities/events.md#6-attendance_sessions)).
2. **pgTAP** — port the KFUCS cases F-19, F-20, F-23 and F-36.
3. **Screens** — [16-event-attendance](../../../10-design-system/INTERNAL-SCREENS/16-event-attendance.md), [check-in page](../../../10-design-system/PUBLIC-SCREENS/12-new-public-pages.md#2-event-check-in-eventsslugcheck-in), [20-committees-management](../../../10-design-system/INTERNAL-SCREENS/20-committees-management.md).
4. **QR** — rotating HMAC token (30 s), verified on the server.

Every story also follows the [standard vertical-slice tasks](../../work-breakdown-structure.md#3-standard-tasks-per-story-vertical-slice) and the [Definition of Done](../../definition-of-done.md).

## Dependencies

| Dependency | Source | Status |
| ---------- | ------ | ------ |
| Q-020 certificates and threshold | Leadership | Pending |

## Acceptance Criteria

- [ ] A concurrent double check-in creates one record.
- [ ] Removing a scheduled day with a finalized session is blocked.
- [ ] *Complete event* stays disabled until attendance is finalized.
- [ ] The attendance percentage in the UI, reports and certificates is identical.
- [ ] CI green, including the public-page visual check; all stories meet the [Definition of Done](../../definition-of-done.md)
- [ ] Deployed to staging; demo script executed

## Sprint Review Checklist (demo script)

- [ ] Run a two-day event: QR check-in from a phone, manual marks, finalize, complete, certificates if enabled.
- [ ] Arabic RTL and English LTR, dark and light
- [ ] At least one permission-denied case shown
- [ ] Release-notes lines collected

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Ramadan capacity | High | Medium | Certificates are P2 and may slip to Sprint 11 |

## References & Specifications

- ADR-012
- [KFUCS alignment](../../../98-reference/kfucs-event-model-alignment.md)
- FR-REG-006, FR-EVT-006

---

## Implementation Status (updated at sprint end)

### Completed
| Item | Details |
| ---- | ------- |

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
