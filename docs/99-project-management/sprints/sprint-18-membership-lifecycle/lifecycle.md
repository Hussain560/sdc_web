# Membership lifecycle — business process (Sprint 18)

The full life of a person in the community, from the day an intake cycle opens to the day their membership ends. This
is the reference for the Sprint 18 stories ([plan](./plan.md)); the database is the authority for every rule below
(SECURITY DEFINER functions with explicit checks, audit on every change, permissions from the database per ADR-004).

## 1. The journey at a glance

```mermaid
flowchart LR
  C["Cycle opens<br/>(published, dates)"] --> F["Applicant fills the join form<br/>(no account needed)"]
  F --> S["Submitted<br/>e-mail: received + tracking link"]
  S --> R["Under review<br/>(a reviewer claims it, scores it)"]
  R -->|accept| A["Accepted<br/>account created, activation e-mail"]
  R -->|waitlist| W["Waitlisted"]
  R -->|reject| X["Rejected<br/>plain e-mail, no note or reason"]
  R -->|need more info| I["Info requested<br/>applicant edits and resubmits"]
  I --> R
  W -->|accept| A
  W -->|cycle completed| X
  A --> P["Activation: sets a password<br/>first sign-in, onboarding screen"]
  A -->|not activated in N days| LP["Place lapsed<br/>next on the waitlist is offered it"]
  LP --> A
  P --> M["Active member<br/>digital card with QR, term runs until its end date"]
  M -->|30 / 7 / 1 days before| N["Reminders"]
  M -->|term end, not renewed| E["Expired<br/>access to member areas stops"]
  E -->|leadership renews| M
  M -->|leadership| SU["Suspended (reason)<br/>sign-in shows a notice"]
  SU -->|reinstate| M
  M -->|member asks to leave| LR["Leave requested<br/>still an active member"]
  LR -->|leadership approves| L["Ended — left"]
  LR -->|leadership declines| M
  LR -->|member withdraws the request| M
  M -->|leadership ends it| T["Ended — terminated (reason)"]
```

Any account (member or not) can also be **blocked** by leadership: the person cannot sign in and sees a notice that
the account is blocked and how to contact the administration. Blocking is about the account; suspension and ending are
about the membership.

## 2. States

### 2.1 Application (`membership_applications.status`)

| State | Meaning | Who moves it | Applicant sees |
| ----- | ------- | ------------ | -------------- |
| `submitted` | Sent during an open cycle | applicant | "Received" + reference number + tracking link |
| `under_review` | A reviewer claimed it (one reviewer at a time; system admin may override) | reviewer | "Under review" |
| `info_requested` **new** | The reviewer needs a correction or more detail; the applicant can edit and resubmit while the cycle's review window lasts | reviewer → applicant | the request, a link to edit |
| `waitlisted` | Good application, no place yet | reviewer | "Waitlisted" |
| `accepted` | Becomes a member; an account is created or reused | reviewer | e-mail with the activation link |
| `rejected` | Not accepted. The applicant gets a plain e-mail with **no note and no reason**; the reviewer may keep an internal note that is never shown to anyone outside leadership | reviewer, or automatic for waitlisted when the cycle completes | the plain e-mail |
| `withdrawn` | The applicant withdrew before a decision | applicant | confirmation |

Rules: one application per e-mail per cycle (exists); a reviewer never decides their own application (exists); capacity
is checked at acceptance (exists); decisions can be taken in bulk (exists, up to 200, per-row result); every decision is
audited and e-mailed once.

### 2.1.1 Review scoring (new)

When a cycle has a rubric (up to 6 criteria), every reviewer gives a 1–5 score per criterion and an optional comment.
Scores and comments are visible to reviewers only and never to the applicant. They inform the decision (and the
waitlist order, Q-L9); they never decide on their own.

### 2.1.2 Waitlist auto-promotion (new)

An accepted person who has not activated their account within the cycle's activation deadline (default 7 days, Q-L8)
loses the place: the acceptance becomes `lapsed`, they get a plain e-mail, and the daily job offers the place to the next
waitlisted applicant (capacity respected, audited, idempotent). Leadership can restore a lapsed person while a place
remains.

### 2.2 Account activation (accepted applicants)

| State | Meaning |
| ----- | ------- |
| invited | Account created on acceptance, activation link e-mailed (valid 7 days) |
| activated | Password set; first sign-in opens onboarding (complete the profile) |
| invite expired | Link no longer valid; a reminder goes at day 3 and day 6; leadership can resend from the member page |
| lapsed | Not activated within the deadline: the place goes to the waitlist (§2.1.2) |
| onboarding | After the first sign-in a short guided screen (welcome, names, photo, skills, what is public) shown once, skippable, saved per step in the database |

### 2.3 Membership (`members.status`, expanded)

| State | Meaning | Access |
| ----- | ------- | ------ |
| `active` | A current member; `term_ends_at` set | full member access |
| `suspended` | Temporarily stopped by leadership, reason required (exists as a value, but nothing blocks access today) | sign-in shows a "membership suspended" notice; member pages, directory listing and member-only actions stop |
| `expired` **new** | The term ended without renewal (automatic, daily job) | sign-in shows "membership ended on …, contact leadership to renew"; hidden from the directory |
| `ended` **new** (replaces `inactive`) | The membership is over: `end_reason` = `left` (member chose), `terminated` (leadership, reason required), `not_renewed`, `legacy` | account stays for history (certificates, registrations) but has no member access; hidden from the directory |

Existing `inactive` rows migrate to `ended` with `end_reason = 'left'` (or `legacy` for legacy records).

### 2.3.1 Leave request (`member_leave_requests`, new)

A member can **never** end their own membership directly. They send a **leave request**; the membership stays `active` (with all access) until leadership decides.

| State | Meaning | Who moves it |
| ----- | ------- | ------------ |
| `pending` | The member asked to leave, with an optional reason and a preferred last day | member |
| `approved` | Leadership accepted: the membership becomes `ended` / `left` on the agreed date (today or the member's preferred date), positions end | `members.manage` |
| `declined` | Leadership refused; the member stays active. The member gets a plain e-mail with no message or reason; leadership talks to them directly if needed | `members.manage` |
| `withdrawn` | The member took the request back before a decision | member |

Rules: one pending request per member; a member with a pending request sees its status on "My membership" and can
withdraw it; a leader cannot decide a request about themselves (another leader or the system administrator does);
every step is audited and e-mailed once; the pending requests are a queue on the dashboard with a count badge, and
can be approved or declined one by one or in bulk.

### 2.4 Account (`profiles`, new fields)

| Field | Meaning |
| ----- | ------- |
| `blocked_at`, `blocked_by`, `blocked_reason` | Account blocked by leadership. The auth user is banned too, so existing sessions end; sign-in shows the blocked notice. Unblocking clears both. |

### 2.5 Digital membership card

Every active member has a card in "My membership": name, photo (if shown), member number, "member since", term end,
status and a QR code to `/verify/member/<token>`. The public page shows only name, member number, status and term end.
The token is rotatable and is revoked when the membership ends or the account is blocked; an expired or ended
membership shows its real status, never "active".

## 3. Term and renewal

- Each membership has `term_starts_at` and `term_ends_at`. Default (Q-L1): the term ends on the date set on the cycle
  (`membership_cycles.term_ends_at`, e.g. the end of the academic year); without it, one year after acceptance.
- Reminders e-mail the member 30, 7 and 1 day(s) before the end. The dashboard shows "ending soon" (≤ 30 days).
- At the end date a daily job (cron route protected by `CRON_SECRET`, the same pattern as the e-mail retry route)
  moves `active` → `expired`, writes the audit entry and e-mails the member. It is idempotent and safe to re-run.
- Renewal: leadership renews one or many members (bulk) to a new end date; `expired` → `active`. Q-L2 decides whether
  members can request renewal themselves (default: a "request renewal" button that notifies leadership).

## 4. Leaving, termination, suspension, blocking

| Action | Who | Needs | Effect | E-mail |
| ------ | --- | ----- | ------ | ------ |
| Ask to leave | the member | confirmation dialog, optional reason and preferred last day | creates a **pending leave request**; nothing changes yet | received (member) and a notice to leadership |
| Approve / decline a leave request | `members.manage` (system administrator, community leader, and the vice leader role if the owner adds it, Q-L7) | one click; approving can set the last day | approve: `ended` / `left`, positions end, hidden from directory; decline: member stays active | approved / declined (plain, no message) |
| End membership (terminate) | `members.manage` | reason (internal) and optional message to the member | `ended` / `terminated`, positions end | yes, with the optional message |
| Suspend / reinstate | `members.manage` | reason; optional end date of the suspension | `suspended` ↔ `active`; positions are kept but inactive | yes |
| Renew | `members.manage` | new end date | `expired` or `active` → `active` with new `term_ends_at` | yes |
| Block / unblock account | `users.block` **new** (system admin, community leader) | reason | account banned, sessions end, sign-in notice | yes |

All of them work one by one from the member page and in bulk from the members list (selection bar, ≤ 200 rows,
per-row result list like the applications bulk decision). Self-actions and actions on someone with a higher role are
refused (a community leader cannot block the system administrator; nobody blocks themselves).

## 5. What a person sees when they sign in

| Situation | What happens |
| --------- | ------------ |
| blocked account | sign-in succeeds in auth but the app shows a modal: "Your account is blocked. Contact the administration: …"; then signs out |
| suspended membership | a modal with the reason category and contact; the account area works (security, my data), member pages do not |
| expired membership | a modal "Your membership ended on <date>"; the "request renewal" action (Q-L2) |
| ended membership | the account works for history (my data, certificates); member pages say the membership has ended |
| pending leave request | no change in access; "My membership" shows "Leave request sent on <date>, waiting for leadership" with a withdraw button |

Server-side checks enforce all of this (RLS and the member functions check `status = 'active'` already for writes;
new: reads of member-only pages and the directory, and a session check for blocked accounts). The modal is only the
explanation.

## 6. Permissions (from the database, ADR-004)

| Key | Holders (default) | Used for |
| --- | ----------------- | -------- |
| `membership.manage_cycles` (exists) | system admin, community leader | cycles, term end date per cycle |
| `membership.review` (exists) | system admin, community leader | decisions, info requests, bulk decisions |
| `members.manage` (exists) | system admin, community leader | renew, suspend, end, resend activation, bulk member actions |
| `users.block` **new** | system admin, community leader | block / unblock any account |
| `members.manage` (leave requests) | system admin, community leader (and the vice leader if added, Q-L7) | approve or decline leave requests |
| `members.edit_own_name` (Sprint 17) | system admin, community leader, founders | unchanged |

## 7. E-mails (new templates marked)

`membership.application_received` (add the tracking link) · **`membership.activation_lapsed`** (plain: the place was released) · **`membership.info_requested`** ·
`membership.application_accepted` (activation) · **`membership.activation_reminder`** · `membership.application_rejected` (plain: no note, no reason)
· `membership.application_waitlisted` · **`member.term_reminder`** (30/7/1) · **`member.expired`** ·
**`member.renewed`** · **`member.suspended`** · **`member.reinstated`** · **`member.ended`** (terminated or not renewed) · **`member.leave_requested`** (to the member, and a notice to leadership) · **`member.leave_approved`** · **`member.leave_declined`** (plain, no message) ·
**`account.blocked`** · **`account.unblocked`**. Both languages, the member's preferred language, sent once
(idempotency key per event), retried by the existing retry route.

## 8. Audit and history

Every transition writes `private.write_audit` with actor, reason and before/after status. The member page shows one
timeline: applied, decided, activated, positions, renewals, suspensions, end. Reviewers see the application's own
timeline (submitted, claimed, info requested, resubmitted, decided, e-mails sent).
