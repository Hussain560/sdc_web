# Reporting Model

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft — metric set pending **OPEN Q-008** |

## 1. Principle

Reports are **derived** from operational data (no separately maintained numbers). Each metric has one definition, implemented once (a SQL view or function), and is shown only to audiences allowed by the [permission catalog](../06-security/permission-catalog.md).

## 2. Audiences

| Dashboard | Audience | Scope |
| --------- | -------- | ----- |
| Community dashboard | Founders, community leader, advisor, system admin | All committees |
| Committee dashboard | Committee head, deputy | Own committee |
| My activity | Any signed-in user | Own registrations, attendance, application status |
| Public statistics | Everyone | Aggregates only (e.g., total members, events held) — **OPEN Q-008** |

## 3. Metric catalogue (Proposed)

| Metric | Definition | Breakdown | Audience |
| ------ | ---------- | --------- | -------- |
| Active members | Members with status `active` | by joining cycle, university, academic status, track, committee | Community, committee (own) |
| New members per cycle | Accepted applications in a cycle | by cycle | Community |
| Application funnel | Submitted → accepted / rejected / waitlisted / withdrawn | by cycle | Community |
| Events held | Events `published`/`completed` with `ends_at` in period | by committee, type, format | Community, committee |
| Registrations | Registrations created in period | by event, status | Community, committee |
| Acceptance rate | accepted ÷ (accepted + rejected) | by event | Community, committee |
| Attendance rate | attended ÷ accepted (events with attendance recorded) | by event, committee | Community, committee |
| Member participation | Share of registrations made by members vs non-members | by event | Community, committee |
| Content output | Articles published in period | by committee | Community, committee |
| Committee size | Active committee members | by committee | Community, committee (own) |
| Pending work | Events/articles awaiting review; applications awaiting decision | by queue | Approvers |

## 4. Rules

| # | Rule | Status |
| - | ---- | ------ |
| RP-1 | Dashboards show aggregates; drilling into personal data requires the corresponding operational permission (e.g., `registrations.review`). | Proposed |
| RP-2 | Public statistics never expose counts small enough to identify individuals (minimum group size 5). | Proposed |
| RP-3 | Exports containing personal data are audited. | Proposed |
| RP-4 | Periods default to the current membership year (between intake cycles) — **OPEN Q-008**. | Proposed |
