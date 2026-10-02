# Operations

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## 1. Backups

| What | How | Retention |
| ---- | --- | --------- |
| Production database | Nightly GitHub Action: `supabase db dump` (schema) + `--data-only` dump, encrypted (`BACKUP_ENCRYPTION_KEY`), stored as a private artifact or in a private storage location controlled by leadership | 30 days |
| Pre-release snapshot | Same, run by `deploy-production.yml` before migrations | Kept with the release record (90 days) |
| Supabase platform backups | Depends on plan (free tier offers limited/no downloadable backups — verify current terms) | Per plan |
| Storage objects (images) | Re-uploadable content; optional periodic sync | — |
| Code and config | GitHub | Indefinite |

**Restore drill**: once per phase (and before v1.0.0), restore the latest backup into a scratch project and run the smoke suite. Record the result in the release notes.

## 2. Recovery runbook (summary)

1. Declare incident; freeze deployments.
2. Identify the last good backup and the affected tables/time window (audit log helps).
3. Restore into a scratch project; extract affected rows; apply corrective SQL as a reviewed migration or one-off script with audit entry.
4. Verify with smoke tests and row-count reconciliation.
5. Post-incident note.

## 3. Monitoring and alerting

| Signal | Tool | Alert to |
| ------ | ---- | -------- |
| Site and DB availability | Scheduled health check (`keepalive.yml`) hitting `/api/health` (checks DB connectivity) | Maintainers (GitHub notification / email) |
| Server errors | Vercel runtime logs (short retention on free plans) | Reviewed after releases; optional external error tracker if needed (**not** default) |
| Email failures | `email_logs` failed count on the admin dashboard | Organizers / admins |
| Free-tier usage | Supabase and Vercel usage dashboards | Monthly review by tech lead |
| Security | Dependabot alerts, GitHub secret scanning | Maintainers |

## 4. Scheduled jobs

| Job | Schedule | Mechanism |
| --- | -------- | --------- |
| Email retry (failed, attempt < 3) | Daily (free-tier cron granularity) | Vercel Cron → `/api/cron/email-retry` (protected by `CRON_SECRET`) |
| Event reminders (optional) | Daily | Vercel Cron → `/api/cron/event-reminders` |
| Keep-alive / health | Daily | GitHub Action |
| Backups | Nightly | GitHub Action |

Lifecycle phases (cycle open/closed, event registration open/ended) are **derived from dates** and need no job.

## 5. Free-tier limits to watch

Limits change; verify on the providers' pricing pages at each milestone review. Values below are indicative as of planning.

| Provider | Limit | Relevance |
| -------- | ----- | --------- |
| Supabase Free | ~500 MB database, ~1 GB file storage, limited egress, 2 active projects per org, **projects pause after ~1 week of inactivity**, limited backups | Staging pausing; image sizes; backups are our responsibility |
| Vercel Hobby | Intended for personal, non-commercial use; limited cron frequency; short log retention | Plan suitability for an organization (**OPEN Q-017**) |
| Email provider free tiers | Daily/monthly send caps (e.g., ~100–300/day depending on provider) | Bulk sends (event cancellations, cycle decisions) must be chunked and quota-aware |
| GitHub Actions | Free minutes for private repos are limited | CI design (§5 of [CI/CD](./ci-cd.md#5-cost-notes)) |

## 6. Logs

| Log | Retention | Contains PII? |
| --- | --------- | ------------- |
| Vercel runtime logs | Plan-dependent (short) | Must not (logger rules) |
| Supabase API/Auth logs | Plan-dependent | IPs/emails in Auth logs — access limited to project admins |
| `audit_logs` | 3 years (Proposed) | Minimal |
| `email_logs` | 1 year (Proposed) | Recipient email |
