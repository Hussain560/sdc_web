# Permission Catalogue

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft (Proposed) — final grants pending **OPEN Q-003, Q-005, Q-006, Q-013, Q-032** |

## 1. Permission keys

| Key | Module | Allows | Scoped? |
| --- | ------ | ------ | ------- |
| `events.create` | Events | Create event drafts | committee |
| `events.view_drafts` | Events | See unpublished events | committee |
| `events.edit` | Events | Edit editable events, private details | committee |
| `events.submit` | Events | Submit for review / withdraw | committee |
| `events.approve` | Events | Approve (publish), request changes | global (**Q-005**) |
| `events.cancel` | Events | Cancel published events | committee |
| `events.complete` | Events | Mark ended events completed | committee |
| `events.delete` | Events | Delete never-published drafts | committee |
| `registrations.review` | Registrations | View registrants with contact data; accept/reject/waitlist | committee |
| `registrations.attendance` | Registrations | Record attendance | committee |
| `registrations.export` | Registrations | Export registrants (audited) | committee |
| `articles.create` | Articles | Create drafts | committee |
| `articles.edit` | Articles | Edit drafts and published articles in scope | committee |
| `articles.publish` | Articles | Publish, request changes, archive/restore | committee |
| `membership.manage_cycles` | Membership | Create/schedule/extend/close/complete cycles | global |
| `membership.review` | Membership | View and decide applications | global (**Q-013**) |
| `membership.export` | Membership | Export applications (audited) | global |
| `members.view` | Members | View private member fields (incl. hidden profiles) | global |
| `members.manage` | Members | Change member status; manual/legacy member records; claim emails | global |
| `committees.manage` | Committees | Create/edit/deactivate committees | global |
| `committee_members.manage` | Committees | Assign/end `committee_member` (and deputy) in scope | committee |
| `roles.view` | Access | View all role assignments | global |
| `roles.assign` | Access | Assign/end roles (subject to anti-escalation) | global |
| `users.view` | Access | Search users and view accounts | global |
| `reports.view_community` | Reports | Community dashboard | global |
| `reports.view_committee` | Reports | Committee dashboard | committee |
| `reference_data.manage` | Admin | Universities, majors, tracks, tags | global |
| `settings.manage` | Admin | Site settings | global |
| `audit.view` | Admin | Audit log | global |
| `email_logs.view` | Admin | Email delivery logs (beyond own scope) | global |

Ownership rights (no permission key): read/update own profile; read/cancel own registrations; submit/edit/withdraw own application; edit own member profile; edit own article drafts (as listed author) until submitted.

## 2. Role × permission matrix (Proposed defaults)

✅ granted · ◐ granted in own committee scope only · — not granted

| Permission | system_admin | founder | community_leader | advisor | committee_head | committee_deputy | committee_member |
| ---------- | :----------: | :-----: | :--------------: | :-----: | :------------: | :--------------: | :--------------: |
| events.create | ✅ | — | ✅ | — | ◐ | ◐ | ◐ |
| events.view_drafts | ✅ | ✅ (**Q-032**) | ✅ | — | ◐ | ◐ | ◐ |
| events.edit | ✅ | — | ✅ | — | ◐ | ◐ | ◐ (drafts) |
| events.submit | ✅ | — | ✅ | — | ◐ | ◐ | — |
| events.approve | ✅ | — | ✅ | — | — (**Q-005**) | — | — |
| events.cancel | ✅ | — | ✅ | — | ◐ | — | — |
| events.complete | ✅ | — | ✅ | — | ◐ | ◐ | — |
| events.delete | ✅ | — | ✅ | — | ◐ | ◐ | — |
| registrations.review | ✅ | — | ✅ | — | ◐ | ◐ | — (grantable) |
| registrations.attendance | ✅ | — | ✅ | — | ◐ | ◐ | ◐ |
| registrations.export | ✅ | — | ✅ | — | ◐ | — | — |
| articles.create | ✅ | — | ✅ | — | ◐ | ◐ | ◐ |
| articles.edit | ✅ | — | ✅ | — | ◐ | ◐ | — (own drafts via ownership) |
| articles.publish | ✅ | — | ✅ | — | ◐ (**Q-006**) | ◐ | — |
| membership.manage_cycles | ✅ | — | ✅ | — | — | — | — |
| membership.review | ✅ | — | ✅ | — | — (**Q-013**) | — | — |
| membership.export | ✅ | — | ✅ | — | — | — | — |
| members.view | ✅ | ✅ (**Q-007**) | ✅ | — | — | — | — |
| members.manage | ✅ | — | ✅ | — | — | — | — |
| committees.manage | ✅ | — | ✅ | — | — | — | — |
| committee_members.manage | ✅ | — | ✅ | — | ◐ | — | — |
| roles.view | ✅ | ✅ | ✅ | — | — | — | — |
| roles.assign | ✅ | — | ✅ (non-global roles only) | — | — | — | — |
| users.view | ✅ | — | ✅ | — | — | — | — |
| reports.view_community | ✅ | ✅ | ✅ | ✅ | — | — | — |
| reports.view_committee | ✅ | ✅ | ✅ | ✅ | ◐ | ◐ | — |
| reference_data.manage | ✅ | — | ✅ | — | — | — | — |
| settings.manage | ✅ | — | ✅ | — | — | — | — |
| audit.view | ✅ | — (**Q-032**) | — | — | — | — | — |
| email_logs.view | ✅ | — | ✅ | — | — | — | — |

Global roles holding a "committee" permission hold it in **every** committee.

## 3. Changing the matrix

The matrix is seed data (`role_permissions`) delivered by migration. Changes require: a PR updating this document and the seed migration, pgTAP tests for the affected policies, and approval by the product owner (organizational meaning) and a system admin (security impact).
