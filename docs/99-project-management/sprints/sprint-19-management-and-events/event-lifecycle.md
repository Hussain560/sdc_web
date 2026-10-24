# The event lifecycle — business process (Sprint 19)

> Written 2026-10-24 from the code on `develop` (migrations `20261206000000_events`, `20261220000100_registrations`,
> `20270214000000_attendance`, `20270314000000_event_ops`, `20270405000000_checkin_hardening`) plus the changes Sprint 19
> brings (marked **new**). The Sprint 18 [membership lifecycle](../sprint-18-membership-lifecycle/lifecycle.md) is the
> model for this document.

## 1. The people

| Who | Permission (scope) | What they do |
| --- | ------------------ | ------------ |
| Committee member | `events.create`, `registrations.attendance` (committee) | Drafts events, takes attendance |
| Committee head / deputy | + `events.submit`, `events.edit`, `registrations.review`, `registrations.export`, `events.complete` (committee) | Submits, decides registrations, signs off attendance, completes |
| Community leader | `events.approve`, `events.cancel` (global) and the above | Approves, requests changes, cancels |
| System admin | everything | Support; settings (certificate switch and threshold) |
| **Presenter (new)** | none — an event-scoped right: `private.is_event_presenter(event)` | Opens and closes attendance sessions, shows the QR, marks attendance on **their** event only |
| Member | an account with an active membership | Registers (member-only events too), sees status, checks in, gets the certificate |
| Guest | no account | Registers from the dialog, checks in by e-mail or QR, gets the certificate by e-mail |

## 2. Event status (stored) and transitions

`draft → pending_review → published → completed → archived`, with `changes_requested` and `cancelled` on the side.

| From | Action | To | Who | Rule |
| ---- | ------ | -- | --- | ---- |
| — | create | `draft` | `events.create` | committee required |
| `draft`, `changes_requested` | submit | `pending_review` | `events.submit` | completeness check (`INCOMPLETE:<field>`) |
| `pending_review` | withdraw | `draft` | `events.submit` | |
| `pending_review`, `draft` | approve | `published` | `events.approve` | publish guard (`PUBLISH_GUARD:<field>`) |
| `pending_review` | request changes | `changes_requested` | `events.approve` | note ≥ 10 characters |
| `published` | cancel | `cancelled` | `events.cancel` | reason required; registrants told |
| `published` | complete | `completed` | `events.complete` | the last day has passed; attendance signed off if any session exists |
| `completed`, `cancelled` | archive | `archived` | `events.complete` | |
| `draft` (never published) | delete | — | `events.delete` | |

## 3. Event phase (derived, only while `published`)

`announced → registration_open → registration_closed → in_progress → ended` (`cancelled` and `ended` also follow the
status). Riyadh time. Registration closes at `registration_end_at` (default: end of day 1) or when seats are full and
auto-close is on. The same function exists in SQL and TypeScript and is tested against one truth table.

## 4. Registration

| Status | Meaning | Who moves it |
| ------ | ------- | ------------ |
| `pending` | waiting (events that need approval) | the person registers |
| `accepted` | has a seat | reviewer, or automatic when the event does not need approval |
| `waitlisted` | no seat yet | reviewer, or automatic when full |
| `rejected` | no | reviewer (`registrations.review`) |
| `cancelled` | withdrew or removed | the person before the event, or the organizer |

Members register with their account; guests register from the dialog (ADR-013) with spam guards. Only the acceptance
e-mail is sent today (owner decision). **New:** the member sees every registration in "My events" with its status,
attendance and certificate, and each item opens the event page.

## 5. Attendance

Per event day: no row = **scheduled** → `open` → `closed` → `finalized`; then the event is signed off
(`attendance_finalized_at`).

| Step | Who today | Who after Sprint 19 |
| ---- | --------- | ------------------- |
| Open a session (late opening flagged), show the QR, live counts | `registrations.attendance` on the committee | the same **or a presenter of the event** |
| Check in | the attendee: venue QR (rotating token), online code, or by registered e-mail | unchanged |
| Manual marking and corrections (with a reason) | `registrations.attendance` | the same **or a presenter** (names only, no contact data) |
| Close a session | `registrations.attendance` | the same **or a presenter** |
| Finalize a day | `registrations.attendance` | committee only (presenter refused) |
| Sign off the event (percent per person, attended / absent, eligible ≥ threshold, default 70 %) | `events.complete` | unchanged |

## 6. Certificates

**Today:** after sign-off, `issue_certificates` creates one row per eligible person; `deliverCertificate` renders a PDF,
stores it in the private `certificates` bucket and e-mails a link to `/certificates/<id>`; the PDF has a verification QR.
Behind the `certificates_enabled` setting.

**New (Sprint 19):**

```text
eligible ─▶ generating ─▶ sent
                     └──▶ failed (reason) ─▶ resend ─▶ generating …
not eligible (below the threshold, shown with the reason; no certificate)
```

- The image (PNG, A4 landscape) is drawn when needed — to send, to view, or to download — and never stored.
- The e-mail carries the PNG as an attachment; no link, no QR (Q-E1).
- The row keeps the record: person, event, figures, template, status, attempts, last error, sent time.
- Organizers with `events.complete` and admins: preview the eligible list, send in batches with progress, see per-person
  results, resend failures, view and download any certificate. Presenters: nothing.
- A participant downloads their own from "My events".

## 7. Presenters (new)

```text
added to the event (wizard or Presenters tab)
  ├─ existing account ──────────────────────────────▶ linked
  └─ outside person: name + e-mail ─▶ account created ─▶ invitation e-mail (7-day link) ─▶ activated ─▶ linked
active window: from the day before day 1 until attendance is signed off (Q-E2)
removed from the event ─▶ rights end at once (the account stays, with nothing to see)
```

A presenter account is not a membership: no `members` row, no directory, no member-only events. The sidebar shows "My
events" only; the event page shows Overview and Attendance only.

## 8. Audit checklist (EVT-013)

Run on a clean database and on the dev site; record the result in the implementation log.

| # | Check |
| - | ----- |
| 1 | Every transition in §2 is allowed for the right role and refused (with the right code) for every other role, in pgTAP |
| 2 | Each refusal code has Arabic and English words in the UI (no raw keys) |
| 3 | Publish guard and completeness list match the wizard's checklist one to one |
| 4 | Cancelling e-mails the accepted and waitlisted people once, in their language |
| 5 | A member can find the event, register, see the status in "My events", open the event from there, cancel before it starts |
| 6 | A guest registers, gets the acceptance e-mail, checks in by e-mail and by QR |
| 7 | Seats, waitlist and auto-close behave at the boundary (last seat, cancellation frees a seat) |
| 8 | Member-only events refuse guests and non-active members (suspended, expired) |
| 9 | Attendance: late opening, two devices at once, closing with people still scanning, a correction after closing |
| 10 | Sign-off numbers match the roster; threshold from the setting; eligible count is right |
| 11 | Completing before the last day or before sign-off is refused with a clear message |
| 12 | Certificates: send, failure, resend, attachment opens, Arabic names long and short, English title present or not |
| 13 | Presenter rights: allowed list works on their event; refused on another event and on every forbidden action |
| 14 | Every list and page has a skeleton, an empty state and a no-permission state |
| 15 | Phone (360 px): no horizontal scroll, actions reachable, QR readable full screen |

## 9. E-mails

| Key | When | Notes |
| --- | ---- | ----- |
| `registration.confirmed` | accepted | existing (the only registration e-mail sent today, by owner decision) |
| `event.cancelled` | event cancelled | existing |
| `certificate.issued` | certificate sent | **changed**: PNG attached, no link |
| `presenter.invited` | outside presenter added | **new**: 7-day activation link, the event name and date |
| `presenter.added` | existing account added as presenter | **new**: link to the event in "My events" |
