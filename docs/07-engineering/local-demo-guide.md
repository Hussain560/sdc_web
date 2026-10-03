# Local Demo Guide — URLs and Demo Accounts

| Field            | Value |
| ---------------- | ----- |
| **Last Updated** | 2026-10-03 |
| **Scope**        | Local development stack only. Never use these accounts or this password on a hosted project. |

## 1. Start everything

```bash
npx supabase start        # local database, auth, storage, mail catcher
npm run db:personas       # (re)creates the demo accounts below; safe to repeat
npm run dev               # the website on http://localhost:3000
```

E2E runs end the demo accounts' roles. Run `npm run db:personas` again afterwards.

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
| `dev.member@example.test` | Committee member (AI) | `/dashboard` | Drafting events and threads for the AI committee |
| `dev.plain@example.test` | Plain user | `/account` | Registering for events, joining, own registrations and certificates |

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
| Member profile | `/account/member-profile` |
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
6. **Toasts:** every save shows a toast, top-left in Arabic and top-right in English.
7. **Theme and language:** toggle dark and light and Arabic and English from the header.

## 8. Guests and members (no sign-up)

- **Visitors never create accounts.** The header shows *Join us*; the footer has a small *Member login* link.
- **Event registration as a guest:** on any open event press *Register*, fill the modal, and the confirmation (and its e-mail, in Mailpit) arrives at once. Try the same e-mail twice, or many quick attempts, to see the refusals.
- **Check-in and certificate as a guest:** the QR page asks for the registered e-mail; the certificate e-mail links to the public certificate page where the PDF downloads.
- **Becoming a member:** open `/join` while an intake cycle is open (create one as the leader under *Membership > Cycles*), apply with a new e-mail, accept the application as the leader, then open the *Activate your account* e-mail in Mailpit and set a password.
