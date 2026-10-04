# Environment Variables and Secrets

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-03 |
| **Status**       | Draft      |

## 1. Variables the application reads today (CURRENT)

`.env.example` is the committed template; `node scripts/preflight-production.mjs --env <file> [--online]` checks a production set.

| Variable | Exposure | Production value | Purpose |
| -------- | -------- | ---------------- | ------- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser | hosted project URL (https) | Supabase API; also allowed in the CSP |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser | hosted anon/publishable key | RLS-limited client key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | hosted service key | Account creation, retention, certificates |
| `SITE_URL` | Server | public https origin | Absolute links in e-mails and activation links |
| `EMAIL_TRANSPORT` | Server | `smtp` (`mailpit` locally, `log` prints) | Adapter selection |
| `SMTP_URL` | **Server only** | provider URL with credentials | Hosted e-mail |
| `MAILPIT_URL` | Server | unset | Local capture only |
| `EMAIL_FROM` | Server | verified sender on the project domain | Sender identity |
| `EMAIL_DAILY_LIMIT` | Server | optional | Daily send cap |
| `CRON_SECRET` | **Server only** | random, 16+ characters | Protects `/api/cron/email-retry` and `/api/cron/retention` |
| `VERCEL` | Set by Vercel | `1` | Enables `upgrade-insecure-requests` in the CSP |
| `PORT`, `NEXT_DIST_DIR` | Test runners | unset | Used by the e2e runners only |

Repository variable and secrets for the workflows: `HEALTH_URLS` (variable), `SUPABASE_DB_URL` and `BACKUP_ENCRYPTION_KEY` (production environment secrets).

The older Edge Function secrets (`GMAIL_USER`, `GMAIL_APP_PASSWORD`) belong to the retired legacy site and are not used by this application.

## 2. Target catalogue (design intent; the table above is what is implemented)

| Variable | Exposure | Local | Preview / Staging | Production | Purpose |
| -------- | -------- | ----- | ----------------- | ---------- | ------- |
| `NEXT_PUBLIC_SITE_URL` | Browser | `http://localhost:3000` | staging URL | production URL | Absolute links, OG, email links |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser | `http://127.0.0.1:54321` | staging project URL | production project URL | Supabase API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or legacy `…_ANON_KEY`) | Browser | from `supabase status` | staging key | production key | RLS-limited client key |
| `SUPABASE_SECRET_KEY` (service role) | **Server only** | from `supabase status` | staging | production | Narrow admin operations |
| `EMAIL_PROVIDER` | Server | `smtp` | provider | provider | Adapter selection |
| `EMAIL_FROM`, `EMAIL_REPLY_TO` | Server | `noreply@localhost` | staging sender | production sender | Sender identity |
| `EMAIL_API_KEY` | **Server only** | — | staging key | production key | Provider API |
| `EMAIL_ALLOWED_RECIPIENTS` | Server | — | team domain/list | — (unset) | Safety net outside production |
| `SMTP_HOST`, `SMTP_PORT` | Server | `127.0.0.1`, Mailpit SMTP port (enable `[inbucket] smtp_port` in `config.toml`) | — | — | Local email capture |
| `CRON_SECRET` | **Server only** | any | random | random | Protects `/api/cron/*` |
| `EMAIL_WEBHOOK_SECRET` | **Server only** | — | provider secret | provider secret | Verifies delivery webhooks |
| `LOG_LEVEL` | Server | `debug` | `info` | `info` | Logger verbosity |

CI-only secrets (GitHub Actions environments `staging` and `production`): `SUPABASE_DB_URL` (Session pooler connection string; replaces the access token, project ref and password for migrations), `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `BACKUP_ENCRYPTION_KEY`.

Supabase Auth SMTP credentials are set in each hosted project's Auth settings (or `config.toml` via `env(...)` substitution), never committed.

## 3. Rules

1. `.env.example` (committed) lists every variable with safe placeholder values and a comment; `.env.local` stays git-ignored.
2. `src/lib/env.ts` validates variables with Zod at startup, separating `server` and `client` schemas; the build fails if a required variable is missing.
3. Server-only variables are read only in modules marked `import 'server-only'`.
4. Never prefix a secret with `NEXT_PUBLIC_`.
5. Rotate secrets when a maintainer leaves, after suspected exposure, and at least yearly for the email API key.
6. Vercel environment scoping: "Preview" variables for the `develop` branch point to staging; production variables only in "Production".
