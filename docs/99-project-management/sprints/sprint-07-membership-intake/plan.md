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
| **Status**          | ✅ Local scope complete 2026-10-02 — remaining: Q-002/Q-011/Q-012/Q-031 confirmation, staging deploy, demo |

## Sprint Objective

The leader schedules the annual intake cycle; `/join` shows closed / upcoming / open; signed-in users apply in a 5-step form while the window is open (D-001). If the next intake opens before this date (Q-011), Sprints 07–08 swap with 05–06.

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| MEM-001 | Reference data tables (universities, majors, tracks) seeded from legacy values | P0 | 3 | — | ✅ Done 2026-10-02 (universities, majors with sub-majors, tracks; seeded from legacy values plus defaults; admin list/edit at `/dashboard/admin/reference-data`) |
| MBR-001 | Create and schedule an intake cycle ⛔ Q-011 | P0 | 5 | — | ✅ Done 2026-10-02 |
| MBR-002 | `/join` shows open / upcoming / closed | P0 | 5 | — | ✅ Done 2026-10-02 |
| MBR-003 | Apply while the cycle is open ⛔ Q-002 | P0 | 8 | — | ✅ Done 2026-10-02 (5 steps, draft in sessionStorage, "other" university/major typed, cycle questions) |
| MBR-005 | See my application status and withdraw | P1 | 3 | — | ✅ Done 2026-10-02 (`/account/membership` and `/join`: edit and withdraw while submitted and open) |

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

- [x] Applying outside the window is rejected by the database.
- [x] One application per user per cycle.
- [x] `/join` matches the public visual language (design review sign-off).
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
| Migration | `20270103000000_membership_intake.sql`: reference tables (RLS: public read, `reference_data.manage` writes), `membership_cycles` (overlap exclusion constraint, derived `private.cycle_phase`, public view `membership_cycle_phase`), `membership_applications` (unique per cycle+user, no direct writes, owner view `my_membership_application` without the internal note), `save_membership_cycle`, `transition_membership_cycle` (publish, unpublish, open now, extend, close early, complete, delete), `submit/update/withdraw_membership_application` |
| pgTAP | `07_membership_intake.sql` (57 assertions): seeds, RLS, boundary instants of the phase, overlap, transitions, MB-1…MB-5, MB-9, MB-10, question lock, audit |
| Module | `src/modules/membership/` (types, schemas incl. the 5-step validation and Riyadh time helpers, messages, queries, actions), `src/modules/reference/`, notification `membership.application_received` |
| Screens | `/join` (closed · scheduled · closed-awaiting · open signed-out · open signed-in form · applied panel), `/account/membership`, `/dashboard/membership/cycles` (+ new/edit with question builder, contextual actions), `/dashboard/admin/reference-data`; profile menu gets *My registrations* and *Membership* |
| Navigation | sidebar items *Registrations* (committee and global), *Intake cycles*, *Reference data* are now live |
| Tests | 11 new unit tests (steps, payload, cycle form, time), 2 E2E (leader opens cycle → applicant applies, gets the e-mail, withdraws → leader closes early; reference data admin-only), `/join` visual baselines (closed state, 8) |

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
| Review and decisions | Sprint 08 (claim, bulk decide, member creation, decision e-mails, export) |
| Already-a-member check | `private.applicant_is_member()` returns false until the members table exists (Sprint 08) |
| Privacy notice | The consent text and version (`CONSENT_VERSION`) are placeholders until Q-031 is answered |
| Phone and preferred committee | Optional, per Q-011/Q-013 defaults |
| Merge duplicates and "needs mapping" list | Reference-data merge and the reviewers' mapping of typed "other" answers come with the review screen (Sprint 08) |
| `/join` countdown | Whole days only; the live "opens in one minute" demo works through the derived phase on refresh |
