# Sprint 18 — Implementation log

> Written while the work happens (unattended run). Branch: `feat/sprint-18-membership-lifecycle`. Nothing is pushed.
> Legend: ⬜ todo · 🔶 in progress · ✅ done · ✔️ verified (tests or screenshots)

## Summary (filled at the end)

_Pending — see "Final summary" at the bottom when the run finishes._

## Implementation map

Existing code that is extended (not duplicated): `src/modules/membership` (accounts, actions, review-actions, queries,
schemas, messages, components), `src/modules/members` (admin-queries, actions, MemberActions), `src/modules/notifications`
(notify, membership, retry), `src/lib/email/templates.ts`, the cron routes under `app/api/cron`, `getAccess`/`getUser`
(`src/lib/auth`), `private.write_audit`, `private.has_permission`.

| Story | DB (migration / function) | Server | UI | Design boards |
| ----- | ------------------------- | ------ | -- | ------------- |
| MBR-007 applications v2 | `20270411…applications_v2`: name parts, `reference` (SDC-YY-NNNN), `tracking_token_hash`, `info_requested`/`lapsed`, `application_events`, token functions | zod schemas, `applyForMembership` v2, tracking actions | — | form, tracking |
| MBR-008 join form | `apply_for_membership` v2 (parts, reference, token) | schemas, draft autosave | `/join` states, 5-step form, result | join (4 states), form, result, phone boards |
| MBR-009 tracking | `track_application`, `resubmit_application_by_token`, `withdraw_application_by_token`, `request_tracking_link` | actions (rate limit) | `/join/status/[token]` | tracking (all states) |
| MBR-010 list | `membership_review_queue` v2 (score, reviewer) | queries with filters/sort | list, bulk bar, phone cards | list, phone |
| MBR-011 review | `request_application_info`, events | actions | review page, shortcuts, undo, next | review |
| MBR-012 rubric | `cycles.rubric`, `application_scores`, `save_application_score` | actions | rubric editor, scoring panel | cycle form, review |
| MBR-013 waitlist | `lapse`, `waitlist_candidates`, `system_accept_applications`, `restore_application` | cron job | waitlist & activation view | waitlist |
| MEM-016 term | `members.term_*`, `cycles.term_ends_at`, `run_membership_daily`, `renew_members`, reminders | cron route | cycles form, members list | members |
| MEM-017 states | states v2, `leave requests`, transition functions | actions | my membership, leave queue | my membership, members |
| MEM-018 bulk | `suspend/reinstate/end/renew_members`, `decide_leave_requests` | actions | members list, dialogs | members, dialogs |
| MEM-019 timeline | `member_events`, `admin_member_timeline` | queries | member detail | member timeline |
| MEM-020 card | `member_no`, `card_token`, `verify_member_card`, `rotate_card_token` | actions | card, full screen, verify, print | card boards |
| ACC-008 block | `profiles.blocked_*`, `users.block`, `block/unblock_accounts` | login handling, session check | notices, dialogs | notices, dialogs |
| ACC-009 activation | `activation_reminders`, onboarding columns/functions | cron, actions | activation, onboarding | activation, onboarding |
| NOT-004 e-mails | `email_outbox` (not-before) for undo | templates ×18 + digest | previews | e-mails board |

Build order followed: database (A) → server (B) → e-mails (C) → public UI (D) → dashboard UI (E) → navigation (F) → the
internal-system responsiveness/skeleton/motion pass requested at the end.

## Decisions taken on ambiguity

| # | Decision | Why |
| - | -------- | --- |
| D1 | Applicants stay accountless (existing owner decision). The tracking token is stored as a SHA-256 hash; when a "received" mail has to be re-sent the token is rotated (the old link was never delivered). | Hash at rest, no personal data in the URL, retry route still works. |
| D2 | `term_ends_at` is a `date` (Riyadh calendar day). A member expires the day after it. | The designs show dates, not times. |
| D3 | Suspension ends the member's committee positions (existing BR-MBR-011 behaviour); reinstating does not restore them. | Pausing positions would need changes in `has_permission`; logged as a deviation from lifecycle §4. |
| D4 | The undo of a decision works through an outbox with a not-before time (`email_outbox`); the status change is real, the e-mail waits 6 s, undo reverts the decision and cancels the outbox row. | Design tension 3. |
| D5 | The activation of an account is detected from `auth.users` (password set or first sign-in) by the daily job and at sign-in. | Accounts are created by the system, no event exists when a password is set. |

## Deviations from the design

_(filled as they happen)_

## Open questions and the default used

| ID | Default used |
| -- | ------------ |
| Q-L1 | term end = cycle's `term_ends_at`, otherwise 12 months from acceptance |
| Q-L2 | "Request renewal" notifies leadership; leadership renews |
| Q-L3 | no grace period: hidden on the day after expiry |
| Q-L4 | e-mail verified after acceptance only; the review step shows the address large with "not my e-mail" |
| Q-L5 | rejected applicants may apply again; the reviewer sees the earlier application |
| Q-L6 | suspended members keep certificates and past registrations |
| Q-L7 | no vice-leader role added |
| Q-L8 | 7 days |
| Q-L9 | best score when the cycle has a rubric, otherwise order of submission; offered freed place is held for 24 hours before the next promotion (see tension 1) |
| Q-L10 | name, member number, status and term end |

## Checklist per story

| Story | Status | Notes |
| ----- | ------ | ----- |
| MBR-007 | ⬜ | |
| MBR-008 | ⬜ | |
| MBR-009 | ⬜ | |
| MBR-010 | ⬜ | |
| MBR-011 | ⬜ | |
| MBR-012 | ⬜ | |
| MBR-013 | ⬜ | |
| MEM-016 | ⬜ | |
| MEM-017 | ⬜ | |
| MEM-018 | ⬜ | |
| MEM-019 | ⬜ | |
| MEM-020 | ⬜ | |
| ACC-008 | ⬜ | |
| ACC-009 | ⬜ | |
| NOT-004 | ⬜ | |
| Internal responsiveness / skeletons / cards / motion pass | ⬜ | |

## Verification commands run

_(each command with its result)_

## What is left or risky

_(filled at the end)_
