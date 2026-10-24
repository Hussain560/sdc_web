# Sprint 19 — Management and Events: Dashboards, Event Lifecycle, Presenters, Certificates

## Sprint Metadata

| Field                 | Value |
| --------------------- | ----- |
| **Sprint #**          | 19 |
| **Duration**          | 2 + 2 weeks (19a logic and data while the designs are made, 19b the screens) |
| **Start Date**        | 2026-10-25 (indicative) |
| **End Date**          | 2026-11-21 |
| **Phase / Milestone** | Phase 7 follow-up — the "الإدارة" (Management) area on the Sprint 18 design language / M12 |
| **Capacity**          | ~30 SP per half — planned 61 SP (P2 stories and the carry-over can slip to Sprint 20) |
| **Team**              | Tech lead + Claude; owner for design approval, copy and the open questions |
| **Status**            | 🔜 Planned (2026-10-24). Step 0: send the design brief to Claude Design |

## Sprint Objective

Everything under **الإدارة** in the sidebar — events, registrations, committees, articles, reports — and the dashboard
home reach the quality of the membership work of Sprint 18: one clear lifecycle per thing, feedback for every action,
skeletons, motion, and real phone layouts. The event is the centre: it is created, approved, published, people register,
presenters (including people from outside the community) take attendance with a QR code, attendance is signed off, and
certificates are generated as images and e-mailed — send and forget.

Demo: a leader opens their own dashboard (not the admin's); a committee member creates an event on a phone; the leader
approves it; a member registers and sees it under "My events"; an external presenter is invited, activates their account,
sees only their event, opens the attendance session, shows the QR, closes the session; the organizer signs off attendance
and sends certificates with a progress bar and per-person results; an admin downloads one certificate; the participant
receives a PNG certificate in the e-mail. AR/EN × dark/light × phone/desktop.

The business process is in [event-lifecycle.md](./event-lifecycle.md). The design brief is
[`CLAUDE-DESIGN-PROMPT-MANAGEMENT-AND-EVENTS.md`](../../../10-design-system/CLAUDE-DESIGN-PROMPT-MANAGEMENT-AND-EVENTS.md).
The certificate artwork from the team is in [references/certificate/](./references/certificate/README.md).

## Why this sprint (the gaps, checked in the code on 2026-10-24)

| # | Gap | Where |
| - | --- | ----- |
| G1 | **One generic dashboard home for every role.** The same tiles and lists for the system admin, the leader and a committee member; the greeting card (avatar letter, today's date, role badge such as "مدير النظام") adds nothing and must go | `app/[locale]/(internal)/dashboard/page.tsx` |
| G2 | **The event detail page was never designed.** Plain definition lists, a history table, stat cards; no lifecycle view, no phone layout, the actions sit in a row at the top | `dashboard/events/[id]/page.tsx` |
| G3 | **Presenters cannot take attendance.** A presenter is either a profile or a guest row in `event_presenters`; every attendance function checks `registrations.attendance` on the **committee**, so a presenter without a committee role (and every outside guest, who has no account) cannot open a session or show the QR | `event_presenters`, `20270214000000_attendance.sql`, `20270314000000_event_ops.sql` |
| G4 | **Certificates are PDFs in storage with a public link.** `deliverCertificate` renders a PDF, uploads it to the private `certificates` bucket, and e-mails a link to `/certificates/<id>`; the PDF carries a verification QR. The owner wants a PNG made on the spot, attached to the e-mail, nothing stored, no link and no QR | `src/modules/attendance/certificates.tsx`, `pdf/CertificateDocument.tsx`, `app/api/certificates/[id]/pdf`, `app/[locale]/certificates/*` |
| G5 | **Certificate generation gives little feedback.** The certificates tab shows up only after every day is finalized; generation and sending run in one server action with no progress, and admins cannot simply view or download one | `CertificatesTab.tsx`, `EventTabs.tsx` |
| G6 | **The certificate artwork is plain.** The team's "classic" template (frame, corner marks, logo, signature, emblem) is good but white; it needs the SDC identity (a background, pattern or texture) and a set of templates | [references/certificate/](./references/certificate/README.md) |
| G7 | **The Management pages predate Sprint 18.** Events list, event wizard, registrations, committees, articles list and editor, reports: tables that squeeze on phones, no bulk bar with per-row results, no skeletons for every route, older layouts | `dashboard/events`, `registrations`, `committees`, `articles`, `reports` |
| G8 | **The member side of events is thin.** A member can register and `/account/registrations` lists the registrations, but the path "see event → register → see status → attend → get certificate" is not one clear journey with click-through on every item | `account/registrations`, public event page |
| G9 | **The event lifecycle has never been audited end to end** the way the membership lifecycle was: every state, who may act, what the person sees and which e-mail goes | [event-lifecycle.md](./event-lifecycle.md) §8 |

## Step 0 — Designs (before any UI story starts)

Send the design brief to Claude Design. The owner approves; the boards land under [designs/](./designs/) like Sprint 18.
The data and logic stories (EVT-013, PRS-001, CRT-001, DSH-001 data) start in parallel — they do not wait on designs.

## User Stories

### Track A — logic and data (19a, no design needed)

| Story ID | Title | Priority | Points |
| -------- | ----- | -------- | ------ |
| EVT-013 | Event lifecycle audit and fixes: every transition allowed/refused (pgTAP), feedback and e-mail per step, the checklist of [event-lifecycle.md §8](./event-lifecycle.md) | P0 | 5 |
| PRS-001 | Presenter accounts: invite a presenter (member or outside guest) to an event, account + activation link, event-scoped attendance rights | P0 | 5 |
| CRT-001 | Certificates as PNG: render on demand, attach to the e-mail, no storage, no link, no QR; retries regenerate | P0 | 5 |
| CRT-002 | Certificate lifecycle and feedback: eligibility preview, generate and send in batches with progress, per-person results, resend, view and download for admins | P0 | 3 |
| DSH-001 | Role-based dashboard data: one summary query per role (counts only what the caller may act on) | P0 | 2 |

### Track B — screens (19b, after the designs)

| Story ID | Title | Priority | Points |
| -------- | ----- | -------- | ------ |
| DSH-002 | Dashboard home per role (system admin, leadership, committee head/deputy, committee member, presenter); the greeting card removed | P0 | 5 |
| EVT-012 | Event detail redesign: header, lifecycle stepper, action bar, tabs (overview, registrations, attendance, certificates, presenters, history), phone layout | P0 | 5 |
| ATT-001 | Attendance tab and QR redesign: day picker, live counts, roster with manual marking, full-screen QR, close and sign-off with confirmations | P0 | 3 |
| PRS-002 | Presenter workspace: "My events" in the sidebar (active, upcoming, past), the event detail with only Overview and Attendance | P0 | 3 |
| EVT-010 | Events list redesign: status tabs with counts, filters, phone cards, quick actions | P0 | 3 |
| EVT-011 | Event wizard redesign (create and edit): the four steps on a phone, autosave, live preview, presenters step with invite | P0 | 5 |
| REG-010 | Registrations page redesign: cross-event queue, bulk bar with per-row results, phone cards | P1 | 3 |
| REG-011 | "My events" for members (`/account/registrations`): upcoming, past, status, attendance, certificate; every item opens the event | P1 | 2 |
| CRT-003 | Certificate templates v2 from the design (SDC identity background), template picker per event, preview | P1 | 3 |
| CMT-004 | Committees index and committee page redesign (members, events, articles, numbers) | P1 | 3 |
| ART-004 | Articles list and editor redesign (phone editor, preview, review flow) | P1 | 3 |
| RPT-004 | Reports redesign (community and committee) | P2 | 2 |

### Carry-over from Sprint 18 (optional, can slip)

Pixel review of the membership screens against the boards; rewrite or retire the five old specs; activation page
"expired" and "new link sent" states. See [Sprint 18 NEXT-STEPS](../sprint-18-membership-lifecycle/NEXT-STEPS.md).

### Acceptance criteria per story

**EVT-013 — Event lifecycle audit and fixes**
- Walk every row of the transition table in [event-lifecycle.md §2](./event-lifecycle.md) in pgTAP: allowed for the
  right permission and scope, refused for everyone else, with the same error codes the UI translates.
- Every action in the UI gives feedback: a confirmation for anything that affects people (publish, cancel, complete,
  reject registrations), a result after it (what was done, what was skipped and why), and the matching e-mail.
- The checklist in §8 is run on a clean database and on the dev site; findings are fixed or written down as stories.
- One Playwright journey walks the whole lifecycle (draft → approve → register → attend → sign off → certificates).

**PRS-001 — Presenter accounts**
- An organizer with `events.edit` on the event's committee can **invite** a presenter from the wizard or the
  Presenters tab: pick an existing account, or enter name and e-mail for someone from outside.
- An outside presenter gets an account (no membership) and an invitation e-mail with the 7-day activation link of Sprint
  18 (`/activate/<token>`); the presenter row links to the profile (`event_presenters.profile_id`).
- New permission check `private.is_event_presenter(event)` — a person is a presenter of that event, not of a
  committee. The attendance functions accept **committee permission OR presenter of the event** for: open, close and
  reopen a session, show the QR, mark attendance manually, and see the roster (names only).
- Presenters **cannot**: sign off (finalize) attendance, complete the event, see or send certificates, decide or export
  registrations, see contact details (e-mail, phone), send e-mails, or touch any other event. Enforced in the database,
  not only the UI.
- Access is limited in time: from the day before the first event day until attendance is finalized (Q-E2).
- pgTAP: presenter can do the allowed list on their event only; refused on another event and on every forbidden action;
  removing the presenter removes the rights at once.

**CRT-001 — Certificates as PNG**
- The certificate is drawn from the approved template at A4 landscape (about 2480 × 1754 px) and returned as a PNG
  buffer; nothing is written to storage; the `certificates` bucket is no longer used (data clean-up in a later contract
  migration).
- The e-mail `certificate.issued` carries the PNG as an attachment (`certificate-<event-slug>.png`) and a short text;
  **no link and no QR** (Q-E1). The mail transport gains attachments (SMTP and Mailpit).
- A retry regenerates the image (stateless). The certificate row keeps who, which event, the attendance figures,
  status and attempts — the record, not the file.
- **Spike first:** Arabic text shaping in the PNG renderer (`next/og` / Satori does not shape Arabic reliably). Options:
  render on a background PNG with `sharp` text (Pango shapes Arabic), or keep `@react-pdf/renderer` and rasterise.
  Choose by output quality on long Arabic names; record the decision in the implementation log.

**CRT-002 — Certificate lifecycle and feedback**
- States per person: eligible → generating → sent / failed (with reason) → resend; not eligible (below the threshold)
  is shown with the reason.
- The tab shows the eligible list before sending, then sends in batches with a progress bar ("12 of 40 sent"), and ends
  with a result list; leaving the page does not lose the result (the rows carry the state).
- **View** (opens the image in a dialog) and **Download** (PNG) for admins and the organizers with `events.complete`;
  generated on demand. A participant can download theirs from "My events".
- Presenters never see this tab.

**DSH-001 / DSH-002 — Dashboard per role**
- The greeting card is removed. Each role has its own home, chosen from the person's positions (the highest wins, with a
  switcher when they hold several):
  - **System admin**: system health (failed e-mails, cron last run, privacy requests, blocked accounts), users and roles
    shortcuts, audit highlights.
  - **Leadership** (leader, founder, advisor): what waits for a decision (event approvals, applications, leave
    requests), community numbers, upcoming events, membership terms ending.
  - **Committee head / deputy**: their committee's events by stage, pending registrations, attendance to sign off,
    articles in review.
  - **Committee member**: their drafts, events they help with, articles.
  - **Presenter**: their events and today's session.
- Every number comes from functions that count only what the caller may act on (as today). Skeletons, empty states and
  a phone layout for each.

**EVT-012 — Event detail**
- A header with title, committee, status and phase, the key facts (dates, place, seats used) and one primary action
  that matches the state (submit, approve, publish, open attendance, sign off, send certificates).
- A lifecycle stepper (draft → review → published → running → attendance signed off → certificates → completed).
- Tabs: Overview, Registrations, Attendance, Certificates, Presenters, History — each shown only to people who may use
  it, each with a skeleton. Phone: tabs scroll, actions move to a bottom bar.

**ATT-001 — Attendance tab and QR**
- Day picker with the state of each day; live counts; roster with search, filter and manual marking; a full-screen QR
  mode for a projector or a phone held up to the room, with the session timer and "close session".
- Close and sign-off ask first and say what follows (signed-off days cannot change; certificates use them).
- The public check-in page (designed in Sprint 15) stays as it is.

**PRS-002 — Presenter workspace**
- A presenter's sidebar has only "My events" (and their account). The list shows active (today), upcoming and past.
- Their event page has Overview (read-only, no private details beyond the meeting link) and Attendance.

**EVT-010 / EVT-011 / REG-010 / REG-011 / CMT-004 / ART-004 / RPT-004** follow the approved boards; each has empty,
loading, error and no-permission states, phone layouts (cards instead of tables) and the bulk patterns of Sprint 18.

**CRT-003 — Certificate templates**
- The templates from the design are built in the renderer chosen by the spike; an event picks its template (default:
  attendance); the preview in the wizard and the Certificates tab uses sample data.

## Open questions

| ID | Question | Default if unanswered |
| -- | -------- | --------------------- |
| Q-E1 | Without a link and a QR, is there still a public verification page (`/certificates/<id>`)? | **Removed.** The certificate carries a short id as text; leadership can confirm a certificate from the dashboard |
| Q-E2 | How long does a presenter keep access to an event? | From the day before the first day until attendance is signed off |
| Q-E3 | What does a presenter see of the attendees? | Names and attendance only; no e-mail, phone or answers |
| Q-E4 | Do presenters get a certificate (thank-you / presenting)? | Yes, as a second template (P2) |
| Q-E5 | Who may invite a presenter? | Anyone with `events.edit` on the event's committee |
| Q-E6 | One dashboard with a layout per role, or separate pages per role? | One `/dashboard` with a layout per role and a switcher for people with several positions |
| Q-E7 | One certificate template, or one per event type? | A small set (attendance, participation, presenter); the event picks one |
| Q-E8 | The leader's signature is inside the certificate artwork. May it live in the repository? | Only in the private template assets, never in docs that are shared outside the team |
| Q-E9 | Keep "only acceptance e-mails" for registrations, or add a reminder the day before? | Keep as today; the reminder is a suggestion below |

## Suggestions (pick in the planning meeting)

| Idea | Why | Suggested |
| ---- | --- | --------- |
| Check in by the **membership card QR** (Sprint 18 card) | Faster door check-in for members | P1 |
| Duplicate an event ("copy from a past event") | Most events repeat | P1 |
| Post-event feedback form (rating + one question) sent with the certificate | Measure quality | P2 |
| Reminder e-mail the day before (registered and accepted) | Fewer no-shows | P2 (needs Q-E9) |
| Event waitlist auto-promotion when someone cancels | Fills seats | P2 |
| No-show tracking per person (attended / registered ratio) shown to reviewers | Fair seat decisions | P2 |
| Post-event report (registrations funnel, attendance by day, certificates) as one page to share | Committees report to leadership | P2 |
| Bulk download of certificates as a ZIP for an event | Admin convenience | P2 |
| Social share image per event (`next/og`) | Better links on X and WhatsApp | P2 |
| Article scheduling and cover images | Content planning | P2 |
| Presenter public profile on the event page (photo, title, link) for outside presenters | Credit for guests | P2 |

## Dependencies

| Dependency | Needed for | Status |
| ---------- | ---------- | ------ |
| Approved designs (step 0) | Track B | ⬜ send the brief |
| Owner answers Q-E1…Q-E9 | PRS-001, CRT-001, DSH-002 | ⬜ defaults above |
| PNG renderer spike (Arabic shaping) | CRT-001, CRT-003 | ⬜ first task of CRT-001 |
| Mail transport with attachments (SMTP size limits on the provider) | CRT-001 | ⬜ |
| Sprint 18 activation token flow | PRS-001 | ✅ on `develop` |

## Definition of Done (sprint-specific)

- `npm run check` passes; pgTAP covers every event transition, every presenter right (allowed and refused), and the
  certificate state changes.
- `npm run e2e` passes; new journeys: the event lifecycle, the presenter flow, certificate send with an attachment
  (Mailpit).
- Every new screen checked in AR/EN × dark/light × 360 px and desktop; no new axe violations; skeleton for every route.
- No certificate file is written to storage; e-mails carry the PNG and no link.
- Docs: event lifecycle, permission catalog (presenter), e-mail catalog (presenter invitation, certificate), module docs
  (events, attendance, notifications), backlog updated.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Arabic text renders wrongly in the PNG | Spike before building; long-name and mixed-script samples in tests |
| Large attachments bounce or are slow to send | A4 at ~150 dpi, compressed PNG (< 1 MB); batches with progress; retry route |
| A presenter gets more than they should | Rights live in the database (`is_event_presenter`), pgTAP for each refused action, time window |
| Outside presenters become "members" by accident | A presenter account has no `members` row and no member pages; the directory and member-only actions require an active membership |
| Scope is large | Track A first; Track B by priority; RPT-004 and CRT-003 can slip |
