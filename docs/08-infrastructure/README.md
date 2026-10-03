# 08 — Infrastructure

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## Baseline (DECISION D-002)

| Service | Responsibility |
| ------- | -------------- |
| **GitHub** | Source code, pull requests, CI (GitHub Actions), releases, issue tracking |
| **Vercel** | Hosting the Next.js app: preview deployments per PR, staging (develop), production (releases) |
| **Supabase** | PostgreSQL, Auth, Storage (one project per shared environment); local stack via Supabase CLI + Docker |
| **Transactional email provider** | Auth emails (custom SMTP) and application emails ([ADR-006](../90-decisions/ADR-006-email-provider.md)) |
| **Domain/DNS** | Site domain and email authentication records (**OPEN Q-017**) |
| **Mailpit** (local) | Captures all local emails (part of the Supabase local stack) |

## Documents

| Document | Contents |
| -------- | -------- |
| [environments.md](./environments.md) | Local → Preview → Staging → Production; project mapping; promotion; access ownership |
| [environment-variables.md](./environment-variables.md) | Variable catalogue, where each is set, secret handling |
| [local-development.md](./local-development.md) | Running the stack locally (today and target) |
| [deployment.md](./deployment.md) | How app, migrations and Auth config reach each environment; rollback |
| [ci-cd.md](./ci-cd.md) | GitHub Actions pipeline design and quality gates |
| [operations.md](./operations.md) | Backups, recovery, monitoring, logs, scheduled jobs, free-tier limits |
