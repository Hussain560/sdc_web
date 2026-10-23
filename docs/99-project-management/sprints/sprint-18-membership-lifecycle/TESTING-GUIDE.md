# Sprint 18 — Testing guide (membership lifecycle)

How to load demo data, sign in as each kind of person, and walk the **whole lifecycle**: apply → review → decide →
activate → member → renew / suspend / leave / end → block. Everything here is **local only**.

## 1. Set up

```bash
npx supabase start          # once, if the stack is not running
npx supabase db reset       # optional: a clean database (applies all migrations)
npm run db:lifecycle        # loads ALL the demo data below (safe to run again)
npm run dev                 # http://localhost:3000
```

Password for **every** demo account: `Dev!Passw0rd1`. Mail goes to Mailpit: **http://127.0.0.1:54324**
(every e-mail the system sends appears there).

> Running the pgTAP tests (`npx supabase test db`) needs a clean database: run `npx supabase db reset` first (the demo data
> makes tests 05 and 26 fail, by design of those tests).

## 2. Accounts (sign in at `/login`)

| E-mail                                      | Who / what you see                                                                        |
| ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `dev.leader@example.test`                   | **Community leader**: everything in "العضوية" (cycles, applications, waiting list, members, leave requests, block) |
| `dev.founder@example.test`                  | Founder: can review applications too (use as a second reviewer)                           |
| `dev.admin@example.test`                    | System admin: full access, can override a claim                                           |
| `dev.head@example.test`                     | Committee head: dashboard without membership review                                       |
| `dev.regular@example.test`                  | Active member, no position: member area only                                              |
| `dev.newmember@example.test`                | **New member, never signed in before**: lands on the welcome tour (`/account/welcome`)    |
| `dev.expiring@example.test`                 | Term ends in **12 days**: sees "Request a renewal"                                        |
| `dev.expired@example.test`                  | **Expired** yesterday: notice dialog, card not valid                                      |
| `dev.suspended@example.test`                | **Suspended** (category "Inactivity" visible, internal reason hidden)                     |
| `dev.ended@example.test`                    | **Ended** (left): notice, not in the directory                                            |
| `dev.leaving@example.test`                  | Has a **pending leave request** (leadership decides)                                      |
| `dev.blocked@example.test`                  | **Blocked**: sign-in is refused and goes to the blocked notice                            |
| `dev.plain@example.test`                    | Signed-in user with no membership                                                         |

## 3. Seeded data

**Cycles** (Dashboard → العضوية → دورات العضوية)

| Cycle                          | State      | Notes                                                                       |
| ------------------------------ | ---------- | --------------------------------------------------------------------------- |
| Autumn 2026 intake (خريف 2026) | **Open**   | capacity 6, rubric (Motivation ×2, Work ×1), 38 applications                |
| Spring 2026 intake             | Completed  | 8 decided applications (5 accepted, 3 rejected)                             |
| Winter 2027 intake             | Scheduled  | opens in 20 days → the `/join` page shows the countdown if you open it only |
| Summer 2027 (draft)            | Draft      | not public                                                                  |

**Applications in the open cycle** (`/dashboard/membership/applications`): 10 new, 4 in review, 2 info requested, 5 accepted
(waiting to activate, at 1/3/5/6 days), 9 waitlisted (scored, ordered by score), 1 lapsed, 4 rejected, 3 withdrawn.
Applications 37–38 are second-time applicants (the reviewer sees the earlier application).

**Waiting list** (`/dashboard/membership/waitlist`): the 5 accepted people with the activation clock (one is urgent: ≤ 1 day
left), the waiting queue ordered by score, and the leadership digest preview.

## 4. Applicant journey (public, no account)

1. Open `/join` (signed out). The open-cycle page shows dates, capacity and "what you get".
2. **Apply**: `/join/apply` → 5 steps (personal with six name parts, study, links and bio, questions, review + consent).
   Reload mid-way: the **draft is restored**. Submit → a result page with the **reference** (`SDC-26-NNNN`) and a
   "save the decision date" calendar file. A "received" e-mail arrives in Mailpit with the tracking link.
3. **Track** without signing in: `/join/status/<token>`. Ready-made tokens for the seeded applications are
   `sha256("dev-track-<n>")` in hex; copy the link for the case you want:

| App | Reference     | State to test                                      | Link (`http://localhost:3000/join/status/…`)                                           |
| --- | ------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | SDC-26-0901   | Received                                           | `c92b3cd6f3cccd7e612c80ea35c7f2dee5faadeddf6b02555c5565a7eb305ff3`                     |
| 3   | SDC-26-0903   | Under review                                       | `5da86e644e1b9e8ab3c28376a3f63e9238542c1085fc3525ea6c32215a216ba6`                     |
| 5   | SDC-26-0905   | **Info requested** (edit only the asked field)     | `4b3186d50a4f4e90bdc38d28a3123a10f9b487ed510ae71dc81779282c025c5d`                     |
| 6   | SDC-26-0906   | **Accepted**, waiting to activate (resend link)    | `a7b85281d4ad02af78ecc172be712ca0d549055b0364f065acb0302cc9d0397c`                     |
| 7   | SDC-26-0907   | **Waitlisted** (no queue number is shown)          | `d0ff6a83fe3571c2c4efe81bb7c2795427b3e23eb93d223d8d36ff2c538d394e`                     |
| 8   | SDC-26-0908   | **Rejected** (plain, no reason)                    | `2d3690b031d8745fa3c1df949035821d71ef0543fac1a2de79b36eea8528a112`                     |
| 10  | SDC-26-0910   | Withdrawn                                          | `cf834f18f075919ca4ca9767a69eecf6f16ee72a63d4b8e678ed9caf8e00865d`                     |
| 31  | SDC-26-0931   | **Lapsed** (activation expired)                    | `138f6711ca145de30e11a6d4fd007d4706a1393f8e8c7a12f383150329c203ea`                     |

   For any other number `n` (1–38): `node -e "console.log(require('crypto').createHash('sha256').update('dev-track-n').digest('hex'))"`.
   An invalid or old token shows "This link is not valid" (and is rate limited after many tries).
4. On the tracking page of app 1 try **Withdraw** (confirmation names what it means). On app 5 edit the GitHub field and
   **Resubmit**: it returns to review. On app 6 press **Resend the activation link** and check Mailpit.

What the applicant must **never** see: reviewer names, notes, scores, queue numbers, other people's data.

## 5. Reviewer journey (`dev.leader@example.test`)

1. **Applications** (`/dashboard/membership/applications`): tabs with counts (all / new / in review / info requested /
   accepted / waitlisted / rejected), search (name, e-mail, phone, reference), filters, sort. On a phone width the table
   becomes cards.
2. Open one **new** application → **claim** it (only one reviewer holds it; the system admin can override).
   Score it with the rubric (stars 1–5 per criterion). Keyboard shortcuts: `A` accept, `W` waitlist, `I` ask for info,
   `R` reject, `J`/`K` next/previous.
3. **Accept** → a toast with **Undo** (6 seconds). Undo → the decision is reverted and the e-mail never leaves; let it
   pass → the decision e-mail goes out once (Mailpit). **Reject** is plain: no note, no reason in the mail.
4. **Ask for info** (dialog: say what and which fields) → the applicant gets a mail with the tracking link.
5. Self-decision: a reviewer **cannot decide their own application**. To see it, apply with `dev.leader@example.test` as the e-mail on the open cycle, then open that application as `dev.leader`: the decision buttons are refused (`SELF_ACTION`).
6. **Bulk**: select several applications → the bar offers accept / waitlist / reject; the confirmation **names the people
   and counts**; the result dialog lists what succeeded and what was skipped (capacity reached, already decided…).
7. **Capacity**: the open cycle has 6 places and 5 are already taken by the accepted people; accept two more and the second one is refused or waitlisted with a clear message.
   is refused or waitlisted with a clear message.

## 6. Waiting list and activation (`/dashboard/membership/waitlist`)

- **Accepted, waiting to activate** shows the clock per person; the "tomorrow" person is highlighted.
- **Resend link** per person (rate limited, mails in Mailpit).
- **Waiting queue** is ordered by score (rubric cycle). Offer a free place → the next in line gets it (a place is held for
  24 hours before the next promotion).
- Run the daily job by hand (it needs the cron secret; local `.env.local` has `CRON_SECRET`):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/membership-daily?dry=1"   # preview only
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/membership-daily"         # for real
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/membership-daily"         # again: no change
```

  It lapses expired activations (e-mail "activation lapsed", plain), promotes from the waiting list up to capacity,
  sends **30 / 7 / 1 day** term reminders, expires finished terms, and mails the leadership digest. **Running it twice must
  change nothing the second time.**

## 7. Activation of a new member

1. Accept an application whose e-mail has no account (any seeded applicant) and let the undo window pass.
2. Mailpit → the acceptance mail has the **activation link** → open it → choose a password (the welcome variant).
3. Sign in → you land on **`/account/welcome`** (5 steps, saved one by one, skippable; reopen it by going to the URL).
4. After the first sign-in the account counts as **activated**; the waiting-list clock stops for that person.

## 8. Member journey

- **`dev.regular`** → `/account/membership` ("عضويتي"): the **card** with QR, status, term bar. Buttons: full screen
  (`/card`), add to home screen (instructions), print (`/card/print`), **change the verification code** (the old QR stops
  working at once).
- Scan/open the QR link (`/verify/member/<token>`): shows name, member number, status, term end — nothing else. Rotate the
  code and reopen the old link → "Unknown code".
- **`dev.expiring`** → "Request a renewal" → leadership gets a mail and sees it in members → "ending soon".
- **Leave**: `dev.regular` → "Request to leave" (reason + preferred last day). The member **stays active** until
  leadership decides; they can withdraw the request. A member can **never end their own membership**.
- **`dev.newmember`** → welcome tour. **`dev.expired` / `dev.suspended` / `dev.ended`** → one notice dialog per sign-in
  (suspended shows the **category** only), and the card/verify page shows the real status.
- **`dev.blocked`** → sign-in is refused → `/notice/blocked` (no reason). Their sessions are ended.
- Switch language (EN/AR) and theme on every screen; check phone width (375 px).

## 9. Leadership: members and requests (`dev.leader`)

- **Members** (`/dashboard/members`): tabs (active, ending soon, leave requests, expired, ended…), selection + bulk
  **renew / suspend / reinstate / end** with dialogs that name the people; CSV export (audited).
- **Suspend** with a category (visible to the member) and an internal reason (staff only). The mail says the category.
- **Member record** → "Full history" timeline (every transition), **add an internal note** (never e-mailed).
- **Leave requests** (`/dashboard/membership/leave-requests`): approve (with a last day) or decline (plain mail, no
  reason). A leader **cannot decide their own** request; actions on a **higher role** are refused (`HIGHER_ROLE`).
- **Block / unblock** an account from the member record (needs `users.block`: leader and system admin).
- **Cycles** (`/dashboard/membership/cycles`): the funnel bars, edit the rubric (locked once someone has scored), term end
  date, activation deadline (1–30 days), publish/close.

## 10. Checks to repeat on every screen

- Arabic RTL and English LTR; dark and light; **375 px** wide (no horizontal scroll, tables as cards, targets ≥ 44 px).
- Keyboard only: Tab order, visible focus, dialogs trap focus and close with Esc.
- Empty, loading (skeleton) and error states; a user **without** the permission sees the no-permission screen.
- Motion respects "reduce motion" (system setting): animations switch off.

## 11. Automated checks

```bash
npm run check                 # format, lint, types, tokens, contrast, unit tests
npx supabase db reset && npx supabase test db   # database tests (clean DB required)
npm run e2e                   # visual gate; NOTE: baselines were already stale before this sprint (see the log)
```

Reset the demo data at any time: `npx supabase db reset && npm run db:lifecycle`.

## 12. Member data for the member page (`npm run db:lifecycle` loads it)

Open **Dashboard → العضوية → الأعضاء** (`/dashboard/members`), search the name, click the row (the whole row opens the record).
The record is the "سجل العضو" screen: header with actions, the current-term card, account, internal notes, and the
**full history** timeline.

| Name (search)             | Login                            | What the record shows                                                                      |
| ------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| ماجد علي القرني           | `dev.expiring@example.test`      | Ends in 12 days (amber term card), a pause and reinstatement, a note, a renewal request    |
| لجين محمد السلمي          | `dev.expired@example.test`       | Expired yesterday ("Renew" is the main action)                                             |
| بدر خالد العنزي           | `dev.suspended@example.test`     | Suspended (category + internal reason in the history)                                      |
| سلمى ناصر الدوسري         | `dev.ended@example.test`         | Ended after a leave request: request → approval → ended                                    |
| عبدالعزيز سعد الحمدان     | `dev.leaving@example.test`       | **Pending leave request**: a decision card in the list and on `/dashboard/membership/leave-requests` |
| ماهر عبدالله الزهراني     | `dev.blocked@example.test`       | Blocked account (history shows the block; unblock from the record)                         |
| ريم سعد الحربي            | `dev.newmember@example.test`     | Joined two days ago, not yet onboarded (welcome tour on first sign-in)                     |
| نورة عبدالله القحطاني     | `dev.regular@example.test`       | Complete public profile: photo fields, skills, projects, links, a presented event          |

Eight more unlinked members become: 3 **ending soon** (5, 20 and 28 days), 2 **expired**, 1 **suspended**, 2 **ended**
(not renewed, terminated) — so every tab of the members list has rows. In the **Ending soon** tab a bar offers
"Renew all N".

## 13. Where each redesigned screen is

| Screen                                  | Where                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------- |
| Applications list (selection, bulk bar) | `/dashboard/membership/applications` — click a row or "مراجعة"              |
| Review page (score, decision, history)  | open any application; shortcuts A W I R and J K                            |
| Member record "سجل العضو"               | `/dashboard/members/<id>`                                                  |
| Action dialogs (renew, suspend, end, block, leave…) | members list ⋮ menu or the record header                     |
| Leave requests                          | `/dashboard/membership/leave-requests` (cards) and the members list        |
| Waiting list                            | `/dashboard/membership/waitlist`                                           |
| Phone versions                          | any of the above at 375 px wide (cards, bottom bars)                       |

**System-status feedback:** click a tab, a filter or any link in the dashboard: a thin bar runs across the top and the
page dims until the new content arrives; decided rows pulse once; saving a score shows "saved at HH:MM". Loading
skeletons have the same shape as each page (including the phone card version).

## 14. Leadership edits the whole member profile

On a member record (`/dashboard/members/<id>`) press **تعديل البيانات / Edit data**. A four-step wizard opens (same look as
"Add member"):

1. **Identity and contact**: Arabic and English names, phone.
2. **Study**: status, university, track, major, sub-major.
3. **Public profile**: headline and about (AR/EN), "open to", the eight links.
4. **Skills and projects**: pick up to 12 skills; add, edit or delete up to 6 projects (projects save at once).

"Save now" / "Save" writes steps 1–3 and the skills; each change is audited (`member.updated_by_staff`,
`member.skills_updated_by_staff`, `member.project_saved_by_staff`). The **photo and the visibility switches stay with the
member** (what is shown in the directory is still their choice). Needs `members.manage` (leader, system admin); the phone
also needs `members.view_contact`. A founder or committee head can open the record but not edit.

## 15. Admin logs with data (sign in as `dev.admin@example.test`)

- **Audit log** `/dashboard/admin/audit`: about 40 rows (applications, cycles, members, positions, committees, events,
  privacy, settings). Action, entity and the field details are shown in words (no technical keys); the filters list
  action groups ("الأعضاء", "المناصب والصلاحيات"…) and entities by name.
- **E-mail log** `/dashboard/admin/emails`: 28 rows covering every lifecycle template, sent, skipped, in progress,
  retrying (2), failed for good (2) and recovered (1). Templates, entities and error reasons are shown in words.
- Loaded by `npm run db:lifecycle` (`dev-email-logs.sql`, `dev-audit-logs.sql`); only the leader and admin see them.

## 16. Full membership flow, step by step (applicant → admin → e-mail → member)

**Setup (already done in the local database):**
- The **Winter 2027 intake** is open (25 places, closes in 30 days). The Autumn intake is closed.
- The mail inbox is at **http://127.0.0.1:54324** (Mailpit). Every e-mail the app sends appears there.
- Running `npm run db:lifecycle` does not change the open cycle.

**Flow:**
1. **Apply.** Open `http://localhost:3000/join`, then "قدّم طلب العضوية". Use an address that has no account, e.g. `flow.applicant@example.test`. Finish the five steps and submit. You get a reference (SDC-26-…).
2. **Received mail.** In Mailpit, open the "استلام طلب العضوية" e-mail. It has the tracking link (`/join/status/…`). Open it: the page shows the status "received".
3. **Admin accepts.** Sign out, then sign in as `dev.admin@example.test` (password `Dev!Passw0rd1`). Go to **العضوية → الطلبات**, select the new application (or open it with "مراجعة"). Use **قبول**. You have 6 seconds to press **تراجع** (undo) before the decision mail is released.
4. **Acceptance mail.** In Mailpit, open "قبول طلب العضوية". It contains the **activation link**.
5. **Activate the account.** Open the activation link. Choose a password (the welcome screen). You are signed in and see the welcome tour at `/account/welcome`.
6. **Member is active.** Go to `/account/membership`: the card with QR, the term, and the leave/renewal options. As admin, the member appears in **العضوية → الأعضاء**, with the timeline showing: application, acceptance, activation.
7. **Other mails.** Waitlist, rejection and activation-reminder mails are in the same inbox. To trigger the daily jobs (activation reminders, lapsed activations, term reminders), run:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/membership-daily?dry=1"
   ```
   Use `dry=1` to preview; drop it to send for real. Running it twice changes nothing the second time.

**Tips:**
- Delete old test mails in Mailpit with "Delete all" before a test to keep the list clear.
- Accepting more people than the cycle has places is refused (capacity).
- The dashboard's e-mail log (**Admin → سجل البريد**) shows every send with its state.
