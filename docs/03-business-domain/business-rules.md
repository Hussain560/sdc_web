# Business Rules Catalogue

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## 1. How to use this catalogue

Each rule has a stable **BR id** used in requirements, tests and code comments. The detailed reasoning lives in the linked lifecycle document; this catalogue adds **where the rule is enforced** so it has exactly one implementation home (principle PP-5).

Enforcement points:

| Code | Meaning |
| ---- | ------- |
| **DB** | Database constraint (PK/FK/UNIQUE/CHECK/exclusion) or trigger |
| **RLS** | Row Level Security policy |
| **SVR** | Server-side domain operation (Server Action / database function) — validated before writing |
| **DRV** | Derived at read time (view/function) — not stored |
| **UI** | Presentation only (never the sole enforcement of a security or integrity rule) |

Status: **C** Confirmed, **P** Proposed, **A** Assumed.

## Membership (BR-MBR)

Detail: [membership-lifecycle.md](./membership-lifecycle.md)

| ID | Rule | Status | Enforced |
| -- | ---- | ------ | -------- |
| BR-MBR-001 | Account creation never creates membership. | C (D-001) | SVR, DB (no member row without accepted application or legacy import) |
| BR-MBR-002 | Applications are accepted only while an intake cycle is open (`opens_at <= now < closes_at`, not closed early). | C (D-001) | DB (insert trigger/RLS check), UI |
| BR-MBR-003 | At most one cycle can be open at a time. | P | DB (exclusion constraint on time range of non-draft cycles) |
| BR-MBR-004 | One application per account per cycle. | P | DB (UNIQUE `cycle_id, user_id`) |
| BR-MBR-005 | Active members cannot apply. | P | SVR |
| BR-MBR-006 | Applicants may edit/withdraw only while `submitted` and the cycle is open. | P | RLS + SVR |
| BR-MBR-007 | Only membership reviewers may change application status; transitions follow the state diagram. | P | RLS + SVR |
| BR-MBR-008 | Acceptance creates/reactivates the member record atomically. | P | SVR (single DB function, transactional) |
| BR-MBR-009 | Directory shows only active members who opted in, and only public fields. | P (Q-007) | DRV (public view) + RLS |
| BR-MBR-010 | Members edit only their own profile fields; not status, dates or placement. | P | RLS + column privileges/trigger |
| BR-MBR-011 | Ending/suspending membership ends committee assignments. | P | SVR |
| BR-MBR-012 | Membership expiry/renewal | Open (Q-012) | — |

## Organization (BR-ORG)

Detail: [organizational-structure.md](./organizational-structure.md), [committee-model.md](./committee-model.md)

| ID | Rule | Status | Enforced |
| -- | ---- | ------ | -------- |
| BR-ORG-001 | Positions are time-bound role assignments; history is never deleted. | P | DB |
| BR-ORG-002 | Committee-scoped roles require a committee; global roles must not have one. | P | DB (CHECK via role scope) |
| BR-ORG-003 | At most one active `community_leader`; at most one active `committee_head` per committee. | P | DB (partial unique / exclusion) |
| BR-ORG-004 | Only active members hold committee roles. | P | SVR |
| BR-ORG-005 | Committees are deactivated, not deleted, once they own events/articles. | P | DB (FK `RESTRICT`) + SVR |
| BR-ORG-006 | Nobody can grant a role or permission they do not hold themselves (anti-escalation); `system_admin` excepted. | P | SVR + RLS |
| BR-ORG-007 | The last active `system_admin` cannot be removed. | P | SVR |

## Events (BR-EVT)

Detail: [event-lifecycle.md](./event-lifecycle.md)

| ID | Rule | Status | Enforced |
| -- | ---- | ------ | -------- |
| BR-EVT-001 | Every event belongs to exactly one active committee at creation. | P (Q-005) | DB (FK NOT NULL) + SVR |
| BR-EVT-002 | Status transitions follow the editorial state diagram. | P | SVR (transition function) + DB (CHECK on values) |
| BR-EVT-003 | Publishing requires approval by an approver (fast-track allowed for approvers). | P (Q-005) | SVR + RLS |
| BR-EVT-004 | Timing phase (coming soon / registration open / ended…) is derived from dates, never stored. | P | DRV |
| BR-EVT-005 | `ends_at >= starts_at`; `registration_closes_at >= registration_opens_at`. | P | DB (CHECK) |
| BR-EVT-006 | Cancelling a published event requires a reason and notifies registrants. | P | SVR |
| BR-EVT-007 | Online meeting URL is visible only to accepted registrants and organizers. | P | RLS / separate column privilege or table |
| BR-EVT-008 | Unpublished events are visible only to their committee roles and approvers. | P | RLS |
| BR-EVT-009 | Unknown or unpublished event URLs return 404 to unauthorized viewers (no fallback to another event). | P | SVR/UI |

## Registrations (BR-REG)

Detail: [registration-lifecycle.md](./registration-lifecycle.md)

| ID | Rule | Status | Enforced |
| -- | ---- | ------ | -------- |
| BR-REG-001 | Registration requires a signed-in account with confirmed email. | C | RLS (`auth.uid()`), Auth |
| BR-REG-002 | One registration per account per event. | P | DB (UNIQUE `event_id, user_id`) |
| BR-REG-003 | Registration only in `registration_open` phase of a published event. | P | DB function / RLS check |
| BR-REG-004 | Members-only events accept only active members. | P (Q-009) | RLS check |
| BR-REG-005 | Name/email snapshotted from profile; client cannot set them. | P | DB (trigger fills) |
| BR-REG-006 | Status changes only by reviewers in scope; transitions per diagram. | P | RLS + SVR |
| BR-REG-007 | Capacity cannot be exceeded by acceptances. | P (Q-029) | SVR (locked count) |
| BR-REG-008 | Participants read only their own registrations. | P | RLS |
| BR-REG-009 | Participants may cancel until the event starts. | P | SVR + RLS |
| BR-REG-010 | Check-in only on accepted registrations during an open session; UNIQUE (registration, session); one canonical attendance percentage. | P (ADR-012) | DB function + UNIQUE |

## Articles (BR-ART)

Detail: [article-lifecycle.md](./article-lifecycle.md)

| ID | Rule | Status | Enforced |
| -- | ---- | ------ | -------- |
| BR-ART-001 | Only `published` articles are public. | P | RLS / public view |
| BR-ART-002 | Status transitions per diagram; publish by committee head/deputy or leader. | P (Q-006) | SVR + RLS |
| BR-ART-003 | Unique, stable slugs. | P | DB (UNIQUE) |
| BR-ART-004 | Body rendered as sanitized Markdown. | P | UI (renderer) + SVR (validation) |
| BR-ART-005 | `published_at` set once. | P | DB trigger |

## Notifications (BR-NOT)

Detail: [notification-rules.md](./notification-rules.md)

| ID | Rule | Status | Enforced |
| -- | ---- | ------ | -------- |
| BR-NOT-001 | Emails are sent server-side after commit, to addresses resolved on the server. | P | SVR |
| BR-NOT-002 | Every attempt logged; failures never roll back decisions. | P | SVR + DB (email log) |
| BR-NOT-003 | Idempotent per template + entity + state. | P | DB (UNIQUE idempotency key) |
| BR-NOT-004 | User values HTML-escaped. | P | SVR (template engine) |

## Governance (BR-GOV)

| ID | Rule | Status | Enforced |
| -- | ---- | ------ | -------- |
| BR-GOV-001 | Every state transition, role change, decision, export and admin action writes an audit entry (actor, action, entity, before/after summary, time). | P | SVR / DB trigger |
| BR-GOV-002 | Audit entries are append-only and readable only by system admins (and leadership for their scope — **OPEN Q-032**). | P | RLS + no UPDATE/DELETE grants |
| BR-GOV-003 | Nothing with history is hard-deleted (soft states instead). | P | DB (FK RESTRICT) + SVR |
