# Module — Notifications

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |
| **Phase**        | 2 (auth emails via provider SMTP), 3A–3C (application emails per module) |

## 1. Purpose
Send correct, safe, logged, bilingual transactional emails as consequences of state changes.

## 2. Current state
Open-relay Edge Functions via Gmail; browser-triggered; Arabic-only; unlogged ([audit §7](../../01-project/current-system-audit.md#7-edge-functions-and-email)).

## 3. Actors and permissions
System (server) sends. Organizers see email logs for their scope and can retry (`registrations.review` / `membership.review` scopes); admins see all (`email_logs.view`).

## 4. Requirements
FR-NOT-001…005, NFR-REL-005.

## 5. Rules
[Notification rules](../../03-business-domain/notification-rules.md); BR-NOT-001…004.

## 6. Data
`email_logs` ([platform entities](../../05-database/entities/platform.md)).

## 7. Routes and screens
| Route | Purpose |
| ----- | ------- |
| Email status column in registrations/applications tables | Per-recipient status + retry |
| `/dashboard/admin/emails` | Global log, filters, retry |
| `/api/cron/email-retry` | Scheduled retry (protected) |
| `/api/webhooks/email` | Delivery/bounce events (optional) |

## 10. Edge cases
1. Provider quota exhausted mid-batch → stop, mark remaining as not yet sent, show resume time.
2. Recipient has no confirmed email (legacy) → `failed` with `NO_RECIPIENT`, never retried automatically.
3. Same decision saved twice → second send skipped by idempotency key.

## 11. Testing
Unit: template rendering escapes; locale selection. Integration: send → log; failure → log + no rollback; idempotency.

## 12. Open questions
Q-010, Q-017, Q-028.
