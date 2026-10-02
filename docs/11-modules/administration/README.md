# Module — Administration

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |
| **Phase**        | 2 (dashboard shell, users, role assignments), 4 (audit UI, reference data, settings) |

## 1. Purpose
Technical and organizational administration: who has which role, managed lists, site settings, and traceability through the audit log.

## 2. Current state
None. Authorization is a hardcoded email array; data fixes require database access.

## 3. Actors and permissions
`system_admin` (all), community leader (non-global role assignment, reference data, settings), founders (`roles.view`).

## 4. Requirements
FR-ADM-001…006, NFR-OPS-005.

## 5. Rules
BR-ORG-006/007 (anti-escalation, last admin), BR-GOV-001…003; [authorization model](../../06-security/authorization-model.md).

## 6. Data
`profiles`, `roles`, `permissions`, `role_permissions`, `role_assignments`, reference tables, `site_settings`, `audit_logs`.

## 7. Routes and screens
| Route | Audience | Purpose |
| ----- | -------- | ------- |
| `/dashboard` (shell) | Anyone with a dashboard permission | Navigation filtered by permissions |
| `/dashboard/admin/users` | `users.view` | Search users; view account, membership, positions, registrations |
| `/dashboard/admin/roles` | `roles.view` / `roles.assign` | Assignments by role/committee; assign/end with terms |
| `/dashboard/admin/audit` | `audit.view` | Filterable audit log |
| `/dashboard/admin/reference-data` | `reference_data.manage` | Universities, majors, tracks, tags |
| `/dashboard/admin/settings` | `settings.manage` | Social links, contact email, footer |

## 10. Edge cases
1. Admin tries to end the last `system_admin` assignment → blocked.
2. Leader tries to assign `system_admin` → blocked (anti-escalation).
3. A user with roles is deleted → assignments ended, history kept with anonymized actor.

## 11. Testing
pgTAP: anti-escalation, last-admin guard, audit append-only. E2E J8.

## 12. Open questions
Q-032, Q-039.
