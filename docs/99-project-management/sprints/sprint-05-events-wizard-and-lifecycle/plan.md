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
| **Capacity**        | ~30 SP — planned 49 SP after adding stories; EVT-013 and EVT-014 are stretch; re-forecast after the first week |
| **Team**            | Tech lead + volunteer developers (assigned at sprint planning) |
| **Status**          | 🔄 In progress — started 2026-10-02 |

## Read First (reference pack)

| Topic | Document | What to take from it |
| ----- | -------- | -------------------- |
| Decision | [ADR-012 — event model and wizard from KFUCS](../../../90-decisions/ADR-012-event-model-and-wizard-from-kfucs.md), [KFUCS → SDC alignment](../../../98-reference/kfucs-event-model-alignment.md) | Why SDC copies KFUCS behaviour; field-by-field mapping (same / adapted / dropped) |
| Module spec | [Events module](../../../11-modules/events/README.md) | Rules EV-1…EV-12, server operations, error codes, edge cases, test list |
| Data | [Events entities §1–4](../../../05-database/entities/events.md), [RLS model](../../../05-database/rls-security-model.md), [conventions](../../../05-database/conventions.md), [migration strategy](../../../05-database/migration-strategy.md) | Columns, constraints, publish guards, private-details split, grants baseline |
| Business | [Event lifecycle](../../../03-business-domain/event-lifecycle.md) (status table, derived phase), [Business rules BR-EVT](../../../03-business-domain/business-rules.md), [Business processes](../../../03-business-domain/business-processes.md) (event journey) | Who may do what, when; phase definitions |
| Screens | [13 event form](../../../10-design-system/INTERNAL-SCREENS/13-event-form.md), [12 events list](../../../10-design-system/INTERNAL-SCREENS/12-events-list.md), [14 event detail and review](../../../10-design-system/INTERNAL-SCREENS/14-event-detail-review.md), [00 data model reference](../../../10-design-system/INTERNAL-SCREENS/00-data-model-reference.md) (badge palettes, allowed actions per status), [03 conditional rendering](../../../10-design-system/INTERNAL-SCREENS/03-conditional-rendering.md), [04 skeletons](../../../10-design-system/INTERNAL-SCREENS/04-skeleton-loading.md) | Wizard steps, list columns, timeline, dialogs, states |
| Security | [Permission catalogue](../../../06-security/permission-catalog.md) (events.* keys), [Authorization model](../../../06-security/authorization-model.md), [Security model](../../../06-security/security-model.md) | Scope rules; no hardcoded roles |
| Requirements | FR-EVT-001…009 in [functional requirements](../../../02-requirements/functional-requirements.md), [NFR](../../../02-requirements/non-functional-requirements.md) | Traceability |
| Engineering | [Server logic](../../../04-architecture/server-logic-and-data-access.md), [Frontend architecture](../../../04-architecture/frontend-architecture.md), [Testing strategy](../../../09-quality/testing-strategy.md), [Design-system foundations](../../../10-design-system/README.md) | Action skeleton, `Result`, tokens, a11y |
| Reference implementation | KFUCS `src/components/admin-events/wizard/*`, `src/hooks/useEventWizard.ts`, `src/lib/validations/admin-event.ts` (read-only reference, not copied verbatim) | Wizard behaviour and the step schemas |

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
| EVT-007 | Dashboard events list: status tabs with counts, filters (search, committee, type, period), pagination | P0 | 5 | — | ⬜ |
| EVT-008 | Event detail: facts rail, private details, lifecycle timeline, action dialogs (request changes, cancel), history tab | P0 | 5 | — | ⬜ |
| EVT-009 | Cover image upload to Storage (JPEG/PNG/WebP ≤ 2 MB, validated server-side) | P1 | 3 | — | ⬜ |
| EVT-010 | Presenters in the wizard: member search or guest (name, title, link), role, order, ≤ 10 | P1 | 3 | — | ⬜ |
| EVT-011 | Derived timing phase: SQL view + TypeScript mirror, one shared truth table in pgTAP and unit tests | P0 | 3 | — | ⬜ |
| EVT-012 | Optimistic concurrency on save (`STALE_DATA`) and the wizard's refresh-safe draft with discard | P1 | 2 | — | ⬜ |
| EVT-013 | Markdown description editor with sanitized preview (ar/en) | P2 | 2 | — | ⬜ |
| EVT-014 | Edit a published event; significant changes (dates, mode, place) require a confirm dialog | P1 | 3 | — | ⬜ |
| EVT-015 | Sidebar items for events (committee and management) become available; list/detail respect scope | P0 | 1 | — | ⬜ |
| TEST-003 | pgTAP for events (transition matrix by role, publish guards, visibility, private details, slug lock) and wizard E2E | P0 | 5 | — | ⬜ |

## Technical Tasks

1. **Migration** — tables, CHECKs, `sync_event_dates()` trigger, `transition_event()` with publish guards (start date, location, group link, ≥ 1 Arabic goal) — [events entities](../../../05-database/entities/events.md).
2. **Schemas** — port KFUCS `step1Schema`…`step4Schema` / `fullEventSchema` (Arabic-first) and their unit tests.
3. **Wizard UI** — [13-event-form](../../../10-design-system/INTERNAL-SCREENS/13-event-form.md); reference `kfucs-portal/src/components/admin-events/wizard/*`, rebuilt on SDC primitives and tokens.
4. **List and detail** — [12-events-list](../../../10-design-system/INTERNAL-SCREENS/12-events-list.md), [14-event-detail-review](../../../10-design-system/INTERNAL-SCREENS/14-event-detail-review.md).
5. **Storage** — `public-media` bucket policies for covers and guest-presenter photos.

6. **Phase derivation** — SQL view `public_events` computes the phase in Asia/Riyadh time; `src/modules/events/phase.ts` mirrors it; both are tested against the same table of cases.
7. **Write paths only through functions** — `save_event` (event + private details + dates + presenters in one transaction, optimistic concurrency), `transition_event`, `delete_event_draft`; the history tab reads audit rows through `event_history()` (no `audit.view` needed for people who can see the event).
8. **Storage** — `public-media` bucket (public read), upload policy for `events.edit` holders, server-side type and size checks.
9. **Primitives batch 2** — Stepper, Tabs, StatCard, EmptyState, status/phase badges (shared by Sprint 06).
10. **Sidebar** — the two events items (committee scope and management scope) become `ready`.

Every story also follows the [standard vertical-slice tasks](../../work-breakdown-structure.md#3-standard-tasks-per-story-vertical-slice) and the [Definition of Done](../../definition-of-done.md).

## Story Details and Acceptance Criteria

| Story | Given / When / Then | Rules | Traces to |
| ----- | ------------------- | ----- | --------- |
| EVT-006 | *Given* the migration on an empty database, *then* the four tables, RLS and the only write paths `save_event` / `transition_event` / `delete_event_draft` exist; `anon` cannot read a draft, and `authenticated` has no direct INSERT/UPDATE/DELETE on any event table | EV-5, EV-7, EV-8 | FR-EVT-001 |
| EVT-001 | *Given* a committee member, *when* they fill steps 1–3 and refresh on step 3, *then* the wizard restores the step and the values and offers *Discard*; *when* they press *Next* with invalid data, *then* the Arabic/English error appears inline and the first invalid field is focused; *then* the preview card updates while typing | EV-1…EV-3 | FR-EVT-001 |
| EVT-002 | *Given* a head, *when* they submit, *then* the event is `pending_review`; *when* a member tries to submit, *then* `FORBIDDEN`; *when* the leader approves with no group link, *then* `PUBLISH_GUARD:group_link` in the active language; *when* the leader requests changes with a 3-character note, *then* `NOTE_TOO_SHORT` | EV-4, EV-5 | FR-EVT-002 |
| EVT-004 | *Given* a published event, *when* the head cancels without a reason, *then* `REASON_REQUIRED`; *with* a reason the status is `cancelled` and the reason is stored | BR-EVT-006 | FR-EVT-005 |
| EVT-007 | *Given* 45 events in scope, *then* the list shows 20 per page with a working pager, tab counts match, filters and page size live in the URL, and a head sees only their committee's events | — | FR-EVT-001 |
| EVT-008 | *Given* `pending_review`, *then* only an approver sees *Approve* and *Request changes*; the private details card is hidden without `events.edit`; the history tab lists every transition with actor and note | EV-7 | FR-EVT-002/005 |
| EVT-009 | *Given* a 3 MB image or an SVG, *then* the upload is refused with `FILE_TOO_LARGE` / `FILE_TYPE`; a 1 MB PNG is stored under `events/<id>/` and shown in the preview | EV-11 | FR-EVT-007 |
| EVT-011 | *Given* the shared truth table (announced, registration open/closed, in progress, ended, cancelled, extended deadline while in progress), *then* SQL and TypeScript return the same phase for every row | EV-6 | FR-EVT-003 |
| EVT-012 | *Given* two editors on one draft, *when* the second saves a stale copy, *then* `STALE_DATA` and a reload prompt | edge case 6 | FR-EVT-001 |
| EVT-014 | *Given* a published event, *when* the dates change, *then* a confirm dialog lists the change before saving | EV-10 | FR-EVT-001 |
| TEST-003 | *Given* the seven personas, *then* every from/to/role transition is asserted in pgTAP, and an E2E creates, resumes, submits and approves an event | — | — |

## Definition of Ready (checked 2026-10-02)

- [x] ADR-012, module spec, entity definitions and the three screen blueprints exist.
- [x] RBAC, committees, audit log and the shell are in place (Sprint 04).
- [x] Pagination, Skeleton, Dialog, Field and Select primitives exist.
- [ ] Q-005 (approver) and Q-040 (event types) — **not blocking**: the recommended defaults (leader approves; six types) are implemented and can change by seed or constraint migration.

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

- [ADR-012](../../../90-decisions/ADR-012-event-model-and-wizard-from-kfucs.md), [KFUCS alignment](../../../98-reference/kfucs-event-model-alignment.md)
- [Events module](../../../11-modules/events/README.md) and [events entities](../../../05-database/entities/events.md)
- [Event lifecycle](../../../03-business-domain/event-lifecycle.md), [business rules](../../../03-business-domain/business-rules.md), [business processes](../../../03-business-domain/business-processes.md)
- Screens: [12](../../../10-design-system/INTERNAL-SCREENS/12-events-list.md), [13](../../../10-design-system/INTERNAL-SCREENS/13-event-form.md), [14](../../../10-design-system/INTERNAL-SCREENS/14-event-detail-review.md), [00 data model reference](../../../10-design-system/INTERNAL-SCREENS/00-data-model-reference.md)
- [Permission catalogue](../../../06-security/permission-catalog.md), [RLS model](../../../05-database/rls-security-model.md), [testing strategy](../../../09-quality/testing-strategy.md)
- FR-EVT-001…009, BR-EVT-001…009, ADR-004, ADR-012

---

## Implementation Status (updated at sprint end)

### Completed
| Item | Details |
| ---- | ------- |

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
