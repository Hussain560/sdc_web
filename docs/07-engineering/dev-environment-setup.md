# Dev Environment Setup (hosted Supabase + Vercel)

| Field            | Value |
| ---------------- | ----- |
| **Last Updated** | 2026-10-04 |
| **Status**       | Plan and checklist: the owner creates the accounts and projects (Part A), Claude/CI do the rest |

Why: local Docker is good for development, but the team also needs a **hosted Dev site** that testers and leaders can open, backed by its own
database, so nobody tests on the production project. This document sets up that second environment following the
[git workflow](git-workflow.md) and [environments](../08-infrastructure/environments.md).

```text
Local (Docker)  ──►  Dev site (Vercel preview of `develop`)  ──►  Staging (Vercel preview of `release/*`)  ──►  Production (`production` branch)
   local Supabase        Supabase project "sdc-dev"                 same "sdc-dev" project                      Supabase project "sdc-members" (production)
```

Dev and Staging share one Supabase project (the free plan allows two active projects: production plus this one). Test data only; **production data never goes to dev** (NFR-PRIV-006).

## Part A. What you do (about 30 minutes)

### A1. Create the Supabase dev project

1. <https://supabase.com/dashboard> → your organisation → **New project**.
2. Name `sdc-dev`; region the same as production; a long database password (store it in the password manager); plan Free.
3. When it is ready, open **Project Settings** and write down (keep them secret):
   - **Project ref** (the short id in the project URL).
   - **API URL** (`https://<ref>.supabase.co`), **anon (publishable) key**, **service role key** (API settings).
   - **Database password** (the one you just set) and, under *Connect*, the **Session pooler** connection string.
4. Account → **Access Tokens** → create a token named `sdc-ci` (used by GitHub Actions to push migrations).

### A2. Push the schema to it

From the repository, on the `develop` branch:

```bash
npx supabase login
npx supabase link --project-ref <DEV_PROJECT_REF>
npx supabase db push --dry-run     # lists the migrations that will run
npx supabase db push               # applies them (about 28 files)
```

The seed file is local-only demo data and is **not** pushed. For a usable dev site:

1. Dashboard → **Authentication → Users → Add user**: create your own test admin (tick *Auto confirm*).
2. Dashboard → **SQL editor**, give that user the administrator role (replace the e-mail):

   ```sql
   insert into public.role_assignments (user_id, role_key)
   select id, 'system_admin' from public.profiles where lower(email) = lower('you@example.com')
   on conflict do nothing;

   insert into public.members (user_id, joined_via, first_name_ar, is_directory_visible)
   select id, 'manual', 'مدير تجريبي', false from public.profiles where lower(email) = lower('you@example.com')
   on conflict (user_id) do nothing;
   ```

3. Sign in on the dev site and create the rest (leaders, a committee head, a test event) from the dashboard, as in the [event lifecycle guide](event-lifecycle-test-guide.md). Use `@example.test` style addresses for fake people. `npm run db:personas` refuses to run against a hosted project on purpose.

### A3. Auth settings of the dev project

Dashboard → **Authentication**:

| Setting | Value |
| ------- | ----- |
| Site URL | the stable Dev URL from A5 (for example `https://sdc-web-git-develop-<team>.vercel.app`) |
| Redirect URLs | `<dev url>/**` and `http://localhost:3000/**` |
| Allow new users to sign up | **off** (accounts are created by the platform) |
| Confirm e-mail | on |
| E-mail link/OTP expiry | 86400 s (activation links must outlive a weekend) |
| SMTP | a sandbox such as Mailtrap (free): every mail is caught, nothing reaches real people |

### A4. Mail for the app on the dev site

Create a Mailtrap (or similar) sandbox inbox and copy its SMTP URL. The app reads `EMAIL_TRANSPORT=smtp` and `SMTP_URL`. Never point the dev site at a real mail provider with real recipients.

### A5. Vercel

1. <https://vercel.com> → **Add New → Project** → import the GitHub repository (`Hussain560/sdc_web` today; the organisation repository later).
2. **Settings → Git → Production Branch = `production`** (create the branch first, see Part B). Pushes to `develop` and `release/*` then become *Preview* deployments, never live.
3. **Settings → Domains**: give the `develop` branch a stable domain (for example `dev.<your-domain>`, or use the generated `…-git-develop-…vercel.app` address) and optionally one for `release/*`.
4. **Settings → Environment Variables** (never prefix secrets with `NEXT_PUBLIC_`):

| Variable | Preview (Dev and Staging) | Production |
| -------- | ------------------------- | ---------- |
| `NEXT_PUBLIC_SUPABASE_URL` | dev project URL | production project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dev anon key | production anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | dev service key | production service key |
| `SITE_URL` | the Dev URL (https) | the production URL |
| `EMAIL_TRANSPORT` / `SMTP_URL` / `EMAIL_FROM` | `smtp`, the sandbox URL, a dev sender | `smtp`, the provider URL, the verified sender |
| `CRON_SECRET` | random, 16+ characters | different random value |

   Add the Production column last, when the cutover is near. Previews can also be limited to the `develop` branch in the variable's settings.

### A6. GitHub

1. **Settings → Secrets and variables → Actions → Environments**: create `dev` and `production` (production with required reviewers = the production owner).
2. In each environment add the secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD` (dev values in `dev`, production values in `production`). The *Deploy database* workflow then applies migrations by itself when `develop` or `release/*` (dev) or `production` changes.
3. **Settings → Actions → General**: tick *Allow GitHub Actions to create and approve pull requests* (needed by the release and sync workflows).
4. **Settings → Branches**: protect `develop`, `release/**`, `main`, `production` as in [git workflow §6](git-workflow.md).
5. Repository variable `HEALTH_URLS` = the Dev health URL (and later the production one) for the keep-alive workflow.

## Part B. Branch setup (commands)

`production` starts where `main` is and is only ever moved by a reviewed pull request from `main`:

```bash
git checkout main && git pull
git checkout -b production
git push -u origin production
```

(The first push of `main` and `develop` is already done on `origin`; the release branch and `v1.0.0-rc.1` too.)

## Part C. Can we test on it? Yes

| Test | How | Needs |
| ---- | --- | ----- |
| Health and public pages | `npm run smoke -- https://<dev url>` (health, 8 pages × 2 languages, security headers) | the Dev site deployed |
| Configuration | `npm run preflight -- --env <file> --online` (the `--online` flag checks that sign-ups are off) | an env file with the dev values |
| Full user flow | [event lifecycle test guide](event-lifecycle-test-guide.md) with the Dev site and your test admin; mails appear in the sandbox inbox | A2 to A5 |
| Release candidate | Tag `vX.Y.Z-rc.N` on `release/*`, open the Staging preview, run the same guide plus the [cutover rehearsal](../08-infrastructure/cutover-runbook.md) steps that apply | the release branch pushed |
| Automated suites | `npm run check`, `supabase test db`, `npm run e2e`, `npm run e2e:auth` run in **CI and locally** on a throwaway local stack; they do not run against the hosted dev project (they write directly to the database) | none |

## Part D. Day-to-day

1. Work on `feat/*`, PR into `develop`: CI runs, the Deploy database workflow updates `sdc-dev`, Vercel updates the Dev site.
2. Test there; when the release scope is done, follow [git workflow §2.1](git-workflow.md).
3. A dev database can be wiped and rebuilt any time: `npx supabase db reset --linked` (**dev only**, never on production).
4. Free-tier projects pause after a week without traffic; the keep-alive workflow calls `/api/health` daily to prevent it.

## Part E. Order I suggest

1. Create `sdc-dev` and the access token (A1).
2. `link` and `db push` (A2), create your admin user and role.
3. Create the Vercel project, set the Preview variables, open the Dev site, run `npm run smoke` (A5, Part C).
4. Add the GitHub environments and secrets (A6) and merge the first PR into `develop` to watch the workflow apply a migration.
5. Create `production` (Part B) and set it as the Vercel production branch **before** anyone merges into it.
