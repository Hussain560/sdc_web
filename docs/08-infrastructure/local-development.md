# Local Development

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## 1. Prerequisites

| Tool | Version | Notes |
| ---- | ------- | ----- |
| Node.js | Current LTS (pinned in `.nvmrc` from Phase 1; v24 used during the audit) | Use `nvm` / `fnm` |
| npm | Bundled with Node | Lockfile committed |
| Docker Desktop | Recent | Required by Supabase CLI |
| Supabase CLI | Via `npx supabase` (dev dependency `supabase`) | No global install needed |
| Git | Recent | — |

## 2. Local service ports

| Service | URL |
| ------- | --- |
| Next.js | `http://localhost:3000` |
| Supabase API (Kong) | `http://127.0.0.1:54321` |
| PostgreSQL | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Supabase Studio | `http://127.0.0.1:54323` |
| Mailpit (email inbox) | `http://127.0.0.1:54324` |

## 3. Today's procedure (CURRENT — after the 2026-10-02 upgrade)

```bash
nvm use            # Node 24 from .nvmrc
npm ci
npx supabase start
```

Copy `.env.example` to `.env.local` and fill the values from `npx supabase status`. Then apply the schema manually by running `supabase/seed_tables.sql` in Studio's SQL editor (⚠ it deletes all rows in `members` and `event_registrations` — local only), and run:

```bash
npm run dev          # Next.js 16 (Turbopack)
npm run typecheck    # tsc --noEmit
npm run lint         # eslint .
npm run db:types     # regenerate src/lib/supabase/database.types.ts after schema changes
```

Edge Functions run in the `supabase_edge_runtime_sdc_web` container; they need `GMAIL_USER`/`GMAIL_APP_PASSWORD` to send (otherwise they fail; emails do **not** go to Mailpit because they use Gmail SMTP directly).

## 4. Target procedure (from Phase 1)

```bash
nvm use
npm ci
npx supabase start
npx supabase db reset
npm run dev
```

`db reset` applies all migrations and `supabase/seed.sql` (synthetic users for every role, committees, a cycle, events in every phase, registrations, articles). Seeded test accounts and their roles are listed in `supabase/seed/README.md`; all seeded passwords are local-only values documented there.

| Task | Command |
| ---- | ------- |
| New migration | `npx supabase migration new <verb_object>` |
| Diff schema changes made in Studio into a migration | `npx supabase db diff -f <name>` |
| Regenerate DB types | `npm run db:types` (`supabase gen types typescript --local`) |
| Run DB (RLS) tests | `npx supabase test db` |
| Unit/component tests | `npm test` |
| E2E tests | `npm run test:e2e` |
| Lint / format / types | `npm run lint` · `npm run format` · `npm run typecheck` |
| Stop stack | `npx supabase stop` |

All emails (Auth and application) appear in Mailpit.

## 5. Troubleshooting

| Symptom | Fix |
| ------- | --- |
| `supabase start` port conflict | Another project's stack is running: `npx supabase stop --project-id <other>` |
| Containers restarting (e.g., `vector`) | Non-essential logging container; restart the stack if other services are healthy |
| Auth emails missing | Check Mailpit; check `site_url`/redirect URLs in `config.toml` |
| RLS denies in dev | You are not signed in as a seeded user with the needed role — use the seeded accounts |
