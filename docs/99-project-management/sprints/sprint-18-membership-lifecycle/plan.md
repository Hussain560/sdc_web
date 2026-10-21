# Sprint 18 — Membership Lifecycle: Join, Review, Activate, Renew, End

## Sprint Metadata

| Field                 | Value |
| --------------------- | ----- |
| **Sprint #**          | 18 |
| **Duration**          | 2 weeks |
| **Start Date**        | 2026-11-01 (indicative) |
| **End Date**          | 2026-11-14 |
| **Phase / Milestone** | Phase 7 — Public redesign follow-up / M11 |
| **Capacity**          | ~30 SP — planned 40 SP (the P2 stories and the polish can slip to Sprint 19) |
| **Team**              | Tech lead + Claude; owner for design approval, copy and the open questions |
| **Status**            | ⬜ Planned — waits on step 0 (designs from Claude Design) |

## Sprint Objective

One complete, honest membership lifecycle. A person applies during an open cycle with a clear form, gets feedback at
every step, and is reviewed on a page that makes a fair decision easy. Accepted people activate their account and land
in onboarding. Membership has a term: members are reminded before it ends, it expires on its own, and leadership renews
it. Leadership can suspend, end or block, one by one or in bulk, and the person always understands what happened when
they sign in. Demo: open a cycle, apply on a phone, request more info, resubmit, accept in bulk, activate, sign in, then
let a term expire (time-travel in the test), renew it, suspend a member and block an account, in AR/EN × dark/light.

The business process is in [lifecycle.md](./lifecycle.md). The design brief is
[`CLAUDE-DESIGN-PROMPT-MEMBERSHIP-LIFECYCLE.md`](../../../10-design-system/CLAUDE-DESIGN-PROMPT-MEMBERSHIP-LIFECYCLE.md).

## Why this sprint (the gaps, checked in the code and the local database on 2026-10-21)

| # | Gap | Where |
| - | --- | ----- |
| G1 | **The join form takes one free name per language** (`full_name_ar`, `full_name_en`), unlike the member record and the add-member wizard (first, middle, last × ar/en) | `membership_applications`, `ApplicationForm.tsx` |
| G2 | **No membership term.** `members` has `joined_at` and `ended_at` but no end date, no reminders, no expiry, no renewal | `members` table |
| G3 | **`suspended` does not stop anything.** The status and a required reason exist, but no check in the sign-in path, the proxy or the member pages | `members.status`, `src/lib/auth` |
| G4 | **No way to block an account.** `profiles` has no blocked state; leadership cannot stop a person from signing in | `profiles` |
| G5 | **Ending a membership is thin.** A member can leave (`inactive`) and leaders can change one status at a time; there is no reason for termination, no e-mail, positions are not ended, no bulk actions on the members list | `set_member_status`, `MemberActions.tsx`, `dashboard/members` |
| G6 | **Applicants get little feedback.** A "received" e-mail exists, but there is no reference number, no way to check status without an account, and no "please correct this" step | `membership.application_received`, `/join` |
| G7 | **The review page is hard to review on.** The application detail page and the applications list need a redesign: all submitted fields grouped, answers readable, duplicate warnings, a sticky decision panel, next/previous through the queue; the list has no phone layout (cards) | `dashboard/membership/applications`, `[id]` |
| G8 | **Accepted people can stall.** The activation e-mail goes once; there is no reminder, no expiry handling and no onboarding after the first sign-in | `member.created`, activation flow |

## Step 0 — Designs (before any UI story starts)

Send the design brief to Claude Design with no extra limits: it receives what we need and designs the rest. The owner
approves, and the specs land as `docs/10-design-system/INTERNAL-SCREENS/` (applications, review, members lifecycle)
and `docs/10-design-system/PUBLIC-SCREENS-V2/` (join, tracking, activation, notices). The data stories (MBR-007,
MEM-016, ACC-008) start in parallel.

## User Stories

| Story ID | Title | Priority | Points | Status |
| -------- | ----- | -------- | ------ | ------ |
| MBR-007 | Applications data v2: split names (first, middle, last × ar/en), reference number, `info_requested` state, tracking token | P0 | 3 | ⬜ |
| MBR-008 | Join form redesign: steps, split names, phone with country, validation, autosave draft, submission feedback | P0 | 5 | ⬜ ⛔ step 0 |
| MBR-009 | Track my application (no account): link from the e-mail, status timeline, edit when info is requested, withdraw | P1 | 3 | ⬜ ⛔ step 0 |
| MBR-010 | Applications list redesign: filters, cycle switcher, bulk bar, phone cards | P0 | 3 | ⬜ ⛔ step 0 |
| MBR-011 | Application review page redesign: every field, answers, duplicates, history, sticky decision panel, request info, next/previous | P0 | 5 | ⬜ ⛔ step 0 |
| MEM-016 | Membership term: term dates, cycle term end, daily expiry job, reminders, renew (single and bulk) | P0 | 5 | ⬜ |
| MEM-017 | Membership states v2: `expired`, `ended` with reason, suspension that really stops access, positions end with the membership | P0 | 3 | ⬜ |
| MEM-018 | Members list bulk actions (renew, suspend, reinstate, end, resend activation, e-mail, export) with per-row results | P0 | 3 | ⬜ ⛔ step 0 |
| MEM-019 | Member detail: lifecycle timeline and actions with reasons and messages | P1 | 2 | ⬜ ⛔ step 0 |
| ACC-008 | Block and unblock accounts (`users.block`), session end, sign-in notices for blocked / suspended / expired | P0 | 3 | ⬜ |
| ACC-009 | Activation follow-up: reminders, expired link handling, resend, onboarding after the first sign-in | P1 | 2 | ⬜ |
| NOT-004 | Lifecycle e-mails (new templates, both languages, idempotent, retried) | P0 | 3 | ⬜ |

### Acceptance criteria per story

**MBR-007 — Applications data v2** (expand only)
- `membership_applications` gains `first_name_ar`, `middle_name_ar`, `last_name_ar`, `first_name_en`, `middle_name_en`,
  `last_name_en` (first and last required in both languages for new applications, ≤ 100 each). `full_name_*` stays,
  filled by a trigger from the parts, so existing queries, e-mails and exports keep working; old rows keep their full
  name and get no parts.
- Acceptance copies the parts to the member record (no more splitting the full name).
- `reference` (short human code like `SDC-26-0142`, unique) and `tracking_token` (random, hashed at rest) for the
  tracking link; `info_requested` added to the status check with `info_request` (text shown to the applicant) and
  `resubmitted_at`.
- pgTAP: parts required, full name kept in sync, reference unique, token never exposed in views, `info_requested`
  transitions (reviewer → applicant → `submitted` again).

**MBR-008 — Join form**
- Follows the approved design: steps (about you, study, links and bio, the cycle's questions, review and consent) on
  phone and desktop; names as six fields (Arabic and English side by side on desktop); phone with the country picker
  (the same `PhoneField` as the profile); e-mail entered twice or verified in the review step (Q-L4).
- Client and server validation with the same messages; the anti-spam layers of today stay (time trap, honeypot,
  rate limit).
- The draft is kept in the browser while filling (cleared on submit); nothing is sent before "submit".
- After submitting: a result screen with the reference number, what happens next and when (the cycle's target decision
  date), and the e-mail it was sent to. Closed and scheduled cycles show a clear state with the next opening date.

**MBR-009 — Track my application**
- `/join/status/<token>` (no sign-in): status timeline, the reviewer's message when info was requested, the form to fix
  only the requested parts and resubmit, and withdraw. Expired or wrong token → a neutral "link not valid" page.
- The token works only for its own application; requests are rate-limited; no personal data in the URL except the
  token.

**MBR-010 — Applications list**
- Filters in the URL (status tabs with counts, cycle, search by any name part, e-mail, phone or reference, academic
  status, track); the cycle switcher shows the open cycle first.
- Bulk bar on selection (accept, waitlist, reject, assign to me), with the existing per-row result list.
- Phone: cards with name, reference, cycle, status and the main facts; tap opens the review page.

**MBR-011 — Review page**
- Every submitted field grouped (identity, contact, study, links, bio, answers) with copy buttons for e-mail and phone;
  links open in a new tab.
- Warnings: same e-mail or phone in another cycle, already a member, previously rejected, blocked account.
- History: submitted, claimed, info requested, resubmitted, decided, e-mails sent.
- A sticky decision panel: claim, accept, waitlist, reject, request info (message to the applicant), internal note;
  keyboard shortcuts and "next application" after a decision. Phone: the panel becomes a bottom bar.

**MEM-016 — Term and renewal**
- `members.term_starts_at`, `term_ends_at`; `membership_cycles.term_ends_at` (optional); acceptance sets the term
  (Q-L1 default); legacy and manual members get a term set by the add wizard (default one year).
- A daily cron route (`/api/cron/membership-expiry`, `CRON_SECRET`) sends the 30/7/1-day reminders once each and moves
  ended terms to `expired`; idempotent; audited; covered by a test that moves the clock.
- `renew_members(ids, ends_at)` with `members.manage`, ≤ 200 per call, per-row results; renewing sets `active`.

**MEM-017 — States v2**
- `members.status`: `active`, `suspended`, `expired`, `ended` (+ `end_reason`: `left`, `terminated`, `not_renewed`,
  `legacy`); migrate `inactive` → `ended`. Status changes go through one function with the transition table of
  [lifecycle.md §2.3](./lifecycle.md) and refuse anything else.
- Ending or suspending ends (or pauses) the person's positions; the directory, member pages and member-only actions
  require `active` (RLS and functions), not just the UI.
- pgTAP: every transition allowed / refused, reasons required, positions follow, directory hides non-active members.

**MEM-018 — Bulk actions on members**
- Selection on the members list (desktop rows, phone cards), a bar with: renew, suspend, reinstate, end membership,
  resend activation, e-mail the selected (template + free text), export CSV. Dialogs ask for the reason and the
  optional message; results per row (done, skipped and why).

**MEM-019 — Member detail lifecycle**
- One timeline (applied, decided, activated, positions, renewals, suspensions, end) and the actions of §4 of the
  lifecycle with their dialogs; the term and "ending soon" are visible at the top.

**ACC-008 — Block accounts and sign-in notices**
- `profiles.blocked_at/by/reason`; `block_account` / `unblock_account` with `users.block` (new key, from the database);
  the auth user is banned so sessions end; you cannot block yourself or a system administrator unless you are one.
- After sign-in the app checks the account and membership state and shows the matching notice (blocked, suspended,
  expired, ended) from the design; blocked accounts are signed out.

**ACC-009 — Activation follow-up**
- Reminders on day 3 and day 6 when the activation link is unused; expired link page offers "send me a new link"
  (rate-limited); leadership can resend from the member page and in bulk.
- First sign-in opens onboarding: confirm names, add a photo, complete the profile (links to the Sprint 17 editor).

**NOT-004 — Lifecycle e-mails**
- The templates of [lifecycle.md §7](./lifecycle.md) in both languages, in the person's language, each sent once per
  event (idempotency key), retried by the existing route; previews in the e-mail tests.

## Suggested additions (pick in the planning meeting)

| Idea | Why | Suggested |
| ---- | --- | --------- |
| Reviewer scoring rubric (1–5 on a few criteria) and a short comment, visible to other reviewers | Fairer, faster decisions with several reviewers | P2, Sprint 19 |
| Two-reviewer rule for rejections (optional per cycle) | Avoids a single hasty "no" | P2 |
| Interview step (`interview` state with a date) | Some cycles may want a call | later, if the community asks |
| Waitlist auto-promotion when an accepted person does not activate in N days | Fills places | P2 |
| Re-apply cooldown (rejected people may apply again after one cycle) | Clear rule, less noise | Q-L5 |
| Decision e-mail texts editable by leadership | Tone and details per cycle | P2 |
| Funnel numbers per cycle (applied, accepted, activated, retained after one term) on the reports page | Measures the intake | P2 |
| Digital membership card (name, photo, member number, QR to verify) | Members like to show it; doubles as a check at events | P2 |
| Data on leaving: export my data, choose to keep or anonymise the public profile | Privacy, trust | P1 with MEM-017 |
| Appeal link in the termination e-mail | Fairness | later |

## Dependencies

| Dependency | Needed for | Status |
| ---------- | ---------- | ------ |
| Approved designs (step 0) | MBR-008…011, MEM-018, MEM-019 UI, ACC-008 notices | ⬜ |
| Owner answers Q-L1…Q-L6 | MEM-016, MBR-008, ACC-008 | ⬜ |
| A daily scheduler for the cron route (Vercel cron on the hosted project, a manual call locally) | MEM-016, ACC-009 | ⬜ |
| Owner approval of new visual baselines (separate `chore(visual)` change) | Merging the redesigned pages | ⬜ |

## Open questions

| ID | Question | Default if unanswered |
| -- | -------- | --------------------- |
| Q-L1 | How long is a membership: until a fixed date per cycle (e.g. end of the academic year) or 12 months from acceptance? | The cycle's term end date when set, otherwise 12 months |
| Q-L2 | Can members request renewal themselves, or only leadership renews? | Members can request; leadership approves |
| Q-L3 | Grace period after expiry before hiding the member from the directory? | None: hidden on the day of expiry, restored on renewal |
| Q-L4 | Verify the applicant's e-mail before the application counts (a confirmation link) or after acceptance only? | After acceptance (the activation link proves it) |
| Q-L5 | Can a rejected applicant apply again in the next cycle? | Yes; the reviewer sees the earlier application |
| Q-L6 | What does a suspended member keep: certificates, event registrations, positions? | Keeps certificates and past registrations; positions paused; cannot register for member-only events |

## Definition of Done (sprint-specific)

- `npm run check` and `npm run e2e` pass; new pgTAP tests pass (every lifecycle transition, allowed and refused);
  generated DB types committed.
- One end-to-end test walks the whole lifecycle: apply → info requested → resubmit → accept → activate → sign in →
  expire (clock moved) → renew → suspend → notice on sign-in → reinstate → end.
- Every new screen verified in AR/EN × dark/light × 360 px and desktop; axe has no new violations; keyboard-only run of
  the join form and the review page.
- The member never sees internal notes; the tracking page shows no data beyond the applicant's own application.
- Docs: lifecycle, permission catalog (`users.block`), e-mail catalog, the membership module doc and the backlog
  updated in the same pull requests.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Scope is large | Data and rules first (MBR-007, MEM-016, MEM-017, ACC-008); tracking page and suggested additions can slip |
| Automatic expiry removes access by mistake (wrong dates, timezone) | Dry-run mode in the job, Saudi time for dates, reminders before, audit, one-click renew |
| Blocking or ending the wrong people in bulk | Confirmation with the count and names, reasons required, per-row results, everything reversible except "end" (which renewal can still undo within the term) |
| Tracking links leak | Random token stored hashed, rate limit, no personal data in the URL, link expires when the cycle completes |
| E-mail volume (reminders) | Sent once per event, daily cap already in place, digest for leadership instead of one e-mail per member |
