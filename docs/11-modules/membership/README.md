# Module — Membership Intake

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |
| **Phase**        | 3B |

## 1. Purpose
Run the community's **periodic membership intake** (about once a year): announce and open a cycle, accept applications only through the dedicated join page while it is open, review them fairly, and turn accepted applicants into members (DECISION D-001).

## 2. Current state
Does not exist. Members are inserted manually; `/register` creates accounts only.

## 3. Actors and permissions
| Actor | Can | Key |
| ----- | --- | --- |
| Visitor | See `/join` state | — |
| Signed-in user | Apply while open; view/edit/withdraw own application | ownership |
| Membership reviewer (leader) | Review and decide | `membership.review` |
| Leader / admin | Manage cycles; export | `membership.manage_cycles`, `membership.export` |

## 4. Requirements
FR-MBR-001…009.

## 5. Rules and lifecycle
[Membership lifecycle](../../03-business-domain/membership-lifecycle.md); BR-MBR-001…012.

## 6. Data
`membership_cycles`, `membership_applications`, `members` ([membership entities](../../05-database/entities/membership.md)); view `membership_cycle_phase`; functions `submit_membership_application`, `decide_membership_applications`.

## 7. Routes and screens
| Route | Audience | Purpose |
| ----- | -------- | ------- |
| `/join` | Everyone | Cycle state + application (pattern: [design patterns §5](../../10-design-system/patterns.md#5-gated-page-membership-intake-join)) |
| `/account/membership` | Applicant/member | Application status, member status |
| `/dashboard/membership/cycles` | Leader | List, create, schedule, extend, close early, complete |
| `/dashboard/membership/applications?cycle=…` | Reviewers | Table with filters, detail drawer, bulk decisions, export |

## 8. Server operations
| Operation | Authorization | Side effects |
| --------- | ------------- | ------------ |
| `createCycle`, `updateCycle`, `publishCycle`, `closeCycleEarly`, `completeCycle` | `membership.manage_cycles` | Audit |
| `submitApplication`, `updateApplication`, `withdrawApplication` | Own; cycle open | Email `membership.application_received` |
| `startReview`, `decideApplications` | `membership.review` | Member created/reactivated; decision emails; audit |
| `exportApplications` | `membership.export` | Audit |

## 9. Notifications
`membership.application_received`, `…_accepted`, `…_rejected`, `…_waitlisted`.

## 10. Edge cases
1. User submits at 23:59:59 and the cycle closes during submission → the DB check at insert time decides; UI shows "closed" error and preserves the draft locally.
2. Two cycles overlapping → rejected by exclusion constraint.
3. Accepted applicant already has an inactive member record → reactivated, not duplicated.
4. Applicant deletes account before decision → application anonymized, excluded from decisions.
5. Capacity reached → further acceptances blocked; reviewer can waitlist (Q-011).
6. Reviewer is also an applicant in the same cycle → cannot decide own application (self-decision guard).

## 11. Testing
pgTAP: cycle-open insert guard, uniqueness, reviewer-only decisions, self-decision guard, member creation atomicity. E2E J5.

## 12. Open questions
Q-002, Q-011, Q-012, Q-013, Q-026, Q-031.
