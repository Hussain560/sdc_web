# Environment Variables and Secrets

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## 1. Current (CURRENT)

| Variable | Where | Notes |
| -------- | ----- | ----- |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | Local stack URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | Local anon key |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Edge Function secrets (remote; location undocumented) | To be retired |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Injected into Edge Functions by Supabase | Used by `check-email-exists` |

There is no `.env.example`, and no validation of required variables.

## 2. Target catalogue

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

CI-only secrets (GitHub Actions environments `staging` and `production`): `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `BACKUP_ENCRYPTION_KEY`.

Supabase Auth SMTP credentials are set in each hosted project's Auth settings (or `config.toml` via `env(...)` substitution), never committed.

## 3. Rules

1. `.env.example` (committed) lists every variable with safe placeholder values and a comment; `.env.local` stays git-ignored.
2. `src/lib/env.ts` validates variables with Zod at startup, separating `server` and `client` schemas; the build fails if a required variable is missing.
3. Server-only variables are read only in modules marked `import 'server-only'`.
4. Never prefix a secret with `NEXT_PUBLIC_`.
5. Rotate secrets when a maintainer leaves, after suspected exposure, and at least yearly for the email API key.
6. Vercel environment scoping: "Preview" variables for the `develop` branch point to staging; production variables only in "Production".
