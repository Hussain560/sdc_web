# Module — Committees & Positions

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |
| **Phase**        | 2 (model, seeding, role assignment), 4 (committee management UI, committee pages) |

## 1. Purpose
Represent SDC's committees and who holds which position for which term, as the single source for both the public leadership display and authorization scope.

## 2. Current state
Leadership and committee heads hardcoded in `app/members/page.js`; no committee entity; authorization by a hardcoded email list.

## 3. Actors and permissions
| Actor | Can | Key |
| ----- | --- | --- |
| Leader / admin | Create/edit/deactivate committees; appoint heads | `committees.manage`, `roles.assign` |
| Committee head | Add/remove committee members (and deputies) | `committee_members.manage` (scoped) |
| Everyone | See active committees and public positions | — |

## 4. Requirements
FR-CMT-001…005, FR-PUB-003.

## 5. Rules
BR-ORG-001…007; [organizational structure](../../03-business-domain/organizational-structure.md); [committee model](../../03-business-domain/committee-model.md).

## 6. Data
`committees`, `role_assignments`, `roles` ([organization](../../05-database/entities/organization.md), [identity & access](../../05-database/entities/identity-and-access.md)); view `current_positions`.

## 7. Routes and screens
| Route | Audience | Purpose |
| ----- | -------- | ------- |
| `/dashboard/committees` | Leader/admin | List, create, edit, deactivate |
| `/dashboard/committees/[id]` | Head, leader | Members & positions with terms; add/end assignments |
| `/committees/[slug]` | Everyone | Public committee page (Phase 4) |

## 10. Edge cases
1. Appointing a second head while one is active → rejected (exclusion constraint); UI offers "end current term and appoint".
2. Head ends own assignment → allowed only via leader (no self-removal of last head without replacement — Proposed).
3. Committee deactivated with published events → events stay public, committee shown as inactive.

## 11. Testing
pgTAP: one active head/leader, scope enforcement, anti-escalation, audit trigger on assignments.

## 12. Open questions
Q-003, Q-004, Q-014, Q-039.
