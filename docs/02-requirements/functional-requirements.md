# Functional Requirements

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

Columns: **P** = priority (MoSCoW), **Ph** = roadmap phase, **Rules/Q** = linked business rules or blocking open questions.

## FR-PUB — Public site

| ID | Requirement | P | Ph | Rules/Q |
| -- | ----------- | - | -- | ------- |
| FR-PUB-001 | The home page shows the hero, the latest published events, the latest published articles, committees, a members teaser and partners, all from the database or configuration. | M | 3 | Q-004, Q-021 |
| FR-PUB-002 | The about page shows the published description, vision and mission, editable without code changes. | S | 4 | — |
| FR-PUB-003 | A leadership view shows current founders, leader, advisor and committee heads/deputies generated from active role assignments. | M | 3 | BR-ORG-001 |
| FR-PUB-004 | Every public page renders its main content on the server with page-specific title, description and Open Graph metadata in the active language. | M | 3 | NFR-PERF-003 |
| FR-PUB-005 | Unknown resources return a proper 404 page in the active language. | M | 3 | BR-EVT-009 |
| FR-PUB-006 | Users can switch language (ar/en) and theme (dark/light); the choice persists and the first server response uses the correct `lang`/`dir`. | M | 1 | NFR-I18N-* |
| FR-PUB-007 | Search: filter within list pages (events, articles, members). A global search page is **not** required unless Q-023 decides otherwise. | S | 3 | Q-023 |
| FR-PUB-008 | Partners section shows real partners managed by leadership. | C | 4 | Q-021 |

## FR-AUTH — Accounts and authentication

| ID | Requirement | P | Ph | Rules/Q |
| -- | ----------- | - | -- | ------- |
| FR-AUTH-001 | A visitor can create an account with full name (ar, ≥ 3 words, current rule), email and password; the password policy is enforced by the server/Auth configuration, not only the browser. | M | 2 | — |
| FR-AUTH-002 | The sign-up page states that an account does not grant membership and links to the join page. | M | 2 | BR-MBR-001 |
| FR-AUTH-003 | Email confirmation is required before sign-in (bilingual, branded templates). | M | 2 | — |
| FR-AUTH-004 | Sign-in returns the user to the page that requested it (`redirect` parameter restricted to same-site paths). | M | 2 | — |
| FR-AUTH-005 | Password reset never reveals whether an email is registered. | M | 2 | NFR-SEC-006 |
| FR-AUTH-006 | Sessions are cookie-based and readable on the server (SSR), refreshed by middleware. | M | 2 | ADR-001 |
| FR-AUTH-007 | A profile row is created automatically for each new account (name, preferred locale). | M | 2 | — |
| FR-AUTH-008 | Users can edit their name and preferred language, change password and email. | S | 3 | — |
| FR-AUTH-009 | Users can request deletion of their account (handled per privacy policy). | S | 5 | Q-031 |
| FR-AUTH-010 | Protected pages redirect unauthenticated users to sign-in on the server (no client-side flash of protected content). | M | 2 | — |

## FR-MBR — Membership intake

| ID | Requirement | P | Ph | Rules/Q |
| -- | ----------- | - | -- | ------- |
| FR-MBR-001 | Leadership can create a membership intake cycle with name, open and close date-times, description/eligibility text, optional capacity and optional extra questions. | M | 3 | BR-MBR-003, Q-011 |
| FR-MBR-002 | The cycle opens and closes automatically based on its dates; leadership can close early or extend. | M | 3 | BR-MBR-002 |
| FR-MBR-003 | `/join` shows the state of intake (closed / upcoming with date / open with form / closed awaiting decisions). | M | 3 | D-001 |
| FR-MBR-004 | While open, a signed-in user can submit one application with the profile fields and cycle questions, accepting the privacy notice. | M | 3 | BR-MBR-004, Q-002 |
| FR-MBR-005 | The applicant can view, edit and withdraw their application while it is `submitted` and the cycle is open. | S | 3 | BR-MBR-006 |
| FR-MBR-006 | Reviewers can list, filter (status, university, track, preferred committee), view and decide (accept / reject / waitlist) applications individually or in bulk, with an internal note. | M | 3 | BR-MBR-007, Q-013 |
| FR-MBR-007 | Acceptance creates or reactivates the member record and sends the decision email. | M | 3 | BR-MBR-008 |
| FR-MBR-008 | Reviewers can export applications of a cycle (audited). | S | 4 | BR-GOV-001 |
| FR-MBR-009 | The applicant receives an email on submission and on decision. | M | 3 | NOT |

## FR-MEM — Members and directory

| ID | Requirement | P | Ph | Rules/Q |
| -- | ----------- | - | -- | ------- |
| FR-MEM-001 | The public directory lists active, opted-in members with public fields only, filterable by university, major, sub-major, academic status, track and committee. | M | 3 | BR-MBR-009, Q-007 |
| FR-MEM-002 | A member profile page shows public fields and the member's committees/positions. | M | 3 | Q-007 |
| FR-MEM-003 | Members can edit their own profile fields and directory visibility. | M | 3 | BR-MBR-010, Q-030 |
| FR-MEM-004 | Leadership can view all members (including private fields), change status (suspend/reinstate/deactivate) with a reason. | M | 4 | BR-MBR-011 |
| FR-MEM-005 | Existing (legacy) member records are migrated and can be claimed by their owners via an emailed link. | M | 3 | Q-026 |
| FR-MEM-006 | Social/portfolio links accept only `https://` URLs. | M | 3 | NFR-SEC-004 |
| FR-MEM-007 | Taxonomy values (universities, majors, academic statuses, tracks) are managed lists with ar/en labels, not free text. | S | 3 | Q-004 |

## FR-CMT — Committees and positions

| ID | Requirement | P | Ph | Rules/Q |
| -- | ----------- | - | -- | ------- |
| FR-CMT-001 | Leadership/system admin can create, edit, deactivate and reactivate committees (ar/en name, slug, description, order). | M | 2 | BR-ORG-005, Q-004 |
| FR-CMT-002 | Authorized users can assign and end positions (role assignments) with start/end dates and optional committee scope. | M | 2 | BR-ORG-001..004 |
| FR-CMT-003 | Committee heads can add and remove committee members (active members only). | M | 4 | BR-ORG-004 |
| FR-CMT-004 | A committee page lists the committee's leadership, members (public ones), events and articles. | S | 4 | — |
| FR-CMT-005 | Position history is retained and viewable by leadership. | S | 4 | Q-014 |

## FR-EVT — Events

| ID | Requirement | P | Ph | Rules/Q |
| -- | ----------- | - | -- | ------- |
| FR-EVT-001 | Committee roles can create and edit event drafts with the full content model (identity, schedule, place, registration settings, detail lists, recognition, contact). | M | 3 | BR-EVT-001 |
| FR-EVT-002 | Events can be submitted for review, approved (published), returned with changes requested, or withdrawn. | M | 3 | BR-EVT-002/003, Q-005 |
| FR-EVT-003 | Published events appear in public lists and detail pages with derived timing badges. | M | 3 | BR-EVT-004 |
| FR-EVT-004 | Public event lists can be filtered by timing (upcoming / past), type, committee and format. | S | 3 | — |
| FR-EVT-005 | Authorized users can cancel a published event with a reason; registrants are notified. | M | 3 | BR-EVT-006 |
| FR-EVT-006 | Authorized users can mark an ended event completed once attendance is finalized. | S | 4 | ADR-012 |
| FR-EVT-007 | Cover images are uploaded to storage with type/size validation. | M | 3 | NFR-SEC-008 |
| FR-EVT-008 | Existing six events and their bilingual details are migrated into the database. | M | 3 | — |
| FR-EVT-009 | Event dates are displayed in Asia/Riyadh time, localized per language. | M | 3 | NFR-I18N-004 |

## FR-REG — Registrations and attendance

| ID | Requirement | P | Ph | Rules/Q |
| -- | ----------- | - | -- | ------- |
| FR-REG-001 | A signed-in user can register for an event in its registration-open phase, once. | M | 3 | BR-REG-001..003 |
| FR-REG-002 | The user sees their registration status on the event page and in "My registrations", and can cancel before start. | M | 3 | BR-REG-008/009 |
| FR-REG-003 | Reviewers in scope see registrations per event with counts, member badge, filters, and accept / reject / waitlist individually or in bulk. | M | 3 | BR-REG-006, Q-018 |
| FR-REG-004 | Capacity and waitlist behaviour per event. | S | 3 | Q-029 |
| FR-REG-005 | Accepted registrants of online events see the meeting link. | S | 3 | BR-EVT-007 |
| FR-REG-006 | Organizers run per-day attendance sessions (QR, online, manual check-in) and finalize them. | S | 4 | ADR-012 |
| FR-REG-007 | Reviewers can export accepted registrants as CSV (audited). | S | 4 | BR-GOV-001 |
| FR-REG-008 | Existing registrations are migrated and linked to migrated events. | M | 3 | Q-026 |

## FR-ART — Articles / threads

| ID | Requirement | P | Ph | Rules/Q |
| -- | ----------- | - | -- | ------- |
| FR-ART-001 | Committee roles can create and edit article drafts (bilingual title/excerpt/body in Markdown, tags, authors, cover, resource link). | M | 3 | Q-006, Q-033 |
| FR-ART-002 | Articles can be submitted, reviewed, published, returned and archived. | M | 3 | BR-ART-002 |
| FR-ART-003 | Published articles are listed (filter by tag/committee) and readable with computed reading time. | M | 3 | BR-ART-001 |
| FR-ART-004 | Existing six articles are migrated. | M | 3 | — |

## FR-NOT — Notifications

| ID | Requirement | P | Ph | Rules/Q |
| -- | ----------- | - | -- | ------- |
| FR-NOT-001 | The system sends the notifications in the [catalogue](../03-business-domain/notification-rules.md) in the recipient's language. | M | 3 | BR-NOT-* |
| FR-NOT-002 | Every send attempt is logged and visible to authorized organizers per event/application. | M | 3 | BR-NOT-002 |
| FR-NOT-003 | Operators can retry failed emails. | S | 3 | — |
| FR-NOT-004 | Auth emails (confirm, reset, email change) use branded bilingual templates. | S | 2 | — |
| FR-NOT-005 | Event reminders 24 h before start. | C | 4 | — |

## FR-RPT — Reports

| ID | Requirement | P | Ph | Rules/Q |
| -- | ----------- | - | -- | ------- |
| FR-RPT-001 | Community dashboard with the metrics in the [reporting model](../03-business-domain/reporting-model.md). | M | 4 | Q-008 |
| FR-RPT-002 | Committee dashboard scoped to the viewer's committee(s). | M | 4 | Q-008 |
| FR-RPT-003 | "My activity" page for any user. | S | 4 | — |
| FR-RPT-004 | Public aggregate statistics on the home page. | C | 4 | RP-2 |

## FR-ADM — Administration

| ID | Requirement | P | Ph | Rules/Q |
| -- | ----------- | - | -- | ------- |
| FR-ADM-001 | System admins can search users and view their account, profile, membership, positions and registrations. | M | 2 | — |
| FR-ADM-002 | System admins can assign/end roles (with anti-escalation and last-admin guards). | M | 2 | BR-ORG-006/007 |
| FR-ADM-003 | System admins can view the audit log with filters (actor, entity, action, date). | M | 4 | BR-GOV-002 |
| FR-ADM-004 | Managed lists (taxonomies, event types, tags) are editable by authorized users. | S | 4 | — |
| FR-ADM-005 | Site configuration (social links, contact email, footer text) is editable without code. | C | 4 | — |
| FR-ADM-006 | An internal dashboard shell (`/dashboard`) shows navigation items based on the user's permissions. | M | 2 | — |
