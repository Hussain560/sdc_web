# Module — Reports & Statistics

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |
| **Phase**        | 4 |

## 1. Purpose
Give founders, leadership and committee heads a reliable view of community health, derived from operational data.

## 2. Current state
None. The committee page shows only a total registration count.

## 3. Actors and permissions
`reports.view_community` (founders, leader, advisor, admin), `reports.view_committee` (heads/deputies in scope), own activity (any user).

## 4. Requirements
FR-RPT-001…004.

## 5. Rules
[Reporting model](../../03-business-domain/reporting-model.md); RP-1…4.

## 6. Data
SQL functions `community_stats(period)`, `committee_stats(committee_id, period)`; views over registrations, members, applications, events, articles.

## 7. Routes and screens
| Route | Audience | Purpose |
| ----- | -------- | ------- |
| `/dashboard` | Any dashboard user | Role-aware overview: pending queues, key numbers in scope |
| `/dashboard/reports` | Community-level viewers | Community dashboard with period selector |
| `/dashboard/reports/committees/[id]` | Committee viewers | Committee dashboard |
| `/account/activity` | Any user | Own registrations and attendance |

## 10. Edge cases
1. Small groups (< 5) in public stats → suppressed (RP-2).
2. Events without recorded attendance → excluded from attendance rate, shown as "not recorded".

## 11. Testing
pgTAP/SQL tests of metric functions against fixture data; scope tests (head of A cannot query B).

## 12. Open questions
Q-008, Q-032.
