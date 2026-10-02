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
| **Capacity**        | ~30 SP — planned 57 SP after adding stories; REG-007 is stretch; PUB-003 and REG-008 move to Sprint 07 if velocity requires; re-forecast after Sprint 05 |
| **Team**            | Tech lead + volunteer developers (assigned at sprint planning) |
| **Status**          | ✅ Local scope complete 2026-10-02 — remaining: staging deploy, demo, hosted SMTP credentials |

## Read First (reference pack)

| Topic | Document | What to take from it |
| ----- | -------- | -------------------- |
| Module specs | [Registrations module](../../../11-modules/registrations/README.md) (RE-1…RE-12, concurrency sequence, error codes), [Notifications module](../../../11-modules/notifications/README.md) (NO-1…NO-8, template catalogue, retry), [Events module §Sprint 06](../../../11-modules/events/README.md), [Public site module](../../../11-modules/public-site/README.md) | Rules, operations, edge cases, tests |
| Data | [Events entities §5 registrations](../../../05-database/entities/events.md#5-event_registrations), [Platform entities §2 `email_logs`](../../../05-database/entities/platform.md#2-email_logs), [RLS model](../../../05-database/rls-security-model.md), [Migration strategy](../../../05-database/migration-strategy.md) (expand–contract, legacy baseline), [Current schema](../../../05-database/current-schema.md) | Constraints, snapshots, claim-before-send, legacy tables |
| Business | [Registration lifecycle](../../../03-business-domain/registration-lifecycle.md), [Notification rules](../../../03-business-domain/notification-rules.md), [Event lifecycle §4 phases](../../../03-business-domain/event-lifecycle.md), [Business rules BR-REG / BR-NOT](../../../03-business-domain/business-rules.md), [Business processes](../../../03-business-domain/business-processes.md) | States, triggers, who is notified |
| Architecture | [E-mail architecture](../../../04-architecture/email-architecture.md), [ADR-006 e-mail provider](../../../90-decisions/README.md), [Server logic](../../../04-architecture/server-logic-and-data-access.md) | Provider adapter, idempotency, retry |
| Public screens | [03 events list](../../../10-design-system/PUBLIC-SCREENS/03-events-list.md), [04 event detail](../../../10-design-system/PUBLIC-SCREENS/04-event-detail.md), [01 home](../../../10-design-system/PUBLIC-SCREENS/01-home.md), [11 committee legacy](../../../10-design-system/PUBLIC-SCREENS/11-committee-legacy.md), [80 public flows](../../../10-design-system/PUBLIC-SCREENS/80-public-flows.md) | Exact look to keep, target states |
| Internal screens | [15 event registrations](../../../10-design-system/INTERNAL-SCREENS/15-event-registrations.md), [11 account area](../../../10-design-system/INTERNAL-SCREENS/11-account-area.md), [00 data model reference](../../../10-design-system/INTERNAL-SCREENS/00-data-model-reference.md), [80 user flows](../../../10-design-system/INTERNAL-SCREENS/80-user-flows.md) | Reviewer table, bulk bar, e-mail status, my registrations |
| Requirements | FR-REG-001…008, FR-NOT-001…005, FR-PUB-001/003/004 in [functional requirements](../../../02-requirements/functional-requirements.md), [NFR](../../../02-requirements/non-functional-requirements.md) | Traceability |
| Engineering | [Testing strategy](../../../09-quality/testing-strategy.md) (visual gate), [Frontend architecture](../../../04-architecture/frontend-architecture.md) | Visual parity rules |
| Security | [Current system audit §3 findings](../../../01-project/current-system-audit.md), [Data protection and privacy](../../../06-security/data-protection-and-privacy.md) | The legacy exposure this sprint retires |

## Sprint Objective

Public event pages read the database and look exactly as before; visitors register through a server function; committees review registrations in the dashboard; acceptance e-mails carry the group and meeting links; legacy events and registrations are migrated; `/committee` and the open e-mail Edge Functions are retired.

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| PUB-002 | Public `/events`, `/events/[slug]` and home blocks from `public_events`; phase badges; KFUCS content blocks in the existing card style; skeletons | P0 | 8 | — | ✅ Done 2026-10-02 |
| REG-001 | Register once for an open event and see my status | P0 | 5 | — | ✅ Done 2026-10-02 |
| REG-003 | Committee reviewers decide registrations (bulk) ⛔ Q-018, Q-028 | P0 | 5 | — | ✅ Done 2026-10-02 |
| NOT-002 | Notifications module + `email_log`; registration templates; claim-before-send | P0 | 5 | — | ✅ Done 2026-10-02 |
| EVT-005 | Migrate the six events + 301 redirects from numeric URLs | P0 | 3 | — | ✅ Done 2026-10-02 |
| REG-005 | Migrate legacy registrations | P0 | 2 | — | ✅ Done 2026-10-02 |
| REG-002 | Cancel my registration before the event | P1 | 2 | — | ✅ Done 2026-10-02 |
| REG-006 | `/account/registrations`: upcoming / past / cancelled tabs, links when accepted, cancel | P1 | 3 | — | ✅ Done 2026-10-02 (single list with status chips; upcoming/past tabs deferred) |
| REG-004 | Capacity guard with row lock; auto-close when full; optional waitlist (Q-029 default: off) | P0 | 3 | — | ✅ Done 2026-10-02 (row lock, per-row CAPACITY_REACHED; waitlist per event setting) |
| REG-007 | Registrant export (CSV, UTF-8 BOM for Arabic Excel), audited | P2 | 2 | — | ✅ Done 2026-10-02 (CSV with BOM, formula-injection safe; audit-log entry deferred) |
| REG-008 | Reviewer queue `/dashboard/registrations` across events in scope, with e-mail status per row and retry | P1 | 3 | — | ✅ Done 2026-10-02 |
| PUB-003 | Home page "upcoming events" block from `public_events`; skeleton while loading | P1 | 3 | — | ✅ Done 2026-10-02 (first three events, same order as /events) |
| PUB-005 | Event detail island: sign-in prompt, confirm dialog, status chip, locked links for accepted registrants | P0 | 3 | — | ✅ Done 2026-10-02 |
| NOT-003 | Provider adapter (SMTP for Mailpit and the provider relay), React/HTML templates ar/en, `email_logs` RLS, retry route with cron secret | P0 | 3 | — | ✅ Done 2026-10-02 |
| EVT-016 | `event.cancelled` and `event.changed` e-mails to registrants (from Sprint 05 cancel and edit actions) | P1 | 3 | — | ✅ Done 2026-10-02 |
| SEC-008 | Retire the legacy surface: delete both e-mail Edge Functions, drop the anon policies, `/committee` → 301 to the new queue | P0 | 3 | — | ✅ Done 2026-10-02 (legacy table kept read-only as event_registrations_legacy) |
| TEST-004 | pgTAP: capacity race (two sessions), scope isolation, no direct grants, snapshots; E2E: register → accept → Mailpit e-mail with group link; visual baselines for the DB-driven pages | P0 | 5 | — | ✅ Done 2026-10-02 (40 pgTAP, 4 E2E, 2 unit files) |

## Technical Tasks

1. **Public pages** — [03-events-list](../../../10-design-system/PUBLIC-SCREENS/03-events-list.md), [04-event-detail](../../../10-design-system/PUBLIC-SCREENS/04-event-detail.md); same CSS classes, data from the view.
2. **Functions** — `register_for_event`, `decide_registrations`, `cancel_registration`; pgTAP for capacity races.
3. **Dashboard** — [15-event-registrations](../../../10-design-system/INTERNAL-SCREENS/15-event-registrations.md) + the `/dashboard/registrations` queue.
4. **E-mail** — provider SDK in `modules/notifications`; ar/en templates; per-recipient log; retry action ([email architecture](../../../04-architecture/email-architecture.md)).
5. **Retire** — `/committee` → 301; delete `send-registration-email` and `send-status-email`; remove the anon policies from the legacy tables.

6. **Legacy migration** — a generated, idempotent migration copies the six events (including the detail lists, FAQ, awards and contact data that live in the old page components) and maps legacy registrations by `legacy_id`; the old numeric URLs redirect with 301.
7. **Visual parity first** — the DB-driven pages keep the existing CSS classes; the visual suite is the gate; any approved difference is listed in the sprint notes.
8. **Public client calls removed** — registration and e-mail calls leave the browser; the legacy open policies are dropped in the same release that ships the replacements.
9. **Mailpit E2E** — `tests/auth` gets registration flows that read the real message and its language.

Every story also follows the [standard vertical-slice tasks](../../work-breakdown-structure.md#3-standard-tasks-per-story-vertical-slice) and the [Definition of Done](../../definition-of-done.md).

## Story Details and Acceptance Criteria

| Story | Given / When / Then | Rules | Traces to |
| ----- | ------------------- | ----- | --------- |
| PUB-002 | *Given* the six migrated events, *then* `/events` and `/events/<slug>` render with the same CSS classes and the Sprint 01 baselines stay within the threshold except the approved additions (phase badges from data); an unknown slug returns the branded 404, not event 2; `/events/1…6` redirect (301) to the slugs | BR-EVT-009 | FR-EVT-003/008 |
| REG-001 | *Given* a signed-in user and an open event, *when* they press register twice quickly, *then* exactly one row exists and the second call returns the existing status; a visitor is sent to sign-in and returns to the event | RE-1…RE-3 | FR-REG-001 |
| REG-002 | *Given* a registration, *when* the event has not started, *then* cancel works and the seat is freed; after the first day starts, `TOO_LATE_TO_CANCEL` | RE-9 | FR-REG-002 |
| REG-003 | *Given* a head of committee A, *then* they see and decide only committee A's registrations (RLS); *when* two reviewers accept for the last seat concurrently, *then* exactly one succeeds and the other gets `CAPACITY_REACHED` | RE-6, RE-7 | FR-REG-003/004 |
| NOT-002 | *Given* a decision, *when* the provider fails, *then* the decision stays, a `failed` log row exists, and *Retry* sends it exactly once (idempotency key) | NO-1…NO-3 | FR-NOT-001…003 |
| EVT-005 | *Given* the migration, *then* events 1–6 exist with bilingual details, FAQ and contact data copied from the old pages, and `legacy_id` set | MG-8 | FR-EVT-008 |
| REG-005 | *Given* legacy registrations, *then* each is linked to its event through `legacy_id`; rows whose user no longer exists keep snapshots with `user_id` null | edge case 5 | FR-REG-008 |
| SEC-008 | *Given* the final migration, *then* anon has no access to registrations, the two Edge Functions are gone and `/committee` redirects | — | Audit F-01…F-03 |
| TEST-004 | *Given* the local stack, *then* the E2E registers a user, accepts them as a reviewer and finds the group link in the Mailpit message in the user's language | — | — |

## Definition of Ready

- [ ] Sprint 05 delivered `events`, `public_events`, the wizard and the lifecycle.
- [x] Registration, notification and public-screen blueprints exist.
- [ ] Q-018 (approval default) and Q-028 (rejection wording) — **not blocking**: defaults implemented (approval on; neutral rejection text).
- [ ] Q-010 provider — local SMTP (Mailpit) works without it; the hosted adapter only needs credentials.

## Dependencies

| Dependency | Source | Status |
| ---------- | ------ | ------ |
| Q-018 approval default, Q-028 rejection wording | Leadership | Pending |
| Provider account (Q-010) | Sprint 03 | — |

## Acceptance Criteria

- [x] Visual check: `/ar/events` and an event page match the baseline (except approved additions).
- [x] Two users racing for the last seat: exactly one is accepted.
- [x] A reviewer of committee A cannot see committee B registrations.
- [x] A failed e-mail does not roll back a decision; retry works.
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

- [Registrations module](../../../11-modules/registrations/README.md), [Notifications module](../../../11-modules/notifications/README.md), [Events module](../../../11-modules/events/README.md), [Public site module](../../../11-modules/public-site/README.md)
- [Registration lifecycle](../../../03-business-domain/registration-lifecycle.md), [Notification rules](../../../03-business-domain/notification-rules.md), [Event lifecycle](../../../03-business-domain/event-lifecycle.md), [Business rules](../../../03-business-domain/business-rules.md)
- [Events entities](../../../05-database/entities/events.md), [Platform entities (`email_logs`)](../../../05-database/entities/platform.md), [Migration strategy](../../../05-database/migration-strategy.md)
- [E-mail architecture](../../../04-architecture/email-architecture.md), [Server logic](../../../04-architecture/server-logic-and-data-access.md)
- Screens: [PUBLIC 01](../../../10-design-system/PUBLIC-SCREENS/01-home.md), [03](../../../10-design-system/PUBLIC-SCREENS/03-events-list.md), [04](../../../10-design-system/PUBLIC-SCREENS/04-event-detail.md), [11](../../../10-design-system/PUBLIC-SCREENS/11-committee-legacy.md); [INTERNAL 11](../../../10-design-system/INTERNAL-SCREENS/11-account-area.md), [15](../../../10-design-system/INTERNAL-SCREENS/15-event-registrations.md)
- [Current system audit](../../../01-project/current-system-audit.md), [testing strategy](../../../09-quality/testing-strategy.md)
- FR-REG-001…008, FR-NOT-001…005, BR-REG-001…009, BR-NOT-001…004

---

## Implementation Status (updated at sprint end)

### Completed
| Item | Details |
| ---- | ------- |
| Migrations | `20261220000000_legacy_events.sql` (six events as rows, generated by `scripts/gen-legacy-events.mjs`, idempotent by `legacy_id`), `20261220000100_registrations.sql` (legacy table renamed to `event_registrations_legacy` with no grants; new `event_registrations`, legacy rows mapped by `legacy_id`; `register_for_event`, `cancel_registration`, `decide_registrations`, `cancel_registration_by_organizer`; views `my_registrations`, `event_registration_counts`; real `accepted_count`/`seats_left` in `public_events`; accepted registrants read private links), `20261220000200_email_logs.sql` (claim-before-send unique index, RLS) |
| pgTAP | `06_registrations.sql` (40 assertions): self-service rules, capacity under bulk decisions, per-row outcomes, scope isolation, no direct writes, snapshots, link visibility, audit |
| Notifications | `src/lib/email/{transport,templates}.ts` (Mailpit HTTP, SMTP, log; 7 templates ar/en, escaped, group link only in *confirmed*), `src/modules/notifications/{notify,registrations}.ts` (claim → send → log, never throws; `notify_status` on the registration), `GET /api/cron/email-retry` (bearer `CRON_SECRET`) |
| Public pages | `/events` and `/events/[slug]` are server components reading `public_events` through a cookie-less client (revalidate 60 s), rendering the existing markup/CSS; numeric URLs answer 301 to slugs; unknown slug → branded 404; home "latest events" from the same data |
| Registration UI | shared `useRegistrationFlow` (sign-in redirect, confirm dialog, server action, closed-phase dialog), `/account/registrations` (links once accepted, cancel), `/dashboard/registrations` (tabs with counts, filters, bulk and per-row decisions, cancel with reason, e-mail status and resend, CSV export) |
| Retired | both e-mail Edge Functions and their config, the anonymous registration policies, `/committee` (308 to the new queue), `src/data/allEvents.ts` |
| Tests | 144 unit, 40 pgTAP in `06`, 4 new E2E (public pages from DB, register → accept → Mailpit mail with link, full event, scope), 16 visual baselines regenerated (approved diff: unified date format, newest-first order, CTF/Cybersecurity swapped) |

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
| Members-only audience | `register_for_event` enforces `MEMBERS_ONLY`, but `private.is_active_member()` is a stub returning true until Sprint 08 |
| Event 1 phase | It has no date, so it shows *Coming soon* and registration stays closed until organisers set a date (documented behaviour change) |
| Hosted e-mail | `EMAIL_TRANSPORT=smtp` is implemented but untested against a real provider; credentials come with the staging deploy |
| Export audit | CSV export is permission-checked but not yet written to `audit_logs` |
| Legacy table | `event_registrations_legacy` is dropped in the hardening sprint after reconciliation sign-off |
| Registrations tabs | `/account/registrations` is one list with status chips; the upcoming/past/cancelled tabs from the story are backlog |
