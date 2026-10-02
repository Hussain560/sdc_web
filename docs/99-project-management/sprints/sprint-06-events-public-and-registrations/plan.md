# Sprint 06 — Events II — Public Pages from DB, Registrations, Notifications

## Sprint Metadata

| Field               | Value |
| ------------------- | ----- |
| **Sprint #**        | 06 |
| **Duration**        | 2 weeks |
| **Start Date**      | 2026-12-20 |
| **End Date**        | 2027-01-02 |
| **Phase / Milestone** | Phase 3A — Events & Registrations / M3 |
| **Target version**  | `v0.4.0` (M3 exit) |
| **Capacity**        | ~30 SP — planned 30 SP |
| **Team**            | Tech lead + volunteer developers (assigned at sprint planning) |
| **Status**          | ⬜ Planned — dates indicative; re-forecast after Sprint 02 velocity |

## Sprint Objective

Public event pages read the database and look exactly as before; visitors register through a server function; committees review registrations in the dashboard; acceptance e-mails carry the group and meeting links; legacy events and registrations are migrated; `/committee` and the open e-mail Edge Functions are retired.

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| PUB-002 | Public `/events`, `/events/[slug]` and home blocks from `public_events`; phase badges; KFUCS content blocks in the existing card style; skeletons | P0 | 8 | — | ⬜ |
| REG-001 | Register once for an open event and see my status | P0 | 5 | — | ⬜ |
| REG-003 | Committee reviewers decide registrations (bulk) ⛔ Q-018, Q-028 | P0 | 5 | — | ⬜ |
| NOT-002 | Notifications module + `email_log`; registration templates; claim-before-send | P0 | 5 | — | ⬜ |
| EVT-005 | Migrate the six events + 301 redirects from numeric URLs | P0 | 3 | — | ⬜ |
| REG-005 | Migrate legacy registrations | P0 | 2 | — | ⬜ |
| REG-002 | Cancel my registration before the event | P1 | 2 | — | ⬜ |

## Technical Tasks

1. **Public pages** — [03-events-list](../../../10-design-system/PUBLIC-SCREENS/03-events-list.md), [04-event-detail](../../../10-design-system/PUBLIC-SCREENS/04-event-detail.md); same CSS classes, data from the view.
2. **Functions** — `register_for_event`, `decide_registrations`, `cancel_registration`; pgTAP for capacity races.
3. **Dashboard** — [15-event-registrations](../../../10-design-system/INTERNAL-SCREENS/15-event-registrations.md) + the `/dashboard/registrations` queue.
4. **E-mail** — provider SDK in `modules/notifications`; ar/en templates; per-recipient log; retry action ([email architecture](../../../04-architecture/email-architecture.md)).
5. **Retire** — `/committee` → 301; delete `send-registration-email` and `send-status-email`; remove the anon policies from the legacy tables.

Every story also follows the [standard vertical-slice tasks](../../work-breakdown-structure.md#3-standard-tasks-per-story-vertical-slice) and the [Definition of Done](../../definition-of-done.md).

## Dependencies

| Dependency | Source | Status |
| ---------- | ------ | ------ |
| Q-018 approval default, Q-028 rejection wording | Leadership | Pending |
| Provider account (Q-010) | Sprint 03 | — |

## Acceptance Criteria

- [ ] Visual check: `/ar/events` and an event page match the baseline (except approved additions).
- [ ] Two users racing for the last seat: exactly one is accepted.
- [ ] A reviewer of committee A cannot see committee B registrations.
- [ ] A failed e-mail does not roll back a decision; retry works.
- [ ] CI green, including the public-page visual check; all stories meet the [Definition of Done](../../definition-of-done.md)
- [ ] Deployed to staging; demo script executed

## Sprint Review Checklist (demo script)

- [ ] Register → review → acceptance e-mail with the group link → status chip on the event page.
- [ ] Arabic RTL and English LTR, dark and light
- [ ] At least one permission-denied case shown
- [ ] Release-notes lines collected

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| End-of-year holiday period | Medium | Medium | Smaller scope; rehearse migrations on staging first |

## References & Specifications

- [Registration lifecycle](../../../03-business-domain/registration-lifecycle.md)
- [Notification rules](../../../03-business-domain/notification-rules.md)
- FR-REG-*, FR-NOT-*

---

## Implementation Status (updated at sprint end)

### Completed
| Item | Details |
| ---- | ------- |

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
