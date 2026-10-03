# Scope and Non-Goals

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## 1. In scope

| Area | Includes | Module |
| ---- | -------- | ------ |
| Public website | Home, about, vision & mission, partners, leadership display, published events, published articles, public member directory, 404 | [public-site](../11-modules/public-site/README.md) |
| Accounts | Sign-up, email confirmation, sign-in, sign-out, password reset, own account settings | [authentication](../11-modules/authentication/README.md) |
| Membership intake | Intake cycles that open and close (≈ once a year), application form, application review, decision emails | [membership](../11-modules/membership/README.md) |
| Members | Member records, member profile & directory visibility, member status | [members](../11-modules/members/README.md) |
| Committees | Committees, leadership positions, committee membership, terms | [committees](../11-modules/committees/README.md) |
| Events | Event authoring, review/approval, publishing, cancellation, completion | [events](../11-modules/events/README.md) |
| Event registration | Registration, review (accept/reject/waitlist), cancellation, attendance | [registrations](../11-modules/registrations/README.md) |
| Articles / threads | Authoring, review, publishing, archiving, bilingual content | [articles](../11-modules/articles/README.md) |
| Notifications | Transactional email (registration, decisions, membership, auth) | [notifications](../11-modules/notifications/README.md) |
| Reports | Community and committee statistics dashboards | [reports](../11-modules/reports/README.md) |
| Administration | Users, role assignments, intake cycles, configuration, audit log | [administration](../11-modules/administration/README.md) |
| Bilingual UX | Arabic (RTL, default) and English (LTR) for all public and internal screens | [design system](../10-design-system/foundations/rtl-and-i18n.md) |
| Theming | Dark (default) and light themes | [theming](../10-design-system/foundations/theming.md) |

## 2. Candidate future scope (not committed)

These appear in the current UI or community activity but are **not committed**. Each needs a stakeholder decision before it is designed.

| Candidate | Evidence | Question |
| --------- | -------- | -------- |
| Attendance certificates | Event pages state "attendance certificate available" for most past events | **OPEN Q-020** — issue certificates through the platform? |
| Partners management | Home page has a partners slider with placeholder logos | **OPEN Q-021** — real partner data and who manages it? |
| Member-to-member contact | `app/members/[id]/page.js` contains a disabled, simulated "Contact me" form | **OPEN Q-022** — is contact needed, and through what privacy-safe channel? |
| Projects showcase | Projects committee exists; mission mentions building projects | Future candidate |
| QR check-in for in-person events | KFUCS reference has it; SDC events are currently online | Future candidate |
| Site search | Header search navigates to a non-existent `/search` page | **OPEN Q-023** — global search or per-page filtering only? |

## 3. Non-goals

These are deliberately **not** part of the platform. Proposals to add them require a decision record.

| Non-goal | Reason |
| -------- | ------ |
| Pricing, paid tickets, subscriptions, invoices, payments | SDC is non-profit; events are free. |
| Multi-tenancy / hosting other communities | One community. |
| Open forum, comments, likes, direct messaging | Moderation burden and privacy risk for a volunteer team. |
| Native mobile apps | Responsive web is sufficient. |
| Course delivery / LMS | Events link to external delivery platforms. |
| Real-time chat or live streaming | Use external tools (e.g., the meeting platform). |
| Microservices, Kubernetes, self-managed servers | Disproportionate to scale; see [ADR-001](../90-decisions/ADR-001-application-architecture.md). |
| Automatic membership on sign-up | Contradicts DECISION D-001 (membership only through intake cycles). |
