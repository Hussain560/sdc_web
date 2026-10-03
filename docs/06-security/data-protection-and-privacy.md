# Data Protection and Privacy

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft — legal review pending **OPEN Q-031** |

## 1. Context

SDC processes personal data of people in Saudi Arabia. The Saudi **Personal Data Protection Law (PDPL)** and its implementing regulations apply to the processing of personal data regardless of the organization being non-profit. This document defines the platform's technical privacy posture; it is **not legal advice** — leadership should obtain guidance on obligations such as the privacy notice wording, retention periods, data-subject request handling and breach notification timelines (**OPEN Q-031**).

**CURRENT (PROBLEM)** — registrants' names and emails are publicly readable through the API; there is no privacy notice, no consent record, no retention rule, and no way for users to see or delete their data.

## 2. Personal data inventory and classification

| Data | Where (target) | Class | Visible to |
| ---- | -------------- | ----- | ---------- |
| Email | `auth.users`, `profiles.email`, snapshots | **Restricted** | Owner; reviewers in scope (registrations/applications); system admins |
| Phone | `membership_applications.phone` | **Restricted** | Owner; membership reviewers |
| Full name | `profiles`, `members`, snapshots | Internal (Public for visible members) | Owner; staff in scope; public only via directory/leadership |
| Academic status, university, major, track | `members`, applications | Internal (Public for visible members) | As above |
| Bio, social links | `members` | Public if directory-visible | Public |
| Application answers, decision notes | `membership_applications` | **Restricted** | Applicant (answers only); reviewers |
| Registration status, attendance | `event_registrations` | **Restricted** | Participant; organizers in scope |
| Position (role assignments) | `role_assignments` | Public for public positions; Internal otherwise | — |
| Audit and email logs | `audit_logs`, `email_logs` | **Restricted** | System admins; organizers (email logs in scope) |

## 3. Principles applied

| Principle | Implementation |
| --------- | -------------- |
| Data minimization | Collect only fields with a defined use; phone optional unless required by Q-011 |
| Purpose limitation | Registration data used for event operations and aggregate reports only |
| Transparency | Privacy notice page (ar/en) linked from every form that collects personal data |
| Consent | Applications and (if required) registrations record `consent_at` + `consent_version`; directory listing is a separate explicit opt-in |
| Visibility by default | Private by default; members opt into the public directory |
| Access control | RLS per classification ([policy matrix](../05-database/rls-security-model.md#3-policy-matrix-target)) |
| Exports | Only with export permissions; audited; CSV includes only needed columns |
| Environment hygiene | No production personal data in local/preview environments (NFR-PRIV-006) |
| Third parties | Processors: Supabase (database/auth/storage), Vercel (hosting/logs), email provider. Document their regions and terms (**OPEN Q-031**). |

## 4. Data subject requests (Proposed)

| Request | How |
| ------- | --- |
| Access | "My data" page shows profile, member record, applications, registrations; export as JSON on request |
| Correction | Self-service profile editing; others via leadership |
| Deletion | Account deletion request → profile anonymized, auth user deleted, snapshots replaced with placeholders; aggregate statistics preserved |

## 5. Retention (Proposed — to be confirmed)

| Data | Proposed retention |
| ---- | ------------------ |
| Membership applications (rejected/withdrawn) | 2 years after the cycle closes, then anonymized |
| Event registrations | 3 years after the event, then anonymized (counts retained) |
| Email logs | 1 year |
| Audit logs | 3 years |
| Inactive accounts without membership or activity | Notify after 3 years of inactivity; delete after notice |

## 6. Breach handling

Follow [incident response](./security-model.md#15-incident-response-lightweight). PDPL regulations set short notification windows for breaches; leadership must confirm the exact obligations and the responsible contact (**OPEN Q-031**).
