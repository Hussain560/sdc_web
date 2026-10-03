# Event Lifecycle Test Guide — from creation to certificate

| Field            | Value                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------- |
| **Last Updated** | 2026-10-03                                                                                    |
| **Scope**        | Local stack only. Accounts and passwords are in the [local demo guide](local-demo-guide.md). |
| **Automated twin** | `tests/auth/events.spec.ts`, `registrations.spec.ts`, `guest-registration.spec.ts`, `attendance.spec.ts` run the same flow; all pass in `npm run e2e:auth`. |

## 0. Setup

```bash
npx supabase start
npm run db:personas
npm run dev
```

Open two browser profiles (or one normal and one private window) so you can be a signed-in person and a visitor at the same time.
Keep the mail catcher open in a tab: <http://127.0.0.1:54324>. Every e-mail below lands there.

Password for every demo account: `Dev!Passw0rd1`. Sign in at <http://localhost:3000/login>.

| You are | Account | Used in steps |
| ------- | ------- | ------------- |
| Committee head (AI) | `dev.head@example.test` | 1, 4, 5, 6, 7, 8 |
| Community leader | `dev.leader@example.test` | 0b, 2, 9 |
| Visitor (private window, not signed in) | none | 3, 5b |

### 0b. Turn certificates on (once)

Leader → `/dashboard/admin/settings` → Certificates tab: switch certificates **on**. The attendance threshold is 70 % (the KFUCS value);
a person below it does not get a certificate. Save and wait for the toast.

## 1. Create the event (head)

1. `/dashboard/events` → **New event**. The organizing committee is fixed to the head's own committee.
2. Step 1 (basics): Arabic and English titles. **Next**.
3. Step 2 (schedule and place): choose *multi-day*, dates for **two days** (for example tomorrow and the day after), times, online with a group link. **Next**.
4. Steps 3 and 4: description and goals, audience, capacity. Try leaving a required field empty first: **Next** is blocked, the error shows and the field is focused.
5. Refresh the page mid-way: the step and values come back.
6. **Submit for review**. Expected: the page shows *Pending review*.

Expected: a row appears in the history; the leader's overview queue shows the event.

## 2. Review and publish (leader)

1. `/dashboard/events` → open the event → **Request changes**. A note shorter than 10 characters is refused; write a real note and send. Status: *Changes requested*.
2. Head: open the event, see *Reviewer notes*, go through the wizard, **Submit for review** again.
3. Leader: **Approve & publish**. Status: *Published*.

Expected: the event is now on `/events` and `/en/events` and has a public page.

## 3. Register as a guest (visitor, private window)

1. Open the public event page → **Register** → modal. Fill name, e-mail (use `guest.one@example.test`), phone, tick consent, **Submit**.
2. Expected: a success message on screen. No e-mail is sent yet: the first e-mail arrives when the head accepts the registration (step 4).
3. Spam checks, all expected to be refused with a clear message: the same e-mail again (duplicate); submitting within a second of opening the modal (too fast); many attempts in a row (throttle).
4. Register two more guests (`guest.two@example.test`, `guest.three@example.test`).

## 4. Accept the registrations (head)

1. Event page → **Registrations** tab, or `/dashboard/registrations`.
2. Select a registrant → **Accept**. A confirmation dialog appears; confirm. A toast confirms and the person gets the acceptance e-mail with the group link (the only registration e-mail; rejected, waitlisted and cancelled registrations send none).
3. Accept the three guests. Click a name to open the details modal (registered at, e-mail, attendance %).

## 5. Day 1 attendance

1. Event → **Attendance** tab → *Day 1* → **Open session**, confirm in the dialog (a late opening is flagged).
2. **QR display** tab: the QR rotates every 120 s ("refreshes in…"); *Live numbers* shows who has checked in.
3. **5b. As the visitor:** open the check-in link (the QR address, `/events/<slug>/check-in?s=<session>&t=<code>`), type `guest.one@example.test`, press **Verify and check in**. Expected: *Check-in successful*; the head's live numbers show the name within seconds.
   - A wrong e-mail: *No registration found*. Reopening with an old code: *Scanner timeout*. Checking in again: *already recorded*.
4. Head: **Attendance list** tab → *Mark present* for `guest.two`; leave `guest.three` absent.
5. **Close session**, then **Finalize session**. The dialog says how many people will be recorded absent; confirm. A toast says *Session finalized*, the day is locked.

## 6. Day 2

Repeat step 5 for *Day 2*. Check in `guest.one` and `guest.two` again (so each has 100 %); leave `guest.three` out (0 %).

## 7. Sign off the event (head)

1. Attendance tab → **Finalize event attendance** (enabled only when every day is finalized). Confirm.
2. Expected: toast *Attendance signed off*. In **Registrations**, each person shows their percentage (100 %, 100 %, 0 %). **Complete** on the event page becomes available only after this.

## 8. Certificates (head)

1. A **Certificates** tab appears (only once all days are finalized and certificates are on).
2. The list shows who is eligible (≥ 70 %): `guest.one`, `guest.two`. `guest.three` is shown as not eligible.
3. **Issue and send certificates (2)** → confirm. Toast: *2 certificates issued*.
4. In Mailpit open the certificate e-mail: it links to `/certificates/<id>`.
5. As the visitor open that link: the public certificate page verifies the certificate; **Download** gives a PDF (starts with `%PDF`).
6. As the plain user or a member with an account: `/account/registrations` also lists the certificate.

## 9. Close the event (leader or head)

**Complete** the event. It leaves the open events list and stays on its public page as finished. Optionally try **Cancel event** on another event: an empty reason is refused, a real reason is saved and shown.

## 10. What to check at the end

- Audit log (admin): `/dashboard/admin/audit` has rows for event submit, approve, registrations, attendance finalization and certificates.
- E-mail log: `/dashboard/admin/emails` lists the confirmation, group-link and certificate e-mails as sent.
- Privacy: as a member, `/account/privacy` downloads your data as JSON and can request deletion; the admin completes it under `/dashboard/admin/privacy`.
- Language and theme: repeat steps 3 and 8 in English (`/en`) and in the light theme.

## 11. Cleaning up

The e2e runs and this walkthrough leave test events and registrations. To reset to a clean demo: `npx supabase db reset` then `npm run db:personas`.
