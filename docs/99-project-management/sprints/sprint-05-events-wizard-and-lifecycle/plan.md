# Sprint 05 — Events I — KFUCS Wizard, Data Model & Lifecycle

## Sprint Metadata

| Field               | Value |
| ------------------- | ----- |
| **Sprint #**        | 05 |
| **Duration**        | 2 weeks |
| **Start Date**      | 2026-12-06 |
| **End Date**        | 2026-12-19 |
| **Phase / Milestone** | Phase 3A — Events & Registrations / M3 |
| **Target version**  | contributes to `v0.4.0` |
| **Capacity**        | ~30 SP — planned 29 SP |
| **Team**            | Tech lead + volunteer developers (assigned at sprint planning) |
| **Status**          | ⬜ Planned — dates indicative; re-forecast after Sprint 02 velocity |

## Sprint Objective

Committees create events in the **4-step KFUCS wizard** (Identity → Logistics → Content → Review) with a live preview and refresh-safe drafts; events move draft → review → published with approvals; the full KFUCS event data model (schedule types, event dates, presenters, goals, FAQ, display config, private links) is in the database.

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| EVT-006 | Events schema: `events`, `event_private_details`, `event_dates`, `event_presenters` + RLS + pgTAP | P0 | 8 | — | ⬜ |
| EVT-001 | 4-step creation wizard with Zod step schemas, preview card, `localStorage` draft | P0 | 8 | — | ⬜ |
| EVT-002 | Submit → approve / request changes; approver fast-track ⛔ Q-005 | P0 | 5 | — | ⬜ |
| EVT-004 | Cancel a published event (reason; registrant e-mails arrive in Sprint 06) | P0 | 3 | — | ⬜ |
| UI-004 | Primitives batch 2: Stepper, Tabs, Table, Drawer, EmptyState, StatCard | P0 | 5 | — | ⬜ |

## Technical Tasks

1. **Migration** — tables, CHECKs, `sync_event_dates()` trigger, `transition_event()` with publish guards (start date, location, group link, ≥ 1 Arabic goal) — [events entities](../../../05-database/entities/events.md).
2. **Schemas** — port KFUCS `step1Schema`…`step4Schema` / `fullEventSchema` (Arabic-first) and their unit tests.
3. **Wizard UI** — [13-event-form](../../../10-design-system/INTERNAL-SCREENS/13-event-form.md); reference `kfucs-portal/src/components/admin-events/wizard/*`, rebuilt on SDC primitives and tokens.
4. **List and detail** — [12-events-list](../../../10-design-system/INTERNAL-SCREENS/12-events-list.md), [14-event-detail-review](../../../10-design-system/INTERNAL-SCREENS/14-event-detail-review.md).
5. **Storage** — `public-media` bucket policies for covers and guest-presenter photos.

Every story also follows the [standard vertical-slice tasks](../../work-breakdown-structure.md#3-standard-tasks-per-story-vertical-slice) and the [Definition of Done](../../definition-of-done.md).

## Dependencies

| Dependency | Source | Status |
| ---------- | ------ | ------ |
| Q-005 approver, Q-040 types | Leadership | Pending |
| RBAC | Sprint 04 | — |

## Acceptance Criteria

- [ ] A committee member can only save drafts; the head submits; the leader approves; every other combination is denied (UI + server + RLS).
- [ ] Refreshing on step 3 restores the wizard state.
- [ ] Specific dates create one `event_dates` row each; removing a date is reflected.
- [ ] Publishing without a group link fails with a localized message.
- [ ] CI green, including the public-page visual check; all stories meet the [Definition of Done](../../definition-of-done.md)
- [ ] Deployed to staging; demo script executed

## Sprint Review Checklist (demo script)

- [ ] Create a 3-day camp with specific dates, two presenters (one guest), goals and FAQ → submit → approve.
- [ ] Arabic RTL and English LTR, dark and light
- [ ] At least one permission-denied case shown
- [ ] Release-notes lines collected

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Wizard scope creep | Medium | Medium | KFUCS behaviour is the spec; anything beyond it goes to the backlog |

## References & Specifications

- ADR-012
- [KFUCS alignment](../../../98-reference/kfucs-event-model-alignment.md)
- [Event lifecycle](../../../03-business-domain/event-lifecycle.md)
- FR-EVT-001…009

---

## Implementation Status (updated at sprint end)

### Completed
| Item | Details |
| ---- | ------- |

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
