# Entities — Platform

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft (Proposed) |

## 1. `audit_logs`

Append-only record of business and security actions (BR-GOV-001).

| Column | Type | Null | Constraint | Description |
| ------ | ---- | ---- | ---------- | ----------- |
| `id` | bigint | no | identity PK | — |
| `occurred_at` | timestamptz | no | now() | — |
| `actor_id` | uuid | yes | FK → `profiles` SET NULL | Null for system jobs |
| `action` | text | no | `^[a-z_]+\.[a-z_]+$` | e.g., `event.approved`, `registration.accepted`, `role.assigned`, `export.registrations` |
| `entity_type` | text | no | — | `event`, `registration`, `application`, `member`, `role_assignment`, … |
| `entity_id` | text | no | — | — |
| `committee_id` | uuid | yes | — | For committee-scoped audit visibility |
| `summary` | jsonb | no | `'{}'` | Changed fields (before/after) — no secrets; personal data minimized |
| `request_id` | text | yes | — | Correlates with application logs |

Indexes: `(entity_type, entity_id)`, `(actor_id, occurred_at desc)`, `(occurred_at desc)`.

Grants/RLS: no UPDATE/DELETE for any API role; INSERT only via security-definer functions/triggers; SELECT with `audit.view` (global) or scoped (**OPEN Q-032**). Retention: **OPEN Q-031** (proposed 3 years).

## 2. `email_logs`

One row per send attempt (BR-NOT-002), modelled on the KFUCS outbox lessons.

| Column | Type | Null | Constraint | Description |
| ------ | ---- | ---- | ---------- | ----------- |
| `id` | uuid | no | PK | — |
| `created_at` | timestamptz | no | now() | — |
| `template_key` | text | no | — | e.g., `registration.confirmed` |
| `locale` | text | no | CHECK in (`ar`,`en`) | — |
| `recipient_user_id` | uuid | yes | FK → `profiles` SET NULL | — |
| `recipient_email` | text | no | — | Restricted |
| `entity_type`, `entity_id` | text | yes | — | Related record |
| `idempotency_key` | text | no | — | `template:entity:state` |
| `attempt` | smallint | no | ≥ 1 | — |
| `status` | text | no | CHECK in (`sent`,`failed`,`skipped`) | — |
| `provider`, `provider_message_id` | text | yes | — | — |
| `error_code`, `error_message` | text | yes | — | Truncated, no secrets |

Constraints: partial UNIQUE (`idempotency_key`) WHERE `status = 'sent'` — the same notification cannot be recorded as sent twice.

Indexes: `(entity_type, entity_id)`, `(status, created_at)`, `(created_at) where status = 'sent'` (daily quota).

RLS: read by organizers in scope of the related entity and by system admins; written only by the server (service role or definer function).

## 3. `site_settings`

| Column | Type | Constraint | Description |
| ------ | ---- | ---------- | ----------- |
| `key` | text | PK | `social_links`, `contact_email`, `footer`, … |
| `value` | jsonb | not null | — |
| `updated_by`, `updated_at` | — | — | — |

Public read for keys marked public; write with `settings.manage`. Optional (FR-ADM-005, Could) — until built, these values live in a typed config module.
