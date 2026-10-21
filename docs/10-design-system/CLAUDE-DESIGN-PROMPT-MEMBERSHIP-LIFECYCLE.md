# Claude Design brief — The membership lifecycle

You already know our Design System v2 (the Saudi Developer Community, SDC) and the pages you designed for members and
motion. Use them: same tokens, type, components and motion language, dark-first with a light theme, Arabic first and
right-to-left, English under `/en`. Build on the system and push it further where these flows need it. You have full
freedom on layout, flow and interaction; the list below says what we need, not how it must look.

## The idea

Joining the community should feel like being welcomed, not like filling a government form. And running the community
should feel calm: leaders should see at a glance who is waiting, who is about to expire, and act on many people at once
without fear of mistakes. Today the pieces exist but they don't form one story. We want the whole lifecycle to read as
one journey, for the person and for the people who run it.

The journey: a cycle opens → someone applies (no account needed) → they get a reference and can follow their
application → a reviewer reads everything on one clear page and decides, or asks for a correction → accepted people get
an e-mail, set a password and land in a short onboarding → their membership has a term, with reminders before it ends →
it expires on its own unless renewed → a member who wants to leave sends a request that leadership approves or declines → leadership can renew, suspend, end, or block an account, one by one or in bulk →
whenever someone signs in, they understand their situation.

## What to design

**Public, for applicants and members**

1. **Join page (`/join`)** in every state: cycle open (with what happens next and when), scheduled (when it opens),
   closed (follow us), already applied, already a member.
2. **The application form.** Steps that feel light on a phone: about you (first, middle and last name in Arabic and in
   English, e-mail, phone with a country picker), study (status, university, major, track), links and a short bio, the
   cycle's own questions, then review and consent. Inline validation, a progress feeling, a saved draft. Arabic names
   can be long; English names are optional in the middle.
3. **After submitting.** A result moment with the reference number (for example `SDC-26-0142`), the e-mail we wrote to,
   what happens next and the expected decision date.
4. **Track my application** (a link from the e-mail, no sign-in): a status timeline, a message from the reviewer when
   they asked for a correction, editing only the requested parts and resubmitting, and withdrawing. Also "link not
   valid".
5. **Activation and first sign-in.** Set a password from the acceptance e-mail, an expired-link page with "send me a
   new link", and a short onboarding after the first sign-in (confirm your name, add a photo, complete your profile).
6. **Notices on sign-in**: account blocked (contact the administration), membership suspended (reason category,
   contact), membership expired (ended on a date, request renewal), membership ended. Calm, clear, never scary.
7. **Onboarding after the first sign-in.** A short guided screen shown once (skippable, reopenable from "My profile"):
   welcome and what membership gives, confirm your names, add a photo, pick a few skills, choose what is public. It
   saves progress per step and ends on the profile with the completeness meter. Make it feel like a warm start, not a
   form.
8. **My membership** in the account area, now with the **digital membership card** — name, photo (only if shown), member
   number, "member since", term end, status and a QR code. It must look good full screen on a phone, can be saved to the
   home screen and prints well. Also design the **public verification page** the QR opens (only name, member number,
   status and term end; and the "not valid" state) and the member's option to rotate the code. Beyond the card, this
   page shows: status, term dates, "ending soon", request renewal, and **ask to leave the
   community**. A member cannot leave by themselves: they send a leave request (optional reason and preferred last
   day) and stay a full member until leadership approves it. Design the request dialog (explain what happens to the
   profile and positions if it is approved), the "request sent, waiting for leadership" state with a withdraw button,
   and the approved and declined outcomes.

**Dashboard, for reviewers and leadership** (keep the dashboard's feel)

9. **Cycles** list and form: add the membership term end date per cycle, the **activation deadline** (days an accepted
   person has to activate before the place goes to the waitlist), and an optional **reviewer rubric** (up to 6 criteria
   with Arabic and English labels and weights, with a default set). Show the cycle's funnel at a glance (applied, in
   review, accepted, activated, lapsed).
10. **Applications list**: status tabs with counts (including waitlisted and lapsed), the score average and sort by score, cycle switcher, search by name part, e-mail, phone or reference,
   filters, selection with a bulk bar (accept, waitlist, reject, assign to me) and a per-row result after a bulk
   decision. On a phone: cards, not a squeezed table.
11. **Application review page** — the most important screen. Everything the applicant submitted, grouped and easy to
    scan (identity, contact, study, links, bio, answers to the cycle questions). Warnings (same e-mail or phone in an
    earlier cycle, already a member, previously rejected, blocked account). The application's history. A decision
    area that stays in reach: claim, accept, waitlist, reject, ask for a correction with a message, an internal note,
    and moving to the next application. When the cycle has a rubric, include a **scoring panel**: each reviewer gives 1 to 5
    per criterion plus a comment, sees the other reviewers' scores and the average; scores are never shown to the
    applicant and never decide on their own. Make reviewing twenty applications in a row comfortable, on desktop and phone.
12. **Members list** with lifecycle at a glance (status, term end, "ending soon", activation pending, leave request
    pending) and selection with bulk actions: renew to a date, suspend, reinstate, end membership, approve or decline
    leave requests, resend activation, e-mail the selected, export. Show the confirmation (how many, who) and the
    per-row results. Add a **leave requests queue** for leadership (count badge, who asked, since when, the member's
    reason and preferred last day, approve or decline).
13. **Member detail**: one timeline (applied, decided, activated, positions, renewals, suspensions, end) and the
    actions, each with its dialog: reason (internal), optional message to the member, dates.
14. **Block / unblock account** dialog, usable for any account, not only members.
15. **The lifecycle e-mails** in both languages: received (with tracking link), correction requested, accepted
    (activation), activation reminder, activation lapsed (plain), rejected (plain: no note and no reason), waitlisted, term reminder, expired, renewed, suspended, reinstated,
    ended, leave requested, leave approved, leave declined (plain, no message), account blocked and unblocked.

For every screen: empty, loading, error and success states, and what a person without the permission sees.

A rule you should show: when an accepted person does not activate their account in time, the place is released and
offered to the next person on the waitlist automatically. Leadership sees what changed in a daily digest and can
restore the person while a place remains. Design the waitlist view (order, score, "offer now"), the lapsed state, and
the digest.

## Things to respect

- Privacy: applicants see only their own application; internal notes are never shown to them; tracking links carry no
  personal data; e-mail and phone never appear on public pages.
- A rejection is communicated plainly: no note or reason is written to the applicant, and a declined leave request
  carries no message either. Reviewers and leadership may keep internal notes that members never see.
- Decisions about people are serious: confirmations name the people and the count, reasons are required where the
  business process asks for them, and bulk results say what was done and what was skipped and why.
- Arabic is the primary layout; mirror correctly for English. Both themes, 360 px phones to wide desktop, keyboard and
  screen-reader friendly, AA contrast, the reduced-motion version of every animation.
- The business rules are in `docs/99-project-management/sprints/sprint-18-membership-lifecycle/lifecycle.md`; follow
  its states and words, and tell us if a rule makes a screen awkward.

## What we'd like back

For each screen: desktop and phone layouts, the states, new components with their variants, and short behaviour notes.
For the flows: a map of the journey for the applicant and for the reviewer. Real-looking Arabic and English sample
content: a mix of strong and weak applications, long names, members ending soon, suspended and expired ones.

Surprise us. If you see a better way to make joining feel welcoming or reviewing feel effortless, propose it.
