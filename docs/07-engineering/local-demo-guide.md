# Local Demo Guide — URLs and Demo Accounts

| Field            | Value |
| ---------------- | ----- |
| **Last Updated** | 2026-10-11 |
| **Scope**        | Local development stack only. Never use these accounts or this password on a hosted project. |

For the full event walkthrough (create, publish, register, check in, certificates) see the [event lifecycle test guide](event-lifecycle-test-guide.md).

## 1. Start everything

```bash
npx supabase start        # local database, auth, storage, mail catcher
npm run db:personas       # (re)creates the demo accounts below; safe to repeat
npm run db:demo           # the demo events (every event-page state, filled seats, attendance records)
npm run dev               # the website on http://localhost:3000
```

E2E runs end the demo accounts' roles. Run `npm run db:personas` again afterwards. A `supabase db reset` removes
the accounts **and** the demo events: run both commands again, in this order: `db:personas`, then `db:demo`.
Run the database tests (`npx supabase test db`) on a freshly reset database **before** `db:demo`, because the demo
rows change some counts.

## 2. Services

| Service | URL | Notes |
| ------- | --- | ----- |
| Website (Arabic, default) | <http://localhost:3000> | RTL |
| Website (English) | <http://localhost:3000/en> | LTR |
| Mail catcher (Mailpit) | <http://127.0.0.1:54324> | Every e-mail the app sends lands here (confirmations, registration, certificates) |
| Supabase API | <http://127.0.0.1:54321> | |
| Database | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` | pgTAP: `npx supabase test db` |

## 3. Demo accounts

Password for **all** accounts: `Dev!Passw0rd1`. Sign in at `/login` (English: `/en/login`).

| Account | Role | Lands on | Good for |
| ------- | ---- | -------- | -------- |
| `dev.admin@example.test` | System administrator | `/dashboard` | Audit log, site settings, partners, reference data, e-mail log, users and roles, everything below |
| `dev.leader@example.test` | Community leader | `/dashboard` | Reports, events approval, committees, membership review, members; no audit log |
| `dev.founder@example.test` | Founder | `/dashboard` | Read-mostly: reports, events pipeline, committees, roles (read-only) |
| `dev.head@example.test` | Committee head (AI) | `/dashboard` | Own committee: events wizard, registrations, articles, attendance, committee report |
| `dev.advisor@example.test` | Advisor | `/dashboard` | Read-only reports |
| `dev.member@example.test` | Committee member (AI) | `/dashboard` | Drafting events and threads for the AI committee |
| `dev.deputy@example.test` | Committee deputy (AI), the "vice" of a committee head | `/dashboard` | The head's work without managing the committee's members |
| `dev.head2@example.test` | Committee head (Cybersecurity) | `/dashboard` | A second committee: checks that scopes do not leak between committees |
| `dev.member2@example.test` | Committee member (Cybersecurity) | `/dashboard` | Cannot see the AI committee's items |
| `dev.regular@example.test` | Community member, no position | `/account` | The member area and own profile; no dashboard, so the header keeps the profile menu |
| `dev.plain@example.test` | Plain user (not a member) | `/account` | Registering for events, the *Apply for membership* path, own registrations and certificates |

Who sees what in the public header: people with a position get one **Dashboard** button; everyone else signed in
gets the profile menu (account, sign out).

## 3b. Demo events (`npm run db:demo`)

One event per state of the event page; dates are relative to today, so the states stay true. Open them at
`/events/<slug>` (English: `/en/events/<slug>`).

| Slug | State |
| ---- | ----- |
| `demo-opens-soon` | S1: registration opens in a few days (date known) |
| `demo-open` | S2: open, 49 of 60 seats taken, presenters, goals, FAQ, details |
| `demo-closes-soon` | S3: registration closes in 20 hours |
| `demo-waitlist` | S4: full, waiting list on |
| `demo-full` | S5: full, no waiting list |
| `demo-closed` | S6: registration closed, event not started |
| `demo-members-only` | S7: members only |
| `demo-running` | S10: running, no check-in session |
| `demo-checkin` | S9: running with an open check-in session and attendance records (4 checked in, 3 waiting, 1 pending, 1 waitlisted) |
| `demo-finished` | S11: finished |
| `demo-cancelled` | S12: cancelled, with a reason |
| `demo-announced` | S13: date to be announced |

The registered states (S8: registered, under review, on the waiting list) need a signed-in member: sign in as
`dev.regular@example.test` and register for `demo-open` (or `demo-waitlist` for the waiting list).

### Testing check-in

The check-in link needs a code that is valid for 120 seconds, so open it from the dashboard QR panel (event
`demo-checkin`, tab *Attendance*, *Show QR*, then *Copy link*), or generate one on the command line:

```bash
docker exec supabase_db_sdc_web psql -U postgres -d postgres -Atc "select floor(extract(epoch from now()))::bigint::text || '.' || private.qr_token(qr_secret, floor(extract(epoch from now()))::bigint) from public.attendance_sessions where status = 'open' limit 1"
```

Open `/events/demo-checkin/check-in?s=<session id>&t=<that code>`. Registered demo e-mails that have not checked in
yet: `demo-wait-1@example.test`, `demo-wait-2@example.test`, `demo-wait-3@example.test`. After 130 seconds the same
link says *This code expired*, the moment it opens. The answer always waits 3 to 4 seconds. Twelve refused attempts
from one address, or five for one e-mail, trigger the *Too many attempts* state.

### The registration form

Guests give four names (Arabic first and last name accept Arabic letters only, English first and last name Latin
letters only: the wrong script is dropped as you type), an e-mail and a mobile number with a country picker. Saudi
numbers are formatted `5x xxx xxxx` and stored as `+966…`. After a successful registration the dialog offers
*Google Calendar*, *Apple Calendar* (the `.ics` file) and a plain file download.

## 4. Public pages

| Page | Arabic | English |
| ---- | ------ | ------- |
| Home (events, threads, members, partners, footer) | `/` | `/en` |
| Events | `/events` | `/en/events` |
| Event detail | `/events/<slug>` e.g. `/events/google-ai-studio-workshop` | `/en/events/<slug>` |
| Event check-in (opened by the QR; no sign-in, type the registered e-mail) | `/events/<slug>/check-in?s=<session>&t=<code>` | `/en/events/<slug>/check-in?...` |
| Threads (articles) | `/articles` | `/en/articles` |
| Committee page | `/committees/ai` | `/en/committees/ai` |
| Members directory | `/members` | `/en/members` |
| Join the community: the application form, no account needed | `/join` | `/en/join` |
| Certificate verification | `/certificates/<id>` | `/en/certificates/<id>` |
| About | `/about` | `/en/about` |
| Member login · Forgot password (no sign-up: `/register` leads to `/join`) | `/login` · `/forgot-password` | same under `/en` |

## 5. Account area (any signed-in user)

| Page | URL |
| ---- | --- |
| Overview | `/account` |
| Profile | `/account/profile` |
| Member profile | `/account/profile` |
| My membership | `/account/membership` |
| My registrations (attendance %, certificates) | `/account/registrations` |
| My roles | `/account/roles` |
| Security | `/account/security` |

## 6. Dashboard (needs a position)

| Screen | URL | Sees it |
| ------ | --- | ------- |
| Overview (queues, tiles, activity) | `/dashboard` | every position |
| Events | `/dashboard/events` | admin, leader, founder, head, member |
| New event (4-step wizard) | `/dashboard/events/new` | leader, head, member |
| Event tabs: Registrations, Attendance (list and QR), Certificates | `/dashboard/events/<id>?tab=registrations` · `?tab=attendance` · `?tab=certificates` | admin, leader, head (members: attendance) |
| Registrations | `/dashboard/registrations` | admin, leader, head |
| Articles (threads) | `/dashboard/articles` | admin, leader, head, member |
| Committees | `/dashboard/committees` | admin, leader, founder; head sees own |
| Membership cycles | `/dashboard/membership/cycles` | admin, leader |
| Membership applications | `/dashboard/membership/applications` | admin, leader |
| Members | `/dashboard/members` | admin, leader, founder |
| **Community reports** | `/dashboard/reports` | admin, leader, founder |
| **Committee report** | `/dashboard/reports/committees/<id>` | those, and the head of that committee (`/dashboard/reports` redirects a head here) |
| Users | `/dashboard/admin/users` | admin, leader |
| Roles and positions | `/dashboard/admin/roles` | admin, leader, founder (read-only) |
| **Audit log** | `/dashboard/admin/audit` | admin only |
| E-mail log | `/dashboard/admin/emails` | admin, leader |
| Reference data (universities, majors, tracks, thread tags) | `/dashboard/admin/reference-data` | admin, leader |
| **Site settings** (general, certificates) | `/dashboard/admin/settings` | admin, leader |
| **Partners** | `/dashboard/admin/settings?tab=partners` | admin, leader |

English dashboard URLs add `/en` in front, for example `/en/dashboard/reports`.

## 7. Things worth trying

1. **Reports:** sign in as the leader, open `/dashboard/reports`, switch the period, open a committee row. Sign in as the head and open `/dashboard/reports` to see the redirect.
2. **Settings reach the footer:** as the admin change the Instagram link in settings, then look at the footer on `/en`.
3. **Audit trail:** as the admin open `/dashboard/admin/audit`, filter by action `settings`, expand a row, export the CSV.
4. **Partners strip:** the local database holds 12 placeholder partners so the home page looks complete. Delete them all in the Partners tab and the strip disappears.
5. **Attendance and certificates:** as the leader turn on certificates in settings, open an event (for example *Google AI Studio Workshop*, which has demo registrants), go to *Attendance*, open the session, show the QR display (120 s rotation, live numbers), open the check-in link in a private window and type `demo.sara@example.test`, mark others manually, close and finalize the day, sign off the event, then use the *Certificates* tab; the e-mails arrive in Mailpit.
6. **Toasts:** every save shows a toast at the top, in the inline-end corner (top-left in Arabic, top-right in English).
7. **Theme and language:** toggle dark and light and Arabic and English from the header.

## 8. Guests and members (no sign-up)

- **Visitors never create accounts.** The header shows *Join us*; the footer has a small *Member login* link.
- **Event registration as a guest:** on any open event press *Register*, fill the modal, and the confirmation (and its e-mail, in Mailpit) arrives at once. Try the same e-mail twice, or many quick attempts, to see the refusals.
- **Check-in and certificate as a guest:** the QR page asks for the registered e-mail; the certificate e-mail links to the public certificate page where the PDF downloads.
- **Becoming a member:** open `/join` while an intake cycle is open (create one as the leader under *Membership > Cycles*), apply with a new e-mail, accept the application as the leader, then open the *Activate your account* e-mail in Mailpit and set a password.
- **Adding a member directly:** as the leader (or a founder) open *Members* and press *Add member*; the new member receives the *Activate your account* e-mail in Mailpit.

- **WhatsApp group in the welcome e-mail:** as the admin or leader open *Settings* and set *Community WhatsApp group link* (https://chat.whatsapp.com/…). It appears as a green button in the membership acceptance and add-member e-mails; leave it empty to hide it.
