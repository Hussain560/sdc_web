# Claude Design brief — Management, events, presenters and certificates

You already know our Design System v2 (the Saudi Developer Community, SDC) and the screens you designed for members,
motion and the membership lifecycle. Use them: same tokens, type, components and motion language, dark-first with a light
theme, Arabic first and right-to-left, English under `/en`. The membership dashboard you designed last (applications,
review page, members, waitlist, the card) is the standard to match: calm, dense where it helps, generous feedback, real
phone layouts, a skeleton for every page. You have full freedom on layout, flow and interaction; the list says what we
need, not how it must look.

## The idea

The "الإدارة" (Management) part of the dashboard — events, registrations, committees, articles, reports — and the
dashboard home were built before that standard and feel like admin forms. We want them to read as one product with the
membership work. The **event** is the heart of the community: it is drafted, approved, published, people register,
presenters run attendance with a QR code, attendance is signed off, and everyone who attended enough gets a certificate
in their inbox. Every step should show where things stand and what comes next, for the organizer, the presenter, the
leader and the attendee.

The business rules are in `docs/99-project-management/sprints/sprint-19-management-and-events/event-lifecycle.md`;
follow its states and words, and tell us if a rule makes a screen awkward.

## What to design

**The dashboard home, one per role** (the most visible change)

1. Today every role sees the same page: a greeting card (avatar letter, today's date, a role badge like "مدير النظام"),
   tiles and two lists. **Remove the greeting card** and design a different home for each role:
   - **System administrator**: system health — e-mails that failed, the daily jobs' last run, open privacy requests,
     blocked accounts — plus shortcuts to users and roles and the latest audit events.
   - **Leadership** (community leader, founder, advisor): what waits for their decision (event approvals, membership
     applications, leave requests), the community in numbers, upcoming events, memberships ending soon.
   - **Committee head / deputy**: their committee's events by stage, registrations waiting, attendance to sign off,
     certificates to send, articles in review.
   - **Committee member**: their drafts, the events they help with, their articles.
   - **Presenter** (new role, see below): their events and today's session, with one big "open attendance".
   Someone with several positions switches between homes. Each home: loading, empty (a new committee with nothing yet)
   and phone layouts.

**Events (for organizers)**

2. **Events list**: status tabs with counts (drafts, in review, changes requested, published, completed, cancelled,
   archived), the phase of published events (registration open, running, ended), filters (committee, type, date), search,
   phone cards, quick actions per state.
3. **Event wizard** (create and edit, four steps: identity → logistics → content → review), comfortable on a phone, with
   autosave, a live preview of the public card, the completeness checklist, and a **presenters step** where the organizer
   picks community members or invites someone from outside by name and e-mail.
4. **Event detail** — the page we never designed and the most important one. A header with title, committee, status and
   phase, the key facts (dates, place or online, seats used of total) and one primary action that fits the state (submit,
   approve, publish, open attendance, sign off, send certificates). A **lifecycle stepper**: draft → review → published →
   running → attendance signed off → certificates → completed. Tabs, each shown only to people allowed to use it:
   - **Overview**: details, private details (group and meeting links, organizer notes), contact, the public card preview,
     the content checklist, review notes when changes were requested, the cancel reason when cancelled.
   - **Registrations**: counts, the list with accept / waitlist / reject in bulk and a per-row result, export.
   - **Attendance** (item 5).
   - **Certificates** (item 7).
   - **Presenters**: who presents, their state (invited, active, removed), add / invite / remove.
   - **History**: a readable timeline, not a table.
   On a phone, tabs scroll and the actions move to a bottom bar.
5. **Attendance** inside the event: a day picker with each day's state (scheduled, open, closed, finalized), live counts
   while a session is open, the roster with search, filters and manual marking (a reason for corrections), a
   **full-screen QR mode** to project or hold up to a room (rotating code, session timer, live count, "close session"),
   and the sign-off moment (ask first; say that signed-off days cannot change and that certificates use them). The
   public check-in page you designed earlier stays as it is.
6. **Registrations page** across events: a queue of pending registrations, filters, bulk decisions with per-row results,
   phone cards.

**Certificates**

7. **The certificates tab and its lifecycle**: the eligible list before sending (with the threshold, for example 70 %,
   and who is below it and why), sending in batches with a progress bar ("12 of 40 sent"), per-person results (sent,
   failed with the reason, resend), and for admins a **view** (the certificate in a dialog) and **download** (PNG) for
   any person. Certificates are now **send and forget**: the image is made when needed, attached to the e-mail, nothing
   is stored, and there is **no link and no QR code** on it any more.
8. **Certificate templates.** Our team made a "classic" attendance certificate:
   `docs/99-project-management/sprints/sprint-19-management-and-events/references/certificate/` (`certificate-blank.png`
   and the source that draws it: teal double frame, the identity mark in the corners, the vertical logo, the title in
   Arabic and English, the statement, the round emblem and the leader's signature). It is a good base but plain white.
   Design **a set of templates** that carry the SDC identity — a background, pattern, texture or brand shapes — and still
   print well and stay readable: attendance, participation (for workshops or hackathons), and a thank-you certificate for
   presenters. A4 landscape. Show each with a short and a very long Arabic name, with and without an English event title,
   and one-day and multi-day dates. Keep the signature block and the emblem; drop the QR and the verification line. These
   templates will be built later as images, so prefer flat shapes and patterns to effects that do not survive a PNG.
9. **The certificate e-mail**: a short message in Arabic and English with the certificate attached (show how the
   attachment appears).

**Presenters — a new kind of account**

10. Some presenters come from outside the community. They get an account that is **not a membership**: they can sign in
    and run attendance for their own event and nothing else. Design:
    - the **invitation e-mail** (event name, date, what they will be able to do, the 7-day activation link) and the
      activation page in the style of the membership activation you designed;
    - their **sidebar** with only "My events" (active today, upcoming, past) and their account;
    - their **event page** with only Overview and Attendance (open the session, show the QR, mark attendance, close the
      session). They see attendee names only, never e-mails or phones, and they cannot sign off, send certificates,
      decide registrations or send e-mails — show what they see where an organizer would see those actions;
    - what they see after the event when their access has ended.

**Members**

11. **My events** (in the account area): upcoming and past registrations with status, attendance and the certificate
    (download). Every item opens the event page. Also the moment right after registering from the event page.

**The rest of Management**

12. **Committees**: the list (each committee's head, members count, events and articles this term) and the committee
    page (members and positions, events, articles, numbers), in the style of the members screens.
13. **Articles**: the list (status tabs: draft, in review, changes requested, published, archived) and the **editor** —
    Markdown with a live preview, bilingual, comfortable on a phone, with the review flow (submit, request changes,
    publish, archive).
14. **Reports**: community and committee reports with the same chart language, a period picker, and a phone layout.

For every screen: empty, loading (skeleton), error and success states, what a person without the permission sees, and
the confirmation and result for any action that affects people.

## Things to respect

- Privacy: presenters see names only; e-mails and phones never appear on public pages; certificates show only the name,
  the event, dates and attendance.
- Decisions about people are serious: confirmations name the count and the people, bulk results say what was done and
  what was skipped and why.
- The visual identity is frozen: our colours, fonts and radii only. The certificate templates may use the printed
  identity colours of the reference file (teal `#2D7566`, green `#58BF88`) because a printed file cannot use the site
  tokens.
- Arabic is the primary layout; mirror correctly for English. Both themes, 360 px phones to wide desktop, keyboard and
  screen-reader friendly, AA contrast, a reduced-motion version of every animation.

## What we'd like back

For each screen: desktop and phone layouts, the states, new components with their variants, and short behaviour notes.
For the flows: a map of the event journey for the organizer, the presenter, the leader and the attendee. The certificate
templates as separate boards. Real-looking Arabic and English sample content: a hackathon over three days, a one-evening
online talk, a cancelled workshop, an outside presenter, long names, a committee with nothing yet.

Surprise us. If you see a better way to make running an event feel effortless, or a certificate feel worth keeping,
propose it.
