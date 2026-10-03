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
| **Status**          | ✅ Local scope complete 2026-10-03 — remaining: Q-007/Q-012/Q-013/Q-026/Q-030/Q-038 confirmation, staging deploy, demo |

## Sprint Objective

Reviewers decide applications in bulk and decisions are e-mailed; accepted applicants become members linked to their accounts; the public directory and profiles read a privacy-safe view; legacy members can claim their records.

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| MBR-004 | Review and decide applications (bulk); decision e-mails ⛔ Q-013 | P0 | 8 | — | ✅ Done 2026-10-03 (claim/release, bulk accept/reject/waitlist with per-row results, member create or reactivate, decision e-mails, CSV export with audit) |
| MEM-002 | Directory and profile from `member_directory` with filters ⛔ Q-007 | P0 | 5 | — | ✅ Done 2026-10-03 (directory and profile read the `member_directory` view; markup and CSS unchanged; old numeric URLs resolve through `legacy_id`) |
| MEM-003 | Members edit their profile and directory visibility ⛔ Q-030 | P0 | 5 | — | ✅ Done 2026-10-03 (`/account/member-profile`, visibility switch, leave the community) |
| MEM-004 | Legacy member import + claim flow ⛔ Q-026, Q-038 | P0 | 8 | — | ✅ Done 2026-10-03 (idempotent import with dry-run report, claim invites, one-time hashed tokens, `/claim/[token]`) |

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

- [x] Anon `select * from members` is denied (pgTAP).
- [x] The directory shows only opted-in active members; visual check unchanged.
- [x] An accepted application creates exactly one member row (idempotent).
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
| Migrations | `20270117000000_members_v2.sql`: legacy table renamed to `members_legacy` (no grants), new `members` (suspension needs a reason, https links), idempotent `private.import_legacy_members()` + `legacy_import_preview()` dry-run, `member_directory` view (active + visible, public columns, compatibility aliases for the unchanged UI), RLS (own / `members.view` / `members.manage`), `member_claim_tokens` (hashed, 7 days, single use), `update_my_member_profile`, `set_member_status` (ends committee roles), `create_member_claim_token`, `preview_member_claim`, `claim_legacy_member`, `claim_membership_application`, `decide_membership_applications`, view `membership_review_queue`; real `is_active_member()` / `applicant_is_member()`; `20270117000100_export_audit.sql` (`record_export`) |
| pgTAP | `08_members_and_review.sql` (60 assertions): import idempotency, directory privacy, self-decision, capacity under bulk decisions, one member per person, applicant view without the note, self-service limits, status changes and role ending, claim token rules (hashed, mismatch, expiry, single use), members-only events, audit and export audit |
| Module | `src/modules/members/` (schemas, queries, actions, messages, components), `src/modules/membership/review-{queries,actions}.ts`, notifications `membership.application_accepted/rejected/waitlisted` and `member.claim_invite` (token hashed in the idempotency key) |
| Screens | `/dashboard/membership/applications` (+ detail), `/dashboard/members`, `/account/member-profile`, `/claim/[token]`; public `/members` and `/members/[id]` now read `member_directory` |
| Navigation | sidebar items *Applications* and *Members* are live; every item of the documented tree except articles, committees, reports and audit/e-mail/settings is built |
| Tests | 10 unit tests, 3 new E2E (bulk accept → mails → member → profile and visibility; self-decision refused; claim flow with the wrong and the right account), RBAC sidebar expectations updated, public directory visual baselines unchanged |

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
| Committee roles require an active member | `assign_role` now enforces the documented rule for real; E2E personas and the dev persona script create member rows; assigning a position to a non-member returns `NOT_ACTIVE_MEMBER` |
| Directory filters in the URL and "load more" | The public directory still filters in the browser (as before); URL filters and cursor paging are backlog (the view is ready) |
| Social icons without links | The profile page still renders placeholder `#` icons (ME-3 UI part) — a visual change that needs sign-off, deferred |
| Moderated profile edits (Q-030) | Not implemented; edits go live immediately |
| Duplicate-merge of legacy members | The dry-run report lists duplicate names; merging is a manual SQL task before invites are sent |
| Sub-major data | Sub-majors come from legacy values only; reference-data admin can add more |
| Membership expiry / renewal (Q-012) | Intentionally absent |
| E-mail log screen | `email_logs` rows exist and are RLS-scoped; the admin screen is Sprint 09 |

### Revision after review (2026-10-03)
Accepting an application now **creates the account** and e-mails the activation link; leadership (system administrator, community leader, founders: new `members.create` permission) can also **add a member directly** from `/dashboard/members` with the same activation e-mail. See [ADR-013](../../../90-decisions/ADR-013-accounts-for-members-only.md).
